// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Outright} from "../src/Outright.sol";
import {MockStable} from "../test/mocks/MockStable.sol";

/// @notice Local-only demo: deploys mock USDC/EURC + Outright on anvil and seeds forwards in
///         every state so the frontend has something to show. Run with anvil's default keys:
///         forge script script/LocalDemo.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
contract LocalDemo is Script {
    uint256 constant PK_A = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80; // anvil #0

    function run() external {
        uint256 pkA = PK_A;
        uint256 pkB = vm.envUint("PK_B");
        address a = vm.addr(pkA);
        address b = vm.addr(pkB);

        vm.startBroadcast(pkA);
        MockStable usdc = new MockStable("USD Coin", "USDC");
        MockStable eurc = new MockStable("Euro Coin", "EURC");
        Outright fwd = new Outright(usdc, eurc);
        usdc.mint(a, 250_000e6); eurc.mint(a, 250_000e6);
        usdc.mint(b, 250_000e6); eurc.mint(b, 250_000e6);
        usdc.approve(address(fwd), type(uint256).max);
        eurc.approve(address(fwd), type(uint256).max);
        uint64 t = uint64(block.timestamp);
        // 1: open offer, A buys €10,000 at 1.1700 in 30 days
        fwd.create(Outright.Side.BuyEURC, 10_000e6, 11_700e6, t + 1 days, t + 30 days, address(0));
        // 2: open offer, A sells €2,500 at 1.1735 in 7 days
        fwd.create(Outright.Side.SellEURC, 2_500e6, 2_933_750000, t + 1 days, t + 7 days, address(0));
        // 3: will be accepted by B and run for 90 days
        fwd.create(Outright.Side.BuyEURC, 50_000e6, 58_610e6, t + 1 days, t + 90 days, address(0));
        // 4: will be accepted by B and mature in 3 minutes
        fwd.create(Outright.Side.SellEURC, 1_000e6, 1_168_200000, t + 60, t + 180, address(0));
        vm.stopBroadcast();

        vm.startBroadcast(pkB);
        usdc.approve(address(fwd), type(uint256).max);
        eurc.approve(address(fwd), type(uint256).max);
        fwd.accept(3);
        fwd.accept(4);
        // 5: B's open offer reserved for A
        fwd.create(Outright.Side.BuyEURC, 5_000e6, 5_862_500000, t + 1 days, t + 14 days, a);
        vm.stopBroadcast();

        console.log("OUTRIGHT", address(fwd));
    }
}
