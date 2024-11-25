import { Struct } from '@services/struct.service';

describe('Struct toBuffer with Bitfield fields', () => {
    let struct: Struct;

    test('should serialize a bitfield value correctly', () => {
        struct = new Struct({
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
        struct = new Struct({
            field1: 'UInt8:4',  // 4-bit field
            field2: 'UInt8:4'   // Another 4-bit field
        });

        const data = {
            field1: 16,  // Invalid value, as 16 exceeds 4 bits (max is 15 for 4 bits)
            field2: 5
        };

        expect(() => struct.toBuffer(data)).toThrowError(
            'Value 16 does not fit within 4 bits for type UInt8'
        );
    });

    test('should correctly serialize a bitfield with multiple bit lengths', () => {
        struct = new Struct({
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
        struct = new Struct({
            field1: 'UInt8:4'  // 4-bit unsigned field
        });

        const data = {
            field1: -1  // Invalid negative value for an unsigned 4-bit field
        };

        expect(() => struct.toBuffer(data)).toThrowError(
            'Value -1 does not fit within 4 bits for type UInt8'
        );
    });

    test('should throw error if bitfield type is invalid', () => {
        expect(() => {
            new Struct({
                // @ts-expect-error test invalided type
                field1: 'UInt32:4'  // 4-bit unsigned field
            });
        }).toThrowError(
            'Invalid bit field format: UInt32:4'
        );
    });

    test('should serialize signed bitfield field correctly', () => {
        struct = new Struct({
            field1: 'Int8:4'  // 4-bit signed field
        });

        const data = {
            field1: -4  // A signed value (-4 fits in a 4-bit signed integer)
        };

        const buffer = struct.toBuffer(data);
        expect(buffer).toEqual(Buffer.from([ 0b1100 ])); // -4 is represented as 1100 in 4-bit signed
    });

    test('should throw error if signed bitfield value exceeds its bit range', () => {
        struct = new Struct({
            field1: 'Int8:4'  // 4-bit signed field
        });

        const data = {
            field1: 8  // Invalid value for a signed 4-bit integer (max is 8 for 4 bits signed)
        };

        expect(() => struct.toBuffer(data)).toThrowError(
            'Value 8 does not fit within 4 bits for type Int8'
        );
    });

    test('should serialize multiple bitfield fields with mixed sizes', () => {
        struct = new Struct({
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
    let struct: Struct;

    test('should correctly deserialize a bitfield value from buffer', () => {
        struct = new Struct({
            field1: 'UInt8:4',  // 4-bit field
            field2: 'UInt8:4'   // Another 4-bit field
        });

        // Buffer with serialized data (in this case: 0101 1010, binary representation)
        const buffer = Buffer.from([ 90 ]);

        const result = struct.toObject<{
            field1: number,
            field2: number
        }>(buffer);

        // We expect the bitfield fields to be correctly deserialized:
        expect(result.field1).toBe(10); // 1010 (binary)
        expect(result.field2).toBe(5);  // 0101 (binary)
    });

    test('should correctly deserialize a signed bitfield from buffer', () => {
        struct = new Struct({
            field1: 'Int8:4'  // 4-bit signed field
        });

        // Buffer with signed 4-bit field value (binary 1100 represents -4)
        const buffer = Buffer.from([ 0b1100 ]);
        const result = struct.toObject<{
            field1: number
        }>(buffer);

        // We expect the signed bitfield field to be correctly deserialized:
        expect(result.field1).toBe(-4);  // Binary 1100 represents -4 for 4-bit signed
    });

    test('should correctly deserialize multiple bitfield values from buffer', () => {
        struct = new Struct({
            field1: 'UInt8:3',  // 3-bit field
            field2: 'UInt8:5',  // 5-bit field
            field3: 'UInt8:7'   // 7-bit field
        });

        // Buffer with multiple bitfield values (binary 101, 10001, and 1000000)
        const buffer = Buffer.from([ 0b10001101, 0b1000000 ]);
        const result = struct.toObject<{
            field1: number,
            field2: number,
            field3: number
        }>(buffer);

        // We expect the bitfield fields to be correctly deserialized:
        expect(result.field1).toBe(5);   // Binary 101
        expect(result.field2).toBe(17);  // Binary 10001
        expect(result.field3).toBe(64);  // Binary 1000000
    });

    test('should correctly deserialize a bitfield value within its size when part of a larger binary sequence', () => {
        struct = new Struct({
            field1: 'UInt8:4'  // 4-bit field
        });

        // Buffer with a value that exceeds the 4-bit limit in total binary representation (0b10011),
        // but only the lower 4 bits should be extracted.
        const buffer = Buffer.from([ 0b10011 ]);  // Only 0b0011 (3) is valid for field1
        expect(struct.toObject<{
            field1: number
        }>(buffer).field1).toBe(3); // Extracted value is the lower 4 bits: 0b0011
    });

    test('should correctly deserialize unsigned bitfield without interpreting it as negative', () => {
        struct = new Struct({
            field1: 'UInt8:4'  // 4-bit unsigned field
        });

        // Buffer with a value represented as 0b1100.
        // Since this is an unsigned field, the value should deserialize as 12 (not interpreted as negative).
        const buffer = Buffer.from([ 0b1100 ]);
        expect(struct.toObject<{
            field1: number
        }>(buffer).field1).toBe(12); // The value is directly 0b1100 (12 in decimal).
    });
});

describe('Struct - String Fields', () => {
    let struct: Struct;

    test('should serialize a string field to a buffer', () => {
        struct = new Struct({
            name: { type: 'string', size: 10 } // Fixed-length string of 10 bytes
        });

        const data = { name: 'Hello' }; // String shorter than the fixed length
        const buffer = struct.toBuffer(data);

        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBe(10); // The buffer size should match the defined length
        expect(buffer.toString('utf8')).toBe('Hello'.padEnd(10, '\0')); // Ensure correct string data
    });

    test('should deserialize a string field from a buffer', () => {
        struct = new Struct({
            name: { type: 'string', size: 10 } // Fixed-length string of 10 bytes
        });

        const buffer = Buffer.alloc(10);
        buffer.write('World'); // Write a string to the buffer
        const obj = struct.toObject<{ name: string }>(buffer);
        expect(obj).toEqual({ name: 'World' }); // Ensure correct deserialization
    });

    test('should correctly handle string truncation if it exceeds the defined length', () => {
        struct = new Struct({
            name: { type: 'string', size: 5 } // Fixed-length string of 5 bytes
        });

        const data = { name: 'TooLong' }; // String longer than the fixed length
        const buffer = struct.toBuffer(data);

        expect(buffer.toString('utf8').trim()).toBe('TooLo'); // Truncated to fit the defined length
    });

    test('should pad the string with null bytes if it is shorter than the defined length', () => {
        struct = new Struct({
            name: { type: 'string', size: 8 } // Fixed-length string of 8 bytes
        });

        const data = { name: 'Pad' }; // String shorter than the fixed length
        const buffer = struct.toBuffer(data);

        expect(buffer.toString('utf8')).toBe('Pad\u0000\u0000\u0000\u0000\u0000'); // Padded with null bytes
    });

    test('should correctly deserialize a null-padded string from a buffer', () => {
        struct = new Struct({
            name: { type: 'string', size: 8 } // Fixed-length string of 8 bytes
        });

        const buffer = Buffer.alloc(8);
        buffer.write('Hello'); // Write a shorter string

        const obj = struct.toObject<{ name: string }>(buffer);

        expect(obj).toEqual({ name: 'Hello' }); // Ensure null padding is trimmed during deserialization
    });

    test('should throw an error if Struct field has invalid types', () => {
        struct = new Struct({
            name: { type: 'string', size: 8 } // Fixed-length string of 8 bytes
        });

        // Attempting to serialize with invalid nested field types
        expect(() => {
            struct.toBuffer<{ name: any }>({
                name: 5465456
            });
        }).toThrow('Expected a string for field "string", but received number');
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
            .toThrow('Expected a BigInt for field "BigUInt64BE", but received number');
    });

    test('should throw error if type is invalid', () => {
        expect(() => {
            new Struct({
                // @ts-expect-error test invalided type
                field1: 'UInt320LE'  // 4-bit unsigned field
            });
        }).toThrowError(
            'Unsupported primitive type: UInt320LE'
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
    let struct: Struct;

    test('should deserialize Int8 from buffer', () => {
        struct = new Struct({ field1: 'Int8' });
        const buffer = Buffer.from([ 0x7F ]); // Max value for Int8 (127)
        const result = struct.toObject<{ field1: number }>(buffer);
        expect(result.field1).toBe(127);
    });

    test('should deserialize UInt8 from buffer', () => {
        struct = new Struct({ field1: 'UInt8' });
        const buffer = Buffer.from([ 0xFF ]); // Max value for UInt8 (255)
        const result = struct.toObject<{ field1: number }>(buffer);
        expect(result.field1).toBe(255);
    });

    test('should deserialize Int16LE from buffer', () => {
        struct = new Struct({ field1: 'Int16LE' });
        const buffer = Buffer.from([ 0xFF, 0x7F ]); // Max value for Int16LE (32767)
        const result = struct.toObject<{ field1: number }>(buffer);
        expect(result.field1).toBe(32767);
    });

    test('should deserialize Int16BE from buffer', () => {
        struct = new Struct({ field1: 'Int16BE' });
        const buffer = Buffer.from([ 0x7F, 0xFF ]); // Max value for Int16BE (32767)
        const result = struct.toObject<{ field1: number }>(buffer);
        expect(result.field1).toBe(32767);
    });

    test('should deserialize UInt16LE from buffer', () => {
        struct = new Struct({ field1: 'UInt16LE' });
        const buffer = Buffer.from([ 0xFF, 0xFF ]); // Max value for UInt16LE (65535)
        const result = struct.toObject<{ field1: number }>(buffer);
        expect(result.field1).toBe(65535);
    });

    test('should deserialize UInt16BE from buffer', () => {
        struct = new Struct({ field1: 'UInt16BE' });
        const buffer = Buffer.from([ 0xFF, 0xFF ]); // Max value for UInt16BE (65535)
        const result = struct.toObject<{ field1: number }>(buffer);
        expect(result.field1).toBe(65535);
    });

    test('should deserialize Int32LE from buffer', () => {
        struct = new Struct({ field1: 'Int32LE' });
        const buffer = Buffer.from([ 0xFF, 0xFF, 0xFF, 0x7F ]); // Max value for Int32LE (2147483647)
        const result = struct.toObject<{ field1: number }>(buffer);
        expect(result.field1).toBe(2147483647);
    });

    test('should deserialize Int32BE from buffer', () => {
        struct = new Struct({ field1: 'Int32BE' });
        const buffer = Buffer.from([ 0x7F, 0xFF, 0xFF, 0xFF ]); // Max value for Int32BE (2147483647)
        const result = struct.toObject<{ field1: number }>(buffer);
        expect(result.field1).toBe(2147483647);
    });

    test('should deserialize UInt32LE from buffer', () => {
        struct = new Struct({ field1: 'UInt32LE' });
        const buffer = Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFF ]); // Max value for UInt32LE (4294967295)
        const result = struct.toObject<{ field1: number }>(buffer);
        expect(result.field1).toBe(4294967295);
    });

    test('should deserialize UInt32BE from buffer', () => {
        struct = new Struct({ field1: 'UInt32BE' });
        const buffer = Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFF ]); // Max value for UInt32BE (4294967295)
        const result = struct.toObject<{ field1: number }>(buffer);
        expect(result.field1).toBe(4294967295);
    });

    test('should deserialize BigInt64LE from buffer', () => {
        struct = new Struct({ field1: 'BigInt64LE' });
        const buffer = Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F ]); // Max value for BigInt64LE
        const result = struct.toObject<{ field1: bigint }>(buffer);
        expect(result.field1).toBe(BigInt('9223372036854775807'));
    });

    test('should deserialize BigInt64BE from buffer', () => {
        struct = new Struct({ field1: 'BigInt64BE' });
        const buffer = Buffer.from([ 0x7F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF ]); // Max value for BigInt64BE
        const result = struct.toObject<{ field1: bigint }>(buffer);
        expect(result.field1).toBe(BigInt('9223372036854775807'));
    });

    test('should deserialize BigUInt64LE from buffer', () => {
        struct = new Struct({ field1: 'BigUInt64LE' });
        const buffer = Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF ]); // Max value for BigUInt64LE
        const result = struct.toObject<{ field1: bigint }>(buffer);
        expect(result.field1).toBe(BigInt('18446744073709551615'));
    });

    test('should deserialize BigUInt64BE from buffer', () => {
        struct = new Struct({ field1: 'BigUInt64BE' });
        const buffer = Buffer.from([ 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF ]); // Max value for BigUInt64BE
        const result = struct.toObject<{ field1: bigint }>(buffer);
        expect(result.field1).toBe(BigInt('18446744073709551615'));
    });
});

describe('Struct - Endianness Validation (Little Endian and Big Endian)', () => {
    let struct: Struct;

    test('should correctly handle Int16LE and Int16BE', () => {
        struct = new Struct({
            fieldLE: 'Int16LE',
            fieldBE: 'Int16BE'
        });

        const buffer = Buffer.from([ 0x34, 0x12, 0x12, 0x34 ]); // 0x1234 for LE and BE
        const result = struct.toObject<{ fieldLE: number; fieldBE: number }>(buffer);

        // Validate Little Endian and Big Endian decoding
        expect(result.fieldLE).toBe(0x1234); // Little Endian -> 0x1234
        expect(result.fieldBE).toBe(0x1234); // Big Endian -> 0x1234
    });

    test('should correctly handle UInt32LE and UInt32BE', () => {
        struct = new Struct({
            fieldLE: 'UInt32LE',
            fieldBE: 'UInt32BE'
        });

        const buffer = Buffer.from([
            0x78, 0x56, 0x34, 0x12, // UInt32LE -> 0x12345678
            0x12, 0x34, 0x56, 0x78 // UInt32BE -> 0x12345678
        ]);
        const result = struct.toObject<{ fieldLE: number; fieldBE: number }>(buffer);

        // Validate Little Endian and Big Endian decoding
        expect(result.fieldLE).toBe(0x12345678); // Little Endian
        expect(result.fieldBE).toBe(0x12345678); // Big Endian
    });

    test('should correctly handle BigInt64LE and BigInt64BE', () => {
        struct = new Struct({
            fieldLE: 'BigInt64LE',
            fieldBE: 'BigInt64BE'
        });

        const buffer = Buffer.from([
            0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // BigInt64LE -> 1
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01 // BigInt64BE -> 1
        ]);
        const result = struct.toObject<{ fieldLE: bigint; fieldBE: bigint }>(buffer);

        // Validate Little Endian and Big Endian decoding
        expect(result.fieldLE).toBe(BigInt(1)); // Little Endian
        expect(result.fieldBE).toBe(BigInt(1)); // Big Endian
    });

    test('should correctly serialize Int16LE and Int16BE', () => {
        struct = new Struct({
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
        struct = new Struct({
            fieldLE: 'UInt32LE',
            fieldBE: 'UInt32BE'
        });

        const data = {
            fieldLE: 0x12345678,
            fieldBE: 0x12345678
        };

        const buffer = struct.toBuffer(data);
        const result = struct.toObject<{ fieldLE: number; fieldBE: number }>(buffer);

        // Validate Little Endian serialization
        expect(buffer.slice(0, 4)).toEqual(Buffer.from([ 0x78, 0x56, 0x34, 0x12 ])); // LE

        // Validate Big Endian serialization
        expect(buffer.slice(4, 8)).toEqual(Buffer.from([ 0x12, 0x34, 0x56, 0x78 ])); // BE

        // Validate round-trip serialization and deserialization
        expect(result).toEqual(data);
    });

    test('should throw an error if endianness mismatch occurs during deserialization', () => {
        struct = new Struct({
            fieldLE: 'Int16LE'
        });

        const buffer = Buffer.from([ 0x12, 0x34 ]); // Incorrect order for Int16LE
        const result = struct.toObject<{ fieldLE: number }>(buffer);

        // Ensure it deserializes correctly (interpret as LE)
        expect(result.fieldLE).toBe(0x3412); // Value incorrectly interpreted if read as BE
    });
});

describe('Struct - Nested Struct Support', () => {
    let nestedStruct: Struct;
    let parentStruct: Struct;

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

        const result = parentStruct.toObject<{
            parentField1: number;
            nestedStructField: {
                nestedField1: number;
                nestedField2: number;
            };
            parentField2: number;
        }>(buffer);

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
            .toThrow('Expected a number for field "UInt8", but received string');
    });

    test('should throw an error if nested Struct field has null types', () => {
        const data = {
            parentField1: 42,
            nestedStructField: null,
            parentField2: 16909060 // 0x01020304 in BE
        };

        // Attempting to serialize with invalid nested field types
        expect(() => parentStruct.toBuffer(data as any))
            .toThrow('Expected an object for field nestedStructField, but received object');
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
