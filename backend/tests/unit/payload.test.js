/**
 * Unit tests for payload encode/decode utilities
 */

const { encodePayload, decodePayload } = require('../../src/lib/payload');
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
describe('Payload encode/decode', () => {
  test('encode/decode roundtrip', () => {
    const payload = encodePayload({
      creatorId: '0123456789abcdef',
      paymentType: 1,
      contentId: 42,
      metadata: 'hello'
    });
    
    const parsed = decodePayload(payload);
    
    expect(parsed).not.toBeNull();
    expect(parsed.version).toBe(1);
    expect(parsed.creatorId).toBe('0123456789abcdef');
    expect(parsed.paymentType).toBe(1);
    expect(parsed.contentId).toBe(42);
    expect(parsed.metadata?.toString()).toBe('hello');
  });

  test('encode with minimal fields', () => {
    const payload = encodePayload({
      creatorId: '0123456789abcdef',
      paymentType: 1
    });
    
    const parsed = decodePayload(payload);
    
    expect(parsed).not.toBeNull();
    expect(parsed.version).toBe(1);
    expect(parsed.creatorId).toBe('0123456789abcdef');
    expect(parsed.paymentType).toBe(1);
    expect(parsed.contentId).toBe(0);
  });

  test('decode invalid payload (too short)', () => {
    const shortPayload = Buffer.from([1, 2, 3]);
    const parsed = decodePayload(shortPayload);
    expect(parsed).toBeNull();
  });

  test('encode different payment types', () => {
    const types = [1, 2, 3]; // tip, unlock, subscription
    
    types.forEach(type => {
      const payload = encodePayload({
        creatorId: '0123456789abcdef',
        paymentType: type
      });
      
      const parsed = decodePayload(payload);
      expect(parsed.paymentType).toBe(type);
    });
  });

  test('encode with metadata buffer', () => {
    const metadata = Buffer.from('test metadata', 'utf8');
    const payload = encodePayload({
      creatorId: '0123456789abcdef',
      paymentType: 1,
      contentId: 123,
      metadata
    });
    
    const parsed = decodePayload(payload);
    expect(parsed.metadata?.toString('utf8')).toBe('test metadata');
  });

  test('encode throws error for invalid creatorId length', () => {
    expect(() => {
      encodePayload({
        creatorId: '01234567', // too short (8 chars = 4 bytes, needs 16 chars = 8 bytes)
        paymentType: 1
      });
    }).toThrow('creatorId must be 8 bytes hex (16 chars)');
  });

  test('roundtrip with large contentId', () => {
    const largeContentId = 4294967295; // max uint32
    const payload = encodePayload({
      creatorId: '0123456789abcdef',
      paymentType: 2,
      contentId: largeContentId
    });
    
    const parsed = decodePayload(payload);
    expect(parsed.contentId).toBe(largeContentId);
  });
});

