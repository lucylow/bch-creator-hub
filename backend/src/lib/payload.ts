// encode/decode OP_RETURN payloads
// Format (binary / compact):
// [1 byte version][8 bytes creatorId][1 byte paymentType][4 bytes contentId][variable metadata]
// creatorId: 8 byte hex (or use 16 hex chars) ; contentId: 32-bit unsigned
// paymentType: 0x01 tip, 0x02 unlock, 0x03 subscription

import { Buffer } from "buffer";

export type ParsedPayload = {
  version: number;
  creatorId: string; // hex
  paymentType: number;
  contentId: number;
  metadata?: Buffer;
};

export function encodePayload(opts: {
  version?: number;
  creatorId: string; // hex string, 16 chars
  paymentType: number;
  contentId?: number;
  metadata?: Buffer | string;
}): Buffer {
  const version = opts.version ?? 1;
  const creatorIdBuf = Buffer.from(opts.creatorId, "hex");
  if (creatorIdBuf.length !== 8) throw new Error("creatorId must be 8 bytes hex (16 chars)");
  const paymentTypeBuf = Buffer.alloc(1);
  paymentTypeBuf.writeUInt8(opts.paymentType, 0);
  const contentIdBuf = Buffer.alloc(4);
  contentIdBuf.writeUInt32BE(opts.contentId ?? 0, 0);
  const metaBuf = opts.metadata ? (typeof opts.metadata === "string" ? Buffer.from(opts.metadata) : opts.metadata) : Buffer.alloc(0);
  return Buffer.concat([Buffer.from([version]), creatorIdBuf, paymentTypeBuf, contentIdBuf, metaBuf]);
}

export function decodePayload(payload: Buffer): ParsedPayload | null {
  if (payload.length < 1 + 8 + 1 + 4) return null;
  const version = payload.readUInt8(0);
  const creatorId = payload.slice(1, 9).toString("hex");
  const paymentType = payload.readUInt8(9);
  const contentId = payload.readUInt32BE(10);
  const metadata = payload.length > 14 ? payload.slice(14) : undefined;
  return { version, creatorId, paymentType, contentId, metadata };
}


