// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Outright} from "../src/Outright.sol";

/// @notice Deploys Outright against Arc's canonical stablecoins.
///         Mainnet (chain 5042): USDC ERC-20 interface + EURC from docs.arc.io/arc/references/contract-addresses
///         Override with USDC_ADDRESS / EURC_ADDRESS env vars for testnet.
contract Deploy is Script {
    address constant USDC_MAINNET = 0x3600000000000000000000000000000000000000;
    address constant EURC_MAINNET = 0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1;

    function run() external returns (Outright fwd) {
        address usdc = vm.envOr("USDC_ADDRESS", USDC_MAINNET);
        address eurc = vm.envOr("EURC_ADDRESS", EURC_MAINNET);

        require(IERC20Metadata(usdc).decimals() == 6, "USDC: expected 6-dec ERC-20 interface");
        require(IERC20Metadata(eurc).decimals() == 6, "EURC: expected 6 decimals");

        vm.startBroadcast();
        fwd = new Outright(IERC20(usdc), IERC20(eurc));
        vm.stopBroadcast();

        console.log("Outright:", address(fwd));
    }
}

interface IERC20Metadata {
    function decimals() external view returns (uint8);
}
