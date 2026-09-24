// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Outright} from "../src/Outright.sol";

/**
 * @notice Seeds a live Outright deployment with tiny demo trades, so the desk and the explorer
 *         have something real to show. Everything here is refundable: an offer nobody takes is
 *         cancelled back to the maker, and a settled trade exchanges the two legs at the agreed
 *         rate. Only gas is spent.
 *
 *         Two wallets are needed because a maker can't take its own offer. Both can be yours.
 *
 *         Env: OUTRIGHT (deployed address), PK_A (maker), PK_B (taker),
 *              RATE (optional, USDC per 1 EURC at 6 decimals; default 1.1700).
 *
 *         Run, in order:
 *           forge script script/SeedMainnet.s.sol --sig "settle()" --rpc-url arc_mainnet --broadcast
 *           # wait ~6 minutes for the 5-minute maturities, then:
 *           forge script script/SeedMainnet.s.sol --sig "claim()"  --rpc-url arc_mainnet --broadcast
 *           forge script script/SeedMainnet.s.sol --sig "book()"   --rpc-url arc_mainnet --broadcast
 *
 *         Later, to take the standing offers back (refunds the deposits):
 *           forge script script/SeedMainnet.s.sol --sig "cancelOpen()" --rpc-url arc_mainnet --broadcast
 */
contract SeedMainnet is Script {
    uint128 constant EUR = 1e6; // €1.00, six decimals

    Outright fwd;
    uint256 rate; // USDC per 1 EURC, 6 decimals
    uint256 pkA;
    uint256 pkB;

    function setUp() public {
        fwd = Outright(vm.envAddress("OUTRIGHT"));
        rate = vm.envOr("RATE", uint256(1_170_000));
        pkA = vm.envUint("PK_A");
        pkB = vm.envUint("PK_B");
    }

    /// @dev usdc = eurc × rate, both 6 decimals.
    function usdcFor(uint128 eurcAmount) internal view returns (uint128) {
        return uint128((uint256(eurcAmount) * rate) / 1e6);
    }

    /// Two €1 forwards that mature in five minutes: one each way, accepted immediately.
    /// After `claim()` these are real settled trades, visible on the explorer.
    function settle() external {
        address a = vm.addr(pkA);
        address b = vm.addr(pkB);
        uint64 t = uint64(block.timestamp);
        require(a != b, "PK_A and PK_B must be different wallets");

        _requireFunds(a, EUR, usdcFor(EUR));
        _requireFunds(b, EUR, usdcFor(EUR));

        vm.startBroadcast(pkA);
        _approve(a);
        uint256 id1 = fwd.create(Outright.Side.BuyEURC, EUR, usdcFor(EUR), t + 120, t + 300, b);
        uint256 id2 = fwd.create(Outright.Side.SellEURC, EUR, usdcFor(EUR), t + 120, t + 300, b);
        vm.stopBroadcast();

        vm.startBroadcast(pkB);
        _approve(b);
        fwd.accept(id1);
        fwd.accept(id2);
        vm.stopBroadcast();

        console.log("Accepted forwards", id1, id2);
        console.log("Both mature at unix", t + 300);
        console.log("Wait until then, then run --sig claim()");
    }

    /// Claims every matured leg either wallet is owed. Safe to re-run; legs that aren't ready are skipped.
    function claim() external {
        _claimAll(pkA);
        _claimAll(pkB);
    }

    /// Four standing offers, both sides, across tenors, so the market has depth to show.
    /// Accept window is 7 days: they stay on the book through judging.
    function book() external {
        address a = vm.addr(pkA);
        address b = vm.addr(pkB);
        uint64 t = uint64(block.timestamp);
        uint64 week = t + 7 days;

        _requireFunds(a, 3 * EUR, usdcFor(3 * EUR));

        vm.startBroadcast(pkA);
        _approve(a);
        // A dealer's spread: bid a few pips below the reference, offer a few pips above,
        // wider for the longer tenor.
        fwd.create(Outright.Side.BuyEURC, 2 * EUR, _at(2 * EUR, -25), week, t + 7 days, address(0));
        fwd.create(Outright.Side.BuyEURC, EUR, _at(EUR, -50), week, t + 30 days, address(0));
        fwd.create(Outright.Side.SellEURC, 2 * EUR, _at(2 * EUR, 25), week, t + 7 days, address(0));
        fwd.create(Outright.Side.SellEURC, EUR, _at(EUR, 50), week, t + 30 days, address(0));
        vm.stopBroadcast();

        console.log("Posted 4 standing offers from", a);
        console.log("Taker wallet for the demo is", b);
    }

    /// Takes back every still-open offer made by either wallet, refunding the deposit.
    /// A maker can cancel at any time before someone accepts.
    function cancelOpen() external {
        _cancelOwn(pkA);
        _cancelOwn(pkB);
    }

    // ---------------------------------------------------------------------

    /// @dev Reference rate shifted by `pips` (1 pip = 0.0001 USDC per EURC).
    function _at(uint128 eurcAmount, int256 pips) internal view returns (uint128) {
        uint256 shifted = uint256(int256(rate) + (pips * 100));
        return uint128((uint256(eurcAmount) * shifted) / 1e6);
    }

    function _approve(address who) internal {
        if (fwd.eurc().allowance(who, address(fwd)) < type(uint128).max) {
            fwd.eurc().approve(address(fwd), type(uint256).max);
        }
        if (fwd.usdc().allowance(who, address(fwd)) < type(uint128).max) {
            fwd.usdc().approve(address(fwd), type(uint256).max);
        }
    }

    function _requireFunds(address who, uint128 eurcNeeded, uint128 usdcNeeded) internal view {
        require(fwd.eurc().balanceOf(who) >= eurcNeeded, "not enough EURC in this wallet");
        require(fwd.usdc().balanceOf(who) >= usdcNeeded, "not enough USDC in this wallet");
    }

    function _claimAll(uint256 pk) internal {
        address who = vm.addr(pk);
        vm.startBroadcast(pk);
        for (uint256 id = 1; id < fwd.nextId(); id++) {
            Outright.Forward memory f = fwd.getForward(id);
            bool mine = fwd.buyerOf(id) == who || fwd.sellerOf(id) == who;
            bool ready = f.status == Outright.Status.Unwound
                || (f.status == Outright.Status.Active && block.timestamp >= f.maturity);
            if (!mine || !ready) continue;
            try fwd.claim(id) {
                console.log("Claimed", id, "as", who);
            } catch {
                // already claimed by this side
            }
        }
        vm.stopBroadcast();
    }

    function _cancelOwn(uint256 pk) internal {
        address who = vm.addr(pk);
        vm.startBroadcast(pk);
        for (uint256 id = 1; id < fwd.nextId(); id++) {
            Outright.Forward memory f = fwd.getForward(id);
            if (f.status != Outright.Status.Open || f.maker != who) continue;
            try fwd.cancel(id) {
                console.log("Cancelled and refunded", id);
            } catch {
                // taken or cancelled between reading and sending
            }
        }
        vm.stopBroadcast();
    }
}
