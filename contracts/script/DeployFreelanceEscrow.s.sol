// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { FreelanceEscrow } from "../src/FreelanceEscrow.sol";

contract DeployFreelanceEscrow is Script {
    function run() external returns (FreelanceEscrow escrow) {
        address acceptedToken = vm.envAddress("USDC_CONTRACT_ADDRESS");
        address admin = vm.envAddress("ESCROW_ADMIN");
        address arbitrator = vm.envAddress("ESCROW_ARBITRATOR");
        address feeRecipient = vm.envAddress("FEE_RECIPIENT");
        uint16 platformFeeBps = uint16(vm.envUint("PLATFORM_FEE_BPS"));
        uint256 maxJobAmount = vm.envUint("MAX_JOB_AMOUNT");

        vm.startBroadcast();
        escrow = new FreelanceEscrow(
            acceptedToken,
            admin,
            arbitrator,
            feeRecipient,
            platformFeeBps,
            maxJobAmount
        );
        vm.stopBroadcast();
    }
}
