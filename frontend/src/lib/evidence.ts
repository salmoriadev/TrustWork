import type { Hex } from "viem";

export interface EvidenceDigest {
  digest: Hex;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export async function digestEvidence(file: File | null, note: string): Promise<EvidenceDigest> {
  const bytes = file ? await file.arrayBuffer() : new TextEncoder().encode(note.trim());
  if (bytes.byteLength === 0) throw new Error("Choose a file or enter a note before hashing.");
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const digest = `0x${Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("")}` as Hex;
  return {
    digest,
    fileName: file?.name ?? "evidence-note.txt",
    contentType: file?.type || "text/plain",
    sizeBytes: bytes.byteLength
  };
}
