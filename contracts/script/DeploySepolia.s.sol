// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { FreelanceEscrow } from "../src/FreelanceEscrow.sol";

address constant BASE_SEPOLIA_USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

contract DeploySepolia is Script {
    function run() external returns (FreelanceEscrow escrow) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        address admin = vm.envOr("ESCROW_ADMIN", deployer);
        address arbitrator = vm.envOr("ESCROW_ARBITRATOR", deployer);
        address feeRecipient = vm.envOr("FEE_RECIPIENT", deployer);
        uint16 platformFeeBps = uint16(vm.envOr("PLATFORM_FEE_BPS", uint256(500)));
        uint256 maxJobAmount = vm.envOr("MAX_JOB_AMOUNT", uint256(10_000e6));

        vm.startBroadcast(deployerPrivateKey);
        escrow = new FreelanceEscrow(
            BASE_SEPOLIA_USDC,
            admin,
            arbitrator,
            feeRecipient,
            platformFeeBps,
            maxJobAmount
        );
        vm.stopBroadcast();

        console2.log("BaseSepoliaUSDC:", BASE_SEPOLIA_USDC);
        console2.log("FreelanceEscrow:", address(escrow));
        console2.log("Deployer:", deployer);
        console2.log("Admin:", admin);
        console2.log("Arbitrator:", arbitrator);
        console2.log("FeeRecipient:", feeRecipient);
        console2.log("PlatformFeeBps:", platformFeeBps);
        console2.log("MaxJobAmount:", maxJobAmount);
    }
}
