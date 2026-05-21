// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { FreelanceEscrow } from "../src/FreelanceEscrow.sol";
import { MockUSDC } from "../src/MockUSDC.sol";

contract FreelanceEscrowTest is Test {
    MockUSDC private usdc;
    FreelanceEscrow private escrow;

    uint256 private clientPk = 0xA11CE;
    uint256 private freelancerPk = 0xB0B;
    address private client;
    address private freelancer;
    address private admin = address(0xAD);
    address private arbitrator = address(0xA7B);
    address private feeRecipient = address(0xFEE);

    function setUp() public {
        client = vm.addr(clientPk);
        freelancer = vm.addr(freelancerPk);
        usdc = new MockUSDC();
        escrow = new FreelanceEscrow(
            address(usdc),
            admin,
            arbitrator,
            feeRecipient,
            500,
            10_000e6
        );

        usdc.mint(client, 10_000e6);
        vm.prank(client);
        usdc.approve(address(escrow), type(uint256).max);
    }

    function testCreateAndFundJob() public {
        _createJob(1, _amounts(1_000e6));

        vm.prank(client);
        escrow.fundJob(1);

        FreelanceEscrow.Job memory job = escrow.getJob(1);
        assertEq(uint256(job.status), uint256(FreelanceEscrow.JobStatus.Funded));
        assertEq(usdc.balanceOf(address(escrow)), 1_000e6);
    }

    function testApproveMilestonePaysFreelancerAndFee() public {
        uint256 milestoneId = _fundAndSubmitOneMilestone(1, 1_000e6);

        vm.prank(client);
        escrow.approveMilestone(milestoneId);

        assertEq(usdc.balanceOf(freelancer), 950e6);
        assertEq(usdc.balanceOf(feeRecipient), 50e6);
        assertEq(usdc.balanceOf(address(escrow)), 0);

        FreelanceEscrow.Job memory job = escrow.getJob(1);
        assertEq(uint256(job.status), uint256(FreelanceEscrow.JobStatus.Completed));
        assertEq(job.releasedAmount, 1_000e6);
    }

    function testRequestRevisionThenTimeoutRelease() public {
        uint256 milestoneId = _fundAndSubmitOneMilestone(1, 1_000e6);

        vm.prank(client);
        escrow.requestRevision(milestoneId, keccak256("revision-notes"));

        vm.prank(freelancer);
        escrow.submitMilestone(milestoneId, keccak256("second-delivery"));

        FreelanceEscrow.Milestone memory milestone = escrow.getMilestone(milestoneId);
        vm.warp(milestone.reviewDeadline);

        escrow.releaseAfterTimeout(milestoneId);

        assertEq(usdc.balanceOf(freelancer), 950e6);
        assertEq(usdc.balanceOf(feeRecipient), 50e6);
    }

    function testResolveDisputeSplitsFunds() public {
        uint256 milestoneId = _fundAndSubmitOneMilestone(1, 1_000e6);

        vm.prank(client);
        uint256 disputeId = escrow.openDispute(milestoneId, arbitrator, keccak256("client-case"));

        vm.prank(arbitrator);
        escrow.resolveDispute(disputeId, 4_000, keccak256("final-evidence-bundle"));

        assertEq(usdc.balanceOf(freelancer), 380e6);
        assertEq(usdc.balanceOf(feeRecipient), 20e6);
        assertEq(usdc.balanceOf(client), 9_600e6);
        assertEq(usdc.balanceOf(address(escrow)), 0);

        FreelanceEscrow.Job memory job = escrow.getJob(1);
        assertEq(uint256(job.status), uint256(FreelanceEscrow.JobStatus.Resolved));
    }

    function testMutualCancelRequiresBothSignaturesAndPaysRemainingEscrow() public {
        _createJob(1, _amounts2(600e6, 400e6));
        vm.prank(client);
        escrow.fundJob(1);

        uint256[] memory ids = escrow.getJobMilestones(1);
        vm.prank(freelancer);
        escrow.submitMilestone(ids[0], keccak256("delivery"));
        vm.prank(client);
        escrow.approveMilestone(ids[0]);

        uint256 deadline = block.timestamp + 1 days;
        bytes32 digest = escrow.hashMutualCancel(1, 250e6, 150e6, deadline);
        bytes memory clientSig = _sign(clientPk, digest);
        bytes memory freelancerSig = _sign(freelancerPk, digest);

        escrow.mutualCancel(1, 250e6, 150e6, deadline, clientSig, freelancerSig);

        assertEq(usdc.balanceOf(freelancer), 712_500_000);
        assertEq(usdc.balanceOf(feeRecipient), 37_500_000);
        assertEq(usdc.balanceOf(client), 9_250e6);
        assertEq(usdc.balanceOf(address(escrow)), 0);

        FreelanceEscrow.Job memory job = escrow.getJob(1);
        assertEq(uint256(job.status), uint256(FreelanceEscrow.JobStatus.Cancelled));
    }

    function testCannotCreateJobAboveCap() public {
        vm.expectRevert(FreelanceEscrow.InvalidAmount.selector);
        _createJob(1, _amounts(10_001e6));
    }

    function _fundAndSubmitOneMilestone(
        uint256 jobId,
        uint256 amount
    )
        private
        returns (uint256 milestoneId)
    {
        _createJob(jobId, _amounts(amount));

        vm.prank(client);
        escrow.fundJob(jobId);

        uint256[] memory ids = escrow.getJobMilestones(jobId);
        milestoneId = ids[0];

        vm.prank(freelancer);
        escrow.submitMilestone(milestoneId, keccak256("delivery"));
    }

    function _createJob(uint256 jobId, uint256[] memory amounts) private {
        vm.prank(client);
        escrow.createJob(jobId, freelancer, address(usdc), amounts);
    }

    function _amounts(uint256 amount) private pure returns (uint256[] memory amounts) {
        amounts = new uint256[](1);
        amounts[0] = amount;
    }

    function _amounts2(
        uint256 first,
        uint256 second
    )
        private
        pure
        returns (uint256[] memory amounts)
    {
        amounts = new uint256[](2);
        amounts[0] = first;
        amounts[1] = second;
    }

    function _sign(uint256 pk, bytes32 digest) private returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }
}
