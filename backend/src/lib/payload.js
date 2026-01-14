// encode/decode OP_RETURN payloads (JavaScript version)
// Format (binary / compact):
// [1 byte version][8 bytes creatorId][1 byte paymentType][4 bytes contentId][variable metadata]
// creatorId: 8 byte hex (or use 16 hex chars) ; contentId: 32-bit unsigned
// paymentType: 0x01 tip, 0x02 unlock, 0x03 subscription

/**
 * Encode payload
 * @param {Object} opts
 * @param {number} opts.version - Payload version (default: 1)
 * @param {string} opts.creatorId - 8-byte hex string (16 chars)
 * @param {number} opts.paymentType - Payment type (1=tip, 2=unlock, 3=subscription)
 * @param {number} opts.contentId - Content ID (optional)
 * @param {Buffer|string} opts.metadata - Metadata (optional)
 * @returns {Buffer}
 */
function encodePayload(opts) {
  const version = opts.version ?? 1;
  const creatorIdBuf = Buffer.from(opts.creatorId, 'hex');
  if (creatorIdBuf.length !== 8) {
    throw new Error('creatorId must be 8 bytes hex (16 chars)');
  }
  const paymentTypeBuf = Buffer.alloc(1);
  paymentTypeBuf.writeUInt8(opts.paymentType, 0);
  const contentIdBuf = Buffer.alloc(4);
  contentIdBuf.writeUInt32BE(opts.contentId ?? 0, 0);
  const metaBuf = opts.metadata
    ? typeof opts.metadata === 'string'
      ? Buffer.from(opts.metadata)
      : opts.metadata
    : Buffer.alloc(0);
  return Buffer.concat([
    Buffer.from([version]),
    creatorIdBuf,
    paymentTypeBuf,
    contentIdBuf,
    metaBuf
  ]);
}

/**
 * Decode payload
 * @param {Buffer} payloadBuf
 * @returns {Object|null}
 */
function decodePayload(payloadBuf) {
  if (payloadBuf.length < 1 + 8 + 1 + 4) return null;
  const version = payloadBuf.readUInt8(0);
  const creatorId = payloadBuf.slice(1, 9).toString('hex');
  const paymentType = payloadBuf.readUInt8(9);
  const contentId = payloadBuf.readUInt32BE(10);
  const metadata = payloadBuf.length > 14 ? payloadBuf.slice(14) : undefined;
  return { version, creatorId, paymentType, contentId, metadata };
}

module.exports = {
  encodePayload,
  decodePayload
};


