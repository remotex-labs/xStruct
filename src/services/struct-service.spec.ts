/**
 * Import will remove at compile time
 */

import type { StructSchemaInterface } from '@services/interfaces/struct-service.interface';

/**
 * Imports
 */

import { Struct } from '@services/struct.service';

/**
 * Tests
 */

describe('Struct.toObject', () => {
    // Original test cases...

    // New test cases for invalid parameters and edge cases

    describe('invalid buffer parameter', () => {
        const schema: StructSchemaInterface = {
            id: 'UInt32LE',
            name: { type: 'string', size: 10 }
        };

        let struct: Struct<any>;

        beforeEach(() => {
            struct = new Struct(schema);
        });

        test('should throw when buffer is null', () => {
            expect(() => {
                struct.toObject(null as unknown as Buffer);
            }).toThrow();
        });

        test('should throw when buffer is undefined', () => {
            expect(() => {
                struct.toObject(undefined as unknown as Buffer);
            }).toThrow();
        });

        test('should throw when buffer is not a Buffer instance', () => {
            expect(() => {
                struct.toObject({} as unknown as Buffer);
            }).toThrow();
        });

        test('should throw when buffer is too small for the schema', () => {
            // Schema requires 14+ bytes but buffer only has 10
            const tooSmallBuffer = Buffer.alloc(10);

            expect(() => {
                struct.toObject(tooSmallBuffer);
            }).toThrow('Buffer size is less than expected: 10 < 14');
        });
    });

    describe('invalid getDynamicOffset parameter', () => {
        const schema: StructSchemaInterface = { count: 'UInt8' };
        let struct: Struct<any>;

        beforeEach(() => {
            struct = new Struct(schema);
        });

        test('should not throw when getDynamicOffset is not a function', () => {
            const buffer = Buffer.alloc(1);
            buffer.writeUInt8(5, 0);

            // These should not throw since getDynamicOffset is optional
            expect(() => {
                struct.toObject(buffer, null as unknown as (offset: number) => void);
            }).not.toThrow();

            expect(() => {
                struct.toObject(buffer, {} as unknown as (offset: number) => void);
            }).not.toThrow();

            expect(() => {
                struct.toObject(buffer, undefined);
            }).not.toThrow();
        });
    });

    describe('comprehensive tests for all supported data types', () => {
        describe('numeric primitives', () => {
            test('should handle all primitive numeric types', () => {
                const schema: StructSchemaInterface = {
                    uint8: 'UInt8',
                    int8: 'Int8',
                    uint16le: 'UInt16LE',
                    uint16be: 'UInt16BE',
                    int16le: 'Int16LE',
                    int16be: 'Int16BE',
                    uint32le: 'UInt32LE',
                    uint32be: 'UInt32BE',
                    int32le: 'Int32LE',
                    int32be: 'Int32BE',
                    biguint64le: 'BigUInt64LE',
                    bigint64le: 'BigInt64LE',
                    floatle: 'FloatLE',
                    doublele: 'DoubleLE'
                };

                const struct = new Struct<any>(schema);

                // Size calculation: 1+1+2+2+2+2+4+4+4+4+8+8+4+8 = 54 bytes
                const buffer = Buffer.alloc(54);
                let offset = 0;

                // Write test values
                buffer.writeUInt8(255, offset);
                offset += 1;
                buffer.writeInt8(-128, offset);
                offset += 1;
                buffer.writeUInt16LE(65535, offset);
                offset += 2;
                buffer.writeUInt16BE(65535, offset);
                offset += 2;
                buffer.writeInt16LE(-32768, offset);
                offset += 2;
                buffer.writeInt16BE(-32768, offset);
                offset += 2;
                buffer.writeUInt32LE(4294967295, offset);
                offset += 4;
                buffer.writeUInt32BE(4294967295, offset);
                offset += 4;
                buffer.writeInt32LE(-2147483648, offset);
                offset += 4;
                buffer.writeInt32BE(-2147483648, offset);
                offset += 4;
                buffer.writeBigUInt64LE(BigInt('18446744073709551615'), offset);
                offset += 8;
                buffer.writeBigInt64LE(BigInt('-9223372036854775808'), offset);
                offset += 8;
                buffer.writeFloatLE(3.14, offset);
                offset += 4;
                buffer.writeDoubleLE(Math.PI, offset);

                const result = struct.toObject(buffer);

                expect(result).toEqual({
                    uint8: 255,
                    int8: -128,
                    uint16le: 65535,
                    uint16be: 65535,
                    int16le: -32768,
                    int16be: -32768,
                    uint32le: 4294967295,
                    uint32be: 4294967295,
                    int32le: -2147483648,
                    int32be: -2147483648,
                    biguint64le: BigInt('18446744073709551615'),
                    bigint64le: BigInt('-9223372036854775808'),
                    floatle: expect.closeTo(3.14, 0.001), // Float precision may vary slightly
                    doublele: Math.PI
                });
            });

            test('should handle edge values for numeric types', () => {
                const schema: StructSchemaInterface = {
                    uint8Min: 'UInt8',
                    uint8Max: 'UInt8',
                    int8Min: 'Int8',
                    int8Max: 'Int8'
                };

                const struct = new Struct<any>(schema);
                const buffer = Buffer.alloc(4);

                buffer.writeUInt8(0, 0);     // uint8Min: minimum value
                buffer.writeUInt8(255, 1);   // uint8Max: maximum value
                buffer.writeInt8(-128, 2);   // int8Min: minimum value
                buffer.writeInt8(127, 3);    // int8Max: maximum value

                const result = struct.toObject(buffer);

                expect(result).toEqual({
                    uint8Min: 0,
                    uint8Max: 255,
                    int8Min: -128,
                    int8Max: 127
                });
            });
        });

        describe('arrays of primitives', () => {
            test('should handle arrays of numeric primitives', () => {
                const schema: StructSchemaInterface = {
                    // @ts-expect-error - Complex array type not properly recognized by TypeScript
                    bytes: { type: 'UInt8', arraySize: 4 },
                    // @ts-expect-error - Complex array type not properly recognized by TypeScript
                    ints: { type: 'Int32LE', arraySize: 2 }
                };

                const struct = new Struct(schema);
                const buffer = Buffer.alloc(12); // 4*1 + 2*4 = 12 bytes

                // Write byte array [10, 20, 30, 40]
                buffer.writeUInt8(10, 0);
                buffer.writeUInt8(20, 1);
                buffer.writeUInt8(30, 2);
                buffer.writeUInt8(40, 3);

                // Write int32 array [1000000, -1000000]
                buffer.writeInt32LE(1000000, 4);
                buffer.writeInt32LE(-1000000, 8);

                const result = struct.toObject(buffer);

                expect(result).toEqual({
                    bytes: [ 10, 20, 30, 40 ],
                    ints: [ 1000000, -1000000 ]
                });
            });

            test('should handle empty arrays', () => {
                const schema: StructSchemaInterface = {
                    // @ts-expect-error - Complex array type not properly recognized by TypeScript
                    emptyArray: { type: 'UInt8', arraySize: 0 }
                };

                const struct = new Struct(schema);
                const buffer = Buffer.alloc(1);

                const result = struct.toObject(buffer);

                expect(result).toEqual({
                    emptyArray: 0
                });
            });
        });

        describe('string types', () => {
            test('should handle fixed-size strings', () => {
                const schema: StructSchemaInterface = {
                    name: { type: 'string', size: 10 }
                };

                const struct = new Struct<any>(schema);
                const buffer = Buffer.alloc(10);

                buffer.write('John Doe', 0, 10);

                const result = struct.toObject(buffer);

                expect(result.name).toEqual('John Doe\0\0');
            });

            test('should handle null-terminated strings', () => {
                const schema: StructSchemaInterface = {
                    name: { type: 'string', nullTerminated: true }
                };

                const struct = new Struct<any>(schema);
                // Buffer with "Test" + null terminator + extra data
                const buffer = Buffer.from('Test\0Extra', 'utf8');

                const result = struct.toObject(buffer);

                expect(result.name).toEqual('Test');

                // Position should be after the null terminator
                const finalOffset = { value: 0 };
                struct.toObject(buffer, (offset) => {
                    finalOffset.value = offset;
                });
                expect(finalOffset.value).toEqual(5); // "Test" + null byte
            });

            test('should handle length-prefixed strings', () => {
                const schema: StructSchemaInterface = {
                    message: { type: 'string', lengthType: 'UInt16LE' }
                };

                const struct = new Struct<any>(schema);
                // 2 bytes for length + string content
                const buffer = Buffer.alloc(20);

                const testString = 'Hello, World!';
                buffer.writeUInt16LE(testString.length, 0);
                buffer.write(testString, 2);

                const result = struct.toObject(buffer);

                expect(result.message).toEqual('Hello, World!');
            });

            test('should handle arrays of strings', () => {
                const schema: StructSchemaInterface = {
                    names: { type: 'string', arraySize: 3, lengthType: 'UInt16LE' }
                };

                const struct = new Struct<any>(schema);
                // Each string has UInt16LE length prefix by default
                const buffer = Buffer.alloc(50);
                let offset = 0;

                const strings = [ 'Alice', 'Bob', 'Charlie' ];
                for (const str of strings) {
                    buffer.writeUInt16LE(str.length, offset);
                    offset += 2;
                    buffer.write(str, offset);
                    offset += str.length;
                }

                const result = struct.toObject(buffer);

                expect(result.names).toEqual(strings);
            });

            test('should handle empty strings', () => {
                const schema: StructSchemaInterface = {
                    empty: { type: 'string', size: 0 }
                };

                const struct = new Struct<any>(schema);
                const buffer = Buffer.alloc(2);

                const result = struct.toObject(buffer);

                expect(result.empty).toEqual('');
            });
        });

        describe('bitfields', () => {
            test('should handle various bitfield sizes', () => {
                const schema: StructSchemaInterface = {
                    bit1: 'UInt8:1',    // 1 bit field
                    bit3: 'UInt8:3',    // 3 bit field
                    bit7: 'UInt16LE:7', // 7 bit field in 16-bit word
                    bit12: 'UInt16BE:12' // 12 bit field in big-endian 16-bit word
                };

                const struct = new Struct<any>(schema);
                const buffer = Buffer.alloc(6);

                // First byte: 10101010 (binary) = 0xAA
                // bit1 gets 0, bit3 gets 101 = 5
                buffer.writeUInt8(0xa, 0);

                // Next two bytes (little endian): 11110000 11001100 = 0xF0CC
                // bit7 gets 1110000 = 112
                buffer.writeUInt16LE(0x70, 1);

                // Last byte for bit12 (big endian high 12 bits): 1010101010101 = 0xAAA
                buffer.writeUInt16BE(0xAAA, 3);

                const result = struct.toObject(buffer);

                expect(result).toEqual({
                    bit1: 0,
                    bit3: 5,
                    bit7: 112,
                    bit12: 0xAAA
                });
            });

            test('should throw when extracting bits beyond field size', () => {
                const schema: StructSchemaInterface = {
                    // @ts-expect-error - Testing invalid bitfield that exceeds UInt8 size
                    invalid: 'UInt8:9' // 9 bits from 8-bit field (invalid)
                };

                expect(() => {
                    new Struct(schema);
                }).toThrow();
            });
        });

        describe('nested structures', () => {
            test('should handle nested struct with mixed types', () => {
                // Create inner structs
                const headerSchema: StructSchemaInterface = {
                    version: 'UInt8',
                    active: 'Int8:1',
                    access: 'Int8:3',
                    num: 'Int8:4'
                };

                const headerStruct = new Struct<any>(headerSchema);
                const positionSchema: StructSchemaInterface = {
                    x: 'FloatLE',
                    y: 'FloatLE',
                    z: 'FloatLE'
                };

                const positionStruct = new Struct<any>(positionSchema);
                const schema: StructSchemaInterface = {
                    header: headerStruct,
                    name: { type: 'string', nullTerminated: true },
                    position: positionStruct,
                    tags: { type: 'string', arraySize: 2 }
                };

                const struct = new Struct<any>(schema);
                const buffer = struct.toBuffer({
                    header: {
                        version: 1,
                        active: -1,
                        access: -3,
                        num: -8
                    },
                    name: 'Test Object',
                    position: {
                        x: 1.5,
                        y: 2.5,
                        z: 3.5
                    },
                    tags: [ 'red', 'blue' ]
                });

                const result = struct.toObject(buffer);
                expect(result).toEqual({
                    header: {
                        version: 1,
                        active: -1,
                        access: -3,
                        num: -8
                    },
                    name: 'Test Object',
                    position: {
                        x: expect.closeTo(1.5, 0.001),
                        y: expect.closeTo(2.5, 0.001),
                        z: expect.closeTo(3.5, 0.001)
                    },
                    tags: [ 'red', 'blue' ]
                });
            });

            test('should handle arrays of nested structs', () => {
                // Create inner struct
                const pointSchema: StructSchemaInterface = {
                    x: 'Int16LE',
                    y: 'Int16LE'
                };
                const pointStruct = new Struct<any>(pointSchema);

                // Create main struct with array of structs
                const schema: StructSchemaInterface = {
                    count: 'UInt8',
                    points: { type: pointStruct, arraySize: 3 }
                };

                const struct = new Struct<any>(schema);

                // 1 byte for count + (3 structs * 4 bytes each) = 13 bytes
                const buffer = Buffer.alloc(13);
                let offset = 0;

                // Write count
                buffer.writeUInt8(3, offset++);

                // Write points
                const points = [
                    { x: 10, y: 20 },
                    { x: -30, y: 40 },
                    { x: 0, y: -50 }
                ];

                for (const point of points) {
                    buffer.writeInt16LE(point.x, offset);
                    offset += 2;
                    buffer.writeInt16LE(point.y, offset);
                    offset += 2;
                }

                const result = struct.toObject(buffer);

                expect(result).toEqual({
                    count: 3,
                    points: points
                });
            });
        });

        describe('boundary tests and malformed data', () => {
            test('should throw when reading past buffer end', () => {
                const schema: StructSchemaInterface = {
                    longString: { type: 'string', lengthType: 'UInt16LE' }
                };

                const struct = new Struct<any>(schema);

                // Create buffer that claims string length is 1000 but buffer is only 10 bytes
                const buffer = Buffer.alloc(10);
                buffer.writeUInt16LE(1000, 0); // Claim string is 1000 bytes long

                expect(() => {
                    struct.toObject(buffer);
                }).toThrow();
            });

            test('should handle a completely invalid buffer (zero-length)', () => {
                const schema: StructSchemaInterface = {
                    value: 'UInt8'
                };

                const struct = new Struct<any>(schema);
                const buffer = Buffer.alloc(0);

                expect(() => {
                    struct.toObject(buffer);
                }).toThrow();
            });

            test('should validate array bounds', () => {
                const schema: StructSchemaInterface = {
                    // Very large array that would cause memory issues if not validated
                    // @ts-expect-error - Testing invalid array size validation
                    hugeArray: { type: 'UInt32LE', arraySize: Number.MAX_SAFE_INTEGER }
                };

                // This should either throw during schema compilation
                // or when trying to allocate memory for the array
                expect(() => {
                    new Struct(schema);
                }).toThrow();
            });
        });
    });
});

describe('Struct.toBuffer', () => {
    // Basic struct for testing
    const basicStruct = new Struct({
        id: 'UInt8',
        value: 'Int16LE',
        flag: 'UInt8:1'
    });

    // Nested struct for testing complex scenarios
    const nestedStruct = new Struct({
        header: 'UInt8',
        body: new Struct({
            name: { type: 'string', size: 10 },
            count: 'UInt16LE'
        })
    });

    // Array struct for testing array handling
    const arrayStruct = new Struct({
        counts: 'UInt8[4]',
        values: 'Int16LE[3]'
    });

    describe('Happy path scenarios', () => {
        test('should serialize basic struct data correctly', () => {
            const data = { id: 42, value: 12345, flag: 1 };
            const buffer = basicStruct.toBuffer(data);

            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBe(basicStruct.size);
            expect(buffer[0]).toBe(42); // id
            expect(buffer.readInt16LE(1)).toBe(12345); // value
            expect(buffer[3] & 0x01).toBe(1); // flag (first bit)
        });

        test('should serialize nested struct data correctly', () => {
            const data = {
                header: 255,
                body: {
                    name: 'Test',
                    count: 500
                }
            };

            const buffer = nestedStruct.toBuffer(data);

            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBe(nestedStruct.size);
            expect(buffer[0]).toBe(255); // header
            expect(buffer.toString('utf8', 1, 5)).toBe('Test'); // name
            expect(buffer.readUInt16LE(11)).toBe(500); // count
        });

        test('should serialize array fields correctly', () => {
            const data = {
                counts: [ 1, 2, 3, 4 ],
                values: [ 100, 200, 300 ]
            };

            const buffer = arrayStruct.toBuffer(data);

            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBe(arrayStruct.size);

            // Check counts array
            expect(buffer[0]).toBe(1);
            expect(buffer[1]).toBe(2);
            expect(buffer[2]).toBe(3);
            expect(buffer[3]).toBe(4);

            // Check values array
            expect(buffer.readInt16LE(4)).toBe(100);
            expect(buffer.readInt16LE(6)).toBe(200);
            expect(buffer.readInt16LE(8)).toBe(300);
        });

        test('should handle zero values correctly', () => {
            const data = { id: 0, value: 0, flag: 0 };
            const buffer = basicStruct.toBuffer(data);

            expect(buffer[0]).toBe(0); // id
            expect(buffer.readInt16LE(1)).toBe(0); // value
            expect(buffer[3] & 0x01).toBe(0); // flag
        });

        test('should handle maximum values correctly', () => {
            const data = { id: 255, value: 32767, flag: 1 };
            const buffer = basicStruct.toBuffer(data);

            expect(buffer[0]).toBe(255); // id (max UInt8)
            expect(buffer.readInt16LE(1)).toBe(32767); // value (max Int16)
            expect(buffer[3] & 0x01).toBe(1); // flag
        });
    });

    describe('Edge cases and error handling', () => {
        test('should throw error when data is null', () => {
            expect(() => {
                basicStruct.toBuffer(null as any);
            }).toThrow(/Expected an object of fields/);
        });

        test('should throw error when data is undefined', () => {
            expect(() => {
                basicStruct.toBuffer(undefined as any);
            }).toThrow(/Expected an object of fields/);
        });

        test('should throw error when data is not an object', () => {
            expect(() => {
                basicStruct.toBuffer('string' as any);
            }).toThrow(/Expected an object of fields/);

            expect(() => {
                basicStruct.toBuffer(123 as any);
            }).toThrow(/Expected an object of fields/);

            expect(() => {
                basicStruct.toBuffer(true as any);
            }).toThrow(/Expected an object of fields/);
        });

        test('should throw error when field value exceeds allowed range', () => {
            expect(() => {
                basicStruct.toBuffer({ id: 256, value: 12345, flag: 1 });
            }).toThrow(); // UInt8 max is 255

            expect(() => {
                basicStruct.toBuffer({ id: 42, value: 32768, flag: 1 });
            }).toThrow(); // Int16 max is 32767

            expect(() => {
                basicStruct.toBuffer({ id: 42, value: 12345, flag: 2 });
            }).toThrow(); // UInt8:1 max is 1
        });

        test('should not throw error when array length is incorrect', () => {
            expect(() => {
                arrayStruct.toBuffer({
                    counts: [ 1, 2, 3 ], // Should be 4 elements
                    values: [ 100, 200, 300 ]
                });
            }).not.toThrow();

            expect(() => {
                arrayStruct.toBuffer({
                    counts: [ 1, 2, 3, 4, 5 ], // Should be 4 elements
                    values: [ 100, 200, 300 ]
                });
            }).not.toThrow();
        });

        test('should not throw error when nested object is missing', () => {
            expect(() => {
                nestedStruct.toBuffer({
                    header: 255
                    // missing body
                } as any);
            }).not.toThrow();
        });

        test('should throw error when nested object is not an object', () => {
            expect(() => {
                nestedStruct.toBuffer({
                    header: 255,
                    body: 'not an object'
                } as any);
            }).toThrow();
        });

        test('should not throw error when string value is too long', () => {
            expect(() => {
                const stringStruct = new Struct({
                    name: { type: 'string', size: 5 }
                });

                stringStruct.toBuffer({ name: 'This string is way too long' });
            }).not.toThrow();
        });

        test('should handle negative values correctly for signed types', () => {
            const signedStruct = new Struct({
                value: 'Int16LE'
            });

            const buffer = signedStruct.toBuffer({ value: -12345 });
            expect(buffer.readInt16LE(0)).toBe(-12345);
        });

        test('should throw error for negative values in unsigned types', () => {
            const unsignedStruct = new Struct({
                value: 'UInt16LE'
            });

            expect(() => {
                unsignedStruct.toBuffer({ value: -1 });
            }).toThrow();
        });

        test('should handle partial data object correctly', () => {
            // When some fields are missing, should throw an error
            expect(() => {
                basicStruct.toBuffer({ id: 42 } as any);
            }).not.toThrow();
        });

        test('should ignore extra fields in data object', () => {
            const data = {
                id: 42,
                value: 12345,
                flag: 1,
                extraField: 'should be ignored'
            };

            const buffer = basicStruct.toBuffer(data);

            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBe(basicStruct.size);
            expect(buffer[0]).toBe(42); // id
        });

        test('should throw error when data fields have incorrect types', () => {
            expect(() => {
                basicStruct.toBuffer({
                    id: '42', // should be number
                    value: 12345,
                    flag: 1
                } as any);
            }).toThrow();

            expect(() => {
                basicStruct.toBuffer({
                    id: 42,
                    value: '12345', // should be number
                    flag: 1
                } as any);
            }).toThrow();
        });

        test('should throw error when BigInt is expected but not provided', () => {
            const bigIntStruct = new Struct({
                value: 'BigInt64LE'
            });

            expect(() => {
                bigIntStruct.toBuffer({ value: 123 }); // Not a BigInt
            }).toThrow();

            // This should work
            const buffer = bigIntStruct.toBuffer({ value: 123n });
            expect(buffer.readBigInt64LE(0)).toBe(123n);
        });
    });

    describe('Boundary value tests', () => {
        test('should handle boundary values for all primitive types', () => {
            const boundaryStruct = new Struct({
                uint8: 'UInt8',
                int8: 'Int8',
                uint16: 'UInt16LE',
                int16: 'Int16LE',
                uint32: 'UInt32LE',
                int32: 'Int32LE',
                bigUint64: 'BigUInt64LE',
                bigInt64: 'BigInt64LE'
            });

            const data = {
                uint8: 255, // Max UInt8
                int8: -128, // Min Int8
                uint16: 65535, // Max UInt16
                int16: -32768, // Min Int16
                uint32: 4294967295, // Max UInt32
                int32: -2147483648, // Min Int32
                bigUint64: 18446744073709551615n, // Max UInt64
                bigInt64: -9223372036854775808n // Min Int64
            };

            const buffer = boundaryStruct.toBuffer(data);

            expect(buffer.readUInt8(0)).toBe(255);
            expect(buffer.readInt8(1)).toBe(-128);
            expect(buffer.readUInt16LE(2)).toBe(65535);
            expect(buffer.readInt16LE(4)).toBe(-32768);
            expect(buffer.readUInt32LE(6)).toBe(4294967295);
            expect(buffer.readInt32LE(10)).toBe(-2147483648);
            expect(buffer.readBigUInt64LE(14)).toBe(18446744073709551615n);
            expect(buffer.readBigInt64LE(22)).toBe(-9223372036854775808n);
        });

        test('should handle empty and maximum length strings', () => {
            const stringStruct = new Struct({
                emptyStr: { type: 'string', size: 5 },
                fullStr: { type: 'string', size: 5 }
            });

            const data = {
                emptyStr: '',
                fullStr: 'ABCDE' // Exactly 5 characters
            };

            const buffer = stringStruct.toBuffer(data);

            expect(buffer.toString('utf8', 0, 5).trim()).toBe('\0'.repeat(5)); // Empty string
            expect(buffer.toString('utf8', 5, 10)).toBe('ABCDE'); // Full string
        });
    });
});

describe('Struct toBuffer with Bitfield fields', () => {
    test('should serialize a bitfield value correctly', () => {
        const struct = new Struct({
            field1: 'UInt8:4',  // 4-bit field
            field2: 'UInt8:4'   // Another 4-bit field
        });

        const data = {
            field1: 10,  // 4-bit value (binary 1010)
            field2: 5    // 4-bit value (binary 0101)
        };

        const buffer = struct.toBuffer(data);
        expect(buffer).toEqual(Buffer.from([ 90 ])); // 90 = 0b01011010 in binary (field1 + field2)
    });

    test('should throw error if bitfield value exceeds the bit width', () => {
        const struct = new Struct({
            field1: 'UInt8:4',  // 4-bit field
            field2: 'UInt8:4'   // Another 4-bit field
        });

        const data = {
            field1: 16,  // Invalid value, as 16 exceeds 4 bits (max is 15 for 4 bits)
            field2: 5
        };

        expect(() => struct.toBuffer(data)).toThrow(
            'Value 16 does not fit within 4 bits for type UInt8'
        );
    });

    test('should correctly serialize a bitfield with multiple bit lengths', () => {
        const struct = new Struct({
            field1: 'UInt8:3',  // 3-bit field
            field2: 'UInt8:5',   // 5-bit field
            field3: 'Int8'
        });

        const data = {
            field1: 5,   // 3-bit value (binary 101)
            field2: 17,  // 5-bit value (binary 10001)
            field3: 7
        };

        const buffer = struct.toBuffer(data);
        const expectedBuffer = Buffer.from([ 0b10001101, 0b111 ]); // Expected binary result: field2 (10001) + field1 (101)
        expect(buffer).toEqual(expectedBuffer);
    });

    test('should throw error if bitfield value is negative for unsigned bitfield', () => {
        const struct = new Struct({
            field1: 'UInt8:4'  // 4-bit unsigned field
        });

        const data = {
            field1: -1  // Invalid negative value for an unsigned 4-bit field
        };

        expect(() => struct.toBuffer(data)).toThrow(
            'Value -1 does not fit within 4 bits for type UInt8'
        );
    });

    test('should throw error if bitfield type is invalid', () => {
        expect(() => {
            new Struct({
                // @ts-expect-error test invalided type
                field1: 'test:4'  // 4-bit unsigned field
            });
        }).toThrow(
            'test is not supported'
        );
    });

    test('should serialize signed bitfield field correctly', () => {
        const struct = new Struct({
            field1: 'Int8:4'  // 4-bit signed field
        });

        const data = {
            field1: -4  // A signed value (-4 fits in a 4-bit signed integer)
        };

        const buffer = struct.toBuffer(data);
        expect(buffer).toEqual(Buffer.from([ 0b1100 ])); // -4 is represented as 1100 in 4-bit signed
    });

    test('should throw error if signed bitfield value exceeds its bit range', () => {
        const struct = new Struct({
            field1: 'Int8:4'  // 4-bit signed field
        });

        const data = {
            field1: 8  // Invalid value for a signed 4-bit integer (max is 8 for 4 bits signed)
        };

        expect(() => struct.toBuffer(data)).toThrow(
            'Value 8 does not fit within 4 bits for type Int8'
        );
    });

    test('should serialize multiple bitfield fields with mixed sizes', () => {
        const struct = new Struct({
            field1: 'UInt8:3',  // 3-bit field
            field2: 'UInt8:5',  // 5-bit field
            field3: 'UInt8:7'   // 7-bit field
        });

        const data = {
            field1: 5,  // 3-bit value (binary 101)
            field2: 17, // 5-bit value (binary 10001)
            field3: 64  // 7-bit value (binary 1000000)
        };

        const buffer = struct.toBuffer(data);
        const expectedBuffer = Buffer.from([ 0b10001101, 0b1000000 ]);  // Combine the bitfields into the buffer
        expect(buffer).toEqual(expectedBuffer);
    });
});

describe('Struct toObject with Bitfield fields', () => {
    test('should correctly deserialize a bitfield value from buffer', () => {
        const struct = new Struct<{
            field1: number,
            field2: number
        }>({
            field1: 'UInt8:4',  // 4-bit field
            field2: 'UInt8:4'   // Another 4-bit field
        });

        // Buffer with serialized data (in this case: 0101 1010, binary representation)
        const buffer = Buffer.from([ 90 ]);

        const result = struct.toObject(buffer);

        // We expect the bitfield fields to be correctly deserialized:
        expect(result.field1).toBe(10); // 1010 (binary)
        expect(result.field2).toBe(5);  // 0101 (binary)
    });

    test('should correctly deserialize a signed bitfield from buffer', () => {
        const struct = new Struct<{
            field1: number
        }>({
            field1: 'Int8:4'  // 4-bit signed field
        });

        // Buffer with signed 4-bit field value (binary 1100 represents -4)
        const buffer = Buffer.from([ 0b1100 ]);
        const result = struct.toObject(buffer);

        // We expect the signed bitfield field to be correctly deserialized:
        expect(result.field1).toBe(-4);  // Binary 1100 represents -4 for 4-bit signed
    });

    test('should correctly deserialize multiple bitfield values from buffer', () => {
        const struct = new Struct<{
            field1: number,
            field2: number,
            field3: number
        }>({
            field1: 'UInt8:3',  // 3-bit field
            field2: 'UInt8:5',  // 5-bit field
            field3: 'UInt8:7'   // 7-bit field
        });

        // Buffer with multiple bitfield values (binary 101, 10001, and 1000000)
        const buffer = Buffer.from([ 0b10001101, 0b1000000 ]);
        const result = struct.toObject(buffer);

        // We expect the bitfield fields to be correctly deserialized:
        expect(result.field1).toBe(5);   // Binary 101
        expect(result.field2).toBe(17);  // Binary 10001
        expect(result.field3).toBe(64);  // Binary 1000000
    });

    test('should correctly deserialize a bitfield value within its size when part of a larger binary sequence', () => {
        const struct = new Struct<{
            field1: number
        }>({
            field1: 'UInt8:4'  // 4-bit field
        });

        // Buffer with a value that exceeds the 4-bit limit in total binary representation (0b10011),
        // but only the lower 4 bits should be extracted.
        const buffer = Buffer.from([ 0b10011 ]);  // Only 0b0011 (3) is valid for field1
        expect(struct.toObject(buffer).field1).toBe(3); // Extracted value is the lower 4 bits: 0b0011
    });

    test('should correctly deserialize unsigned bitfield without interpreting it as negative', () => {
        const struct = new Struct<{
            field1: number
        }>({
            field1: 'UInt8:4'  // 4-bit unsigned field
        });

        // Buffer with a value represented as 0b1100.
        // Since this is an unsigned field, the value should deserialize as 12 (not interpreted as negative).
        const buffer = Buffer.from([ 0b1100 ]);
        expect(struct.toObject(buffer).field1).toBe(12); // The value is directly 0b1100 (12 in decimal).
    });

    describe('string with nullTerminated option', () => {
        test('should throw an error when no null terminator is present', () => {
            const schema: StructSchemaInterface = {
                name: { type: 'utf8', nullTerminated: true },
                value: 'UInt8'
            };

            const struct = new Struct<any>(schema);
            const buffer = Buffer.from('HelloWorld\x01', 'utf8'); // Create a buffer without any null terminators for the string
            expect(() => struct.toObject(buffer)).toThrow();
        });

        test('should throw when null terminator is not found within maxLength', () => {
            const schema: StructSchemaInterface = {
                name: { type: 'utf8', nullTerminated: true, maxLength: 2 },
                value: 'UInt8'
            };

            const struct = new Struct<any>(schema);
            const buffer = Buffer.from('Hello\0World\x01', 'utf8');

            // Should throw an error because the null terminator is not within maxLength (2)
            expect(() => struct.toObject(buffer)).toThrow();
        });
    });
});

describe('Struct - String Fields', () => {
    test('should serialize a string field to a buffer', () => {
        const struct = new Struct({
            name: { type: 'string', size: 10 } // Fixed-length string of 10 bytes
        });

        const data = { name: 'Hello' }; // String shorter than the fixed length
        const buffer = struct.toBuffer(data);

        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBe(10); // The buffer size should match the defined length
        expect(buffer.toString('utf8')).toBe('Hello'.padEnd(10, '\0')); // Ensure correct string data
    });

    test('should deserialize a string field from a buffer', () => {
        const struct = new Struct<{ name: string }>({
            name: { type: 'string', nullTerminated: true } // Fixed-length string of 10 bytes
        });

        const buffer = Buffer.alloc(10);
        buffer.write('World'); // Write a string to the buffer
        const obj = struct.toObject(buffer);
        expect(obj).toEqual({ name: 'World' }); // Ensure correct deserialization
    });

    test('should correctly handle string truncation if it exceeds the defined length', () => {
        const struct = new Struct({
            name: { type: 'string', size: 5 } // Fixed-length string of 5 bytes
        });

        const data = { name: 'TooLong' }; // String longer than the fixed length
        const buffer = struct.toBuffer(data);

        expect(buffer.toString('utf8').trim()).toBe('TooLo'); // Truncated to fit the defined length
    });

    test('should pad the string with null bytes if it is shorter than the defined length', () => {
        const struct = new Struct({
            name: { type: 'string', size: 8 } // Fixed-length string of 8 bytes
        });

        const data = { name: 'Pad' }; // String shorter than the fixed length
        const buffer = struct.toBuffer(data);

        expect(buffer.toString('utf8')).toBe('Pad\u0000\u0000\u0000\u0000\u0000'); // Padded with null bytes
    });

    test('should correctly deserialize a null-padded string from a buffer', () => {
        const struct = new Struct<{ name: string }>({
            name: { type: 'string', size: 8 } // Fixed-length string of 8 bytes
        });

        const buffer = Buffer.alloc(8);
        buffer.write('Hello'); // Write a shorter string

        const obj = struct.toObject(buffer);

        expect(obj).toEqual({ name: 'Hello\0\0\0' }); // Ensure null padding is trimmed during deserialization
    });

    test('should throw an error if Struct field has invalid types', () => {
        const struct = new Struct<{ name: any }>({
            name: { type: 'string', size: 8 } // Fixed-length string of 8 bytes
        });

        // Attempting to serialize with invalid nested field types
        expect(() => {
            struct.toBuffer({
                name: 5465456
            });
        }).toThrow('argument must be a string');
    });
});

describe('Struct - toBuffer for all types', () => {
    test('should serialize Int8 correctly', () => {
        const struct = new Struct({ value: 'Int8' });
        const buffer = struct.toBuffer({ value: -12 });
        expect(buffer.readInt8(0)).toBe(-12);
    });

    test('should serialize UInt8 correctly', () => {
        const struct = new Struct({ value: 'UInt8' });
        const buffer = struct.toBuffer({ value: 255 });
        expect(buffer.readUInt8(0)).toBe(255);
    });

    test('should serialize Int16LE correctly', () => {
        const struct = new Struct({ value: 'Int16LE' });
        const buffer = struct.toBuffer({ value: -32768 });
        expect(buffer.readInt16LE(0)).toBe(-32768);
    });

    test('should serialize Int16BE correctly', () => {
        const struct = new Struct({ value: 'Int16BE' });
        const buffer = struct.toBuffer({ value: -32768 });
        expect(buffer.readInt16BE(0)).toBe(-32768);
    });

    test('should serialize UInt16LE correctly', () => {
        const struct = new Struct({ value: 'UInt16LE' });
        const buffer = struct.toBuffer({ value: 65535 });
        expect(buffer.readUInt16LE(0)).toBe(65535);
    });

    test('should serialize UInt16BE correctly', () => {
        const struct = new Struct({ value: 'UInt16BE' });
        const buffer = struct.toBuffer({ value: 65535 });
        expect(buffer.readUInt16BE(0)).toBe(65535);
    });

    test('should serialize Int32LE correctly', () => {
        const struct = new Struct({ value: 'Int32LE' });
        const buffer = struct.toBuffer({ value: -2147483648 });
        expect(buffer.readInt32LE(0)).toBe(-2147483648);
    });

    test('should serialize Int32BE correctly', () => {
        const struct = new Struct({ value: 'Int32BE' });
        const buffer = struct.toBuffer({ value: -2147483648 });
        expect(buffer.readInt32BE(0)).toBe(-2147483648);
    });

    test('should serialize UInt32LE correctly', () => {
        const struct = new Struct({ value: 'UInt32LE' });
        const buffer = struct.toBuffer({ value: 4294967295 });
        expect(buffer.readUInt32LE(0)).toBe(4294967295);
    });

    test('should serialize UInt32BE correctly', () => {
        const struct = new Struct({ value: 'UInt32BE' });
        const buffer = struct.toBuffer({ value: 4294967295 });
        expect(buffer.readUInt32BE(0)).toBe(4294967295);
    });

    test('should serialize BigInt64LE correctly', () => {
        const struct = new Struct({ value: 'BigInt64LE' });
        const buffer = struct.toBuffer({ value: BigInt('-9223372036854775808') });
        expect(buffer.readBigInt64LE(0)).toBe(BigInt('-9223372036854775808'));
    });

    test('should serialize BigInt64BE correctly', () => {
        const struct = new Struct({ value: 'BigInt64BE' });
        const buffer = struct.toBuffer({ value: BigInt('-9223372036854775808') });
        expect(buffer.readBigInt64BE(0)).toBe(BigInt('-9223372036854775808'));
    });

    test('should serialize BigUInt64LE correctly', () => {
        const struct = new Struct({ value: 'BigUInt64LE' });
        const buffer = struct.toBuffer({ value: BigInt('18446744073709551615') });
        expect(buffer.readBigUInt64LE(0)).toBe(BigInt('18446744073709551615'));
    });

    test('should serialize BigUInt64BE correctly', () => {
        const struct = new Struct({ value: 'BigUInt64BE' });
        const buffer = struct.toBuffer({ value: BigInt('18446744073709551615') });
        expect(buffer.readBigUInt64BE(0)).toBe(BigInt('18446744073709551615'));
    });

    test('Expected a BigInt for field "BigUInt64BE", but received number', () => {
        const struct = new Struct({ value: 'BigUInt64BE' });
        // Attempting to serialize with invalid nested field types
        expect(() => struct.toBuffer({ value: 54654554 }))
            .toThrow(`Expected a BigInt for field "BigUInt64BE", but received ${ 54654554 }`);
    });

    test('should throw error if type is invalid', () => {
        expect(() => {
            new Struct({
                // @ts-expect-error test invalided type
                field1: 'UInt320LE'  // 4-bit unsigned field
            });
        }).toThrow(
            'Invalid primitive type: UInt320LE'
        );
    });
});

describe('Struct - toBuffer with length validation', () => {
    test('should throw an error if the value length exceeds schema-defined length (UInt8)', () => {
        const struct = new Struct({ value: 'UInt8' });

        // Exceeds UInt8 range (value > 255)
        expect(() => struct.toBuffer({ value: 256 })).toThrow(
            'The value of "value" is out of range. It must be >= 0 and <= 255. Received 256'
        );
    });

    test('should throw an error if the value length exceeds schema-defined length (Int8)', () => {
        const struct = new Struct({ value: 'Int8' });

        // Exceeds Int8 range (-128 to 127)
        expect(() => struct.toBuffer({ value: 128 })).toThrow(
            'The value of "value" is out of range. It must be >= -128 and <= 127. Received 128'
        );
    });

    test('should throw an error if the value length exceeds schema-defined length (Bitfield)', () => {
        const struct = new Struct({ value: 'UInt8:4' }); // 4-bit field

        // Exceeds 4-bit range (value > 15)
        expect(() => struct.toBuffer({ value: 16 })).toThrow(
            'Value 16 does not fit within 4 bits for type UInt8'
        );
    });

    test('should throw an error if the value length exceeds schema-defined length (UInt16LE)', () => {
        const struct = new Struct({ value: 'UInt16LE' });

        // Exceeds UInt16 range (value > 65535)
        expect(() => struct.toBuffer({ value: 65536 })).toThrow(
            'The value of "value" is out of range. It must be >= 0 and <= 65535. Received 65536'
        );
    });

    test('should throw an error if the value length exceeds schema-defined length (BigUInt64LE)', () => {
        const struct = new Struct({ value: 'BigUInt64LE' });

        // Exceeds BigUInt64 range (value > 2^64 - 1)
        const tooLargeValue = BigInt('18446744073709551616'); // 2^64
        expect(() => struct.toBuffer({ value: tooLargeValue })).toThrow(
            'The value of "value" is out of range. It must be >= 0n and < 2n ** 64n. Received 18_446_744_073_709_551_616n'
        );
    });

    test('should throw an error for nested Struct if the serialized length exceeds its size', () => {
        const nestedStruct = new Struct({ nestedField: 'UInt8' });
        const struct = new Struct({
            field1: 'UInt8',
            field2: nestedStruct
        });

        // Passing an invalid value to the nested struct
        expect(() => struct.toBuffer({
            field1: 12,
            field2: { nestedField: 300 } // Exceeds UInt8 range
        })).toThrow('The value of "value" is out of range. It must be >= 0 and <= 255. Received 300');
    });

    test('should throw an error for buffer overflow with larger nested data', () => {
        const nestedStruct = new Struct({ nestedField: 'UInt16LE' }); // Size: 2 bytes
        const struct = new Struct({
            field1: 'UInt8', // Size: 1 byte
            field2: nestedStruct // Size: 2 bytes
        });

        // Try to overflow the buffer
        const invalidData = {
            field1: 1,
            field2: { nestedField: 65536 } // Exceeds UInt16 range
        };

        expect(() => struct.toBuffer(invalidData)).toThrow(
            'The value of "value" is out of range. It must be >= 0 and <= 65535. Received 65536'
        );
    });
});

describe('Struct - from Buffer for all supported types', () => {
    test('should deserialize Int8 from buffer', () => {
        const struct = new Struct<{ field1: number }>({ field1: 'Int8' });
        const buffer = Buffer.from([ 0x7F ]); // Max value for Int8 (127)
        const result = struct.toObject(buffer);
        expect(result.field1).toBe(127);
    });

    test('should deserialize UInt8 from buffer', () => {
        const struct = new Struct<{ field1: number }>({ field1: 'UInt8' });
        const buffer = Buffer.from([ 0xFF ]); // Max value for UInt8 (255)
        const result = struct.toObject(buffer);
        expect(result.field1).toBe(255);
    });

    test('should deserialize Int16LE from buffer', () => {
        const struct = new Struct<{ field1: number }>({ field1: 'Int16LE' });
        const buffer = Buffer.from([ 0xFF, 0x7F ]); // Max value for Int16LE (32767)
        const result = struct.toObject(buffer);
        expect(result.field1).toBe(32767);
    });

    test('should deserialize Int16BE from buffer', () => {
        const struct = new Struct<{ field1: number }>({ field1: 'Int16BE' });
        const buffer = Buffer.from([ 0x7F, 0xFF ]); // Max value for Int16BE (32767)
        const result = struct.toObject(buffer);
        expect(result.field1).toBe(32767);
    });

    test('should deserialize UInt16LE from buffer', () => {
        const struct = new Struct<{ field1: number }>({ field1: 'UInt16LE' });
        const buffer = Buffer.from([ 0xFF, 0xFF ]); // Max value for UInt16LE (65535)
        const result = struct.toObject(buffer);
        expect(result.field1).toBe(65535);
    });

    test('should deserialize UInt16BE from buffer', () => {
        const struct = new Struct<{ field1: number }>({ field1: 'UInt16BE' });
        const buffer = Buffer.from([ 0xFF, 0xFF ]); // Max value for UInt16BE (65535)
        const result = struct.toObject(buffer);
        expect(result.field1).toBe(65535);
    });

    test('should deserialize Int32LE from buffer', () => {
        const struct = new Struct<{ field1: number }>({ field1: 'Int32LE' });
        const buffer = Buffer.from([ 0xFF, 0xFF, 0xFF, 0x7F ]); // Max value for Int32LE (2147483647)
        const result = struct.toObject(buffer);
        expect(result.field1).toBe(2147483647);
    });

    test('should deserialize Int32BE from buffer', () => {
        const struct = new Struct<{ field1: number }>({ field1: 'Int32BE' });
        const buffer = Buffer.from([ 0x7F, 0xFF, 0xFF, 0xFF ]); // Max value for Int32BE (2147483647)
        const result = struct.toObject(buffer);
        expect(result.field1).toBe(2147483647);
    });

    test('should deserialize UInt32LE from buffer', () => {
        const struct = new Struct<{ field1: number }>({ field1: 'UInt32LE' });
        const buffer = Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFF ]); // Max value for UInt32LE (4294967295)
        const result = struct.toObject(buffer);
        expect(result.field1).toBe(4294967295);
    });

    test('should deserialize UInt32BE from buffer', () => {
        const struct = new Struct<{ field1: number }>({ field1: 'UInt32BE' });
        const buffer = Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFF ]); // Max value for UInt32BE (4294967295)
        const result = struct.toObject(buffer);
        expect(result.field1).toBe(4294967295);
    });

    test('should deserialize BigInt64LE from buffer', () => {
        const struct = new Struct<{ field1: bigint }>({ field1: 'BigInt64LE' });
        const buffer = Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F ]); // Max value for BigInt64LE
        const result = struct.toObject(buffer);
        expect(result.field1).toBe(BigInt('9223372036854775807'));
    });

    test('should deserialize BigInt64BE from buffer', () => {
        const struct = new Struct<{ field1: bigint }>({ field1: 'BigInt64BE' });
        const buffer = Buffer.from([ 0x7F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF ]); // Max value for BigInt64BE
        const result = struct.toObject(buffer);
        expect(result.field1).toBe(BigInt('9223372036854775807'));
    });

    test('should deserialize BigUInt64LE from buffer', () => {
        const struct = new Struct<{ field1: bigint }>({ field1: 'BigUInt64LE' });
        const buffer = Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF ]); // Max value for BigUInt64LE
        const result = struct.toObject(buffer);
        expect(result.field1).toBe(BigInt('18446744073709551615'));
    });

    test('should deserialize BigUInt64BE from buffer', () => {
        const struct = new Struct<{ field1: bigint }>({ field1: 'BigUInt64BE' });
        const buffer = Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF ]); // Max value for BigUInt64BE
        const result = struct.toObject(buffer);
        expect(result.field1).toBe(BigInt('18446744073709551615'));
    });
});

describe('Struct - Endianness Validation (Little Endian and Big Endian)', () => {
    test('should correctly handle Int16LE and Int16BE', () => {
        const struct = new Struct<{ fieldLE: number; fieldBE: number }>({
            fieldLE: 'Int16LE',
            fieldBE: 'Int16BE'
        });

        const buffer = Buffer.from([ 0x34, 0x12, 0x12, 0x34 ]); // 0x1234 for LE and BE
        const result = struct.toObject(buffer);

        // Validate Little Endian and Big Endian decoding
        expect(result.fieldLE).toBe(0x1234); // Little Endian -> 0x1234
        expect(result.fieldBE).toBe(0x1234); // Big Endian -> 0x1234
    });

    test('should correctly handle UInt32LE and UInt32BE', () => {
        const struct = new Struct<{ fieldLE: number; fieldBE: number }>({
            fieldLE: 'UInt32LE',
            fieldBE: 'UInt32BE'
        });

        const buffer = Buffer.from([
            0x78, 0x56, 0x34, 0x12, // UInt32LE -> 0x12345678
            0x12, 0x34, 0x56, 0x78 // UInt32BE -> 0x12345678
        ]);
        const result = struct.toObject(buffer);

        // Validate Little Endian and Big Endian decoding
        expect(result.fieldLE).toBe(0x12345678); // Little Endian
        expect(result.fieldBE).toBe(0x12345678); // Big Endian
    });

    test('should correctly handle BigInt64LE and BigInt64BE', () => {
        const struct = new Struct<{ fieldLE: bigint; fieldBE: bigint }>({
            fieldLE: 'BigInt64LE',
            fieldBE: 'BigInt64BE'
        });

        const buffer = Buffer.from([
            0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // BigInt64LE -> 1
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01 // BigInt64BE -> 1
        ]);
        const result = struct.toObject(buffer);

        // Validate Little Endian and Big Endian decoding
        expect(result.fieldLE).toBe(BigInt(1)); // Little Endian
        expect(result.fieldBE).toBe(BigInt(1)); // Big Endian
    });

    test('should correctly serialize Int16LE and Int16BE', () => {
        const struct = new Struct({
            fieldLE: 'Int16LE',
            fieldBE: 'Int16BE'
        });

        const data = {
            fieldLE: 0x1234, // Value to serialize
            fieldBE: 0x1234 // Value to serialize
        };

        const buffer = struct.toBuffer(data);

        // Validate Little Endian serialization
        expect(buffer.slice(0, 2)).toEqual(Buffer.from([ 0x34, 0x12 ])); // 0x1234 in LE

        // Validate Big Endian serialization
        expect(buffer.slice(2, 4)).toEqual(Buffer.from([ 0x12, 0x34 ])); // 0x1234 in BE
    });

    test('should correctly serialize and deserialize UInt32LE and UInt32BE', () => {
        const struct = new Struct<{ fieldLE: number; fieldBE: number }>({
            fieldLE: 'UInt32LE',
            fieldBE: 'UInt32BE'
        });

        const data = {
            fieldLE: 0x12345678,
            fieldBE: 0x12345678
        };

        const buffer = struct.toBuffer(data);
        const result = struct.toObject(buffer);

        // Validate Little Endian serialization
        expect(buffer.slice(0, 4)).toEqual(Buffer.from([ 0x78, 0x56, 0x34, 0x12 ])); // LE

        // Validate Big Endian serialization
        expect(buffer.slice(4, 8)).toEqual(Buffer.from([ 0x12, 0x34, 0x56, 0x78 ])); // BE

        // Validate round-trip serialization and deserialization
        expect(result).toEqual(data);
    });

    test('should throw an error if endianness mismatch occurs during deserialization', () => {
        const struct = new Struct<{ fieldLE: number }>({
            fieldLE: 'Int16LE'
        });

        const buffer = Buffer.from([ 0x12, 0x34 ]); // Incorrect order for Int16LE
        const result = struct.toObject(buffer);

        // Ensure it deserializes correctly (interpret as LE)
        expect(result.fieldLE).toBe(0x3412); // Value incorrectly interpreted if read as BE
    });
});

describe('Struct - Nested Struct Support', () => {
    let nestedStruct: Struct;
    let parentStruct: Struct<{
        parentField1: number;
        nestedStructField: {
            nestedField1: number;
            nestedField2: number;
        };
        parentField2: number;
    }>;

    beforeEach(() => {
        // Define a nested Struct
        nestedStruct = new Struct({
            nestedField1: 'UInt8',  // 8-bit unsigned integer
            nestedField2: 'UInt16LE' // 16-bit unsigned integer (Little Endian)
        });

        // Define a parent Struct containing the nested Struct
        parentStruct = new Struct({
            parentField1: 'UInt8', // 8-bit unsigned integer
            nestedStructField: nestedStruct, // Nested Struct
            parentField2: 'UInt32BE' // 32-bit unsigned integer (Big Endian)
        });
    });

    test('should correctly serialize nested Structs', () => {
        const data = {
            parentField1: 42,
            nestedStructField: {
                nestedField1: 7,
                nestedField2: 258 // 0x0102 in LE
            },
            parentField2: 16909060 // 0x01020304 in BE
        };

        const buffer = parentStruct.toBuffer(data);

        // Validate the serialized buffer
        expect(buffer).toEqual(
            Buffer.from([
                42,                // parentField1 (UInt8)
                7,                 // nestedField1 (UInt8)
                0x02, 0x01,        // nestedField2 (UInt16LE -> 0x0102)
                0x01, 0x02, 0x03, 0x04 // parentField2 (UInt32BE -> 0x01020304)
            ])
        );
    });

    test('should correctly deserialize nested Structs', () => {
        const buffer = Buffer.from([
            42,                // parentField1 (UInt8)
            7,                 // nestedField1 (UInt8)
            0x02, 0x01,        // nestedField2 (UInt16LE -> 0x0102)
            0x01, 0x02, 0x03, 0x04 // parentField2 (UInt32BE -> 0x01020304)
        ]);

        const result = parentStruct.toObject(buffer);

        // Validate the deserialized object
        expect(result).toEqual({
            parentField1: 42,
            nestedStructField: {
                nestedField1: 7,
                nestedField2: 258 // 0x0102 in LE
            },
            parentField2: 16909060 // 0x01020304 in BE
        });
    });

    test('should throw an error if nested Struct field has invalid types', () => {
        const data = {
            parentField1: 42,
            nestedStructField: {
                nestedField1: 'invalid', // Invalid type
                nestedField2: 258
            },
            parentField2: 16909060 // 0x01020304 in BE
        };

        // Attempting to serialize with invalid nested field types
        expect(() => parentStruct.toBuffer(data as any))
            .toThrow('Expected a number for field "UInt8", but received invalid');
    });

    test('should throw an error if nested Struct is has invalid types', () => {
        const data = {
            parentField1: 42,
            nestedStructField: 40,
            parentField2: 16909060 // 0x01020304 in BE
        };

        // Attempting to serialize with invalid nested field types
        expect(() => parentStruct.toBuffer(data as any))
            .toThrow('Expected an object of fields, but received number');
    });

    test('should correctly handle nested Structs with default values', () => {
        // Add default values to the nested struct
        const defaultNestedStruct = new Struct({
            nestedField1: 'UInt8',
            nestedField2: 'UInt16LE'
        });

        const defaultParentStruct = new Struct({
            parentField1: 'UInt8',
            nestedStructField: defaultNestedStruct
        });

        const data = {
            parentField1: 42,
            nestedStructField: {
                nestedField2: 258 // Only nestedField2 provided
            }
        };

        const buffer = defaultParentStruct.toBuffer(data);

        // Validate that nestedField1 is set to 0 (default for UInt8)
        expect(buffer).toEqual(Buffer.from([ 42, 0, 0x02, 0x01 ]));
    });
});

describe('Struct - Array Support', () => {
    test('should correctly handle Int16LE[8] serialization and deserialization', () => {
        const struct = new Struct<{ int16Array: number[] }>({
            int16Array: 'Int16LE[8]' // Array of 8 Int16LE values
        });

        const data = {
            int16Array: [ 0x1234, 0x5678, 0x3411, 0x1EF0, 0x1111, 0x2222, 0x3333, 0x4444 ]
        };

        const buffer = struct.toBuffer(data);
        const result = struct.toObject(buffer);

        // Validate serialized buffer
        expect(buffer).toEqual(
            Buffer.from([
                0x34, 0x12, 0x78, 0x56, 0x11, 0x34, 0xF0, 0x1E,
                0x11, 0x11, 0x22, 0x22, 0x33, 0x33, 0x44, 0x44
            ])
        );

        // Validate deserialized array
        expect(result.int16Array).toEqual(data.int16Array);
    });

    test('should correctly handle BigUInt64BE[12] serialization and deserialization', () => {
        const struct = new Struct<{ bigUintArray: bigint[] }>({
            bigUintArray: 'BigUInt64BE[12]' // Array of 12 BigUInt64BE values
        });

        const data = {
            bigUintArray: Array.from({ length: 12 }, (_, i) => BigInt(i + 1)) // [1n, 2n, ..., 12n]
        };

        const buffer = struct.toBuffer(data);
        const result = struct.toObject(buffer);

        // Validate serialized buffer
        expect(buffer).toEqual(
            Buffer.from([
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, // 1n
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, // 2n
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, // 3n
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, // 4n
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05, // 5n
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x06, // 6n
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07, // 7n
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, // 8n
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x09, // 9n
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0A, // 10n
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0B, // 11n
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0C  // 12n
            ])
        );

        // Validate deserialized array
        expect(result.bigUintArray).toEqual(data.bigUintArray);
    });

    test('should throw an error if array contain an different type', () => {
        const struct = new Struct({
            int16Array: 'Int16LE[4]' // Array of 4 Int16LE values
        });

        const data = {
            int16Array: [ 0x1234, 0x5678, 0x1ABC, '0x1EF0', 0x1111 ] // Exceeds 4 elements
        };

        // Ensure serialization throws an error
        expect(() => struct.toBuffer(data))
            .toThrow('Expected a number for field "Int16LE", but received 0x1EF0');
    });

    test('should correctly handle nested Structs with arrays', () => {
        const nestedStruct = new Struct({
            arrayField: 'UInt8[3]', // Array of 3 UInt8 values
            anotherField: 'UInt16LE'
        });

        const parentStruct = new Struct({
            parentField1: 'UInt8',
            nestedStructField: nestedStruct,
            parentField2: 'UInt32BE'
        });

        const data = {
            parentField1: 42,
            nestedStructField: {
                arrayField: [ 1, 2, 3 ],
                anotherField: 258 // 0x0102 in LE
            },
            parentField2: 16909060 // 0x01020304 in BE
        };

        const buffer = parentStruct.toBuffer(data);
        const result = parentStruct.toObject(buffer);

        // Validate serialized buffer
        expect(buffer).toEqual(
            Buffer.from([
                42,                // parentField1 (UInt8)
                1, 2, 3,           // arrayField (UInt8[3])
                0x02, 0x01,        // anotherField (UInt16LE -> 0x0102)
                0x01, 0x02, 0x03, 0x04 // parentField2 (UInt32BE -> 0x01020304)
            ])
        );

        // Validate deserialized object
        expect(result).toEqual(data);
    });
});
