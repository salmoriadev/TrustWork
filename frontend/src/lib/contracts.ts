import { createWalletClient, custom, keccak256, toBytes, type EIP1193Provider, type Hex } from "viem";

import type { EscrowConfig, PreparedJob } from "./api";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

const escrowAbi = [
  {
    type: "function",
    name: "createJob",
    stateMutability: "nonpayable",
    inputs: [
      { name: "jobId", type: "uint256" },
      { name: "freelancer", type: "address" },
      { name: "token", type: "address" },
      { name: "milestoneAmounts", type: "uint256[]" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "fundJob",
    stateMutability: "nonpayable",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "submitMilestone",
    stateMutability: "nonpayable",
    inputs: [
      { name: "milestoneId", type: "uint256" },
      { name: "evidenceHash", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "approveMilestone",
    stateMutability: "nonpayable",
    inputs: [{ name: "milestoneId", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "requestRevision",
    stateMutability: "nonpayable",
    inputs: [
      { name: "milestoneId", type: "uint256" },
      { name: "evidenceHash", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "openDispute",
    stateMutability: "nonpayable",
    inputs: [
      { name: "milestoneId", type: "uint256" },
      { name: "arbitrator", type: "address" },
      { name: "evidenceHash", type: "bytes32" }
    ],
    outputs: [{ name: "disputeId", type: "uint256" }]
  },
  {
    type: "function",
    name: "releaseAfterTimeout",
    stateMutability: "nonpayable",
    inputs: [{ name: "milestoneId", type: "uint256" }],
    outputs: []
  }
] as const;

const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  }
] as const;

export async function approveUsdc(preparedJob: PreparedJob): Promise<Hex> {
  const wallet = await getWallet();
  return wallet.writeContract({
    address: preparedJob.usdc_contract_address as Hex,
    abi: erc20Abi,
    functionName: "approve",
    chain: undefined,
    args: [preparedJob.escrow_contract_address as Hex, BigInt(preparedJob.total_amount_raw)]
  });
}

export async function createPreparedJob(preparedJob: PreparedJob): Promise<Hex> {
  const wallet = await getWallet();
  return wallet.writeContract({
    address: preparedJob.escrow_contract_address as Hex,
    abi: escrowAbi,
    functionName: "createJob",
    chain: undefined,
    args: [
      BigInt(preparedJob.job_id),
      preparedJob.freelancer_wallet as Hex,
      preparedJob.usdc_contract_address as Hex,
      preparedJob.milestone_amounts_raw.map(BigInt)
    ]
  });
}

export async function fundJob(config: EscrowConfig, jobId: number): Promise<Hex> {
  const wallet = await getWallet();
  return wallet.writeContract({
    address: config.escrow_contract_address as Hex,
    abi: escrowAbi,
    functionName: "fundJob",
    chain: undefined,
    args: [BigInt(jobId)]
  });
}

export async function submitMilestone(
  config: EscrowConfig,
  milestoneId: number,
  evidence: string
): Promise<Hex> {
  const wallet = await getWallet();
  return wallet.writeContract({
    address: config.escrow_contract_address as Hex,
    abi: escrowAbi,
    functionName: "submitMilestone",
    chain: undefined,
    args: [BigInt(milestoneId), evidenceHash(evidence)]
  });
}

export async function approveMilestone(config: EscrowConfig, milestoneId: number): Promise<Hex> {
  const wallet = await getWallet();
  return wallet.writeContract({
    address: config.escrow_contract_address as Hex,
    abi: escrowAbi,
    functionName: "approveMilestone",
    chain: undefined,
    args: [BigInt(milestoneId)]
  });
}

export async function requestRevision(
  config: EscrowConfig,
  milestoneId: number,
  evidence: string
): Promise<Hex> {
  const wallet = await getWallet();
  return wallet.writeContract({
    address: config.escrow_contract_address as Hex,
    abi: escrowAbi,
    functionName: "requestRevision",
    chain: undefined,
    args: [BigInt(milestoneId), evidenceHash(evidence)]
  });
}

export async function openDispute(
  config: EscrowConfig,
  milestoneId: number,
  evidence: string
): Promise<Hex> {
  const wallet = await getWallet();
  return wallet.writeContract({
    address: config.escrow_contract_address as Hex,
    abi: escrowAbi,
    functionName: "openDispute",
    chain: undefined,
    args: [BigInt(milestoneId), config.escrow_arbitrator as Hex, evidenceHash(evidence)]
  });
}

export async function releaseAfterTimeout(config: EscrowConfig, milestoneId: number): Promise<Hex> {
  const wallet = await getWallet();
  return wallet.writeContract({
    address: config.escrow_contract_address as Hex,
    abi: escrowAbi,
    functionName: "releaseAfterTimeout",
    chain: undefined,
    args: [BigInt(milestoneId)]
  });
}

async function getWallet() {
  if (!window.ethereum) {
    throw new Error("Nenhuma carteira EIP-1193 encontrada no navegador");
  }

  const [account] = (await window.ethereum.request({ method: "eth_requestAccounts" })) as Hex[];
  return createWalletClient({ account, transport: custom(window.ethereum) });
}

function evidenceHash(value: string): Hex {
  return keccak256(toBytes(value.trim() || "matchescrow-demo-evidence"));
}
