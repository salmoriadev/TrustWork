// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FreelanceEscrow is AccessControl, Pausable, ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;

    enum JobStatus {
        Created,
        Funded,
        InProgress,
        Completed,
        Cancelled,
        Disputed,
        Resolved
    }

    enum MilestoneStatus {
        Pending,
        Submitted,
        Approved,
        Released,
        RevisionRequested,
        Disputed,
        Resolved
    }

    enum DisputeStatus {
        Opened,
        Resolved
    }

    struct Job {
        uint256 jobId;
        address client;
        address freelancer;
        address token;
        uint256 totalAmount;
        uint256 releasedAmount;
        JobStatus status;
        uint64 createdAt;
    }

    struct Milestone {
        uint256 milestoneId;
        uint256 jobId;
        uint256 amount;
        bytes32 evidenceHash;
        uint64 submittedAt;
        uint64 reviewDeadline;
        MilestoneStatus status;
    }

    struct Dispute {
        uint256 disputeId;
        uint256 jobId;
        uint256 milestoneId;
        address openedBy;
        address arbitrator;
        bytes32 evidenceHash;
        DisputeStatus status;
        uint16 freelancerShareBps;
    }

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");

    uint16 public constant BPS_DENOMINATOR = 10_000;
    uint16 public constant MAX_PLATFORM_FEE_BPS = 1_000;
    uint64 public constant DEFAULT_REVIEW_PERIOD = 7 days;

    bytes32 public constant MUTUAL_CANCEL_TYPEHASH = keccak256(
        "MutualCancel(uint256 jobId,uint256 clientRefund,uint256 freelancerPayout,uint256 nonce,uint256 deadline)"
    );

    address public immutable acceptedToken;
    address public feeRecipient;
    uint16 public platformFeeBps;
    uint256 public maxJobAmount;

    uint256 public nextMilestoneId = 1;
    uint256 public nextDisputeId = 1;

    mapping(uint256 jobId => bool exists) public jobExists;
    mapping(uint256 jobId => Job job) public jobs;
    mapping(uint256 jobId => uint256[] milestoneIds) private jobMilestoneIds;
    mapping(uint256 milestoneId => Milestone milestone) public milestones;
    mapping(uint256 disputeId => Dispute dispute) public disputes;
    mapping(uint256 milestoneId => uint256 disputeId) public milestoneDisputeId;
    mapping(uint256 jobId => uint256 nonce) public jobCancelNonces;
    mapping(uint256 jobId => bool hadDispute) public jobHadDispute;

    event JobCreated(
        uint256 indexed jobId,
        address indexed client,
        address indexed freelancer,
        address token,
        uint256 totalAmount,
        uint256 milestoneCount
    );
    event MilestoneCreated(
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        uint256 amount,
        uint256 sequence
    );
    event JobFunded(uint256 indexed jobId, address indexed client, uint256 amount);
    event MilestoneSubmitted(
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        bytes32 evidenceHash,
        uint64 submittedAt,
        uint64 reviewDeadline
    );
    event MilestoneApproved(
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        uint256 grossAmount,
        uint256 platformFee
    );
    event RevisionRequested(
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        address indexed requestedBy,
        bytes32 evidenceHash
    );
    event DisputeOpened(
        uint256 indexed disputeId,
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        address openedBy,
        address arbitrator,
        bytes32 evidenceHash
    );
    event DisputeResolved(
        uint256 indexed disputeId,
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        uint16 freelancerShareBps,
        uint256 freelancerGrossAmount,
        uint256 clientRefundAmount,
        bytes32 evidenceHash
    );
    event PaymentReleased(
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        address indexed to,
        uint256 amount,
        uint256 platformFee
    );
    event JobCancelled(
        uint256 indexed jobId,
        uint256 clientRefund,
        uint256 freelancerGrossPayout
    );
    event PlatformFeeCollected(
        uint256 indexed jobId,
        uint256 indexed milestoneId,
        address indexed token,
        uint256 amount
    );
    event PlatformFeeUpdated(uint16 oldFeeBps, uint16 newFeeBps);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    event MaxJobAmountUpdated(uint256 oldMaxJobAmount, uint256 newMaxJobAmount);

    error ZeroAddress();
    error InvalidAmount();
    error InvalidBps();
    error InvalidStatus();
    error JobAlreadyExists();
    error JobNotFound();
    error MilestoneNotFound();
    error DisputeNotFound();
    error NotJobClient();
    error NotJobFreelancer();
    error NotJobParticipant();
    error InvalidToken();
    error InvalidEvidenceHash();
    error DeadlineNotReached();
    error SignatureExpired();
    error BadSignature();
    error UnauthorizedArbitrator();

    constructor(
        address acceptedToken_,
        address admin,
        address initialArbitrator,
        address feeRecipient_,
        uint16 platformFeeBps_,
        uint256 maxJobAmount_
    )
        EIP712("FreelanceEscrow", "1")
    {
        if (
            acceptedToken_ == address(0) || admin == address(0)
                || initialArbitrator == address(0) || feeRecipient_ == address(0)
        ) {
            revert ZeroAddress();
        }
        if (platformFeeBps_ > MAX_PLATFORM_FEE_BPS) revert InvalidBps();
        if (maxJobAmount_ == 0) revert InvalidAmount();

        acceptedToken = acceptedToken_;
        feeRecipient = feeRecipient_;
        platformFeeBps = platformFeeBps_;
        maxJobAmount = maxJobAmount_;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(ARBITRATOR_ROLE, initialArbitrator);
    }

    function createJob(
        uint256 jobId,
        address freelancer,
        address token,
        uint256[] calldata milestoneAmounts
    )
        external
        whenNotPaused
    {
        if (jobId == 0) revert InvalidAmount();
        if (jobExists[jobId]) revert JobAlreadyExists();
        if (freelancer == address(0) || freelancer == msg.sender) revert ZeroAddress();
        if (token != acceptedToken) revert InvalidToken();
        if (milestoneAmounts.length == 0) revert InvalidAmount();

        uint256 totalAmount;
        for (uint256 i = 0; i < milestoneAmounts.length; i++) {
            if (milestoneAmounts[i] == 0) revert InvalidAmount();
            totalAmount += milestoneAmounts[i];
        }
        if (totalAmount > maxJobAmount) revert InvalidAmount();

        jobExists[jobId] = true;
        jobs[jobId] = Job({
            jobId: jobId,
            client: msg.sender,
            freelancer: freelancer,
            token: token,
            totalAmount: totalAmount,
            releasedAmount: 0,
            status: JobStatus.Created,
            createdAt: uint64(block.timestamp)
        });

        emit JobCreated(jobId, msg.sender, freelancer, token, totalAmount, milestoneAmounts.length);

        for (uint256 i = 0; i < milestoneAmounts.length; i++) {
            uint256 milestoneId = nextMilestoneId++;
            milestones[milestoneId] = Milestone({
                milestoneId: milestoneId,
                jobId: jobId,
                amount: milestoneAmounts[i],
                evidenceHash: bytes32(0),
                submittedAt: 0,
                reviewDeadline: 0,
                status: MilestoneStatus.Pending
            });
            jobMilestoneIds[jobId].push(milestoneId);
            emit MilestoneCreated(jobId, milestoneId, milestoneAmounts[i], i);
        }
    }

    function fundJob(uint256 jobId) external nonReentrant whenNotPaused existingJob(jobId) {
        Job storage job = jobs[jobId];
        if (msg.sender != job.client) revert NotJobClient();
        if (job.status != JobStatus.Created) revert InvalidStatus();

        job.status = JobStatus.Funded;
        IERC20(job.token).safeTransferFrom(msg.sender, address(this), job.totalAmount);

        emit JobFunded(jobId, msg.sender, job.totalAmount);
    }

    function submitMilestone(
        uint256 milestoneId,
        bytes32 evidenceHash
    )
        external
        whenNotPaused
        existingMilestone(milestoneId)
    {
        if (evidenceHash == bytes32(0)) revert InvalidEvidenceHash();
        Milestone storage milestone = milestones[milestoneId];
        Job storage job = jobs[milestone.jobId];
        if (msg.sender != job.freelancer) revert NotJobFreelancer();
        if (job.status != JobStatus.Funded && job.status != JobStatus.InProgress) {
            revert InvalidStatus();
        }
        if (
            milestone.status != MilestoneStatus.Pending
                && milestone.status != MilestoneStatus.RevisionRequested
        ) {
            revert InvalidStatus();
        }

        uint64 submittedAt = uint64(block.timestamp);
        uint64 reviewDeadline = submittedAt + DEFAULT_REVIEW_PERIOD;

        milestone.evidenceHash = evidenceHash;
        milestone.submittedAt = submittedAt;
        milestone.reviewDeadline = reviewDeadline;
        milestone.status = MilestoneStatus.Submitted;
        job.status = JobStatus.InProgress;

        emit MilestoneSubmitted(
            milestone.jobId,
            milestoneId,
            evidenceHash,
            submittedAt,
            reviewDeadline
        );
    }

    function approveMilestone(
        uint256 milestoneId
    )
        external
        nonReentrant
        whenNotPaused
        existingMilestone(milestoneId)
    {
        Milestone storage milestone = milestones[milestoneId];
        Job storage job = jobs[milestone.jobId];
        if (msg.sender != job.client) revert NotJobClient();
        if (milestone.status != MilestoneStatus.Submitted) revert InvalidStatus();
        if (job.status != JobStatus.InProgress) revert InvalidStatus();

        milestone.status = MilestoneStatus.Released;
        job.releasedAmount += milestone.amount;
        uint256 fee = _payFreelancer(job, milestone.milestoneId, milestone.amount);

        emit MilestoneApproved(job.jobId, milestone.milestoneId, milestone.amount, fee);
        _refreshJobStatusAfterMilestoneFinalized(job.jobId);
    }

    function requestRevision(
        uint256 milestoneId,
        bytes32 evidenceHash
    )
        external
        whenNotPaused
        existingMilestone(milestoneId)
    {
        Milestone storage milestone = milestones[milestoneId];
        Job storage job = jobs[milestone.jobId];
        if (msg.sender != job.client) revert NotJobClient();
        if (milestone.status != MilestoneStatus.Submitted) revert InvalidStatus();
        if (job.status != JobStatus.InProgress) revert InvalidStatus();

        milestone.status = MilestoneStatus.RevisionRequested;
        milestone.reviewDeadline = 0;

        emit RevisionRequested(job.jobId, milestoneId, msg.sender, evidenceHash);
    }

    function openDispute(
        uint256 milestoneId,
        address arbitrator,
        bytes32 evidenceHash
    )
        external
        whenNotPaused
        existingMilestone(milestoneId)
        returns (uint256 disputeId)
    {
        if (evidenceHash == bytes32(0)) revert InvalidEvidenceHash();
        if (arbitrator == address(0) || !hasRole(ARBITRATOR_ROLE, arbitrator)) {
            revert UnauthorizedArbitrator();
        }

        Milestone storage milestone = milestones[milestoneId];
        Job storage job = jobs[milestone.jobId];
        if (msg.sender != job.client && msg.sender != job.freelancer) revert NotJobParticipant();
        if (job.status != JobStatus.InProgress) revert InvalidStatus();
        if (
            milestone.status != MilestoneStatus.Submitted
                && milestone.status != MilestoneStatus.RevisionRequested
        ) {
            revert InvalidStatus();
        }

        disputeId = nextDisputeId++;
        milestone.status = MilestoneStatus.Disputed;
        job.status = JobStatus.Disputed;
        jobHadDispute[job.jobId] = true;
        milestoneDisputeId[milestoneId] = disputeId;
        disputes[disputeId] = Dispute({
            disputeId: disputeId,
            jobId: job.jobId,
            milestoneId: milestoneId,
            openedBy: msg.sender,
            arbitrator: arbitrator,
            evidenceHash: evidenceHash,
            status: DisputeStatus.Opened,
            freelancerShareBps: 0
        });

        emit DisputeOpened(disputeId, job.jobId, milestoneId, msg.sender, arbitrator, evidenceHash);
    }

    function resolveDispute(
        uint256 disputeId,
        uint16 freelancerShareBps,
        bytes32 evidenceHash
    )
        external
        nonReentrant
        whenNotPaused
    {
        if (freelancerShareBps > BPS_DENOMINATOR) revert InvalidBps();
        if (evidenceHash == bytes32(0)) revert InvalidEvidenceHash();

        Dispute storage dispute = disputes[disputeId];
        if (dispute.disputeId == 0) revert DisputeNotFound();
        if (dispute.status != DisputeStatus.Opened) revert InvalidStatus();
        if (msg.sender != dispute.arbitrator || !hasRole(ARBITRATOR_ROLE, msg.sender)) {
            revert UnauthorizedArbitrator();
        }

        Milestone storage milestone = milestones[dispute.milestoneId];
        Job storage job = jobs[dispute.jobId];
        if (job.status != JobStatus.Disputed || milestone.status != MilestoneStatus.Disputed) {
            revert InvalidStatus();
        }

        uint256 freelancerGross = (milestone.amount * freelancerShareBps) / BPS_DENOMINATOR;
        uint256 clientRefund = milestone.amount - freelancerGross;

        dispute.status = DisputeStatus.Resolved;
        dispute.freelancerShareBps = freelancerShareBps;
        dispute.evidenceHash = evidenceHash;
        milestone.evidenceHash = evidenceHash;
        milestone.status = MilestoneStatus.Resolved;
        job.releasedAmount += milestone.amount;

        if (freelancerGross > 0) {
            _payFreelancer(job, milestone.milestoneId, freelancerGross);
        }
        if (clientRefund > 0) {
            IERC20(job.token).safeTransfer(job.client, clientRefund);
            emit PaymentReleased(job.jobId, milestone.milestoneId, job.client, clientRefund, 0);
        }

        emit DisputeResolved(
            disputeId,
            job.jobId,
            milestone.milestoneId,
            freelancerShareBps,
            freelancerGross,
            clientRefund,
            evidenceHash
        );
        _refreshJobStatusAfterMilestoneFinalized(job.jobId);
    }

    function releaseAfterTimeout(
        uint256 milestoneId
    )
        external
        nonReentrant
        whenNotPaused
        existingMilestone(milestoneId)
    {
        Milestone storage milestone = milestones[milestoneId];
        Job storage job = jobs[milestone.jobId];
        if (job.status != JobStatus.InProgress) revert InvalidStatus();
        if (milestone.status != MilestoneStatus.Submitted) revert InvalidStatus();
        if (block.timestamp < milestone.reviewDeadline) revert DeadlineNotReached();

        milestone.status = MilestoneStatus.Released;
        job.releasedAmount += milestone.amount;
        uint256 fee = _payFreelancer(job, milestone.milestoneId, milestone.amount);

        emit MilestoneApproved(job.jobId, milestone.milestoneId, milestone.amount, fee);
        _refreshJobStatusAfterMilestoneFinalized(job.jobId);
    }

    function mutualCancel(
        uint256 jobId,
        uint256 clientRefund,
        uint256 freelancerPayout,
        uint256 deadline,
        bytes calldata clientSignature,
        bytes calldata freelancerSignature
    )
        external
        nonReentrant
        whenNotPaused
        existingJob(jobId)
    {
        if (block.timestamp > deadline) revert SignatureExpired();

        Job storage job = jobs[jobId];
        if (
            job.status != JobStatus.Created && job.status != JobStatus.Funded
                && job.status != JobStatus.InProgress
        ) {
            revert InvalidStatus();
        }

        uint256 remaining = job.status == JobStatus.Created ? 0 : job.totalAmount - job.releasedAmount;
        if (clientRefund + freelancerPayout != remaining) revert InvalidAmount();

        bytes32 digest = hashMutualCancel(jobId, clientRefund, freelancerPayout, deadline);
        if (ECDSA.recover(digest, clientSignature) != job.client) revert BadSignature();
        if (ECDSA.recover(digest, freelancerSignature) != job.freelancer) revert BadSignature();

        jobCancelNonces[jobId]++;
        job.status = JobStatus.Cancelled;
        job.releasedAmount = job.totalAmount;

        uint256[] storage ids = jobMilestoneIds[jobId];
        for (uint256 i = 0; i < ids.length; i++) {
            Milestone storage milestone = milestones[ids[i]];
            if (!_isFinalMilestoneStatus(milestone.status)) {
                milestone.status = MilestoneStatus.Resolved;
            }
        }

        if (clientRefund > 0) {
            IERC20(job.token).safeTransfer(job.client, clientRefund);
            emit PaymentReleased(jobId, 0, job.client, clientRefund, 0);
        }
        if (freelancerPayout > 0) {
            _payFreelancer(job, 0, freelancerPayout);
        }

        emit JobCancelled(jobId, clientRefund, freelancerPayout);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function setPlatformFeeBps(uint16 newFeeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newFeeBps > MAX_PLATFORM_FEE_BPS) revert InvalidBps();
        uint16 oldFeeBps = platformFeeBps;
        platformFeeBps = newFeeBps;
        emit PlatformFeeUpdated(oldFeeBps, newFeeBps);
    }

    function setFeeRecipient(address newFeeRecipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newFeeRecipient == address(0)) revert ZeroAddress();
        address oldRecipient = feeRecipient;
        feeRecipient = newFeeRecipient;
        emit FeeRecipientUpdated(oldRecipient, newFeeRecipient);
    }

    function setMaxJobAmount(uint256 newMaxJobAmount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newMaxJobAmount == 0) revert InvalidAmount();
        uint256 oldMaxJobAmount = maxJobAmount;
        maxJobAmount = newMaxJobAmount;
        emit MaxJobAmountUpdated(oldMaxJobAmount, newMaxJobAmount);
    }

    function hashMutualCancel(
        uint256 jobId,
        uint256 clientRefund,
        uint256 freelancerPayout,
        uint256 deadline
    )
        public
        view
        returns (bytes32)
    {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    MUTUAL_CANCEL_TYPEHASH,
                    jobId,
                    clientRefund,
                    freelancerPayout,
                    jobCancelNonces[jobId],
                    deadline
                )
            )
        );
    }

    function getJob(uint256 jobId) external view existingJob(jobId) returns (Job memory) {
        return jobs[jobId];
    }

    function getMilestone(
        uint256 milestoneId
    )
        external
        view
        existingMilestone(milestoneId)
        returns (Milestone memory)
    {
        return milestones[milestoneId];
    }

    function getDispute(
        uint256 disputeId
    )
        external
        view
        returns (Dispute memory)
    {
        Dispute memory dispute = disputes[disputeId];
        if (dispute.disputeId == 0) revert DisputeNotFound();
        return dispute;
    }

    function getJobMilestones(
        uint256 jobId
    )
        external
        view
        existingJob(jobId)
        returns (uint256[] memory)
    {
        return jobMilestoneIds[jobId];
    }

    function _payFreelancer(
        Job storage job,
        uint256 milestoneId,
        uint256 grossAmount
    )
        private
        returns (uint256 fee)
    {
        fee = (grossAmount * platformFeeBps) / BPS_DENOMINATOR;
        uint256 netAmount = grossAmount - fee;

        if (netAmount > 0) {
            IERC20(job.token).safeTransfer(job.freelancer, netAmount);
            emit PaymentReleased(job.jobId, milestoneId, job.freelancer, netAmount, fee);
        }
        if (fee > 0) {
            IERC20(job.token).safeTransfer(feeRecipient, fee);
            emit PlatformFeeCollected(job.jobId, milestoneId, job.token, fee);
        }
    }

    function _refreshJobStatusAfterMilestoneFinalized(uint256 jobId) private {
        Job storage job = jobs[jobId];
        uint256[] storage ids = jobMilestoneIds[jobId];
        for (uint256 i = 0; i < ids.length; i++) {
            if (!_isFinalMilestoneStatus(milestones[ids[i]].status)) {
                job.status = JobStatus.InProgress;
                return;
            }
        }
        job.status = jobHadDispute[jobId] ? JobStatus.Resolved : JobStatus.Completed;
    }

    function _isFinalMilestoneStatus(
        MilestoneStatus status
    )
        private
        pure
        returns (bool)
    {
        return status == MilestoneStatus.Released || status == MilestoneStatus.Resolved;
    }

    modifier existingJob(uint256 jobId) {
        if (!jobExists[jobId]) revert JobNotFound();
        _;
    }

    modifier existingMilestone(uint256 milestoneId) {
        if (milestones[milestoneId].milestoneId == 0) revert MilestoneNotFound();
        _;
    }
}
