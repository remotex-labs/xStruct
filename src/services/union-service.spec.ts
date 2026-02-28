/**
 * Import will remove at compile time
 */

import type { StructSchemaInterface } from '@services/interfaces/struct-service.interface';

/**
 * Imports
 */

import { Union } from '@services/union.service';
import { Struct } from '@services/struct.service';

/**
 * Tests
 */

describe('Union - constructor / schema validation', () => {
    describe('valid schemas', () => {
        test('should compile a schema of flat primitives without throwing', () => {
            expect(() => {
                new Union({ int: 'UInt32LE', float: 'FloatLE' });
            }).not.toThrow();
        });

        test('should compile a schema containing nested Struct members without throwing', () => {
            const a = new Struct({ x: 'UInt32LE', y: 'UInt32LE' });
            const b = new Struct({ x: 'UInt32LE', y: 'UInt32LE', z: 'UInt32LE' });

            expect(() => {
                new Union({ a, b });
            }).not.toThrow();
        });

        test('should compile a schema with a fixed-size string descriptor without throwing', () => {
            expect(() => {
                new Union({ name: { type: 'string', size: 10 }, id: 'UInt32LE' });
            }).not.toThrow();
        });

        test('should compile a schema with a fixed-size string shorthand without throwing', () => {
            expect(() => {
                new Union({ label: 'string(8)', value: 'UInt32LE' });
            }).not.toThrow();
        });

        test('should compile a schema with a single UInt8 field without throwing', () => {
            expect(() => {
                new Union({ byte: 'UInt8' });
            }).not.toThrow();
        });

        test('should compile an empty schema without throwing', () => {
            expect(() => {
                new Union({});
            }).not.toThrow();
        });
    });

    describe('dynamic string rejection', () => {
        test('should throw for a bare "string" shorthand member', () => {
            expect(() => {
                new Union({ name: 'string' } as StructSchemaInterface);
            }).toThrow('dynamic string type');
        });

        test('should throw for a bare "utf8" shorthand member', () => {
            expect(() => {
                new Union({ name: 'utf8' } as StructSchemaInterface);
            }).toThrow('dynamic string type');
        });

        test('should throw for a bare "ascii" shorthand member', () => {
            expect(() => {
                new Union({ name: 'ascii' } as StructSchemaInterface);
            }).toThrow('dynamic string type');
        });

        test('should throw for a null-terminated string member', () => {
            expect(() => {
                new Union({ name: { type: 'string', nullTerminated: true } });
            }).toThrow('null-terminated strings are not allowed');
        });

        test('should throw for a length-prefixed string member', () => {
            expect(() => {
                new Union({ name: { type: 'string', lengthType: 'UInt16LE' } });
            }).toThrow('length-prefixed strings are not allowed');
        });

        test('should throw and include the member name in the error message', () => {
            expect(() => {
                new Union({ myField: 'string' } as StructSchemaInterface);
            }).toThrow('myField');
        });
    });

    describe('size calculation', () => {
        test('size should equal the widest primitive member', () => {
            const u = new Union({ byte: 'UInt8', word: 'UInt32LE' });
            expect(u.size).toBe(4);
        });

        test('size should equal the widest nested Struct member', () => {
            const small = new Struct({ x: 'UInt8' });                          // 1 byte
            const large = new Struct({ x: 'UInt32LE', y: 'UInt32LE' });        // 8 bytes
            const u = new Union({ small, large });
            expect(u.size).toBe(8);
        });

        test('size should be 0 for an empty schema', () => {
            const u = new Union({});
            expect(u.size).toBe(0);
        });

        test('size should equal the sole member size when only one member is defined', () => {
            const u = new Union({ value: 'UInt16LE' });
            expect(u.size).toBe(2);
        });
    });
});

describe('Union.toObject', () => {
    describe('invalid buffer parameter', () => {
        let u: Union<any>;

        beforeEach(() => {
            u = new Union({ int: 'UInt32LE', float: 'FloatLE' });
        });

        test('should throw when buffer is null', () => {
            expect(() => {
                u.toObject(null as unknown as Buffer);
            }).toThrow();
        });

        test('should throw when buffer is undefined', () => {
            expect(() => {
                u.toObject(undefined as unknown as Buffer);
            }).toThrow();
        });

        test('should throw when buffer is a plain object', () => {
            expect(() => {
                u.toObject({} as unknown as Buffer);
            }).toThrow();
        });

        test('should throw when buffer is a string', () => {
            expect(() => {
                u.toObject('deadbeef' as unknown as Buffer);
            }).toThrow();
        });

        test('should throw when buffer is too small', () => {
            const tooSmall = Buffer.alloc(2); // union requires 4 bytes
            expect(() => {
                u.toObject(tooSmall);
            }).toThrow(/buffer too small/i);
        });
    });

    describe('flat primitive members', () => {
        test('should decode all members from the same bytes', () => {
            const u = new Union<{ int: number; float: number }>({
                int: 'UInt32LE',
                float: 'FloatLE'
            });

            const buffer = Buffer.alloc(4);
            buffer.writeFloatLE(5.0, 0);

            const result = u.toObject(buffer);

            expect(result.float).toBeCloseTo(5.0, 4);
            expect(result.int).toBe(buffer.readUInt32LE(0));
        });

        test('should return every member key regardless of which member was written', () => {
            const u = new Union<{ a: number; b: number; c: number }>({
                a: 'UInt8',
                b: 'UInt16LE',
                c: 'UInt32LE'
            });

            const buffer = Buffer.alloc(4);
            buffer.writeUInt32LE(0xdeadbeef, 0);

            const result = u.toObject(buffer);

            expect(result).toHaveProperty('a');
            expect(result).toHaveProperty('b');
            expect(result).toHaveProperty('c');
        });

        test('should decode UInt8 member correctly', () => {
            const u = new Union<{ byte: number; word: number }>({
                byte: 'UInt8',
                word: 'UInt32LE'
            });

            const buffer = Buffer.alloc(4);
            buffer.writeUInt8(0xAB, 0);

            expect(u.toObject(buffer).byte).toBe(0xAB);
        });

        test('should always read from offset 0 regardless of member size', () => {
            const u = new Union<{ small: number; large: number }>({
                small: 'UInt8',
                large: 'UInt32LE'
            });

            const buffer = Buffer.alloc(4);
            buffer.writeUInt32LE(0x01020304, 0);

            const result = u.toObject(buffer);

            // small reads only the first byte of the same buffer
            expect(result.small).toBe(0x04);
            expect(result.large).toBe(0x01020304);
        });
    });

    describe('nested Struct members', () => {
        test('should decode all Struct members from the same bytes', () => {
            const xy  = new Struct<{ x: number; y: number }>({ x: 'UInt32LE', y: 'UInt32LE' });
            const xyz = new Struct<{ x: number; y: number; z: number }>({ x: 'UInt32LE', y: 'UInt32LE', z: 'UInt32LE' });
            const u   = new Union<{ xy: typeof xy extends Struct<infer S> ? S : never; xyz: typeof xyz extends Struct<infer S> ? S : never }>({ xy, xyz });

            const buffer = Buffer.alloc(u.size);
            buffer.writeUInt32LE(1, 0);
            buffer.writeUInt32LE(2, 4);
            buffer.writeUInt32LE(3, 8);

            const result = u.toObject(buffer);

            expect(result.xy).toEqual({ x: 1, y: 2 });
            expect(result.xyz).toEqual({ x: 1, y: 2, z: 3 });
        });

        test('should return a plain object for each Struct member', () => {
            const inner = new Struct({ value: 'UInt8' });
            const u = new Union<{ inner: { value: number } }>({ inner });

            const buffer = Buffer.alloc(1);
            buffer.writeUInt8(42, 0);

            expect(u.toObject(buffer).inner).toEqual({ value: 42 });
        });
    });

    describe('getDynamicOffset callback', () => {
        test('should invoke getDynamicOffset with the union size', () => {
            const u = new Union({ a: 'UInt8', b: 'UInt32LE' });
            const buffer = Buffer.alloc(u.size);
            const callback = xJet.fn();

            u.toObject(buffer, callback);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(u.size);
        });

        test('should not throw when getDynamicOffset is undefined', () => {
            const u = new Union({ a: 'UInt8' });
            const buffer = Buffer.alloc(u.size);

            expect(() => u.toObject(buffer, undefined)).not.toThrow();
        });
    });
});

describe('Union.toBuffer', () => {
    describe('invalid data parameter', () => {
        let u: Union<any>;

        beforeEach(() => {
            u = new Union({ int: 'UInt32LE', float: 'FloatLE' });
        });

        test('should throw when data is null', () => {
            expect(() => {
                u.toBuffer(null as any);
            }).toThrow(/expected object/i);
        });

        test('should throw when data is undefined', () => {
            expect(() => {
                u.toBuffer(undefined as any);
            }).toThrow(/expected object/i);
        });

        test('should throw when data is a string', () => {
            expect(() => {
                u.toBuffer('bad' as any);
            }).toThrow(/expected object/i);
        });

        test('should throw when data is a number', () => {
            expect(() => {
                u.toBuffer(42 as any);
            }).toThrow(/expected object/i);
        });
    });

    describe('write semantics — first defined member wins', () => {
        test('should write the first member when it is the only defined key', () => {
            const u = new Union<{ int: number; float: number }>({
                int: 'UInt32LE',
                float: 'FloatLE'
            });

            const buffer = u.toBuffer({ int: 0x3f800000 });
            expect(buffer.readUInt32LE(0)).toBe(0x3f800000);
        });

        test('should write the first defined member when multiple keys are present', () => {
            const u = new Union<{ a: number; b: number }>({
                a: 'UInt32LE',
                b: 'UInt32LE'
            });

            // Both keys are present; 'a' is declared first → 'a' must be written
            const buffer = u.toBuffer({ a: 1, b: 2 });
            expect(buffer.readUInt32LE(0)).toBe(1);
        });

        test('should skip undefined members and write the next defined one', () => {
            const u = new Union<{ a: number; b: number }>({
                a: 'UInt32LE',
                b: 'UInt32LE'
            });

            const buffer = u.toBuffer({ b: 99 }); // 'a' is absent → 'b' is written
            expect(buffer.readUInt32LE(0)).toBe(99);
        });

        test('should return a zeroed buffer when no member is defined', () => {
            const u = new Union<{ a: number; b: number }>({
                a: 'UInt32LE',
                b: 'UInt32LE'
            });

            const buffer = u.toBuffer({});
            expect(buffer).toEqual(Buffer.alloc(u.size));
        });
    });

    describe('buffer size and zeroing', () => {
        test('should always return a buffer of exactly this.size bytes', () => {
            const u = new Union({ byte: 'UInt8', dword: 'UInt32LE' });
            const buffer = u.toBuffer({ byte: 0xff });

            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBe(u.size); // 4
        });

        test('should zero bytes not covered by the written member', () => {
            const u = new Union({ byte: 'UInt8', dword: 'UInt32LE' });
            const buffer = u.toBuffer({ byte: 0x01 });

            // Only the first byte is written; bytes 1-3 must remain 0x00
            expect(buffer[0]).toBe(0x01);
            expect(buffer[1]).toBe(0x00);
            expect(buffer[2]).toBe(0x00);
            expect(buffer[3]).toBe(0x00);
        });
    });

    describe('nested Struct members', () => {
        test('should correctly serialize a Struct member', () => {
            const inner = new Struct<{ x: number; y: number }>({ x: 'UInt32LE', y: 'UInt32LE' });
            const u = new Union<{ inner: { x: number; y: number } }>({ inner });

            const buffer = u.toBuffer({ inner: { x: 1, y: 2 } });

            expect(buffer.readUInt32LE(0)).toBe(1);
            expect(buffer.readUInt32LE(4)).toBe(2);
        });

        test('should throw when a Struct member value exceeds its field range', () => {
            const inner = new Struct<{ value: number }>({ value: 'UInt8' });
            const u = new Union<{ inner: { value: number } }>({ inner });

            expect(() => {
                u.toBuffer({ inner: { value: 300 } }); // UInt8 max is 255
            }).toThrow();
        });
    });

    describe('round-trip — toBuffer → toObject', () => {
        test('should round-trip flat primitive members', () => {
            const u = new Union<{ int: number; float: number }>({
                int: 'UInt32LE',
                float: 'FloatLE'
            });

            const original = { float: 1.5 };
            const buffer = u.toBuffer(original);
            const result = u.toObject(buffer);

            expect(result.float).toBeCloseTo(1.5, 4);
            // int must also decode from the same bytes
            expect(typeof result.int).toBe('number');
        });

        test('should round-trip nested Struct members', () => {
            const a = new Struct<{ x: number; y: number }>({ x: 'UInt16LE', y: 'UInt16LE' });
            const b = new Struct<{ x: number; y: number; z: number }>({ x: 'UInt16LE', y: 'UInt16LE', z: 'UInt16LE' });
            const u = new Union<{ a: { x: number; y: number }; b: { x: number; y: number; z: number } }>({ a, b });

            const buffer = u.toBuffer({ a: { x: 10, y: 20 } });
            const result = u.toObject(buffer);

            expect(result.a).toEqual({ x: 10, y: 20 });
            // 'b' reads all three slots from the same bytes; z comes from the bytes a wrote as padding
            expect(result.b.x).toBe(10);
            expect(result.b.y).toBe(20);
        });

        test('should round-trip when Union is nested inside a Struct', () => {
            const u = new Union<{ int: number; float: number }>({ int: 'UInt32LE', float: 'FloatLE' });
            const s = new Struct<{ prefix: number; data: { int: number; float: number } }>({
                prefix: 'UInt8',
                data: u
            });

            const original: any = { prefix: 7, data: { float: 3.14 } };
            const buffer = s.toBuffer(original);
            const result = s.toObject(buffer);

            expect(result.prefix).toBe(7);
            expect(result.data.float).toBeCloseTo(3.14, 2);
        });
    });
});

describe('Union - boundary and edge cases', () => {
    test('should handle a union with a single member', () => {
        const u = new Union<{ value: number }>({ value: 'UInt32LE' });

        const buffer = u.toBuffer({ value: 0xdeadbeef });
        const result = u.toObject(buffer);

        expect(result.value).toBe(0xdeadbeef);
    });

    test('should handle maximum UInt32 value without corruption', () => {
        const u = new Union<{ int: number; float: number }>({ int: 'UInt32LE', float: 'FloatLE' });

        const buffer = u.toBuffer({ int: 4294967295 });
        expect(buffer.readUInt32LE(0)).toBe(4294967295);
    });

    test('should handle BigInt members', () => {
        const u = new Union<{ big: bigint; small: number }>({
            big: 'BigUInt64LE',
            small: 'UInt32LE'
        });

        const buffer = u.toBuffer({ big: 18446744073709551615n });
        const result = u.toObject(buffer);

        expect(result.big).toBe(18446744073709551615n);
    });

    test('should handle a fixed-size string member', () => {
        const u = new Union<{ label: string; id: number }>({
            label: { type: 'string', size: 8 },
            id: 'UInt32LE'
        });

        const buffer = u.toBuffer({ label: 'ABCD' });
        const result = u.toObject(buffer);

        expect(result.label).toBe('ABCD\0\0\0\0');
    });

    test('should handle a buffer that is exactly this.size bytes', () => {
        const u = new Union<any>({ value: 'UInt32LE' });
        const buffer = Buffer.alloc(u.size);
        buffer.writeUInt32LE(42, 0);

        expect(() => u.toObject(buffer)).not.toThrow();
        expect(u.toObject(buffer).value).toBe(42);
    });

    test('should handle a buffer larger than this.size without throwing', () => {
        const u = new Union<any>({ value: 'UInt8' });
        const buffer = Buffer.alloc(100);
        buffer.writeUInt8(7, 0);

        expect(() => u.toObject(buffer)).not.toThrow();
        expect(u.toObject(buffer).value).toBe(7);
    });
});
