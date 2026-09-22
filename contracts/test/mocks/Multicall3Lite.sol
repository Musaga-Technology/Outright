// SPDX-License-Identifier: MIT
// Local-only: anvil has no Multicall3 at the canonical address, which viem/wagmi need.
// scripts/local.sh compiles this and anvil_setCode's it into 0xcA11bde0…CA11.
pragma solidity ^0.8.24;
contract Multicall3Lite {
    struct Call3 { address target; bool allowFailure; bytes callData; }
    struct Result { bool success; bytes returnData; }
    function aggregate3(Call3[] calldata calls) external payable returns (Result[] memory r) {
        r = new Result[](calls.length);
        for (uint256 i; i < calls.length; i++) {
            (bool ok, bytes memory d) = calls[i].target.call(calls[i].callData);
            require(ok || calls[i].allowFailure, "call failed");
            r[i] = Result(ok, d);
        }
    }
}
