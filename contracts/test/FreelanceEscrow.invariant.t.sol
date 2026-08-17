// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { StdInvariant } from "forge-std/StdInvariant.sol";
import { Test } from "forge-std/Test.sol";
import { FreelanceEscrow } from "../src/FreelanceEscrow.sol";
import { MockUSDC } from "../src/MockUSDC.sol";

contract EscrowHandler is Test {
    FreelanceEscrow public immutable escrow;
    MockUSDC public immutable usdc;
    address public immutable client;
    address public immutable freelancer;

    uint256 public expectedEscrowBalance;
    uint256 public nextJobId = 1;
    uint256[] private milestoneIds;

    constructor(FreelanceEscrow escrow_, MockUSDC usdc_, address client_, address freelancer_) {
        escrow = escrow_;
        usdc = usdc_;
        client = client_;
        freelancer = freelancer_;
    }

    function createAndFund(uint96 rawAmount) external {
        if (nextJobId > 32) return;

        uint256 amount = bound(uint256(rawAmount), 1, escrow.maxJobAmount());
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;

        usdc.mint(client, amount);
        vm.startPrank(client);
        usdc.approve(address(escrow), amount);
        escrow.createJob(nextJobId, freelancer, address(usdc), amounts);
        escrow.fundJob(nextJobId);
        vm.stopPrank();

        uint256[] memory ids = escrow.getJobMilestones(nextJobId);
        milestoneIds.push(ids[0]);
        expectedEscrowBalance += amount;
        nextJobId++;
    }

    function submitAndApprove(uint256 seed) external {
        if (milestoneIds.length == 0) return;

        uint256 milestoneId = milestoneIds[seed % milestoneIds.length];
        FreelanceEscrow.Milestone memory milestone = escrow.getMilestone(milestoneId);
        if (milestone.status == FreelanceEscrow.MilestoneStatus.Pending) {
            vm.prank(freelancer);
            escrow.submitMilestone(milestoneId, keccak256(abi.encode(milestoneId, seed)));
            milestone = escrow.getMilestone(milestoneId);
        }
        if (milestone.status != FreelanceEscrow.MilestoneStatus.Submitted) return;

        vm.prank(client);
        escrow.approveMilestone(milestoneId);
        expectedEscrowBalance -= milestone.amount;
    }
}

contract FreelanceEscrowInvariantTest is StdInvariant, Test {
    MockUSDC private usdc;
    FreelanceEscrow private escrow;
    EscrowHandler private handler;

    function setUp() public {
        address client = makeAddr("client");
        address freelancer = makeAddr("freelancer");
        address admin = makeAddr("admin");
        address arbitrator = makeAddr("arbitrator");
        address feeRecipient = makeAddr("feeRecipient");

        usdc = new MockUSDC();
        escrow = new FreelanceEscrow(address(usdc), admin, arbitrator, feeRecipient, 500, 10_000e6);
        handler = new EscrowHandler(escrow, usdc, client, freelancer);

        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = EscrowHandler.createAndFund.selector;
        selectors[1] = EscrowHandler.submitAndApprove.selector;
        targetContract(address(handler));
        targetSelector(FuzzSelector({ addr: address(handler), selectors: selectors }));
    }

    function invariantEscrowBalanceMatchesTrackedLiability() public view {
        assertEq(usdc.balanceOf(address(escrow)), handler.expectedEscrowBalance());
    }

    function invariantConfigurationRemainsBounded() public view {
        assertEq(escrow.acceptedToken(), address(usdc));
        assertLe(escrow.platformFeeBps(), escrow.MAX_PLATFORM_FEE_BPS());
    }
}
