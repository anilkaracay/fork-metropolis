import { keccak256, stringToHex, type Hex } from "viem";
import { thesisMetadataSchema, type ThesisMetadataInput } from "./thesis.ts";

export function canonicalThesisMetadata(input: ThesisMetadataInput): string {
  const metadata = thesisMetadataSchema.parse(input);
  // Property construction order is part of metadata version 1.
  return JSON.stringify({
    version: 1,
    reasoning: metadata.reasoning,
    tags: metadata.tags,
    entryNote: metadata.entryNote,
  });
}

export function thesisContentHash(input: ThesisMetadataInput): Hex {
  return keccak256(stringToHex(canonicalThesisMetadata(input)));
}
