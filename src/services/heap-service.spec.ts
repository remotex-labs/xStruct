/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { PointerSizeType } from '@interfaces/heap.interface';

/**
 * Imports
 */

import { xStructRangeError } from '@errors/range.error';
import { bufferGrow } from '@components/buffer.component';
import { PACKED_MAX_LEN, TAG_FAR, TAG_INLINE, TAG_PACKED } from '@constants/heap.constant';
import { buildLayout, cache, getLayout, heapRead, heapWrite, varintRead, varintWrite } from '@services/heap.service';

/**
 * Tests
 */

describe('heap.service', () => {
    beforeEach(() => {
        cache.clear();
        xJet.clearAllMocks();
    });

    describe('buildLayout', () => {
        test.each<{ ptrSize: PointerSizeType, bits: number, inlineBytes: number, returnBig: boolean }>(
            { ptrSize: 4, bits: 32, inlineBytes: 3, returnBig: false },
            { ptrSize: 8, bits: 64, inlineBytes: 7, returnBig: true }
        )(
            'builds layout for $ptrSize byte pointers',
            ({ ptrSize, bits, inlineBytes, returnBig }) => {
                const layout = buildLayout(ptrSize);

                expect(layout).toMatchObject({
                    bits,
                    inlineBytes,
                    returnBig,
                    farTag: TAG_FAR << BigInt(bits - 2)
                });

                expect(layout.tagShift).toBe(BigInt(bits - 2));
                expect(layout.inlineMask).toBe((1n << BigInt(bits - 2)) - 1n);
                expect(layout.farOffMask).toBe((1n << BigInt(bits - 2)) - 1n);
            }
        );
    });

    describe('getLayout', () => {
        test('caches layouts by pointer size', () => {
            const first = getLayout(4);
            const second = getLayout(4);

            expect(first).toBe(second);
            expect(cache.size).toBe(1);
        });

        test('creates separate layouts for different pointer sizes', () => {
            const a = getLayout(4);
            const b = getLayout(8);

            expect(a).not.toBe(b);
            expect(cache.size).toBe(2);
        });
    });

    describe('varintWrite', () => {
        test.each`
            value      | expected                 | written
            ${ 0 }     | ${ [ 0x00 ] }           | ${ 1 }
            ${ 127 }   | ${ [ 0x7F ] }           | ${ 1 }
            ${ 128 }   | ${ [ 0x80, 0x01 ] }     | ${ 2 }
            ${ 300 }   | ${ [ 0xAC, 0x02 ] }     | ${ 2 }
            ${ 16384 } | ${ [ 0x80, 0x80, 0x01 ] } | ${ 3 }
        `(
            'encodes varint value $value',
            ({ value, expected, written }) => {
                const buffer = Buffer.alloc(16);
                const result = varintWrite(buffer, 0, <number> value);

                expect(result).toBe(written);
                expect(Array.from(buffer.subarray(0, <number> written))).toEqual(expected);
            }
        );
    });

    describe('varintRead', () => {
        test.each`
            encoded                     | expectedValue | expectedBytes
            ${ [ 0x00 ] }               | ${ 0 }        | ${ 1 }
            ${ [ 0x7F ] }               | ${ 127 }      | ${ 1 }
            ${ [ 0x80, 0x01 ] }         | ${ 128 }      | ${ 2 }
            ${ [ 0xAC, 0x02 ] }         | ${ 300 }      | ${ 2 }
            ${ [ 0x80, 0x80, 0x01 ] }   | ${ 16384 }    | ${ 3 }
        `(
            'decodes varint $encoded',
            ({ encoded, expectedValue, expectedBytes }) => {
                const buffer = Buffer.from(<Array<number>> encoded);
                const [ value, bytesRead ] = varintRead(buffer, 0);

                expect(value).toBe(expectedValue);
                expect(bytesRead).toBe(expectedBytes);
            }
        );

        test('round trips values through varint write/read', () => {
            const values = [ 0, 1, 127, 128, 255, 300, 16384 ];

            for (const value of values) {
                const buffer = Buffer.alloc(16);
                const written = varintWrite(buffer, 0, value);
                const [ decoded, bytesRead ] = varintRead(buffer, 0);

                expect(decoded).toBe(value);
                expect(bytesRead).toBe(written);
            }
        });
    });

    describe('heapWrite + heapRead', () => {
        test('writes and reads inline payloads', () => {
            const ctx = { buffer: Buffer.alloc(32), top: 0 };
            const data = Buffer.from([ 0x11, 0x22, 0x33 ]);
            const ptr = heapWrite.call(ctx, data, 4);

            expect(typeof ptr).toBe('number');
            expect(ctx.top).toBe(0);

            const normalized = BigInt(ptr);
            const tag = normalized >> 30n;
            expect(tag).toBe(TAG_INLINE);

            const out = heapRead.call(ctx, ptr, 4);
            expect(out).toEqual(data);
        });

        test('writes and reads packed payloads', () => {
            const ctx = {
                buffer: Buffer.alloc(256),
                top: 0
            };

            const data = Buffer.alloc(32, 0xAA);
            const ptr = heapWrite.call(ctx, data, 4);
            expect(ctx.top).toBe(32);

            const normalized = BigInt(ptr);
            expect(normalized >> BigInt(30)).toBe(TAG_PACKED);

            const len = Number(normalized & BigInt(PACKED_MAX_LEN));
            expect(len).toBe(32);

            const out = heapRead.call(ctx, ptr, 4);
            expect(out).toEqual(data);
            expect(out.buffer).toBe(ctx.buffer.buffer);
        });

        test('writes and reads far payloads', () => {
            const ctx = {
                buffer: Buffer.alloc(32),
                top: 0
            };

            const data = Buffer.alloc(PACKED_MAX_LEN + 1, 0xBB);
            const ptr = heapWrite.call(ctx, data, 4);
            expect(BigInt(ptr) >> 30n).toBe(TAG_FAR);

            const [ len, headerLen ] = varintRead(ctx.buffer, 0);
            expect(len).toBe(data.byteLength);
            expect(ctx.top).toBe(headerLen + data.byteLength);

            const out = heapRead.call(ctx, ptr, 4);
            expect(out).toEqual(data);
        });

        test('returns bigint pointers for pointer sizes above 48 bits', () => {
            const ctx = { buffer: Buffer.alloc(64), top: 0 };
            const ptr = heapWrite.call(ctx, Buffer.from([ 0x01 ]), 8);
            expect(typeof ptr).toBe('bigint');
        });

        test('grows the buffer when capacity is insufficient', () => {
            xJet.mock(bufferGrow);
            const ctx = { buffer: Buffer.alloc(8), top: 0 };
            const data = Buffer.alloc(64, 0xCC);

            heapWrite.call(ctx, data, 4);
            expect(bufferGrow).toHaveBeenCalledTimes(1);
            expect(bufferGrow).toHaveBeenCalledWith(expect.any(Buffer), expect.any(Number));
            expect(ctx.buffer.byteLength).toBeGreaterThan(8);
        });

        test('throws range error when heap exceeds addressable space', () => {
            const layout = getLayout(4);
            const ctx = { buffer: Buffer.alloc(64), top: Number(layout.farOffMask) };
            expect(() => {heapWrite.call(ctx, Buffer.alloc(8), 4);}).toThrow(xStructRangeError);
        });

        test('return buffer(0) for invalid pointer tags', () => {
            const ctx = { buffer: Buffer.alloc(64), top: 0 };
            const invalid = (0x3n << 30n) | 0x1234n;

            expect(heapRead.call(ctx, invalid, 4).length).toBe(0);
        });

        test('normalizes oversized pointer values before decoding', () => {
            const ctx = {
                buffer: Buffer.alloc(64),
                top: 0
            };

            const data = Buffer.from([ 0xAA ]);
            const ptr = heapWrite.call(ctx, data, 4);
            const oversized = (0xFFFF_FFFFn << 32n) | BigInt(ptr);
            const out = heapRead.call(ctx, oversized, 4);
            expect(out.subarray(0, 1)).toEqual(data);
        });

        test('returns zero copy subarrays for packed and far pointers', () => {
            const ctx = {
                buffer: Buffer.alloc(256),
                top: 0
            };

            const packedPtr = heapWrite.call(ctx, Buffer.alloc(32, 0x11), 4);
            const farPtr = heapWrite.call(ctx, Buffer.alloc(PACKED_MAX_LEN + 1, 0x22), 4);
            const packed = heapRead.call(ctx, packedPtr, 4);
            const far = heapRead.call(ctx, farPtr, 4);

            expect(packed.buffer).toBe(ctx.buffer.buffer);
            expect(far.buffer).toBe(ctx.buffer.buffer);
        });

        test('falls back to far encoding when packed pointer exceeds pointer size bits', () => {
            const ctx = { buffer: Buffer.alloc(256), top: 4 }; // pre-advance so off=4

            // off=4, len=4 → packed = (4 << 8) | 4 = 1028 > 63 (max for ptrSize=1) → far
            const data = Buffer.alloc(4, 0xAB);
            const ptr = heapWrite.call(ctx, data, 1);

            const normalized = BigInt(ptr) & 0xFFn;
            expect((normalized >> 6n) & 0x3n).toBe(TAG_FAR);

            const out = heapRead.call(ctx, ptr, 1);
            expect(out).toEqual(data);
        });

        test('uses packed encoding when pointer fits within pointer size bits', () => {
            const ctx = { buffer: Buffer.alloc(256), top: 0 };

            // ptrSize=4 → 32 bits, packed ptr with small off+len fits easily
            const data = Buffer.alloc(4, 0xCD);
            const ptr = heapWrite.call(ctx, data, 4);

            const normalized = BigInt(ptr);
            expect(normalized >> 30n).toBe(TAG_PACKED);

            const out = heapRead.call(ctx, ptr, 4);
            expect(out).toEqual(data);
        });

        test('packed encoding boundary: largest payload that still fits in ptrSize=2', () => {
            const ctx = { buffer: Buffer.alloc(256), top: 0 };
            const data = Buffer.alloc(63, 0xEE);
            const ptr = heapWrite.call(ctx, data, 2);

            const normalized = BigInt(ptr) & 0xFFFFn;
            expect(normalized >> 14n).toBe(TAG_PACKED);

            const out = heapRead.call(ctx, ptr, 2);
            expect(out).toEqual(data);
        });

        test('falls back to far when packed would exceed ptrSize=2 bits', () => {
            const ctx = { buffer: Buffer.alloc(256), top: 0 };
            heapWrite.call(ctx, Buffer.alloc(64, 0x01), 2);  // top becomes 64
            const data = Buffer.alloc(4, 0xFF);
            const ptr = heapWrite.call(ctx, data, 2);

            const normalized = BigInt(ptr) & 0xFFFFn;
            expect(normalized >> 14n).toBe(TAG_FAR);

            const out = heapRead.call(ctx, ptr, 2);
            expect(out).toEqual(data);
        });

        test('inline payload encodes and decodes exact length', () => {
            const ctx = { buffer: Buffer.alloc(32), top: 0 };

            // ptrSize=4, inlineBytes=3 - write 2 bytes, must decode back to exactly 2
            const data = Buffer.from([ 0x11, 0x22 ]);
            const ptr = heapWrite.call(ctx, data, 4);

            expect(ctx.top).toBe(0); // no heap write
            expect((BigInt(ptr) >> 30n) & 0x3n).toBe(TAG_INLINE);

            const out = heapRead.call(ctx, ptr, 4);
            expect(out).toEqual(data);
            expect(out.byteLength).toBe(2); // not 3 (inlineBytes)
        });

        test('inline payload with 1 byte decodes exact length', () => {
            const ctx = { buffer: Buffer.alloc(32), top: 0 };

            const data = Buffer.from([ 0xAB ]);
            const ptr = heapWrite.call(ctx, data, 4);

            expect(ctx.top).toBe(0);
            expect((BigInt(ptr) >> 30n) & 0x3n).toBe(TAG_INLINE);

            const out = heapRead.call(ctx, ptr, 4);
            expect(out).toEqual(data);
            expect(out.byteLength).toBe(1);
        });

        test('inline payload at full capacity decodes exact length', () => {
            const ctx = { buffer: Buffer.alloc(32), top: 0 };

            // ptrSize=4, inlineBytes=3 - write all 3 bytes
            const data = Buffer.from([ 0x11, 0x22, 0x33 ]);
            const ptr = heapWrite.call(ctx, data, 4);

            expect(ctx.top).toBe(0);
            expect((BigInt(ptr) >> 30n) & 0x3n).toBe(TAG_INLINE);

            const out = heapRead.call(ctx, ptr, 4);
            expect(out).toEqual(data);
            expect(out.byteLength).toBe(3);
        });

        test('inline length field does not bleed into payload bytes', () => {
            const ctx = { buffer: Buffer.alloc(32), top: 0 };

            // ensure the 4-bit length field does not corrupt payload values
            const data = Buffer.from([ 0xFF, 0xFF ]);
            const ptr = heapWrite.call(ctx, data, 4);

            const out = heapRead.call(ctx, ptr, 4);
            expect(out[0]).toBe(0xFF);
            expect(out[1]).toBe(0xFF);
            expect(out.byteLength).toBe(2);
        });

        test('inline round trips across all supported pointer sizes', () => {
            const cases: Array<{ ptrSize: PointerSizeType, data: Buffer }> = [
                { ptrSize: 2, data: Buffer.from([ 0x42 ]) },
                { ptrSize: 4, data: Buffer.from([ 0x01, 0x02 ]) },
                { ptrSize: 6, data: Buffer.from([ 0x01, 0x02, 0x03, 0x04 ]) },
                { ptrSize: 8, data: Buffer.from([ 0x01, 0x02, 0x03, 0x04, 0x05 ]) }
            ];

            for (const { ptrSize, data } of cases) {
                const ctx = { buffer: Buffer.alloc(32), top: 0 };
                const ptr = heapWrite.call(ctx, data, ptrSize);

                expect(ctx.top).toBe(0); // no heap write for inline
                expect(heapRead.call(ctx, ptr, ptrSize)).toEqual(data);
                expect(heapRead.call(ctx, ptr, ptrSize).byteLength).toBe(data.byteLength);
            }
        });
    });
});
