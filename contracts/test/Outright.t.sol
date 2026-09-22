// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Outright} from "../src/Outright.sol";
import {MockStable} from "./mocks/MockStable.sol";

contract OutrightTest is Test {
    Outright fwd;
    MockStable usdc;
    MockStable eurc;

    address importer = makeAddr("importer"); // needs EUR later, holds USD
    address exporter = makeAddr("exporter"); // holds EUR, wants USD
    address stranger = makeAddr("stranger");

    uint128 constant EUR = 10_000e6; // €10,000
    uint128 constant USD = 11_700e6; // at 1.17 USDC per EURC

    function setUp() public {
        usdc = new MockStable("USD Coin", "USDC");
        eurc = new MockStable("Euro Coin", "EURC");
        fwd = new Outright(usdc, eurc);

        usdc.mint(importer, 1_000_000e6);
        eurc.mint(exporter, 1_000_000e6);
        usdc.mint(exporter, 1_000_000e6);
        eurc.mint(importer, 1_000_000e6);

        for (uint256 i; i < 2; i++) {
            address a = i == 0 ? importer : exporter;
            vm.startPrank(a);
            usdc.approve(address(fwd), type(uint256).max);
            eurc.approve(address(fwd), type(uint256).max);
            vm.stopPrank();
        }
    }

    function _offer(address counterparty) internal returns (uint256 id) {
        vm.prank(importer);
        id = fwd.create(
            Outright.Side.BuyEURC,
            EUR,
            USD,
            uint64(block.timestamp + 1 hours),
            uint64(block.timestamp + 30 days),
            counterparty
        );
    }

    // --- happy path --------------------------------------------------------

    function test_fullLifecycle_makerBuys() public {
        uint256 u0 = usdc.balanceOf(importer);
        uint256 id = _offer(address(0));
        assertEq(usdc.balanceOf(address(fwd)), USD);
        assertEq(fwd.strike(id), 1.17e18);

        vm.warp(block.timestamp + 10 minutes);
        vm.prank(exporter);
        fwd.accept(id);
        assertEq(eurc.balanceOf(address(fwd)), EUR);
        assertEq(fwd.getForward(id).acceptedAt, block.timestamp);
        assertLt(fwd.getForward(id).createdAt, fwd.getForward(id).acceptedAt);

        vm.warp(block.timestamp + 30 days);
        uint256 e0 = eurc.balanceOf(importer);
        vm.prank(importer);
        fwd.claim(id);
        assertEq(eurc.balanceOf(importer) - e0, EUR);
        assertEq(u0 - usdc.balanceOf(importer), USD);

        uint256 x0 = usdc.balanceOf(exporter);
        vm.prank(exporter);
        fwd.claim(id);
        assertEq(usdc.balanceOf(exporter) - x0, USD);

        assertEq(usdc.balanceOf(address(fwd)), 0);
        assertEq(eurc.balanceOf(address(fwd)), 0);
    }

    function test_fullLifecycle_makerSells() public {
        vm.prank(exporter);
        uint256 id = fwd.create(
            Outright.Side.SellEURC, EUR, USD, uint64(block.timestamp + 1 hours), uint64(block.timestamp + 1 days), address(0)
        );
        assertEq(eurc.balanceOf(address(fwd)), EUR);
        assertEq(fwd.buyerOf(id), address(0));

        vm.prank(importer);
        fwd.accept(id);
        assertEq(fwd.buyerOf(id), importer);
        assertEq(fwd.sellerOf(id), exporter);

        vm.warp(block.timestamp + 1 days);
        vm.prank(importer);
        fwd.claim(id);
        vm.prank(exporter);
        fwd.claim(id);
        assertEq(usdc.balanceOf(address(fwd)), 0);
        assertEq(eurc.balanceOf(address(fwd)), 0);
    }

    // --- guards ------------------------------------------------------------

    function test_revert_claimBeforeMaturity() public {
        uint256 id = _offer(address(0));
        vm.prank(exporter);
        fwd.accept(id);
        vm.prank(importer);
        vm.expectRevert(Outright.NotMatured.selector);
        fwd.claim(id);
    }

    function test_revert_doubleClaim() public {
        uint256 id = _offer(address(0));
        vm.prank(exporter);
        fwd.accept(id);
        vm.warp(block.timestamp + 30 days);
        vm.startPrank(importer);
        fwd.claim(id);
        vm.expectRevert(Outright.NothingToClaim.selector);
        fwd.claim(id);
        vm.stopPrank();
    }

    function test_revert_strangerClaim() public {
        uint256 id = _offer(address(0));
        vm.prank(exporter);
        fwd.accept(id);
        vm.warp(block.timestamp + 30 days);
        vm.prank(stranger);
        vm.expectRevert(Outright.NotAllowed.selector);
        fwd.claim(id);
    }

    function test_revert_acceptAfterExpiry() public {
        uint256 id = _offer(address(0));
        vm.warp(block.timestamp + 2 hours);
        vm.prank(exporter);
        vm.expectRevert(Outright.OfferExpired.selector);
        fwd.accept(id);
    }

    function test_revert_makerCannotAcceptOwn() public {
        uint256 id = _offer(address(0));
        vm.prank(importer);
        vm.expectRevert(Outright.BadCounterparty.selector);
        fwd.accept(id);
    }

    function test_restrictedCounterparty() public {
        uint256 id = _offer(exporter);
        vm.prank(stranger);
        vm.expectRevert(Outright.NotAllowed.selector);
        fwd.accept(id);
        vm.prank(exporter);
        fwd.accept(id);
    }

    function test_revert_badParams() public {
        vm.startPrank(importer);
        vm.expectRevert(Outright.ZeroAmount.selector);
        fwd.create(Outright.Side.BuyEURC, 0, USD, uint64(block.timestamp), uint64(block.timestamp), address(0));
        vm.expectRevert(Outright.BadTimes.selector);
        fwd.create(Outright.Side.BuyEURC, EUR, USD, uint64(block.timestamp + 2), uint64(block.timestamp + 1), address(0));
        vm.expectRevert(Outright.BadCounterparty.selector);
        fwd.create(Outright.Side.BuyEURC, EUR, USD, uint64(block.timestamp), uint64(block.timestamp), importer);
        vm.stopPrank();
    }

    // --- cancel ------------------------------------------------------------

    function test_makerCancel() public {
        uint256 u0 = usdc.balanceOf(importer);
        uint256 id = _offer(address(0));
        vm.prank(stranger);
        vm.expectRevert(Outright.NotAllowed.selector);
        fwd.cancel(id);
        vm.prank(importer);
        fwd.cancel(id);
        assertEq(usdc.balanceOf(importer), u0);
        vm.prank(exporter);
        vm.expectRevert(Outright.WrongStatus.selector);
        fwd.accept(id);
    }

    function test_anyoneCancelsExpired_refundGoesToMaker() public {
        uint256 u0 = usdc.balanceOf(importer);
        uint256 id = _offer(address(0));
        vm.warp(block.timestamp + 2 hours);
        vm.prank(stranger);
        fwd.cancel(id);
        assertEq(usdc.balanceOf(importer), u0);
        assertEq(usdc.balanceOf(stranger), 0);
    }

    function test_revert_cancelActive() public {
        uint256 id = _offer(address(0));
        vm.prank(exporter);
        fwd.accept(id);
        vm.prank(importer);
        vm.expectRevert(Outright.WrongStatus.selector);
        fwd.cancel(id);
    }

    // --- unwind ------------------------------------------------------------

    function test_mutualUnwind_refundsOwnLegs() public {
        uint256 u0 = usdc.balanceOf(importer);
        uint256 e0 = eurc.balanceOf(exporter);
        uint256 id = _offer(address(0));
        vm.prank(exporter);
        fwd.accept(id);

        vm.prank(importer);
        fwd.requestUnwind(id);
        // one-sided consent does nothing
        vm.prank(importer);
        vm.expectRevert(Outright.NotMatured.selector);
        fwd.claim(id);

        vm.prank(exporter);
        fwd.requestUnwind(id);
        assertEq(uint8(fwd.getForward(id).status), uint8(Outright.Status.Unwound));

        vm.prank(importer);
        fwd.claim(id);
        vm.prank(exporter);
        fwd.claim(id);
        assertEq(usdc.balanceOf(importer), u0);
        assertEq(eurc.balanceOf(exporter), e0);
    }

    function test_revokeUnwind() public {
        uint256 id = _offer(address(0));
        vm.prank(exporter);
        fwd.accept(id);
        vm.prank(importer);
        fwd.requestUnwind(id);
        vm.prank(importer);
        fwd.revokeUnwind(id);
        vm.prank(exporter);
        fwd.requestUnwind(id);
        assertEq(uint8(fwd.getForward(id).status), uint8(Outright.Status.Active));
    }

    function test_revert_unwindAfterMaturity() public {
        uint256 id = _offer(address(0));
        vm.prank(exporter);
        fwd.accept(id);
        vm.warp(block.timestamp + 30 days);
        vm.prank(importer);
        vm.expectRevert(Outright.AlreadyMatured.selector);
        fwd.requestUnwind(id);
    }

    // --- blocklist isolation (Arc/Circle tokens can block addresses) -------

    function test_blockedCounterpartyCannotFreezeOtherSide() public {
        uint256 id = _offer(address(0));
        vm.prank(exporter);
        fwd.accept(id);
        eurc.setBlocked(importer, true); // importer can no longer receive EURC

        vm.warp(block.timestamp + 30 days);
        vm.prank(importer);
        vm.expectRevert(bytes("blocklisted"));
        fwd.claim(id);

        uint256 x0 = usdc.balanceOf(exporter);
        vm.prank(exporter);
        fwd.claim(id); // exporter still gets paid
        assertEq(usdc.balanceOf(exporter) - x0, USD);
    }

    // --- fuzz: escrow always conserves and fully drains ---------------------

    function testFuzz_conservation(uint128 e, uint128 u, uint32 dt, bool makerBuys) public {
        e = uint128(bound(e, 1, 500_000e6));
        u = uint128(bound(u, 1, 500_000e6));
        dt = uint32(bound(dt, 1, 365 days));
        address maker = makerBuys ? importer : exporter;
        address taker = makerBuys ? exporter : importer;

        uint256 totalU = usdc.balanceOf(importer) + usdc.balanceOf(exporter);
        uint256 totalE = eurc.balanceOf(importer) + eurc.balanceOf(exporter);

        vm.prank(maker);
        uint256 id = fwd.create(
            makerBuys ? Outright.Side.BuyEURC : Outright.Side.SellEURC,
            e,
            u,
            uint64(block.timestamp),
            uint64(block.timestamp + dt),
            address(0)
        );
        vm.prank(taker);
        fwd.accept(id);
        vm.warp(block.timestamp + dt);
        vm.prank(importer);
        fwd.claim(id);
        vm.prank(exporter);
        fwd.claim(id);

        assertEq(usdc.balanceOf(address(fwd)), 0);
        assertEq(eurc.balanceOf(address(fwd)), 0);
        assertEq(usdc.balanceOf(importer) + usdc.balanceOf(exporter), totalU);
        assertEq(eurc.balanceOf(importer) + eurc.balanceOf(exporter), totalE);
    }
}
