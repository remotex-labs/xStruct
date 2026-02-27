/**
 * Import will remove at compile time
 */

import type { BitfieldDescriptorInterface } from '@components/interfaces/bitfield-component.interface';
import type { PositionedBitfieldDescriptorType } from '@components/interfaces/bitfield-component.interface';

/**
 * Imports
 */

import { PRIMITIVE_TYPE_SIZES } from '@components/primitive.component';
import { validateBitFieldBounds, parseBitfieldDescriptor } from '@components/bitfield.component';
import { maskCache, getBitMask, readBitfield, isSignedType } from '@components/bitfield.component';
import { processValueForBitfield, validateBitfieldParameters } from '@components/bitfield.component';
import { writeBitfield, extractBitfieldValue, composeBitfieldValue } from '@components/bitfield.component';

/**
 * Tests
 */

describe('processValueForBitfield', () => {
    describe('with signed integers', () => {
        test('should apply sign extension to negative numbers', () => {
            const descriptor: BitfieldDescriptorInterface = {
                type: 'Int8',
                bitSize: 4,
                bitPosition: 0
            };

            // Testing with a negative number
            expect(processValueForBitfield(descriptor, -2)).toBe(-2);

            // 0b1110 in 4 bits = -2 in signed representation
            expect(processValueForBitfield(descriptor, 14)).toBe(-2);
        });

        test('should correctly handle positive numbers within bit size', () => {
            const descriptor: BitfieldDescriptorInterface = {
                type: 'Int16LE',
                bitSize: 5,
                bitPosition: 0
            };

            // 0b01111 = 15 (positive, within 5-bit range)
            expect(processValueForBitfield(descriptor, 15)).toBe(15);
        });

        test('should handle boundary conditions for signed values', () => {
            const descriptor: BitfieldDescriptorInterface = {
                type: 'Int8',
                bitSize: 3,
                bitPosition: 0
            };

            // For 3-bit signed int, range is -4 to 3
            expect(processValueForBitfield(descriptor, 3)).toBe(3);   // Max positive
            expect(processValueForBitfield(descriptor, 7)).toBe(-1);  // 111 in 3 bits = -1
            expect(processValueForBitfield(descriptor, 4)).toBe(-4);  // 100 in 3 bits = -4 (min negative)
        });
    });

    describe('with unsigned integers', () => {
        test('should return the original value', () => {
            const descriptor: BitfieldDescriptorInterface = {
                type: 'UInt8',
                bitSize: 4,
                bitPosition: 0
            };

            expect(processValueForBitfield(descriptor, 10)).toBe(10);
            expect(processValueForBitfield(descriptor, 0)).toBe(0);
            expect(processValueForBitfield(descriptor, 15)).toBe(15);
        });
    });

    describe('with different bit sizes', () => {
        test('should respect the specified bit size when processing values', () => {
            // Testing with different bit sizes
            const descriptor4bit: BitfieldDescriptorInterface = {
                type: 'Int8',
                bitSize: 4,
                bitPosition: 0
            };

            const descriptor8bit: BitfieldDescriptorInterface = {
                type: 'Int8',
                bitSize: 8,
                bitPosition: 0
            };

            // Value 0b10001111 (143) should be interpreted differently based on bit size
            expect(processValueForBitfield(descriptor4bit, 15)).toBe(-1); // 4-bit 1111 = -1
            expect(processValueForBitfield(descriptor8bit, 143)).toBe(-113); // 8-bit 10001111 = -113
        });
    });
});

describe('extractBitfieldValue', () => {
    describe('basic functionality', () => {
        test('should extract bits from the specified position with given size', () => {
            const rawValue = 0b11010100; // 212 decimal
            const descriptor: BitfieldDescriptorInterface = {
                type: 'UInt8',
                bitSize: 3,
                bitPosition: 2
            };

            // Expected: bits at positions 2,3,4 are 101 binary = 5 decimal
            expect(extractBitfieldValue(rawValue, descriptor)).toBe(5);
        });

        test('should extract bits at position 0', () => {
            const rawValue = 0b10101011; // 171 decimal
            const descriptor: BitfieldDescriptorInterface = {
                type: 'UInt8',
                bitSize: 3,
                bitPosition: 0
            };

            // Expected: bits at positions 0,1,2 are 011 binary = 3 decimal
            expect(extractBitfieldValue(rawValue, descriptor)).toBe(3);
        });
    });

    describe('different bit sizes', () => {
        test('should handle single-bit extraction', () => {
            const rawValue = 0b10101010; // 170 decimal
            const descriptor: BitfieldDescriptorInterface = {
                type: 'UInt8',
                bitSize: 1,
                bitPosition: 3
            };

            // Expected: bit at position 3 is 1
            expect(extractBitfieldValue(rawValue, descriptor)).toBe(1);
        });

        test('should handle full-width extraction', () => {
            const rawValue = 0b11001010; // 202 decimal
            const descriptor: BitfieldDescriptorInterface = {
                type: 'UInt8',
                bitSize: 8,
                bitPosition: 0
            };

            // Expected: all 8 bits = 202 decimal
            expect(extractBitfieldValue(rawValue, descriptor)).toBe(202);
        });
    });

    describe('error handling', () => {
        test('should throw error when primitive type size is > 32 bits', () => {
            // Mock a type that has more than 32 bits
            const mockType = 'BigInt64BE';
            const originalSize = PRIMITIVE_TYPE_SIZES[mockType];
            PRIMITIVE_TYPE_SIZES[mockType] = 64;

            const descriptor: BitfieldDescriptorInterface = {
                type: mockType,
                bitSize: 16,
                bitPosition: 0
            };

            expect(() => extractBitfieldValue(0, descriptor)).toThrow('BigInt64BE is not supported yet');

            // Clean up mock
            if (originalSize === undefined) {
                // Use type assertion to allow delete operation on the index signature
                (PRIMITIVE_TYPE_SIZES as Record<string, number>)[mockType] = undefined as any;
            } else {
                PRIMITIVE_TYPE_SIZES[mockType] = originalSize;
            }
        });

        test('should throw error when bitPosition + bitSize exceeds type size', () => {
            const descriptor: BitfieldDescriptorInterface = {
                type: 'UInt8',
                bitSize: 5,
                bitPosition: 4
            };

            expect(() => extractBitfieldValue(0, descriptor)).toThrow(
                'bitPosition(4) + bitSize(5) exceeds UInt8 size'
            );
        });
    });

    describe('integration with processValueForBitfield', () => {
        test('should handle signed values correctly', () => {
            const rawValue = 0b11110000; // 240 decimal
            const descriptor: BitfieldDescriptorInterface = {
                type: 'Int8',
                bitSize: 4,
                bitPosition: 4
            };

            // Bits 4-7 are 1111 binary = 15 decimal
            // With sign extension for Int8 with 4 bits, 1111 represents -1
            expect(extractBitfieldValue(rawValue, descriptor)).toBe(-1);
        });

        test('should handle positive signed values correctly', () => {
            const rawValue = 0b00110000; // 48 decimal
            const descriptor: BitfieldDescriptorInterface = {
                type: 'Int8',
                bitSize: 4,
                bitPosition: 4
            };

            // Bits 4-7 are 0011 binary = 3 decimal
            // Since the most significant bit is 0, it's a positive number
            expect(extractBitfieldValue(rawValue, descriptor)).toBe(3);
        });
    });

    describe('integration with different types', () => {
        test('should handle UInt16 values', () => {
            const rawValue = 0b1010101010101010; // 43690 decimal
            const descriptor: BitfieldDescriptorInterface = {
                type: 'UInt16BE',
                bitSize: 6,
                bitPosition: 5
            };

            // Expected: bits 5-10 are 010101 binary = 21 decimal
            expect(extractBitfieldValue(rawValue, descriptor)).toBe(21);
        });

        test('should extract and properly sign-extend for Int16', () => {
            const rawValue = 0b0000111111110000; // 4080 decimal
            const descriptor: BitfieldDescriptorInterface = {
                type: 'Int16LE',
                bitSize: 8,
                bitPosition: 4
            };

            // Bits 4-11 are 11111111 = 255 unsigned, but as a signed 8-bit value, it's -1
            expect(extractBitfieldValue(rawValue, descriptor)).toBe(-1);
        });

        test('should handle multiple bit fields from the same value', () => {
            const rawValue = 0b10101100; // 172 decimal

            const field1: BitfieldDescriptorInterface = {
                type: 'UInt8',
                bitSize: 2,
                bitPosition: 0
            };

            const field2: BitfieldDescriptorInterface = {
                type: 'UInt8',
                bitSize: 3,
                bitPosition: 2
            };

            const field3: BitfieldDescriptorInterface = {
                type: 'UInt8',
                bitSize: 3,
                bitPosition: 5
            };

            // Field 1: bits 0-1 are 00 binary = 0 decimal
            // Field 2: bits 2-4 are 011 binary = 3 decimal
            // Field 3: bits 5-7 are 101 binary = 5 decimal
            expect(extractBitfieldValue(rawValue, field1)).toBe(0);
            expect(extractBitfieldValue(rawValue, field2)).toBe(3);
            expect(extractBitfieldValue(rawValue, field3)).toBe(5);
        });
    });

    test('should throw error when bitPosition + bitSize exceeds type size', () => {
        const invalidDescriptor: BitfieldDescriptorInterface = {
            type: 'UInt8', // 8 bits
            bitSize: 5,
            bitPosition: 4 // 4 + 5 = 9, which exceeds 8 bits
        };
        const rawValue = 0;

        expect(() => {
            extractBitfieldValue(rawValue, invalidDescriptor);
        }).toThrow(/bitPosition\(4\) \+ bitSize\(5\) exceeds UInt8 size for read operation/);
    });

    test('should throw error for unsupported primitive types', () => {
        const invalidDescriptor: BitfieldDescriptorInterface = {
            type: 'BigUInt64LE', // Assuming BigUInt64LE is > 32 bits and not supported yet
            bitSize: 3,
            bitPosition: 0
        };
        const rawValue = 0;

        expect(() => {
            extractBitfieldValue(rawValue, invalidDescriptor);
        }).toThrow(/BigUInt64LE is not supported yet/);
    });

    test('should throw error when bitSize is zero or negative', () => {
        const invalidDescriptor1: BitfieldDescriptorInterface = {
            type: 'UInt8',
            bitSize: 0, // Invalid - zero bits
            bitPosition: 0
        };

        const invalidDescriptor2: BitfieldDescriptorInterface = {
            type: 'UInt8',
            bitSize: -1, // Invalid - negative bits
            bitPosition: 0
        };

        const rawValue = 0;

        expect(() => {
            extractBitfieldValue(rawValue, invalidDescriptor1);
        }).toThrow('bitSize(0) and bitPosition(0) must be greater than bitSize(1) and bitPosition(0) for read operation');

        expect(() => {
            extractBitfieldValue(rawValue, invalidDescriptor2);
        }).toThrow(
            'bitSize(-1) and bitPosition(0) must be greater than bitSize(1) and bitPosition(0) for read operation'
        );
    });

    test('should throw error when bitPosition is negative', () => {
        const invalidDescriptor: BitfieldDescriptorInterface = {
            type: 'UInt8',
            bitSize: 3,
            bitPosition: -1 // Invalid - negative position
        };

        const rawValue = 0;

        expect(() => {
            extractBitfieldValue(rawValue, invalidDescriptor);
        }).toThrow(
            'bitSize(3) and bitPosition(-1) must be greater than bitSize(1) and bitPosition(0) for read operation'
        );
    });
});

describe('composeBitfieldValue', () => {
    test('should write an unsigned value to a bitfield', () => {
        const descriptor: BitfieldDescriptorInterface = {
            type: 'UInt8',
            bitSize: 3,
            bitPosition: 0
        };
        const rawValue = 0;
        const valueToWrite = 5;

        const result = composeBitfieldValue(rawValue, descriptor, valueToWrite);

        expect(result).toBe(5); // 5 in binary is 101, which fits in 3 bits at position 0
    });

    test('should write a value to a bitfield with non-zero position', () => {
        const descriptor: BitfieldDescriptorInterface = {
            type: 'UInt8',
            bitSize: 3,
            bitPosition: 2
        };
        const rawValue = 0;
        const valueToWrite = 5;

        const result = composeBitfieldValue(rawValue, descriptor, valueToWrite);

        expect(result).toBe(20); // 5 shifted left by 2 positions becomes 20 (10100 binary)
    });

    test('should preserve existing bits outside the target field', () => {
        const descriptor: BitfieldDescriptorInterface = {
            type: 'UInt8',
            bitSize: 3,
            bitPosition: 2
        };
        const rawValue = 0b10000001; // 129 in decimal
        const valueToWrite = 5;

        const result = composeBitfieldValue(rawValue, descriptor, valueToWrite);

        expect(result).toBe(0b10010101); // 149 in decimal: preserves bits 7 and 0
    });

    test('should overwrite only the specified bits when value already exists', () => {
        const descriptor: BitfieldDescriptorInterface = {
            type: 'UInt8',
            bitSize: 3,
            bitPosition: 2
        };
        const rawValue = 0b11111111; // 255 in decimal, all bits set
        const valueToWrite = 2; // 010 in binary

        const result = composeBitfieldValue(rawValue, descriptor, valueToWrite);

        expect(result).toBe(0b11101011); // 235 in decimal: bits 2,3,4 changed to 010
    });

    test('should handle signed values correctly', () => {
        const descriptor: BitfieldDescriptorInterface = {
            type: 'Int8',
            bitSize: 4,
            bitPosition: 0
        };
        const rawValue = 0;
        const valueToWrite = -3;

        const result = composeBitfieldValue(rawValue, descriptor, valueToWrite);

        // -3 in 4-bit two's complement is 1101, which is 13 in decimal
        expect(result).toBe(13);
    });

    // Edge cases
    test('should handle zero as a valid input', () => {
        const descriptor: BitfieldDescriptorInterface = {
            type: 'UInt8',
            bitSize: 3,
            bitPosition: 2
        };
        const rawValue = 0b11111111;
        const valueToWrite = 0;

        const result = composeBitfieldValue(rawValue, descriptor, valueToWrite);

        expect(result).toBe(0b11100011); // All target bits cleared
    });

    test('should handle maximum value for bit size', () => {
        const descriptor: BitfieldDescriptorInterface = {
            type: 'UInt8',
            bitSize: 3,
            bitPosition: 1
        };
        const rawValue = 0;
        const valueToWrite = 7; // Maximum 3-bit value

        const result = composeBitfieldValue(rawValue, descriptor, valueToWrite);

        expect(result).toBe(14); // 7 shifted left by 1 position is 14
    });

    test('processValueForBitfield handles signed values correctly', () => {
        const signedDescriptor: BitfieldDescriptorInterface = {
            type: 'Int8',
            bitSize: 4,
            bitPosition: 0
        };

        // 15 in 4-bit signed representation should be -1
        expect(processValueForBitfield(signedDescriptor, 15)).toBe(-1);

        // 7 in 4-bit signed is still 7
        expect(processValueForBitfield(signedDescriptor, 7)).toBe(7);

        const unsignedDescriptor: BitfieldDescriptorInterface = {
            type: 'UInt8',
            bitSize: 4,
            bitPosition: 0
        };

        // Unsigned types should return the value unchanged
        expect(processValueForBitfield(unsignedDescriptor, 15)).toBe(15);
        expect(processValueForBitfield(unsignedDescriptor, 7)).toBe(7);
    });

    test('should throw error when bitPosition + bitSize exceeds type size', () => {
        const invalidDescriptor: BitfieldDescriptorInterface = {
            type: 'UInt8', // 8 bits
            bitSize: 5,
            bitPosition: 4 // 4 + 5 = 9, which exceeds 8 bits
        };
        const rawValue = 0;
        const valueToWrite = 3;

        expect(() => {
            composeBitfieldValue(rawValue, invalidDescriptor, valueToWrite);
        }).toThrow(/bitPosition\(4\) \+ bitSize\(5\) exceeds UInt8 size for write operation/);
    });

    test('should throw error for unsupported primitive types', () => {
        const invalidDescriptor: BitfieldDescriptorInterface = {
            type: 'BigUInt64LE', // Assuming BigUInt64LE is > 32 bits and not supported yet
            bitSize: 3,
            bitPosition: 0
        };
        const rawValue = 0;
        const valueToWrite = 3;

        expect(() => {
            composeBitfieldValue(rawValue, invalidDescriptor, valueToWrite);
        }).toThrow(/BigUInt64LE is not supported yet/);
    });

    test('should throw RangeError when value exceeds maximum for unsigned bitfield', () => {
        const descriptor: BitfieldDescriptorInterface = {
            type: 'UInt8',
            bitSize: 3, // Max value: 7
            bitPosition: 0
        };
        const rawValue = 0;
        const valueToWrite = 8; // Too large for 3 bits

        expect(() => {
            composeBitfieldValue(rawValue, descriptor, valueToWrite);
        }).toThrow(RangeError);
        expect(() => {
            composeBitfieldValue(rawValue, descriptor, valueToWrite);
        }).toThrow(/8 does not fit within 3 bits for type UInt8/);
    });

    test('should throw RangeError when value is below minimum for unsigned bitfield', () => {
        const descriptor: BitfieldDescriptorInterface = {
            type: 'UInt8',
            bitSize: 3,
            bitPosition: 0
        };
        const rawValue = 0;
        const valueToWrite = -1; // Negative, invalid for unsigned

        expect(() => {
            composeBitfieldValue(rawValue, descriptor, valueToWrite);
        }).toThrow(RangeError);
        expect(() => {
            composeBitfieldValue(rawValue, descriptor, valueToWrite);
        }).toThrow(/-1 does not fit within 3 bits for type UInt8/);
    });

    test('should throw RangeError when value exceeds maximum for signed bitfield', () => {
        const descriptor: BitfieldDescriptorInterface = {
            type: 'Int8',
            bitSize: 3, // Range: -4 to 3
            bitPosition: 0
        };
        const rawValue = 0;
        const valueToWrite = 4; // Too large for 3-bit signed

        expect(() => {
            composeBitfieldValue(rawValue, descriptor, valueToWrite);
        }).toThrow(RangeError);
        expect(() => {
            composeBitfieldValue(rawValue, descriptor, valueToWrite);
        }).toThrow(/4 does not fit within 3 bits for type Int8/);
    });

    test('should throw RangeError when value is below minimum for signed bitfield', () => {
        const descriptor: BitfieldDescriptorInterface = {
            type: 'Int8',
            bitSize: 3, // Range: -4 to 3
            bitPosition: 0
        };
        const rawValue = 0;
        const valueToWrite = -5; // Too small for 3-bit signed

        expect(() => {
            composeBitfieldValue(rawValue, descriptor, valueToWrite);
        }).toThrow(RangeError);
        expect(() => {
            composeBitfieldValue(rawValue, descriptor, valueToWrite);
        }).toThrow(/-5 does not fit within 3 bits for type Int8/);
    });
});

describe('getBitMask', () => {
    beforeEach(() => {
        // Clear the cache before each test to ensure consistent test behavior
        maskCache.clear();
    });

    test('should generate correct bit masks for different sizes', () => {
        // Test various bit sizes
        expect(getBitMask(1)).toBe(1);          // 0b1 = 1
        expect(getBitMask(3)).toBe(7);          // 0b111 = 7
        expect(getBitMask(8)).toBe(255);        // 0b11111111 = 255
        expect(getBitMask(16)).toBe(65535);     // 16 bits all set = 65535
    });

    test('should use cache for subsequent calls with the same size', () => {
        // We'll spy on the Map.set method to verify caching behavior
        const setSpy = xJet.spyOn(maskCache, 'set');

        // First call should calculate and cache
        const result1 = getBitMask(5);
        expect(result1).toBe(31);  // 0b11111 = 31
        expect(setSpy).toHaveBeenCalledTimes(1);
        expect(setSpy).toHaveBeenCalledWith(5, 31);

        // Second call should use the cache
        setSpy.mockClear();
        const result2 = getBitMask(5);
        expect(result2).toBe(31);
        expect(setSpy).not.toHaveBeenCalled(); // Shouldn't call set again

        // Different size should calculate and cache again
        const result3 = getBitMask(6);
        expect(result3).toBe(63);  // 0b111111 = 63
        expect(setSpy).toHaveBeenCalledTimes(1);
        expect(setSpy).toHaveBeenCalledWith(6, 63);
    });

    test('should handle edge cases', () => {
        // Zero bits (technically should be 0)
        expect(getBitMask(0)).toBe(0);

        // Maximum safe integer bits in JavaScript
        const maxSafeSize = Math.floor(Math.log2(Number.MAX_SAFE_INTEGER));
        expect(() => getBitMask(maxSafeSize)).not.toThrow();

        // Beyond safe integer range might have precision issues, but shouldn't throw
        expect(() => getBitMask(53)).not.toThrow();
    });

    test('should produce the same result for repeated calls with the same size', () => {
        const size = 10;
        const expectedMask = 1023; // 0b1111111111 = 1023

        const result1 = getBitMask(size);
        const result2 = getBitMask(size);
        const result3 = getBitMask(size);

        expect(result1).toBe(expectedMask);
        expect(result2).toBe(expectedMask);
        expect(result3).toBe(expectedMask);
    });
});

describe('isSignedType', () => {
    test('should identify signed types correctly', () => {
        // Test common signed integer types
        expect(isSignedType('Int8')).toBe(true);
        expect(isSignedType('Int16')).toBe(true);
        expect(isSignedType('Int32')).toBe(true);
        expect(isSignedType('Int64')).toBe(true);
        expect(isSignedType('IntCustom')).toBe(true);
    });

    test('should identify unsigned types correctly', () => {
        // Test common unsigned types
        expect(isSignedType('UInt8')).toBe(false);
        expect(isSignedType('UInt16')).toBe(false);
        expect(isSignedType('UInt32')).toBe(false);
        expect(isSignedType('Float32')).toBe(false);
        expect(isSignedType('Float64')).toBe(false);
        expect(isSignedType('Double')).toBe(false);
        expect(isSignedType('Boolean')).toBe(false);
        expect(isSignedType('Char')).toBe(false);
    });

    test('should be case sensitive', () => {
        // Test case sensitivity
        expect(isSignedType('int8')).toBe(false);
        expect(isSignedType('INTEGER')).toBe(false);
        expect(isSignedType('integer')).toBe(false);
    });

    test('should handle edge cases', () => {
        // Test edge cases
        expect(isSignedType('')).toBe(false);
        expect(isSignedType('Int')).toBe(true);
        expect(isSignedType('IntegerType')).toBe(true);
        expect(isSignedType('NotInt')).toBe(false);
        expect(isSignedType('_Int')).toBe(false);
    });

    test('should handle types with Int in the middle or end', () => {
        // Test types where "Int" appears in the middle or end
        expect(isSignedType('MyInt8')).toBe(false);
        expect(isSignedType('CustomInt')).toBe(false);
        expect(isSignedType('NotInteger')).toBe(false);
    });
});

describe('validateBitFieldBounds', () => {
    describe('signed bitfields', () => {
        test('should not throw for values within bounds of a signed bitfield', () => {
            // 3-bit signed range: -4 to 3
            const descriptor: BitfieldDescriptorInterface = {
                type: 'Int8',
                bitSize: 3,
                bitPosition: 0
            };

            // Test boundary values
            expect(() => validateBitFieldBounds(descriptor, -4)).not.toThrow();
            expect(() => validateBitFieldBounds(descriptor, 0)).not.toThrow();
            expect(() => validateBitFieldBounds(descriptor, 3)).not.toThrow();

            // Test values in between
            expect(() => validateBitFieldBounds(descriptor, -3)).not.toThrow();
            expect(() => validateBitFieldBounds(descriptor, -2)).not.toThrow();
            expect(() => validateBitFieldBounds(descriptor, -1)).not.toThrow();
            expect(() => validateBitFieldBounds(descriptor, 1)).not.toThrow();
            expect(() => validateBitFieldBounds(descriptor, 2)).not.toThrow();
        });

        test('should throw for values outside bounds of a signed bitfield', () => {
            // 3-bit signed range: -4 to 3
            const descriptor: BitfieldDescriptorInterface = {
                type: 'Int8',
                bitSize: 3,
                bitPosition: 0
            };

            // Test out-of-bounds values
            expect(() => validateBitFieldBounds(descriptor, -5)).toThrow(RangeError);
            expect(() => validateBitFieldBounds(descriptor, 4)).toThrow(RangeError);
            expect(() => validateBitFieldBounds(descriptor, 100)).toThrow(RangeError);
            expect(() => validateBitFieldBounds(descriptor, -100)).toThrow(RangeError);

            // Verify error message includes relevant information
            expect(() => {
                validateBitFieldBounds(descriptor, 4);
            }).toThrow(/4.*3.*Int8/);
        });

        test('should handle different signed bit sizes correctly', () => {
            // 4-bit signed range: -8 to 7
            const descriptor4Bit: BitfieldDescriptorInterface = {
                type: 'Int16LE',
                bitSize: 4,
                bitPosition: 0
            };

            expect(() => validateBitFieldBounds(descriptor4Bit, -8)).not.toThrow();
            expect(() => validateBitFieldBounds(descriptor4Bit, 7)).not.toThrow();
            expect(() => validateBitFieldBounds(descriptor4Bit, -9)).toThrow(RangeError);
            expect(() => validateBitFieldBounds(descriptor4Bit, 8)).toThrow(RangeError);

            // 8-bit signed range: -128 to 127
            const descriptor8Bit: BitfieldDescriptorInterface = {
                type: 'Int8',
                bitSize: 8,
                bitPosition: 0
            };

            expect(() => validateBitFieldBounds(descriptor8Bit, -128)).not.toThrow();
            expect(() => validateBitFieldBounds(descriptor8Bit, 127)).not.toThrow();
            expect(() => validateBitFieldBounds(descriptor8Bit, -129)).toThrow(RangeError);
            expect(() => validateBitFieldBounds(descriptor8Bit, 128)).toThrow(RangeError);
        });
    });

    // Test unsigned bitfields
    describe('unsigned bitfields', () => {
        test('should not throw for values within bounds of an unsigned bitfield', () => {
            // 3-bit unsigned range: 0 to 7
            const descriptor: BitfieldDescriptorInterface = {
                type: 'UInt8',
                bitSize: 3,
                bitPosition: 0
            };

            // Test boundary values
            expect(() => validateBitFieldBounds(descriptor, 0)).not.toThrow();
            expect(() => validateBitFieldBounds(descriptor, 7)).not.toThrow();

            // Test values in between
            expect(() => validateBitFieldBounds(descriptor, 1)).not.toThrow();
            expect(() => validateBitFieldBounds(descriptor, 3)).not.toThrow();
            expect(() => validateBitFieldBounds(descriptor, 6)).not.toThrow();
        });

        test('should throw for values outside bounds of an unsigned bitfield', () => {
            // 3-bit unsigned range: 0 to 7
            const descriptor: BitfieldDescriptorInterface = {
                type: 'UInt8',
                bitSize: 3,
                bitPosition: 0
            };

            // Test out-of-bounds values
            expect(() => validateBitFieldBounds(descriptor, -1)).toThrow(RangeError);
            expect(() => validateBitFieldBounds(descriptor, 8)).toThrow(RangeError);
            expect(() => validateBitFieldBounds(descriptor, 100)).toThrow(RangeError);

            // Verify error message
            expect(() => {
                validateBitFieldBounds(descriptor, 8);
            }).toThrow(/8.*3.*UInt8/);
        });

        test('should handle different unsigned bit sizes correctly', () => {
            // 4-bit unsigned range: 0 to 15
            const descriptor4Bit: BitfieldDescriptorInterface = {
                type: 'UInt16BE',
                bitSize: 4,
                bitPosition: 0
            };

            expect(() => validateBitFieldBounds(descriptor4Bit, 0)).not.toThrow();
            expect(() => validateBitFieldBounds(descriptor4Bit, 15)).not.toThrow();
            expect(() => validateBitFieldBounds(descriptor4Bit, -1)).toThrow(RangeError);
            expect(() => validateBitFieldBounds(descriptor4Bit, 16)).toThrow(RangeError);

            // 8-bit unsigned range: 0 to 255
            const descriptor8Bit: BitfieldDescriptorInterface = {
                type: 'UInt8',
                bitSize: 8,
                bitPosition: 0
            };

            expect(() => validateBitFieldBounds(descriptor8Bit, 0)).not.toThrow();
            expect(() => validateBitFieldBounds(descriptor8Bit, 255)).not.toThrow();
            expect(() => validateBitFieldBounds(descriptor8Bit, -1)).toThrow(RangeError);
            expect(() => validateBitFieldBounds(descriptor8Bit, 256)).toThrow(RangeError);
        });
    });

    test('should handle edge case bit sizes', () => {
        // 1-bit unsigned: 0 to 1
        const descriptor1BitUnsigned: BitfieldDescriptorInterface = {
            type: 'UInt8',
            bitSize: 1,
            bitPosition: 0
        };

        expect(() => validateBitFieldBounds(descriptor1BitUnsigned, 0)).not.toThrow();
        expect(() => validateBitFieldBounds(descriptor1BitUnsigned, 1)).not.toThrow();
        expect(() => validateBitFieldBounds(descriptor1BitUnsigned, 2)).toThrow(RangeError);

        // 1-bit signed: -1 to 0
        const descriptor1BitSigned: BitfieldDescriptorInterface = {
            type: 'Int8',
            bitSize: 1,
            bitPosition: 0
        };

        expect(() => validateBitFieldBounds(descriptor1BitSigned, -1)).not.toThrow();
        expect(() => validateBitFieldBounds(descriptor1BitSigned, 0)).not.toThrow();
        expect(() => validateBitFieldBounds(descriptor1BitSigned, 1)).toThrow(RangeError);
    });

    test('should handle non-standard bit sizes', () => {
        // 10-bit unsigned: 0 to 1023
        const descriptorUnsigned: BitfieldDescriptorInterface = {
            type: 'UInt16BE',
            bitSize: 10,
            bitPosition: 0
        };

        expect(() => validateBitFieldBounds(descriptorUnsigned, 0)).not.toThrow();
        expect(() => validateBitFieldBounds(descriptorUnsigned, 1023)).not.toThrow();
        expect(() => validateBitFieldBounds(descriptorUnsigned, 1024)).toThrow(RangeError);

        // 10-bit signed: -512 to 511
        const descriptorSigned: BitfieldDescriptorInterface = {
            type: 'Int16LE',
            bitSize: 10,
            bitPosition: 0
        };

        expect(() => validateBitFieldBounds(descriptorSigned, -512)).not.toThrow();
        expect(() => validateBitFieldBounds(descriptorSigned, 511)).not.toThrow();
        expect(() => validateBitFieldBounds(descriptorSigned, -513)).toThrow(RangeError);
        expect(() => validateBitFieldBounds(descriptorSigned, 512)).toThrow(RangeError);
    });
});

describe('validateBitfieldParameters', () => {
    describe('valid parameters', () => {
        test('should not throw for valid bitfield parameters', () => {
            const validDescriptors: Array<[BitfieldDescriptorInterface, string]> = [
                // [descriptor, operation]
                [{ type: 'UInt8', bitSize: 8, bitPosition: 0 }, 'read' ],
                [{ type: 'Int16LE', bitSize: 4, bitPosition: 0 }, 'write' ],
                [{ type: 'UInt32BE', bitSize: 1, bitPosition: 0 }, 'read' ],
                [{ type: 'Int8', bitSize: 3, bitPosition: 5 }, 'write' ],
                [{ type: 'UInt16BE', bitSize: 10, bitPosition: 6 }, 'read' ],
                [{ type: 'Int32LE', bitSize: 16, bitPosition: 16 }, 'write' ]
            ];

            validDescriptors.forEach(([ descriptor, operation ]) => {
                expect(() => validateBitfieldParameters(descriptor, operation)).not.toThrow();
            });
        });
    });

    // Test invalid bitSize and bitPosition
    describe('invalid bitSize and bitPosition', () => {
        test('should throw for bitSize less than 1', () => {
            const descriptor: BitfieldDescriptorInterface = {
                type: 'UInt8',
                bitSize: 0, // Invalid: less than 1
                bitPosition: 0
            };

            expect(() => validateBitfieldParameters(descriptor, 'read')).toThrow(Error);

            try {
                validateBitfieldParameters(descriptor, 'read');
            } catch (error) {
                const message = (error as Error).message;
                expect(message).toContain('bitSize(0)');
                expect(message).toContain('must be greater than bitSize(1)');
                expect(message).toContain('for read');
            }

            const negativeSize: BitfieldDescriptorInterface = {
                type: 'UInt8',
                bitSize: -2,
                bitPosition: 0
            };

            expect(() => validateBitfieldParameters(negativeSize, 'write')).toThrow(Error);
        });

        test('should throw for bitPosition less than 0', () => {
            const descriptor: BitfieldDescriptorInterface = {
                type: 'Int16LE',
                bitSize: 4,
                bitPosition: -1 // Invalid: less than 0
            };

            expect(() => validateBitfieldParameters(descriptor, 'read')).toThrow(Error);

            try {
                validateBitfieldParameters(descriptor, 'read');
            } catch (error) {
                const message = (error as Error).message;
                expect(message).toContain('bitPosition(-1)');
                expect(message).toContain('must be greater than');
                expect(message).toContain('bitPosition(0)');
                expect(message).toContain('for read');
            }
        });
    });

    // Test unsupported primitive types
    describe('unsupported primitive types', () => {
        test('should throw for primitive types larger than 32 bits', () => {
            const descriptor: BitfieldDescriptorInterface = {
                type: 'BigInt64BE', // Assuming BigInt64BE is > 32 bits in PRIMITIVE_TYPE_SIZES
                bitSize: 8,
                bitPosition: 0
            };

            expect(() => validateBitfieldParameters(descriptor, 'read')).toThrow(Error);

            try {
                validateBitfieldParameters(descriptor, 'read');
            } catch (error) {
                const message = (error as Error).message;
                expect(message).toContain('Int64');
                expect(message).toContain('is not supported');
            }
        });
    });

    // Test exceeding type size
    describe('bit position and size exceeding type size', () => {
        test('should throw when bitPosition + bitSize exceeds primitive type size', () => {
            // UInt8 is 8 bits, so bitPosition 5 + bitSize 4 = 9 exceeds 8
            const descriptor: BitfieldDescriptorInterface = {
                type: 'UInt8',
                bitSize: 4,
                bitPosition: 5
            };

            expect(() => validateBitfieldParameters(descriptor, 'read')).toThrow(Error);

            try {
                validateBitfieldParameters(descriptor, 'read');
            } catch (error) {
                const message = (error as Error).message;
                expect(message).toContain('bitPosition(5) + bitSize(4)');
                expect(message).toContain('exceeds UInt8 size');
                expect(message).toContain('for read');
            }

            // Int16 is 16 bits, so bitPosition 10 + bitSize 7 = 17 exceeds 16
            const descriptor16: BitfieldDescriptorInterface = {
                type: 'Int16BE',
                bitSize: 7,
                bitPosition: 10
            };

            expect(() => validateBitfieldParameters(descriptor16, 'write')).toThrow(Error);
        });

        test('should not throw when bitPosition + bitSize equals the primitive type size', () => {
            // UInt8 is 8 bits, so bitPosition 0 + bitSize 8 = 8 equals 8 (valid)
            const descriptor: BitfieldDescriptorInterface = {
                type: 'UInt8',
                bitSize: 8,
                bitPosition: 0
            };

            expect(() => validateBitfieldParameters(descriptor, 'read')).not.toThrow();

            // UInt16 is 16 bits, so bitPosition 8 + bitSize 8 = 16 equals 16 (valid)
            const descriptor16: BitfieldDescriptorInterface = {
                type: 'UInt16LE',
                bitSize: 8,
                bitPosition: 8
            };

            expect(() => validateBitfieldParameters(descriptor16, 'write')).not.toThrow();
        });
    });

    // Test different operations
    describe('different operation names', () => {
        test('should include the operation name in the error message', () => {
            const invalidDescriptor: BitfieldDescriptorInterface = {
                type: 'Int8',
                bitSize: 0,
                bitPosition: 0
            };

            const operations = [ 'read', 'write', 'update', 'validate' ];

            operations.forEach(operation => {
                expect(() => {
                    validateBitfieldParameters(invalidDescriptor, operation);
                }).toThrow(new RegExp(`for ${ operation }`));
            });
        });
    });

    // Test edge cases
    describe('edge cases', () => {
        test('should validate minimum valid parameters', () => {
            const minDescriptor: BitfieldDescriptorInterface = {
                type: 'UInt8',
                bitSize: 1,
                bitPosition: 0
            };

            expect(() => validateBitfieldParameters(minDescriptor, 'read')).not.toThrow();
        });

        test('should validate parameters at type bounds', () => {
            // Assuming UInt8 is 8 bits
            const maxDescriptor: BitfieldDescriptorInterface = {
                type: 'UInt8',
                bitSize: 4,
                bitPosition: 4
            };

            expect(() => validateBitfieldParameters(maxDescriptor, 'read')).not.toThrow();
        });
    });
});

describe('parseBitfieldDescriptor', () => {
    describe('success cases', () => {
        test('should correctly parse a valid descriptor with default bit position', () => {
            const result = parseBitfieldDescriptor('Int8:4');

            expect(result).toEqual({
                kind: 'bitfield',
                type: 'Int8',
                size: 1,
                bitSize: 4,
                position: 0,
                bitPosition: 0,
                isBigEndian: false
            });
        });

        test('should correctly parse a valid descriptor with specified bit position', () => {
            const result = parseBitfieldDescriptor('UInt16LE:6', 0, 3);

            expect(result).toEqual({
                kind: 'bitfield',
                type: 'UInt16LE',
                size: 2,
                bitSize: 6,
                position: 0,
                bitPosition: 3,
                isBigEndian: false
            });
        });

        test('should parse correctly with max allowed bit position', () => {
            const result = parseBitfieldDescriptor('Int32BE:1', 0, 30);

            expect(result).toEqual({
                kind: 'bitfield',
                type: 'Int32BE',
                size: 4,
                bitSize: 1,
                position: 0,
                bitPosition: 30,
                isBigEndian: true
            });
        });

        test('should parse correctly with bit size filling the remaining space', () => {
            const result = parseBitfieldDescriptor('UInt8:5', 0, 2);

            expect(result).toEqual({
                kind: 'bitfield',
                type: 'UInt8',
                size: 1,
                bitSize: 5,
                position: 0,
                bitPosition: 2,
                isBigEndian: false
            });
        });
    });

    describe('error cases', () => {
        test('should throw error for unsupported type', () => {
            expect(() => {
                parseBitfieldDescriptor('Float64:4');
            }).toThrow('Float64 is not supported');
        });

        test('should throw error for negative bit position', () => {
            expect(() => {
                parseBitfieldDescriptor('Int8:4', 0, -1);
            }).toThrow('Bitfield position -1 is out of bounds (must be between 0 and 7)');
        });

        test('should throw error for bit position equal to type size', () => {
            expect(() => {
                parseBitfieldDescriptor('Int8:4', 0, 8);
            }).toThrow('Bitfield position 8 is out of bounds (must be between 0 and 7)');
        });

        test('should throw error for bit position greater than type size', () => {
            expect(() => {
                parseBitfieldDescriptor('Int16LE:4', 0, 20);
            }).toThrow('Bitfield position 20 is out of bounds (must be between 0 and 15)');
        });

        test('should throw error for invalid bit size format', () => {
            expect(() => {
                parseBitfieldDescriptor('Int8:abc');
            }).toThrow('Int8:abc is not valid');
        });

        test('should throw error for bit size of 0', () => {
            expect(() => {
                parseBitfieldDescriptor('Int8:0');
            }).toThrow('Int8:0 is not valid');
        });

        test('should throw error for invalid field format', () => {
            expect(() => {
                parseBitfieldDescriptor('Int8');
            }).toThrow('Int8 is not valid');
        });

        test('should throw error when bit size + position exceeds type size', () => {
            expect(() => {
                parseBitfieldDescriptor('Int8:5', 0, 4);
            }).toThrow('Int8 size (8) is not enough to hold 5 bits starting at position 4');
        });

        test('should throw error for maximum overflow case', () => {
            expect(() => {
                parseBitfieldDescriptor('UInt16LE:16', 0, 1);
            }).toThrow('UInt16LE size (16) is not enough to hold 16 bits starting at position 1');
        });
    });
});

describe('Bitfield Buffer Operations', () => {
    // Test fixtures
    const createUnsignedDescriptor = (
        bitSize: number,
        bitPosition: number,
        position: number = 0,
        size: number = 1,
        isBigEndian: boolean = false
    ): PositionedBitfieldDescriptorType => ({
        kind: 'bitfield',
        type: 'UInt8',
        bitSize,
        bitPosition,
        position,
        size,
        isBigEndian
    });

    const createSignedDescriptor = (
        bitSize: number,
        bitPosition: number,
        position: number = 0,
        size: number = 1,
        isBigEndian: boolean = false
    ): PositionedBitfieldDescriptorType => ({
        kind: 'bitfield',
        type: 'Int8',
        bitSize,
        bitPosition,
        position,
        size,
        isBigEndian
    });

    describe('writeBitfield and readBitfield', () => {
        test('should write and read an unsigned 3-bit value at bit position 2', () => {
            // Initialize a buffer with 0b10000010 (130)
            const buffer = Buffer.from([ 130, 0 ]);
            const descriptor = createUnsignedDescriptor(3, 2);

            // Write 0b110 (6) to the 3-bit field at position 2
            writeBitfield.call({ buffer, descriptor, offset: 0 }, 6);

            // Expected: 0b10011010 (154)
            expect(buffer[0]).toBe(154);

            // Read back the value
            expect(readBitfield.call({ buffer, descriptor, offset: 0 })).toBe(6);
        });

        test('should write and read a signed negative value', () => {
            // Initialize a buffer with 0b11110000 (240)
            const buffer = Buffer.from([ 240, 0 ]);
            const descriptor = createSignedDescriptor(3, 1);

            // Write -1 (0b111 in 3-bit signed form) to the field
            writeBitfield.call({ buffer, descriptor, offset: 0 }, -1);

            // Expected: 0b11111110 (254)
            expect(buffer[0]).toBe(254);

            // Read back the value
            expect(readBitfield.call({ buffer, descriptor, offset: 0 })).toBe(-1);
        });

        test('should write and read a value with custom offset', () => {
            // Initialize a buffer with zeros
            const buffer = Buffer.alloc(4);
            const descriptor = createUnsignedDescriptor(5, 3, 1);

            // Write 0b10111 (23) to the field in the second byte
            writeBitfield.call({ buffer, descriptor, offset: 0 }, 23);

            // Expected second byte: 0b10111000 (184)
            expect(buffer[1]).toBe(184);

            // Read back the value
            expect(readBitfield.call({ buffer, descriptor, offset: 0 })).toBe(23);
        });

        test('should handle position parameter correctly', () => {
            // Initialize a buffer with zeros
            const buffer = Buffer.alloc(4);
            const descriptor = createUnsignedDescriptor(4, 0, 0);

            // Write to position 0, 1, and 2
            writeBitfield.call({ buffer, descriptor, offset: 0 }, 7);
            writeBitfield.call({ buffer, descriptor, offset: 1 }, 9);
            writeBitfield.call({ buffer, descriptor, offset: 2 }, 15);

            expect(buffer[0]).toBe(7);
            expect(buffer[1]).toBe(9);
            expect(buffer[2]).toBe(15);

            // Read back from each position
            expect(readBitfield.call({ buffer, descriptor, offset: 0 })).toBe(7);
            expect(readBitfield.call({ buffer, descriptor, offset: 1 })).toBe(9);
            expect(readBitfield.call({ buffer, descriptor, offset: 2 })).toBe(15);
        });

        test('should handle big-endian values correctly', () => {
            // Initialize a buffer with zeros
            const buffer = Buffer.alloc(4);

            // Create a big-endian field descriptor that spans 2 bytes
            const descriptor = createUnsignedDescriptor(5, 3, 0, 2, true);

            // Write a value that needs more than one byte to represent
            writeBitfield.call({ buffer, descriptor, offset: 0 }, 23);

            // Read back the value
            expect(readBitfield.call({ buffer, descriptor, offset: 0 })).toBe(23);
        });
    });

    describe('Edge cases', () => {
        test('should correctly write a value that uses all bits in the field', () => {
            const buffer = Buffer.alloc(1);

            // 3-bit field at position 0
            const descriptor = createUnsignedDescriptor(3, 0);

            // Maximum value for 3 bits: 7
            writeBitfield.call({ buffer, descriptor, offset: 0 }, 7);
            expect(buffer[0]).toBe(7);
            expect(readBitfield.call({ buffer, descriptor, offset: 0 })).toBe(7);
        });

        test('should handle 1-bit fields (boolean-like fields)', () => {
            const buffer = Buffer.alloc(1);

            // 1-bit field at position 3
            const descriptor = createUnsignedDescriptor(1, 3);

            // Write 1 to the single bit
            writeBitfield.call({ buffer, descriptor, offset: 0 }, 1);
            expect(buffer[0]).toBe(8); // 0b00001000

            // Read back the bit
            expect(readBitfield.call({ buffer, descriptor, offset: 0 })).toBe(1);

            // Clear the bit
            writeBitfield.call({ buffer, descriptor, offset: 0 }, 0);
            expect(buffer[0]).toBe(0);
            expect(readBitfield.call({ buffer, descriptor, offset: 0 })).toBe(0);
        });

        test('should handle overlapping writes to the same byte', () => {
            const buffer = Buffer.alloc(1);

            // Two different fields in the same byte
            const descriptor1 = createUnsignedDescriptor(3, 0); // bits 0-2
            const descriptor2 = createUnsignedDescriptor(3, 3); // bits 3-5

            // Write to both fields
            writeBitfield.call({ buffer, descriptor: descriptor1, offset: 0 }, 5); // 0b101
            writeBitfield.call({ buffer, descriptor: descriptor2, offset: 0 }, 7); // 0b111

            // Expected: 0b00111101 (61)
            expect(buffer[0]).toBe(61);

            // Read back both fields
            expect(readBitfield.call({ buffer, descriptor: descriptor1, offset: 0 })).toBe(5);
            expect(readBitfield.call({ buffer, descriptor: descriptor2, offset: 0 })).toBe(7);
        });

        test('should handle signed values correctly at boundary conditions', () => {
            const buffer = Buffer.alloc(1);

            // 3-bit signed field
            const descriptor = createSignedDescriptor(3, 2);

            // Minimum value for 3-bit signed: -4
            writeBitfield.call({ buffer, descriptor, offset: 0 }, -4);
            expect(readBitfield.call({ buffer, descriptor, offset: 0 })).toBe(-4);

            // Maximum value for 3-bit signed: 3
            writeBitfield.call({ buffer, descriptor, offset: 0 }, 3);
            expect(readBitfield.call({ buffer, descriptor, offset: 0 })).toBe(3);
        });
    });
});

