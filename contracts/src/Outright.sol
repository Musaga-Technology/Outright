// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Outright
/// @notice Fully collateralized, physically settled USDC/EURC forward contracts on Arc.
///         A maker posts an offer to buy or sell EURC for USDC at a fixed rate on a future
///         date and escrows their leg. A taker accepts by escrowing the other leg. At maturity
///         each party pulls what they bought. No oracle, no margin calls, no default risk.
/// @dev    Both legs use the 6-decimal ERC-20 interfaces. On Arc, USDC's ERC-20 interface
///         (0x3600...0000) shares a balance with the 18-decimal native gas token; this contract
///         never touches msg.value, so the two precisions are never mixed.
///         Payouts are pull-based so a blocklisted counterparty cannot freeze the other side.
contract Outright is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice The maker's side of the trade.
    enum Side {
        BuyEURC, // maker escrows USDC, receives EURC at maturity
        SellEURC // maker escrows EURC, receives USDC at maturity
    }

    enum Status {
        None,
        Open, // posted, waiting for a taker
        Active, // both legs escrowed
        Cancelled, // never accepted; maker refunded
        Unwound // both parties agreed to exit before maturity; each refunded
    }

    struct Forward {
        address maker;
        address taker; // fixed counterparty if set at creation, otherwise set on accept
        uint128 eurcAmount;
        uint128 usdcAmount;
        uint64 createdAt;
        uint64 acceptBy;
        uint64 acceptedAt; // 0 until accepted
        uint64 maturity;
        Side makerSide;
        Status status;
        bool buyerClaimed;
        bool sellerClaimed;
        bool makerUnwind;
        bool takerUnwind;
    }

    IERC20 public immutable usdc;
    IERC20 public immutable eurc;

    uint256 public nextId = 1;
    mapping(uint256 => Forward) internal _forwards;

    event Created(
        uint256 indexed id,
        address indexed maker,
        Side makerSide,
        uint256 eurcAmount,
        uint256 usdcAmount,
        uint64 acceptBy,
        uint64 maturity,
        address counterparty
    );
    event Accepted(uint256 indexed id, address indexed taker);
    event Cancelled(uint256 indexed id);
    event UnwindRequested(uint256 indexed id, address indexed party);
    event UnwindRevoked(uint256 indexed id, address indexed party);
    event Unwound(uint256 indexed id);
    event Claimed(uint256 indexed id, address indexed party, address token, uint256 amount);

    error ZeroAmount();
    error BadTimes();
    error BadCounterparty();
    error WrongStatus();
    error OfferExpired();
    error NotAllowed();
    error NotMatured();
    error AlreadyMatured();
    error NothingToClaim();

    constructor(IERC20 _usdc, IERC20 _eurc) {
        require(address(_usdc) != address(0) && address(_eurc) != address(0), "token=0");
        usdc = _usdc;
        eurc = _eurc;
    }

    // ---------------------------------------------------------------------
    // Lifecycle
    // ---------------------------------------------------------------------

    /// @notice Post a forward offer and escrow the maker's leg.
    /// @param makerSide    BuyEURC (maker escrows USDC) or SellEURC (maker escrows EURC).
    /// @param eurcAmount   EURC to be delivered at maturity (6 decimals).
    /// @param usdcAmount   USDC to be paid for it (6 decimals). Strike = usdcAmount / eurcAmount.
    /// @param acceptBy     Last timestamp a taker can accept.
    /// @param maturity     Timestamp from which both legs can be claimed.
    /// @param counterparty Optional: only this address may accept (address(0) = anyone).
    function create(
        Side makerSide,
        uint128 eurcAmount,
        uint128 usdcAmount,
        uint64 acceptBy,
        uint64 maturity,
        address counterparty
    ) external nonReentrant returns (uint256 id) {
        if (eurcAmount == 0 || usdcAmount == 0) revert ZeroAmount();
        if (acceptBy < block.timestamp || maturity < acceptBy) revert BadTimes();
        if (counterparty == msg.sender) revert BadCounterparty();

        id = nextId++;
        _forwards[id] = Forward({
            maker: msg.sender,
            taker: counterparty,
            eurcAmount: eurcAmount,
            usdcAmount: usdcAmount,
            createdAt: uint64(block.timestamp),
            acceptBy: acceptBy,
            acceptedAt: 0,
            maturity: maturity,
            makerSide: makerSide,
            status: Status.Open,
            buyerClaimed: false,
            sellerClaimed: false,
            makerUnwind: false,
            takerUnwind: false
        });

        if (makerSide == Side.BuyEURC) {
            usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
        } else {
            eurc.safeTransferFrom(msg.sender, address(this), eurcAmount);
        }

        emit Created(id, msg.sender, makerSide, eurcAmount, usdcAmount, acceptBy, maturity, counterparty);
    }

    /// @notice Accept an open offer and escrow the opposite leg.
    function accept(uint256 id) external nonReentrant {
        Forward storage f = _forwards[id];
        if (f.status != Status.Open) revert WrongStatus();
        if (block.timestamp > f.acceptBy) revert OfferExpired();
        if (msg.sender == f.maker) revert BadCounterparty();
        if (f.taker != address(0) && f.taker != msg.sender) revert NotAllowed();

        f.taker = msg.sender;
        f.acceptedAt = uint64(block.timestamp);
        f.status = Status.Active;

        if (f.makerSide == Side.BuyEURC) {
            eurc.safeTransferFrom(msg.sender, address(this), f.eurcAmount);
        } else {
            usdc.safeTransferFrom(msg.sender, address(this), f.usdcAmount);
        }

        emit Accepted(id, msg.sender);
    }

    /// @notice Cancel an unaccepted offer. The maker can cancel any time; once the offer has
    ///         expired anyone can trigger the refund (it always goes to the maker).
    function cancel(uint256 id) external nonReentrant {
        Forward storage f = _forwards[id];
        if (f.status != Status.Open) revert WrongStatus();
        if (msg.sender != f.maker && block.timestamp <= f.acceptBy) revert NotAllowed();

        f.status = Status.Cancelled;
        _refundMaker(f);
        emit Cancelled(id);
    }

    /// @notice Consent to unwinding an active forward before maturity. When both parties
    ///         have consented, each can reclaim their own deposit.
    function requestUnwind(uint256 id) external {
        Forward storage f = _forwards[id];
        if (f.status != Status.Active) revert WrongStatus();
        if (block.timestamp >= f.maturity) revert AlreadyMatured();

        if (msg.sender == f.maker) f.makerUnwind = true;
        else if (msg.sender == f.taker) f.takerUnwind = true;
        else revert NotAllowed();
        emit UnwindRequested(id, msg.sender);

        if (f.makerUnwind && f.takerUnwind) {
            f.status = Status.Unwound;
            emit Unwound(id);
        }
    }

    /// @notice Withdraw a pending unwind consent.
    function revokeUnwind(uint256 id) external {
        Forward storage f = _forwards[id];
        if (f.status != Status.Active) revert WrongStatus();
        if (msg.sender == f.maker) f.makerUnwind = false;
        else if (msg.sender == f.taker) f.takerUnwind = false;
        else revert NotAllowed();
        emit UnwindRevoked(id, msg.sender);
    }

    /// @notice Pull your side of a settled (matured) or unwound forward.
    ///         Matured: the EURC buyer gets EURC, the seller gets USDC.
    ///         Unwound: each party gets their own deposit back.
    function claim(uint256 id) external nonReentrant {
        Forward storage f = _forwards[id];
        address buyer = _buyer(f);
        address seller = _seller(f);

        bool isBuyer = msg.sender == buyer;
        bool isSeller = msg.sender == seller;
        if (!isBuyer && !isSeller) revert NotAllowed();

        bool unwound;
        if (f.status == Status.Active) {
            if (block.timestamp < f.maturity) revert NotMatured();
        } else if (f.status == Status.Unwound) {
            unwound = true;
        } else {
            revert WrongStatus();
        }

        if (isBuyer && !f.buyerClaimed) {
            f.buyerClaimed = true;
            (IERC20 t, uint256 amt) = unwound ? (usdc, uint256(f.usdcAmount)) : (eurc, uint256(f.eurcAmount));
            t.safeTransfer(buyer, amt);
            emit Claimed(id, buyer, address(t), amt);
        } else if (isSeller && !f.sellerClaimed) {
            f.sellerClaimed = true;
            (IERC20 t, uint256 amt) = unwound ? (eurc, uint256(f.eurcAmount)) : (usdc, uint256(f.usdcAmount));
            t.safeTransfer(seller, amt);
            emit Claimed(id, seller, address(t), amt);
        } else {
            revert NothingToClaim();
        }
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function getForward(uint256 id) external view returns (Forward memory) {
        return _forwards[id];
    }

    function buyerOf(uint256 id) external view returns (address) {
        return _buyer(_forwards[id]);
    }

    function sellerOf(uint256 id) external view returns (address) {
        return _seller(_forwards[id]);
    }

    /// @notice Strike rate as USDC per 1 EURC, scaled by 1e18.
    function strike(uint256 id) external view returns (uint256) {
        Forward storage f = _forwards[id];
        if (f.eurcAmount == 0) return 0;
        return (uint256(f.usdcAmount) * 1e18) / f.eurcAmount;
    }

    // ---------------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------------

    function _buyer(Forward storage f) internal view returns (address) {
        return f.makerSide == Side.BuyEURC ? f.maker : f.taker;
    }

    function _seller(Forward storage f) internal view returns (address) {
        return f.makerSide == Side.SellEURC ? f.maker : f.taker;
    }

    function _refundMaker(Forward storage f) internal {
        if (f.makerSide == Side.BuyEURC) {
            usdc.safeTransfer(f.maker, f.usdcAmount);
        } else {
            eurc.safeTransfer(f.maker, f.eurcAmount);
        }
    }
}
