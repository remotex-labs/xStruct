/**
 * Import will remove at compile time
 */

import type {
    PrimitiveType,
    PrimitiveContextInterface,
    PositionedPrimitiveDescriptorType
} from '@components/interfaces/primitive-component.interface';

/**
 * Imports
 */

import {
    readPrimitive,
    writePrimitive,
    readPrimitiveArray,
    readSinglePrimitive,
    writePrimitiveArray,
    writeSinglePrimitive,
    PRIMITIVE_TYPE_SIZES,
    parsePrimitiveDescriptor
} from '@components/primitive.component';

/**
 * Tests
 */

describe('parsePrimitiveDescriptor', () => {
    const defaultPrimitiveDescriptor = {
        kind: 'primitive',
        position: 0
    };

    test('should parse simple primitive types correctly', () => {
        const result1 = parsePrimitiveDescriptor('UInt8');
        expect(result1).toEqual({ type: 'UInt8', size: 1, arraySize: undefined, ...defaultPrimitiveDescriptor });

        const result2 = parsePrimitiveDescriptor('Int32LE');
        expect(result2).toEqual({ type: 'Int32LE', size: 4, arraySize: undefined, ...defaultPrimitiveDescriptor });

        const result3 = parsePrimitiveDescriptor('BigInt64BE');
        expect(result3).toEqual({ type: 'BigInt64BE', size: 8, arraySize: undefined, ...defaultPrimitiveDescriptor });
    });

    test('should parse array primitive types correctly', () => {
        const result1 = parsePrimitiveDescriptor('UInt8[5]');
        expect(result1).toEqual({ type: 'UInt8', size: 1, arraySize: 5, ...defaultPrimitiveDescriptor });

        const result2 = parsePrimitiveDescriptor('Int16LE[42]');
        expect(result2).toEqual({ type: 'Int16LE', size: 2, arraySize: 42, ...defaultPrimitiveDescriptor });

        const result3 = parsePrimitiveDescriptor('BigUInt64BE[100]');
        expect(result3).toEqual({ type: 'BigUInt64BE', size: 8, arraySize: 100, ...defaultPrimitiveDescriptor });
    });

    test('should support all primitive types defined in PRIMITIVE_TYPE_SIZES', () => {
        Object.keys(PRIMITIVE_TYPE_SIZES).forEach((type) => {
            const result = parsePrimitiveDescriptor(type);
            const expectedSize = PRIMITIVE_TYPE_SIZES[type as PrimitiveType] / 8;
            expect(result).toEqual({ type, size: expectedSize, arraySize: undefined, ...defaultPrimitiveDescriptor });
        });
    });

    test.each([
        [ 'empty string', '' ],
        [ 'missing closing bracket', 'UInt8[' ],
        [ 'empty brackets', 'UInt8[]' ],
        [ 'non-numeric array size', 'UInt8[abc]' ],
        [ 'spaces in descriptor', 'UInt8 [5]' ],
        [ 'starting with number', '8UInt' ]
    ])('should throw error for invalid descriptor format: %s', (_, input) => {
        expect(() => parsePrimitiveDescriptor(input)).toThrow('Invalid primitive descriptor:');
    });

    test.each([
        [ 'Unknown', 'Unknown' ],
        [ 'Float32[5]', 'Float32' ],
        [ 'String[10]', 'String' ]
    ])('should throw error for unsupported primitive type: %s', (input, expectedTypeInError) => {
        expect(() => parsePrimitiveDescriptor(input)).toThrow(`Invalid primitive type: ${ expectedTypeInError }`);
    });
});

describe('readSinglePrimitive', () => {
    let buffer: Buffer;

    beforeEach(() => {
        // Create a fresh buffer for each test
        buffer = Buffer.alloc(16);
    });

    test('should read UInt8 value correctly', () => {
        // Arrange
        buffer.writeUInt8(42, 5);

        const context: PrimitiveContextInterface = {
            buffer,
            offset: 2,
            descriptor: {
                position: 3,
                type: 'UInt8',
                size: 1
            }
        };

        // Act
        const result = readSinglePrimitive.call(context);

        // Assert
        expect(result).toBe(42);
    });

    test('should read Int16LE value correctly', () => {
        // Arrange
        buffer.writeInt16LE(-12345, 8);

        const context: PrimitiveContextInterface = {
            buffer,
            offset: 4,
            descriptor: {
                position: 4,
                type: 'Int16LE',
                size: 2
            }
        };

        // Act
        const result = readSinglePrimitive.call(context);

        // Assert
        expect(result).toBe(-12345);
    });

    test('should read BigInt64BE value correctly', () => {
        // Arrange
        const bigValue = BigInt('9007199254740991');
        buffer.writeBigInt64BE(bigValue, 4);

        const context: PrimitiveContextInterface = {
            buffer,
            offset: 0,
            descriptor: {
                position: 4,
                type: 'BigInt64BE',
                size: 8
            }
        };

        // Act
        const result = readSinglePrimitive.call(context);

        // Assert
        expect(result).toBe(bigValue);
    });

    test('should apply arrayOffset correctly', () => {
        // Arrange
        buffer.writeUInt32LE(111, 0);
        buffer.writeUInt32LE(222, 4);
        buffer.writeUInt32LE(333, 8);

        const context: PrimitiveContextInterface = {
            buffer,
            offset: 0,
            descriptor: {
                position: 0,
                type: 'UInt32LE',
                size: 4
            }
        };

        // Act
        const result1 = readSinglePrimitive.call(context, 0);
        const result2 = readSinglePrimitive.call(context, 4);
        const result3 = readSinglePrimitive.call(context, 8);

        // Assert
        expect(result1).toBe(111);
        expect(result2).toBe(222);
        expect(result3).toBe(333);
    });

    test('should use combined offset + position + arrayOffset for absolute position', () => {
        // Arrange
        buffer.writeFloatLE(3.14159, 9);

        const context: PrimitiveContextInterface = {
            buffer,
            offset: 2,
            descriptor: {
                position: 3,
                type: 'FloatLE',
                size: 4
            }
        };

        // Act
        const result = readSinglePrimitive.call(context, 4);

        // Assert
        expect(result).toBeCloseTo(3.14159);
    });
});

describe('readPrimitiveArray', () => {
    function createContext(bufferData: number[], type: string, size: number, arraySize: number): PrimitiveContextInterface {
        return {
            descriptor: {
                type,
                position: 0,
                size,
                arraySize
            } as PositionedPrimitiveDescriptorType,
            buffer: Buffer.from(bufferData),
            offset: 0
        };
    }

    test('should read an array of UInt8 values', () => {
        // Create a buffer with values [1, 2, 3]
        const bufferData = [ 1, 2, 3 ];
        const context = createContext(bufferData, 'UInt8', 1, 3);

        // Act
        const result = readPrimitiveArray.call(context);

        // Assert
        expect(result).toEqual([ 1, 2, 3 ]);
    });

    test('should read an array of UInt16LE values', () => {
        // Create a buffer with two UInt16LE values: 513 (0x0201) and 1027 (0x0403)
        // In little-endian, this is represented as [1, 2, 3, 4]
        const bufferData = [ 1, 2, 3, 4 ];
        const context = createContext(bufferData, 'UInt16LE', 2, 2);

        // Act
        const result = readPrimitiveArray.call(context);

        // Assert
        // 0x0201 = 513, 0x0403 = 1027
        expect(result).toEqual([ 513, 1027 ]);
    });

    test('should read an array of UInt16BE values', () => {
        // Create a buffer with two UInt16BE values: 258 (0x0102) and 772 (0x0304)
        // In big-endian, this is represented as [1, 2, 3, 4]
        const bufferData = [ 1, 2, 3, 4 ];
        const context = createContext(bufferData, 'UInt16BE', 2, 2);

        // Act
        const result = readPrimitiveArray.call(context);

        // Assert
        // 0x0102 = 258, 0x0304 = 772
        expect(result).toEqual([ 258, 772 ]);
    });

    test('should read an array of Int32LE values', () => {
        // Create a buffer with one Int32LE value: 0x04030201 = 67305985
        const bufferData = [ 1, 2, 3, 4 ];
        const context = createContext(bufferData, 'Int32LE', 4, 1);

        // Act
        const result = readPrimitiveArray.call(context);

        // Assert
        expect(result).toEqual([ 67305985 ]);
    });

    test('should return an empty array if arraySize is 0', () => {
        // Arrange
        const context = createContext([ 1, 2, 3, 4 ], 'UInt8', 1, 0);

        // Act
        const result = readPrimitiveArray.call(context);

        // Assert
        expect(result).toHaveLength(0);
    });

    test('should handle arraySize being undefined', () => {
        // Arrange
        const context = createContext([ 1, 2, 3, 4 ], 'UInt8', 1, <any> undefined);

        // Act
        const result = readPrimitiveArray.call(context);

        // Assert
        expect(result).toHaveLength(0);
    });

    test('should handle 64-bit types with BigInt values', () => {
        // Create a buffer for BigInt64LE value [1, 0, 0, 0, 0, 0, 0, 0] = 1n
        const buffer = Buffer.alloc(8);
        buffer.writeBigInt64LE(1n, 0);

        const context: PrimitiveContextInterface = {
            descriptor: {
                type: 'BigInt64LE',
                position: 0,
                size: 8,
                arraySize: 1
            },
            buffer,
            offset: 0
        };

        // Act
        const result = readPrimitiveArray.call(context);

        // Assert
        expect(result).toEqual([ 1n ]);
    });
});

describe('readPrimitive', () => {
    // Helper function to create a context with real buffer data
    function createContext(bufferData: number[], type: string, size: number, arraySize?: number): PrimitiveContextInterface {
        return {
            descriptor: {
                type,
                position: 0,
                size,
                arraySize
            } as PositionedPrimitiveDescriptorType,
            buffer: Buffer.from(bufferData),
            offset: 0
        };
    }

    test('should read a single UInt8 value when arraySize is not provided', () => {
        // Create a buffer with value [42]
        const bufferData = [ 42 ];
        const context = createContext(bufferData, 'UInt8', 1);

        // Act
        const result = readPrimitive.call(context);

        // Assert
        expect(result).toBe(42);
    });

    test('should read a single UInt16LE value when arraySize is not provided', () => {
        // Create a buffer with UInt16LE value: 513 (0x0201)
        // In little-endian, this is represented as [1, 2]
        const bufferData = [ 1, 2 ];
        const context = createContext(bufferData, 'UInt16LE', 2);

        // Act
        const result = readPrimitive.call(context);

        // Assert
        // 0x0201 = 513
        expect(result).toBe(513);
    });

    test('should read an array of UInt8 values when arraySize is provided', () => {
        // Create a buffer with values [1, 2, 3]
        const bufferData = [ 1, 2, 3 ];
        const context = createContext(bufferData, 'UInt8', 1, 3);

        // Act
        const result = readPrimitive.call(context);

        // Assert
        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual([ 1, 2, 3 ]);
    });

    test('should read an array of UInt16BE values when arraySize is provided', () => {
        // Create a buffer with two UInt16BE values: 258 (0x0102) and 772 (0x0304)
        // In big-endian, this is represented as [1, 2, 3, 4]
        const bufferData = [ 1, 2, 3, 4 ];
        const context = createContext(bufferData, 'UInt16BE', 2, 2);

        // Act
        const result = readPrimitive.call(context);

        // Assert
        expect(Array.isArray(result)).toBe(true);
        // 0x0102 = 258, 0x0304 = 772
        expect(result).toEqual([ 258, 772 ]);
    });

    test('should return a single value when arraySize is 0', () => {
        // Create a buffer with value [42]
        const bufferData = [ 42 ];
        const context = createContext(bufferData, 'UInt8', 1, 0);

        // Act
        const result = readPrimitive.call(context);

        // Assert
        // Should call readSinglePrimitive since arraySize is falsy
        expect(result).toBe(42);
    });

    test('should return a single value when arraySize is undefined but the property exists', () => {
        // Create a context with arraySize undefined but present
        const bufferData = [ 42 ];
        const context = createContext(bufferData, 'UInt8', 1, undefined);

        // Act
        const result = readPrimitive.call(context);

        // Assert
        // Should call readSinglePrimitive since arraySize is falsy
        expect(result).toBe(42);
    });

    test('should handle 32-bit integer values', () => {
        // Create a buffer with one Int32LE value: 0x04030201 = 67305985
        const buffer = Buffer.alloc(4);
        buffer.writeInt32LE(67305985, 0);

        const context: PrimitiveContextInterface = {
            descriptor: {
                type: 'Int32LE',
                position: 0,
                size: 4
            },
            buffer,
            offset: 0
        };

        // Act
        const result = readPrimitive.call(context);

        // Assert
        expect(result).toBe(67305985);
    });

    test('should handle 64-bit integer array values', () => {
        // Create a buffer for two BigInt64LE values
        const buffer = Buffer.alloc(16);
        buffer.writeBigInt64LE(1n, 0);
        buffer.writeBigInt64LE(2n, 8);

        const context: PrimitiveContextInterface = {
            descriptor: {
                type: 'BigInt64LE',
                position: 0,
                size: 8,
                arraySize: 2
            },
            buffer,
            offset: 0
        };

        // Act
        const result = readPrimitive.call(context);

        // Assert
        expect(Array.isArray(result)).toBe(true);
        expect(result).toEqual([ 1n, 2n ]);
    });
});

describe('writeSinglePrimitive', () => {
    // Helper function to create a context for testing
    function createContext(type: string, size: number, offset = 0, position = 0): PrimitiveContextInterface {
        return {
            descriptor: {
                type,
                position,
                size
            } as PositionedPrimitiveDescriptorType,
            buffer: Buffer.alloc(20), // Allocate enough space for various tests
            offset
        };
    }

    test('should write UInt8 value to buffer', () => {
        // Arrange
        const context = createContext('UInt8', 1);
        const value = 42;

        // Act
        writeSinglePrimitive.call(context, value);

        // Assert
        expect(context.buffer.readUInt8(0)).toBe(42);
    });

    test('should write UInt16LE value to buffer', () => {
        // Arrange
        const context = createContext('UInt16LE', 2);
        const value = 513; // 0x0201

        // Act
        writeSinglePrimitive.call(context, value);

        // Assert
        expect(context.buffer.readUInt16LE(0)).toBe(513);
    });

    test('should write UInt16BE value to buffer', () => {
        // Arrange
        const context = createContext('UInt16BE', 2);
        const value = 513; // 0x0201

        // Act
        writeSinglePrimitive.call(context, value);

        // Assert
        expect(context.buffer.readUInt16BE(0)).toBe(513);
    });

    test('should write Int32LE value to buffer', () => {
        // Arrange
        const context = createContext('Int32LE', 4);
        const value = -67305985; // Negative value to test signed int

        // Act
        writeSinglePrimitive.call(context, value);

        // Assert
        expect(context.buffer.readInt32LE(0)).toBe(-67305985);
    });

    test('should write BigInt64LE value to buffer', () => {
        // Arrange
        const context = createContext('BigInt64LE', 8);
        const value = 9007199254740991n; // Max safe integer as BigInt

        // Act
        writeSinglePrimitive.call(context, value);

        // Assert
        expect(context.buffer.readBigInt64LE(0)).toBe(9007199254740991n);
    });

    test('should write to correct position with offset', () => {
        // Arrange
        const context = createContext('UInt8', 1, 2, 3);
        const value = 42;

        // Act
        writeSinglePrimitive.call(context, value);

        // Assert - should be at position 5 (offset 2 + position 3)
        expect(context.buffer.readUInt8(5)).toBe(42);
    });

    test('should write to correct position with arrayOffset', () => {
        // Arrange
        const context = createContext('UInt16LE', 2);
        const value = 513;
        const arrayOffset = 4;

        // Act
        writeSinglePrimitive.call(context, value, arrayOffset);

        // Assert
        expect(context.buffer.readUInt16LE(4)).toBe(513);
    });

    test('should throw TypeError when providing number for BigInt type', () => {
        // Arrange
        const context = createContext('BigInt64LE', 8);
        const value = 42; // Number, not BigInt

        // Act & Assert
        expect(() => {
            writeSinglePrimitive.call(context, value);
        }).toThrow(TypeError);
        expect(() => {
            writeSinglePrimitive.call(context, value);
        }).toThrow('Expected a BigInt for field "BigInt64LE"');
    });

    test('should throw TypeError when providing BigInt for number type', () => {
        // Arrange
        const context = createContext('UInt32LE', 4);
        const value = 42n; // BigInt, not Number

        // Act & Assert
        expect(() => {
            writeSinglePrimitive.call(context, value);
        }).toThrow(TypeError);
        expect(() => {
            writeSinglePrimitive.call(context, value);
        }).toThrow('Expected a number for field "UInt32LE"');
    });

    test('should handle absolute position correctly with all parameters', () => {
        // Arrange
        const context = createContext('UInt8', 1, 5, 3);
        const value = 42;
        const arrayOffset = 2;

        // Act
        writeSinglePrimitive.call(context, value, arrayOffset);

        // Assert - absolute position should be: offset(5) + position(3) + arrayOffset(2) = 10
        expect(context.buffer.readUInt8(10)).toBe(42);
    });

    test('should handle FloatLE values', () => {
        // Arrange
        const context = createContext('FloatLE', 4);
        const value = 3.14;

        // Act
        writeSinglePrimitive.call(context, value);

        // Assert
        expect(context.buffer.readFloatLE(0)).toBeCloseTo(3.14);
    });

    test('should handle DoubleLE values', () => {
        // Arrange
        const context = createContext('DoubleLE', 8);
        const value = 3.14159265359;

        // Act
        writeSinglePrimitive.call(context, value);

        // Assert
        expect(context.buffer.readDoubleLE(0)).toBeCloseTo(3.14159265359);
    });
});

describe('writePrimitiveArray', () => {
    // Helper function to create a context for testing
    function createContext(type: string, size: number, arraySize: number, offset = 0, position = 0): PrimitiveContextInterface {
        return {
            descriptor: {
                type,
                position,
                size,
                arraySize
            } as PositionedPrimitiveDescriptorType,
            buffer: Buffer.alloc(100), // Allocate enough space for various tests
            offset
        };
    }

    test('should write an array of UInt8 values to buffer', () => {
        // Arrange
        const context = createContext('UInt8', 1, 3);
        const values = [ 10, 20, 30 ];

        // Act
        writePrimitiveArray.call(context, values);

        // Assert
        expect(context.buffer.readUInt8(0)).toBe(10);
        expect(context.buffer.readUInt8(1)).toBe(20);
        expect(context.buffer.readUInt8(2)).toBe(30);
    });

    test('should write an array of UInt16LE values to buffer', () => {
        // Arrange
        const context = createContext('UInt16LE', 2, 3);
        const values = [ 513, 1027, 1541 ]; // 0x0201, 0x0403, 0x0605

        // Act
        writePrimitiveArray.call(context, values);

        // Assert
        expect(context.buffer.readUInt16LE(0)).toBe(513);
        expect(context.buffer.readUInt16LE(2)).toBe(1027);
        expect(context.buffer.readUInt16LE(4)).toBe(1541);
    });

    test('should write an array of UInt16BE values to buffer', () => {
        // Arrange
        const context = createContext('UInt16BE', 2, 3);
        const values = [ 258, 772, 1286 ]; // 0x0102, 0x0304, 0x0506

        // Act
        writePrimitiveArray.call(context, values);

        // Assert
        expect(context.buffer.readUInt16BE(0)).toBe(258);
        expect(context.buffer.readUInt16BE(2)).toBe(772);
        expect(context.buffer.readUInt16BE(4)).toBe(1286);
    });

    test('should write an array of Int32LE values to buffer', () => {
        // Arrange
        const context = createContext('Int32LE', 4, 2);
        const values = [ 67305985, -67305985 ]; // Positive and negative values

        // Act
        writePrimitiveArray.call(context, values);

        // Assert
        expect(context.buffer.readInt32LE(0)).toBe(67305985);
        expect(context.buffer.readInt32LE(4)).toBe(-67305985);
    });

    test('should write an array of BigInt64LE values to buffer', () => {
        // Arrange
        const context = createContext('BigInt64LE', 8, 2);
        const values = [ 9007199254740991n, -9007199254740991n ]; // Max safe integer and its negative

        // Act
        writePrimitiveArray.call(context, values);

        // Assert
        expect(context.buffer.readBigInt64LE(0)).toBe(9007199254740991n);
        expect(context.buffer.readBigInt64LE(8)).toBe(-9007199254740991n);
    });

    test('should write to correct position with offset and position', () => {
        // Arrange
        const context = createContext('UInt8', 1, 3, 2, 3);
        const values = [ 10, 20, 30 ];

        // Act
        writePrimitiveArray.call(context, values);

        // Assert - should start at offset(2) + position(3) = 5
        expect(context.buffer.readUInt8(5)).toBe(10);
        expect(context.buffer.readUInt8(6)).toBe(20);
        expect(context.buffer.readUInt8(7)).toBe(30);
    });

    test('should fill with zeros when array values are fewer than arraySize', () => {
        // Arrange
        const context = createContext('UInt16LE', 2, 4);
        const values = [ 513, 1027 ]; // Only 2 values for an array of size 4

        // Act
        writePrimitiveArray.call(context, values);

        // Assert
        expect(context.buffer.readUInt16LE(0)).toBe(513);
        expect(context.buffer.readUInt16LE(2)).toBe(1027);
        expect(context.buffer.readUInt16LE(4)).toBe(0); // Filled with zero
        expect(context.buffer.readUInt16LE(6)).toBe(0); // Filled with zero
    });

    test('should handle empty input array by filling with zeros', () => {
        // Arrange
        const context = createContext('UInt8', 1, 3);
        const values: number[] = []; // Empty array

        // Act
        writePrimitiveArray.call(context, values);

        // Assert
        expect(context.buffer.readUInt8(0)).toBe(0);
        expect(context.buffer.readUInt8(1)).toBe(0);
        expect(context.buffer.readUInt8(2)).toBe(0);
    });

    test('should handle arraySize=0 by not writing anything', () => {
        // Arrange
        const context = createContext('UInt8', 1, 0); // arraySize = 0
        const buffer = Buffer.from(context.buffer); // Save original buffer state
        const values = [ 10, 20, 30 ];

        // Act
        writePrimitiveArray.call(context, values);

        // Assert - buffer should remain unchanged
        expect(context.buffer).toEqual(buffer);
    });

    test('should handle FloatLE array values', () => {
        // Arrange
        const context = createContext('FloatLE', 4, 2);
        const values = [ 3.14, 2.71 ];

        // Act
        writePrimitiveArray.call(context, values);

        // Assert
        expect(context.buffer.readFloatLE(0)).toBeCloseTo(3.14);
        expect(context.buffer.readFloatLE(4)).toBeCloseTo(2.71);
    });

    test('should handle DoubleLE array values', () => {
        // Arrange
        const context = createContext('DoubleLE', 8, 2);
        const values = [ 3.14159265359, 2.71828182846 ];

        // Act
        writePrimitiveArray.call(context, values);

        // Assert
        expect(context.buffer.readDoubleLE(0)).toBeCloseTo(3.14159265359);
        expect(context.buffer.readDoubleLE(8)).toBeCloseTo(2.71828182846);
    });

    test('should handle undefined arraySize by treating it as 0', () => {
        // Arrange
        const context = {
            descriptor: {
                type: 'UInt8',
                position: 0,
                size: 1
                // arraySize is intentionally undefined
            } as PositionedPrimitiveDescriptorType,
            buffer: Buffer.alloc(10),
            offset: 0,
            value: undefined
        };
        const buffer = Buffer.from(context.buffer); // Save original buffer state
        const values = [ 10, 20, 30 ];

        // Act
        writePrimitiveArray.call(context, values);

        // Assert - buffer should remain unchanged
        expect(context.buffer).toEqual(buffer);
    });

    test('should truncate input array if it has more values than arraySize', () => {
        // Arrange
        const context = createContext('UInt8', 1, 2);
        const values = [ 10, 20, 30, 40 ]; // 4 values but arraySize is 2

        // Act
        writePrimitiveArray.call(context, values);

        // Assert - only first 2 values should be written
        expect(context.buffer.readUInt8(0)).toBe(10);
        expect(context.buffer.readUInt8(1)).toBe(20);
        // The buffer at position 2 should not be 30
        expect(context.buffer.readUInt8(2)).not.toBe(30);
    });
});

describe('writePrimitive', () => {
    // Helper function to create a context for testing
    function createContext(type: string, size: number, arraySize?: number, offset = 0, position = 0): PrimitiveContextInterface {
        return {
            descriptor: {
                type,
                position,
                size,
                ...(arraySize !== undefined && { arraySize })
            } as PositionedPrimitiveDescriptorType,
            buffer: Buffer.alloc(100), // Allocate enough space for various tests
            offset
        };
    }

    test('should write a single UInt8 value when arraySize is not provided', () => {
        // Arrange
        const context = createContext('UInt8', 1);
        const value = 42;

        // Act
        writePrimitive.call(context, value);

        // Assert
        expect(context.buffer.readUInt8(0)).toBe(42);
    });

    test('should write a single UInt16LE value when arraySize is not provided', () => {
        // Arrange
        const context = createContext('UInt16LE', 2);
        const value = 513; // 0x0201

        // Act
        writePrimitive.call(context, value);

        // Assert
        expect(context.buffer.readUInt16LE(0)).toBe(513);
    });

    test('should write an array of UInt8 values when arraySize is provided', () => {
        // Arrange
        const context = createContext('UInt8', 1, 3);
        const values = [ 10, 20, 30 ];

        // Act
        writePrimitive.call(context, values);

        // Assert
        expect(context.buffer.readUInt8(0)).toBe(10);
        expect(context.buffer.readUInt8(1)).toBe(20);
        expect(context.buffer.readUInt8(2)).toBe(30);
    });

    test('should write an array of UInt16BE values when arraySize is provided', () => {
        // Arrange
        const context = createContext('UInt16BE', 2, 3);
        const values = [ 258, 772, 1286 ]; // 0x0102, 0x0304, 0x0506

        // Act
        writePrimitive.call(context, values);

        // Assert
        expect(context.buffer.readUInt16BE(0)).toBe(258);
        expect(context.buffer.readUInt16BE(2)).toBe(772);
        expect(context.buffer.readUInt16BE(4)).toBe(1286);
    });

    test('should convert non-array to array when arraySize is provided', () => {
        // Arrange
        const context = createContext('UInt8', 1, 3);
        const value = 42; // Single value

        // Act
        writePrimitive.call(context, value);

        // Assert - should write [42, 0, 0]
        expect(context.buffer.readUInt8(0)).toBe(42);
        expect(context.buffer.readUInt8(1)).toBe(0);
        expect(context.buffer.readUInt8(2)).toBe(0);
    });

    test('should extract first element when given array but no arraySize', () => {
        // Arrange
        const context = createContext('UInt8', 1);
        const values = [ 10, 20, 30 ];

        // Act
        writePrimitive.call(context, values);

        // Assert - should only write first element
        expect(context.buffer.readUInt8(0)).toBe(10);
        // Verify other elements were not written
        const originalBuffer = Buffer.alloc(100);
        expect(context.buffer.readUInt8(1)).toBe(originalBuffer.readUInt8(1));
    });

    test('should use 0 when given empty array and no arraySize', () => {
        // Arrange
        const context = createContext('UInt8', 1);
        const values: number[] = []; // Empty array

        // Act
        writePrimitive.call(context, values);

        // Assert - should write 0
        expect(context.buffer.readUInt8(0)).toBe(0);
    });

    test('should handle BigInt64LE value', () => {
        // Arrange
        const context = createContext('BigInt64LE', 8);
        const value = 9007199254740991n; // Max safe integer as BigInt

        // Act
        writePrimitive.call(context, value);

        // Assert
        expect(context.buffer.readBigInt64LE(0)).toBe(9007199254740991n);
    });

    test('should handle BigInt64LE array values', () => {
        // Arrange
        const context = createContext('BigInt64LE', 8, 2);
        const values = [ 9007199254740991n, -9007199254740991n ];

        // Act
        writePrimitive.call(context, values);

        // Assert
        expect(context.buffer.readBigInt64LE(0)).toBe(9007199254740991n);
        expect(context.buffer.readBigInt64LE(8)).toBe(-9007199254740991n);
    });

    test('should write to correct position with offset and position', () => {
        // Arrange
        const context = createContext('UInt8', 1, undefined, 2, 3);
        const value = 42;

        // Act
        writePrimitive.call(context, value);

        // Assert - absolute position should be: offset(2) + position(3) = 5
        expect(context.buffer.readUInt8(5)).toBe(42);
    });

    test('should handle arraySize=0 by writing a single value', () => {
        // Arrange
        const context = createContext('UInt8', 1, 0);
        const value = 42;

        // Act
        writePrimitive.call(context, value);

        // Assert - should write as single value
        expect(context.buffer.readUInt8(0)).toBe(42);
    });

    test('should handle FloatLE value', () => {
        // Arrange
        const context = createContext('FloatLE', 4);
        const value = 3.14;

        // Act
        writePrimitive.call(context, value);

        // Assert
        expect(context.buffer.readFloatLE(0)).toBeCloseTo(3.14);
    });

    test('should handle DoubleLE array values', () => {
        // Arrange
        const context = createContext('DoubleLE', 8, 2);
        const values = [ 3.14159265359, 2.71828182846 ];

        // Act
        writePrimitive.call(context, values);

        // Assert
        expect(context.buffer.readDoubleLE(0)).toBeCloseTo(3.14159265359);
        expect(context.buffer.readDoubleLE(8)).toBeCloseTo(2.71828182846);
    });

    test('should truncate input array if it has more values than arraySize', () => {
        // Arrange
        const context = createContext('UInt8', 1, 2);
        const values = [ 10, 20, 30, 40 ]; // 4 values but arraySize is 2

        // Act
        writePrimitive.call(context, values);

        // Assert - only first 2 values should be written
        expect(context.buffer.readUInt8(0)).toBe(10);
        expect(context.buffer.readUInt8(1)).toBe(20);
        // The buffer at position 2 should not be 30
        expect(context.buffer.readUInt8(2)).not.toBe(30);
    });

    test('should fill array with 0 when input array is smaller than arraySize', () => {
        // Arrange
        const context = createContext('UInt16LE', 2, 3);
        const values = [ 513 ]; // Only 1 value for an array of size 3

        // Act
        writePrimitive.call(context, values);

        // Assert
        expect(context.buffer.readUInt16LE(0)).toBe(513);
        expect(context.buffer.readUInt16LE(2)).toBe(0); // Filled with zero
        expect(context.buffer.readUInt16LE(4)).toBe(0); // Filled with zero
    });
});
