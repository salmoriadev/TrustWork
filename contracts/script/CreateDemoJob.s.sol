// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { FreelanceEscrow } from "../src/FreelanceEscrow.sol";

contract CreateDemoJob is Script {
    function run() external {
        uint256 clientPrivateKey = vm.envUint("PRIVATE_KEY");
        address client = vm.addr(clientPrivateKey);
        address freelancer = vm.envAddress("DEMO_FREELANCER");
        address escrowAddress = vm.envAddress("ESCROW_CONTRACT_ADDRESS");
        address usdcAddress = vm.envAddress("USDC_CONTRACT_ADDRESS");
        uint256 jobId = vm.envOr("DEMO_JOB_ID", uint256(1001));

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1_200e6;
        amounts[1] = 800e6;

        vm.startBroadcast(clientPrivateKey);
        IERC20(usdcAddress).approve(escrowAddress, amounts[0] + amounts[1]);
        FreelanceEscrow(escrowAddress).createJob(jobId, freelancer, usdcAddress, amounts);
        FreelanceEscrow(escrowAddress).fundJob(jobId);
        vm.stopBroadcast();

        console2.log("Demo job:", jobId);
        console2.log("Client:", client);
        console2.log("Freelancer:", freelancer);
    }
}
