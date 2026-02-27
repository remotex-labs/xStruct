/**
 * Imports
 */

import { getBufferMethod, readMethod, splitBufferWithGap, writeMethod } from '@components/buffer.component';

/**
 * Tests
 */

describe('Buffer Methods', () => {
    describe('getBufferMethod', () => {
        test('should throw error when invalid type is provided', () => {
            const buffer = Buffer.from([ 1, 2, 3, 4 ]);

            expect(() => {
                getBufferMethod(buffer, 'read', '');
            }).toThrow('Invalid type() parameter');
        });

        test('should throw error when method does not exist on Buffer', () => {
            const buffer = Buffer.from([ 1, 2, 3, 4 ]);

            expect(() => {
                getBufferMethod(buffer, 'read', 'NonExistentType');
            }).toThrow('Method "readNonExistentType" does not exist on Buffer');
        });
    });

    describe('readMethod', () => {
        test('should return a method that correctly reads from the buffer', () => {
            const buffer = Buffer.from([ 0x12, 0x34, 0x56, 0x78 ]);

            const readUInt8 = readMethod<number>(buffer, 'UInt8');
            expect(readUInt8(0)).toBe(0x12);

            const readUInt16LE = readMethod<number>(buffer, 'UInt16LE');
            expect(readUInt16LE(0)).toBe(0x3412);

            const readUInt32LE = readMethod<number>(buffer, 'UInt32LE');
            expect(readUInt32LE(0)).toBe(0x78563412);
        });

        test('should throw error for invalid read type', () => {
            const buffer = Buffer.from([ 1, 2, 3, 4 ]);

            expect(() => {
                readMethod(buffer, 'InvalidType');
            }).toThrow('Method "readInvalidType" does not exist on Buffer');
        });

        test('should handle empty buffer correctly', () => {
            const emptyBuffer = Buffer.alloc(0);
            const readUInt8 = readMethod<number>(emptyBuffer, 'UInt8');

            expect(() => {
                readUInt8(0);
            }).toThrow(); // Should throw some kind of error when reading from an empty buffer
        });

        test('should correctly read BigInt values from buffer', () => {
            // Create a buffer with known 64-bit values
            const buffer = Buffer.alloc(16);

            // Write some known values in little-endian format
            buffer.writeBigInt64LE(BigInt('0x1234567890ABCDEF'), 0);
            buffer.writeBigInt64LE(BigInt('-42'), 8);

            // Test our readMethod with BigInt
            const readBigInt64LE = readMethod<bigint>(buffer, 'BigInt64LE');

            expect(readBigInt64LE(0)).toBe(BigInt('0x1234567890ABCDEF'));
            expect(readBigInt64LE(8)).toBe(BigInt('-42'));
        });
    });

    describe('writeMethod', () => {
        test('should return a method that correctly writes to the buffer', () => {
            const buffer = Buffer.alloc(4);

            const writeUInt8 = writeMethod(buffer, 'UInt8');
            writeUInt8(0xFF, 0);
            expect(buffer[0]).toBe(0xFF);

            const writeUInt16LE = writeMethod(buffer, 'UInt16LE');
            writeUInt16LE(0xABCD, 1);
            expect(buffer[1]).toBe(0xCD);
            expect(buffer[2]).toBe(0xAB);

            const writeUInt8At3 = writeMethod(buffer, 'UInt8');
            writeUInt8At3(0x99, 3);
            expect(buffer[3]).toBe(0x99);

            expect(buffer).toEqual(Buffer.from([ 0xFF, 0xCD, 0xAB, 0x99 ]));
        });

        test('should throw error for invalid write type', () => {
            const buffer = Buffer.alloc(4);

            expect(() => {
                writeMethod(buffer, 'InvalidType');
            }).toThrow('Method "writeInvalidType" does not exist on Buffer');
        });

        test('should handle buffer boundary correctly', () => {
            const buffer = Buffer.alloc(2);
            const writeUInt16LE = writeMethod(buffer, 'UInt16LE');

            writeUInt16LE(0x1234, 0);
            expect(buffer).toEqual(Buffer.from([ 0x34, 0x12 ]));

            // Writing at the boundary should throw
            expect(() => {
                writeUInt16LE(0x5678, 1);
            }).toThrow(); // Should throw index out of range or similar error
        });

        test('should correctly write BigInt values to buffer', () => {
            // Create a buffer for testing
            const buffer = Buffer.alloc(16);

            // Test our writeMethod with BigInt
            const writeBigInt64LE = writeMethod<bigint>(buffer, 'BigInt64LE');
            const writeUInt64LE = writeMethod<bigint>(buffer, 'BigUInt64LE');

            writeBigInt64LE(BigInt('0x1234567890ABCDEF'), 0);
            writeUInt64LE(BigInt('0xFEDCBA0987654321'), 8);

            // Verify direct buffer content
            const expected1 = Buffer.alloc(8);
            expected1.writeBigInt64LE(BigInt('0x1234567890ABCDEF'), 0);

            const expected2 = Buffer.alloc(8);
            expected2.writeBigUInt64LE(BigInt('0xFEDCBA0987654321'), 0);

            expect(buffer.subarray(0, 8)).toEqual(expected1);
            expect(buffer.subarray(8, 16)).toEqual(expected2);
        });
    });

    describe('integration tests', () => {
        test('should correctly read what was written', () => {
            const buffer = Buffer.alloc(8);

            const writeUInt16LE = writeMethod(buffer, 'UInt16LE');
            const writeUInt32LE = writeMethod(buffer, 'UInt32LE');

            writeUInt16LE(0x1234, 0);
            writeUInt16LE(0x5678, 2);
            writeUInt32LE(0xABCDEF12, 4);

            const readUInt16LE = readMethod<number>(buffer, 'UInt16LE');
            const readUInt32LE = readMethod<number>(buffer, 'UInt32LE');

            expect(readUInt16LE(0)).toBe(0x1234);
            expect(readUInt16LE(2)).toBe(0x5678);
            expect(readUInt32LE(4)).toBe(0xABCDEF12);
        });
    });
});

describe('splitBufferWithGap', () => {
    const testBuffer = Buffer.from([ 1, 2, 3, 4, 5, 6 ]);

    test('should split a buffer at the specified position with no skip', () => {
        const [ first, second ] = splitBufferWithGap(testBuffer, 3);

        expect(first.length).toBe(3);
        expect(second.length).toBe(3);

        expect([ ...first ]).toEqual([ 1, 2, 3 ]);
        expect([ ...second ]).toEqual([ 4, 5, 6 ]);
    });

    test('should split a buffer with a gap between parts', () => {
        const [ first, second ] = splitBufferWithGap(testBuffer, 2, 1);

        expect(first.length).toBe(2);
        expect(second.length).toBe(3);

        expect([ ...first ]).toEqual([ 1, 2 ]);
        expect([ ...second ]).toEqual([ 4, 5, 6 ]);
    });

    test('should handle splitting at position 0', () => {
        const [ first, second ] = splitBufferWithGap(testBuffer, 0);

        expect(first.length).toBe(0);
        expect(second.length).toBe(6);

        expect([ ...first ]).toEqual([]);
        expect([ ...second ]).toEqual([ 1, 2, 3, 4, 5, 6 ]);
    });

    test('should handle splitting at the buffer end', () => {
        const [ first, second ] = splitBufferWithGap(testBuffer, 6);

        expect(first.length).toBe(6);
        expect(second.length).toBe(0);

        expect([ ...first ]).toEqual([ 1, 2, 3, 4, 5, 6 ]);
        expect([ ...second ]).toEqual([]);
    });

    test('should handle skipping beyond buffer length', () => {
        const [ first, second ] = splitBufferWithGap(testBuffer, 4, 10);

        expect(first.length).toBe(4);
        expect(second.length).toBe(0);

        expect([ ...first ]).toEqual([ 1, 2, 3, 4 ]);
        expect([ ...second ]).toEqual([]);
    });

    test('should handle empty buffers', () => {
        const emptyBuffer = Buffer.alloc(0);
        const [ first, second ] = splitBufferWithGap(emptyBuffer, 0);

        expect(first.length).toBe(0);
        expect(second.length).toBe(0);

        expect([ ...first ]).toEqual([]);
        expect([ ...second ]).toEqual([]);
    });

    test('should handle large skip values', () => {
        const [ first, second ] = splitBufferWithGap(testBuffer, 2, 10);

        expect(first.length).toBe(2);
        expect(second.length).toBe(0);

        expect([ ...first ]).toEqual([ 1, 2 ]);
        expect([ ...second ]).toEqual([]);
    });

    test('should throw error for negative split position', () => {
        expect(() => {
            splitBufferWithGap(testBuffer, -1);
        }).toThrow('Split position cannot be negative');
    });

    test('should throw error when split position exceeds buffer length', () => {
        expect(() => {
            splitBufferWithGap(testBuffer, 10);
        }).toThrow('Split position cannot exceed buffer length');
    });

    test('should handle exactly reaching the end with skip', () => {
        const [ first, second ] = splitBufferWithGap(testBuffer, 3, 3);

        expect(first.length).toBe(3);
        expect(second.length).toBe(0);

        expect([ ...first ]).toEqual([ 1, 2, 3 ]);
        expect([ ...second ]).toEqual([]);
    });

    test('should not modify the original buffer', () => {
        const originalBuffer = Buffer.from([ 1, 2, 3, 4, 5, 6 ]);
        const bufferCopy = Buffer.from(originalBuffer);

        splitBufferWithGap(originalBuffer, 2, 1);

        expect([ ...originalBuffer ]).toEqual([ ...bufferCopy ]);
    });

    test('should create views (not copies) of the original buffer', () => {
        const originalBuffer = Buffer.from([ 1, 2, 3, 4, 5, 6 ]);
        const [ first, second ] = splitBufferWithGap(originalBuffer, 2, 1);

        // Modify the original buffer
        originalBuffer[0] = 99;
        originalBuffer[4] = 77;

        // The changes should be reflected in the views
        expect(first[0]).toBe(99);
        expect(second[1]).toBe(77);
    });
});
