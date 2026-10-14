// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @notice Buys EURC with USDC on Arc's Uniswap v3 pool, so a wallet funded only in dollars can
 *         post the euro leg of a forward. Verified on mainnet: SwapRouter02's factory() matches
 *         the v3 factory, and the 0.05% USDC/EURC pool holds both tokens.
 *
 *         Env: PK_A (the wallet), AMOUNT_IN (USDC, 6 decimals; default 1.80), SLIPPAGE_BPS (default 100 = 1%).
 *
 *         forge script script/SwapForEurc.s.sol --rpc-url arc_mainnet --private-key $PK_A --broadcast
 */
contract SwapForEurc is Script {
    address constant USDC = 0x3600000000000000000000000000000000000000;
    address constant EURC = 0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1;
    address constant ROUTER = 0x53BF6B0684Ec7eF91e1387Da3D1a1769bC5A6F77;
    address constant POOL = 0x6fd5F2fb831940DcD61A98c5B3aCB7D8C6f3bFc1; // USDC/EURC, 0.05%
    uint24 constant FEE = 500;

    function run() external {
        uint256 amountIn = vm.envOr("AMOUNT_IN", uint256(1_800_000));
        uint256 slippageBps = vm.envOr("SLIPPAGE_BPS", uint256(100));
        address me = msg.sender;

        // token0 is USDC, token1 is EURC, so price = EURC per USDC = (sqrtPriceX96 / 2**96)**2.
        (uint160 sqrtPriceX96,,,,,,) = IUniswapV3Pool(POOL).slot0();
        uint256 expectedOut = (amountIn * uint256(sqrtPriceX96) * uint256(sqrtPriceX96)) >> 192;
        uint256 minOut = (expectedOut * (10_000 - slippageBps)) / 10_000;
        require(IERC20(USDC).balanceOf(me) >= amountIn, "not enough USDC");

        console.log("Spending USDC (6dp):", amountIn);
        console.log("Expecting EURC (6dp) about:", expectedOut);
        console.log("Minimum accepted:", minOut);

        vm.startBroadcast();
        IERC20(USDC).approve(ROUTER, amountIn);
        uint256 out = ISwapRouter02(ROUTER).exactInputSingle(
            ISwapRouter02.ExactInputSingleParams({
                tokenIn: USDC,
                tokenOut: EURC,
                fee: FEE,
                recipient: me,
                amountIn: amountIn,
                amountOutMinimum: minOut,
                sqrtPriceLimitX96: 0
            })
        );
        vm.stopBroadcast();

        console.log("Received EURC (6dp):", out);
        console.log("EURC balance now:", IERC20(EURC).balanceOf(me));
    }
}

interface ISwapRouter02 {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

interface IUniswapV3Pool {
    function slot0() external view returns (uint160, int24, uint16, uint16, uint16, uint8, bool);
}
