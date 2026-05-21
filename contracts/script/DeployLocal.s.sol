// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { FreelanceEscrow } from "../src/FreelanceEscrow.sol";
import { MockUSDC } from "../src/MockUSDC.sol";

contract DeployLocal is Script {
    uint256 private constant DEFAULT_ANVIL_PRIVATE_KEY =
        ANVIL_DEVELOPMENT_KEY_REMOVED;

    uint256 private constant INITIAL_MINT = 1_000_000e6;

    function run() external returns (MockUSDC usdc, FreelanceEscrow escrow) {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", DEFAULT_ANVIL_PRIVATE_KEY);
        address deployer = vm.addr(deployerPrivateKey);

        address admin = vm.envOr("ESCROW_ADMIN", deployer);
        address arbitrator = vm.envOr("ESCROW_ARBITRATOR", deployer);
        address feeRecipient = vm.envOr("FEE_RECIPIENT", deployer);
        uint16 platformFeeBps = uint16(vm.envOr("PLATFORM_FEE_BPS", uint256(500)));
        uint256 maxJobAmount = vm.envOr("MAX_JOB_AMOUNT", uint256(10_000e6));

        vm.startBroadcast(deployerPrivateKey);
        usdc = new MockUSDC();
        usdc.mint(deployer, INITIAL_MINT);
        escrow = new FreelanceEscrow(
            address(usdc),
            admin,
            arbitrator,
            feeRecipient,
            platformFeeBps,
            maxJobAmount
        );
        vm.stopBroadcast();

        console2.log("MockUSDC:", address(usdc));
        console2.log("FreelanceEscrow:", address(escrow));
        console2.log("Deployer/Admin:", deployer);
    }
}
