/**
 * Imports
 */

import { Union } from '@services/union.service';
import { Struct } from '@services/struct.service';

/**
 * Tests
 */

describe('Union', () => {
    test('sizes to the widest field rather than the sum', () => {
        const union = new Union({ a: 'u8', b: 'u32le', c: 'u16le' });

        expect(union.size).toBe(4);
        expect(new Struct({ a: 'u8', b: 'u32le', c: 'u16le' }).size).toBe(7); // packed, no alignment padding
    });

    test('overlaps every field at offset 0', () => {
        const union = new Union<{ a?: number; b: number }>({ a: 'u8', b: 'u32le' });

        const buffer = union.toBuffer({ b: 0x01020304 });

        expect(buffer.byteLength).toBe(4);

        const decoded = union.toObject(buffer);
        expect(decoded.b).toBe(0x01020304);
        expect(decoded.a).toBe(0x04); // low byte of the little-endian u32 shares offset 0
    });

    test('inherits pointer-size handling from Struct', () => {
        expect(new Union({}).pointerSize).toBe(4);
        expect(new Union({}, { pointerSize: 8 }).pointerSize).toBe(8);
    });

    test('round-trips a single packed bitfield container', () => {
        const union = new Union<{ flags?: number; raw: number }>({ flags: 'u8:4', raw: 'u8' });

        const buffer = union.toBuffer({ raw: 0xAB });

        expect(buffer.byteLength).toBe(1);
        expect(union.toObject(buffer).raw).toBe(0xAB);
    });
});
