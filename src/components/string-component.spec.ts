/**
 * Imports
 */

import {
    readString,
    writeString,
    readStringArray,
    writeStringArray,
    readSingleString,
    writeSingleString,
    parseStringDescriptor
} from '@components/string.component';

/**
 * Tests
 */

describe('parseStringDescriptor', () => {
    const defaultStringDescriptor = {
        kind: 'string',
        size: 2,
        position: 0,
        lengthType: 'UInt16LE'
    };

    test('should parse string type without size', () => {
        const result = parseStringDescriptor('utf8');
        expect(result).toEqual({ type: 'utf8', arraySize: undefined, ...defaultStringDescriptor });
    });

    test('should parse ascii type without size', () => {
        const result = parseStringDescriptor('ascii');
        expect(result).toEqual({ type: 'ascii', arraySize: undefined, ...defaultStringDescriptor });
    });

    test('should parse string literal type without size', () => {
        const result = parseStringDescriptor('string');
        expect(result).toEqual({ type: 'string', arraySize: undefined, ...defaultStringDescriptor });
    });

    test('should parse string type with array size', () => {
        const result = parseStringDescriptor('utf8[10]');
        expect(result).toEqual({ type: 'utf8', arraySize: 10, ...defaultStringDescriptor });
    });

    test('should parse ascii type with array size', () => {
        const result = parseStringDescriptor('ascii[25]');
        expect(result).toEqual({ type: 'ascii', arraySize: 25, ...defaultStringDescriptor });
    });

    test('should parse string literal type with array size', () => {
        const result = parseStringDescriptor('string[5]');
        expect(result).toEqual({ type: 'string', arraySize: 5, ...defaultStringDescriptor });
    });

    test('should be case insensitive', () => {
        const result1 = parseStringDescriptor('UTF8');
        const result2 = parseStringDescriptor('AsCiI[15]');
        const result3 = parseStringDescriptor('STRING[8]');

        expect(result1).toEqual({ type: 'utf8', arraySize: undefined, ...defaultStringDescriptor });
        expect(result2).toEqual({ type: 'ascii', arraySize: 15, ...defaultStringDescriptor  });
        expect(result3).toEqual({ type: 'string', arraySize: 8, ...defaultStringDescriptor  });
    });

    test('should throw error for invalid type', () => {
        expect(() => parseStringDescriptor('invalid')).toThrow('Invalid string descriptor: invalid');
    });

    test('should throw error for invalid format', () => {
        expect(() => parseStringDescriptor('utf8[abc]')).toThrow('Invalid string descriptor: utf8[abc]');
    });

    test('should throw error for empty string', () => {
        expect(() => parseStringDescriptor('')).toThrow('Invalid string descriptor: ');
    });

    test('should throw error for malformed descriptor', () => {
        expect(() => parseStringDescriptor('utf8[10')).toThrow('Invalid string descriptor: utf8[10');
        expect(() => parseStringDescriptor('utf8]10[')).toThrow('Invalid string descriptor: utf8]10[');
    });
});

describe('readSingleString', () => {
    describe('when reading length-prefixed strings', () => {
        test('should correctly read a UTF-8 string with length prefix', () => {
            const buffer = Buffer.alloc(7);
            buffer.writeUInt16LE(5, 0);
            buffer.write('Hello', 2);

            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 2,         // Size of the length prefix (UInt16LE = 2 bytes)
                    lengthType: 'UInt16LE',
                    kind: 'string'
                },
                offset: 0
            };

            const result = readSingleString.call(context);

            expect(result).toBe('Hello');
            expect(context.offset).toBe(5); // Offset should increase by string length
        });

        test('should correctly read an ASCII string with length prefix', () => {
            const buffer = Buffer.alloc(9);
            buffer.writeUInt16LE(7, 0); // Length prefix: 7 characters
            buffer.write('Testing', 2);  // String data starts at position 2

            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'ascii',
                    size: 2,
                    lengthType: 'UInt16LE',
                    kind: 'string'
                },
                offset: 0
            };

            const result = readSingleString.call(context);

            expect(result).toBe('Testing');
            expect(context.offset).toBe(7);
        });

        test('should correctly apply the arrayOffset parameter', () => {
            const buffer = Buffer.alloc(15);

            // First string: "Hello" with length 5
            buffer.writeUInt16LE(5, 0);
            buffer.write('Hello', 2);

            // Second string: "World" with length 5
            buffer.writeUInt16LE(5, 7);  // Position 7 = 2 (first length) + 5 (first string)
            buffer.write('World', 9);

            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 2,
                    lengthType: 'UInt16LE',
                    kind: 'string'
                },
                offset: 0
            };

            // Read the first string (no offset)
            const result1 = readSingleString.call(context, 0);
            expect(result1).toBe('Hello');

            // Read the second string (with offset)
            context.offset = 0; // Reset offset for testing
            const result2 = readSingleString.call(context, 7);
            expect(result2).toBe('World');
        });
    });

    describe('when reading null-terminated strings', () => {
        test('should correctly read a null-terminated string', () => {
            const buffer = Buffer.from('Hello\0World', 'utf8');

            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 0,
                    nullTerminated: true,
                    kind: 'string'
                },
                offset: 0
            };

            const result = readSingleString.call(context);

            expect(result).toBe('Hello');
            expect(context.offset).toBe(6); // 5 chars + 1 null byte
        });

        test('should handle null-terminated string at a specific position', () => {
            const buffer = Buffer.alloc(20);
            buffer.write('XXXXX', 0); // First 5 bytes are not part of our string
            buffer.write('Test\0More', 5); // Null-terminated string starts at position 5

            const context = <any> {
                buffer,
                descriptor: <any> {
                    position: 5, // Start at position 5
                    type: 'ascii',
                    size: 0,
                    nullTerminated: true,
                    kind: 'string'
                },
                offset: 0
            };

            const result = readSingleString.call(context);

            expect(result).toBe('Test');
            expect(context.offset).toBe(5); // 4 chars + 1 null byte
        });
    });

    describe('when reading fixed-size strings', () => {
        test('should correctly read a fixed-size string', () => {
            const buffer = Buffer.from('HelloWorld', 'utf8');
            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 5, // Only read the first 5 bytes
                    kind: 'string'
                },
                offset: 0
            };

            const result = readSingleString.call(context);

            expect(result).toBe('Hello');
        });

        test('should correctly apply position and offset for fixed-size strings', () => {
            const buffer = Buffer.from('0123456789', 'ascii');
            const context = <any> {
                buffer,
                descriptor: {
                    position: 2, // Start at position 2
                    type: 'ascii',
                    size: 3, // Read 3 bytes
                    kind: 'string'
                },
                offset: 1 // Additional offset of 1
            };

            const result = readSingleString.call(context);
            expect(result).toBe('345');
        });
    });

    test('should throw when reading past buffer end', () => {
        // Create buffer that claims string length is 1000 but buffer is only 10 bytes
        const buffer = Buffer.alloc(10);
        buffer.writeUInt16LE(1000, 0); // Claim string is 1000 bytes long

        expect(() => {
            readSingleString.call({
                offset: 0,
                buffer: buffer,
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 2,
                    lengthType: 'UInt16LE',
                    kind: 'string'
                }
            });
        }).toThrow('String prefix length exceeds buffer position: 2 size: 1000 > 10');
    });
});

describe('readStringArray', () => {
    test('should read an array of length-prefixed strings', () => {
        const buffer = Buffer.alloc(21);

        // First string: "Hello" (length 5)
        buffer.writeUInt16LE(5, 0);
        buffer.write('Hello', 2);

        // Second string: "World" (length 5)
        buffer.writeUInt16LE(5, 7);
        buffer.write('World', 9);

        // Third string: "Test" (length 4)
        buffer.writeUInt16LE(4, 14);
        buffer.write('Test', 16);

        const context = <any> {
            buffer,
            descriptor: {
                position: 0,
                type: 'utf8',
                size: 2,
                arraySize: 3,
                lengthType: 'UInt16LE',
                kind: 'string'
            },
            offset: 0
        };

        const result = readStringArray.call(context);

        expect(result).toEqual([ 'Hello', 'World', 'Test' ]);
        expect(result.length).toBe(3);
    });

    test('should read an array of null-terminated strings', () => {
        // Create a buffer with null-terminated strings
        const buffer = Buffer.from('Hello\0World\0Test\0', 'ascii');

        const context = <any> {
            buffer,
            descriptor: {
                position: 0,
                type: 'ascii',
                size: 0,
                arraySize: 3,
                nullTerminated: true,
                kind: 'string'
            },
            offset: 0
        };

        const result = readStringArray.call(context);

        expect(result).toEqual([ 'Hello', 'World', 'Test' ]);
        expect(result.length).toBe(3);
    });

    test('should read an array of fixed-size strings', () => {
        // Create a buffer with fixed-size strings (4 bytes each)
        const buffer = Buffer.alloc(12);
        buffer.write('abcd', 0);
        buffer.write('efgh', 4);
        buffer.write('ijkl', 8);

        const context = <any> {
            buffer,
            descriptor: {
                position: 0,
                type: 'utf8',
                size: 4,
                arraySize: 3,
                kind: 'string'
            },
            offset: 0
        };

        const result = readStringArray.call(context);

        expect(result).toEqual([ 'abcd', 'efgh', 'ijkl' ]);
        expect(result.length).toBe(3);
    });

    test('should return an empty array when arraySize is 0', () => {
        const buffer = Buffer.from('Hello World', 'utf8');

        const context = <any> {
            buffer,
            descriptor: {
                position: 0,
                type: 'utf8',
                size: 5,
                arraySize: 0, // No elements in array
                kind: 'string'
            },
            offset: 0
        };

        const result = readStringArray.call(context);

        expect(result).toEqual([]);
        expect(result.length).toBe(0);
    });

    test('should handle mixed-length strings in an array', () => {
        // Create a buffer with three length-prefixed strings of different lengths
        const buffer = Buffer.alloc(20);

        // First string: "Hi" (length 2)
        buffer.writeUInt16LE(2, 0);
        buffer.write('Hi', 2);

        // Second string: "Hello" (length 5)
        buffer.writeUInt16LE(5, 4);
        buffer.write('Hello', 6);

        // Third string: "Testing" (length 7)
        buffer.writeUInt16LE(7, 11);
        buffer.write('Testing', 13);

        const context = <any> {
            buffer,
            descriptor: {
                position: 0,
                type: 'utf8',
                size: 2,
                arraySize: 3,
                lengthType: 'UInt16LE',
                kind: 'string'
            },
            offset: 0
        };

        const result = readStringArray.call(context);

        expect(result).toEqual([ 'Hi', 'Hello', 'Testing' ]);
        expect(result.length).toBe(3);
    });

    test('should apply position offset correctly', () => {
        // Create a buffer with a 4-byte header followed by string data
        const buffer = Buffer.alloc(20);

        // Write some header data (not used by our function)
        buffer.write('HEAD', 0);

        // First string: "ABC" (starts at position 4)
        buffer.writeUInt16LE(3, 4);
        buffer.write('ABC', 6);

        // Second string: "DEF" (positioned after first string)
        buffer.writeUInt16LE(3, 9);
        buffer.write('DEF', 11);

        const context = <any> {
            buffer,
            descriptor: {
                position: 4, // Start after the header
                type: 'ascii',
                size: 2, // Size of each entry: 2 bytes length + 4 bytes max content
                arraySize: 2,
                lengthType: 'UInt16LE',
                kind: 'string'
            },
            offset: 0
        };

        const result = readStringArray.call(context);

        expect(result).toEqual([ 'ABC', 'DEF' ]);
        expect(result.length).toBe(2);
    });
});

describe('readString', () => {
    describe('when reading a single string', () => {
        test('should read a length-prefixed single string', () => {
            // Create a buffer with a length-prefixed string
            const buffer = Buffer.alloc(10);
            buffer.writeUInt16LE(5, 0); // Length prefix: 5 characters
            buffer.write('Hello', 2);   // String data

            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 2,
                    lengthType: 'UInt16LE',
                    kind: 'string'
                },
                offset: 0
            };

            const result = readString.call(context);

            expect(result).toBe('Hello');
        });

        test('should read a null-terminated single string', () => {
            // Create a buffer with a null-terminated string
            const buffer = Buffer.from('Testing\0Data', 'ascii');

            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'ascii',
                    size: 0,
                    nullTerminated: true,
                    kind: 'string'
                },
                offset: 0
            };

            const result = readString.call(context);

            expect(result).toBe('Testing');
        });

        test('should read a fixed-size single string', () => {
            // Create a buffer with a fixed size string
            const buffer = Buffer.from('HelloWorld', 'utf8');

            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 5, // Only read 5 bytes
                    kind: 'string'
                },
                offset: 0
            };

            const result = readString.call(context);

            expect(result).toBe('Hello');
        });
    });

    describe('when reading an array of strings', () => {
        test('should read an array of length-prefixed strings', () => {
            // Create a buffer with two length-prefixed strings
            const buffer = Buffer.alloc(16);

            // First string: "Hello" (length 5)
            buffer.writeUInt16LE(5, 0);
            buffer.write('Hello', 2);

            // Second string: "World" (length 5)
            buffer.writeUInt16LE(5, 7);
            buffer.write('World', 9);

            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 2, // Size of each entry in the array
                    arraySize: 2, // Array has 2 elements
                    lengthType: 'UInt16LE',
                    kind: 'string'
                },
                offset: 0
            };

            const result = readString.call(context);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toEqual([ 'Hello', 'World' ]);
        });

        test('should read an array of null-terminated strings', () => {
            // Create a buffer with null-terminated strings
            const buffer = Buffer.from('One\0Two\0', 'ascii');

            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'ascii',
                    size: 0, // Each string element with null terminator
                    arraySize: 2, // Array has 2 elements
                    nullTerminated: true,
                    kind: 'string'
                },
                offset: 0
            };

            const result = readString.call(context);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toEqual([ 'One', 'Two' ]);
        });

        test('should read an array of fixed-size strings', () => {
            // Create a buffer with three fixed-size strings
            const buffer = Buffer.alloc(12);
            buffer.write('ABC', 0);
            buffer.write('DEF', 3);
            buffer.write('GHI', 6);

            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 3, // Each string is 4 bytes (including any padding)
                    arraySize: 3, // Array has 3 elements
                    kind: 'string'
                },
                offset: 0
            };

            const result = readString.call(context);

            expect(Array.isArray(result)).toBe(true);
            expect(result).toEqual([ 'ABC', 'DEF', 'GHI' ]);
        });

        test('should handle an array with arraySize of 0', () => {
            const buffer = Buffer.from('NotUsed', 'utf8');

            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 7,
                    arraySize: 0, // Zero elements
                    kind: 'string'
                },
                offset: 0
            };

            const result = readString.call(context);

            expect(Array.isArray(result)).not.toBe(true);
            expect(result).toEqual('NotUsed');
        });
    });

    test('should read a single string when arraySize is undefined', () => {
        // Create a buffer with a length-prefixed string
        const buffer = Buffer.alloc(10);
        buffer.writeUInt16LE(6, 0);
        buffer.write('Memory', 2);

        const context = <any> {
            buffer,
            descriptor: {
                position: 0,
                type: 'utf8',
                size: 2,
                // arraySize is intentionally undefined
                lengthType: 'UInt16LE',
                kind: 'string'
            },
            offset: 0
        };

        const result = readString.call(context);

        expect(typeof result).toBe('string');
        expect(result).toBe('Memory');
    });

    test('should read a single string when arraySize is explicitly nullish', () => {
        // Create a buffer with a null-terminated string
        const buffer = Buffer.from('Simple\0', 'ascii');

        const context = <any> {
            buffer,
            descriptor: {
                position: 0,
                type: 'ascii',
                size: 0,
                arraySize: null, // Explicitly null
                nullTerminated: true,
                kind: 'string'
            },
            offset: 0
        };

        const result = readString.call(context);

        expect(typeof result).toBe('string');
        expect(result).toBe('Simple');
    });
});

describe('writeSingleString', () => {
    describe('when writing length-prefixed string', () => {
        test('should write a string with UInt16LE length prefix', () => {
            const context = <any> {
                buffer: Buffer.alloc(20),
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 2, // Size of the length prefix
                    lengthType: 'UInt16LE',
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'Hello');

            // First 2 bytes should contain the length (5)
            expect(context.buffer.readUInt16LE(0)).toBe(5);
            // The string should follow
            expect(context.buffer.toString('utf8', 2, 7)).toBe('Hello');
        });

        test('should write a string with UInt32LE length prefix', () => {
            const context = <any> {
                buffer: Buffer.alloc(20),
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 4, // Size of the length prefix
                    lengthType: 'UInt32LE',
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'World');

            // First 4 bytes should contain the length (5)
            expect(context.buffer.readUInt32LE(0)).toBe(5);
            // The string should follow
            expect(context.buffer.toString('utf8', 4, 9)).toBe('World');
        });

        test('should update the offset correctly after writing', () => {
            const buffer = Buffer.alloc(20);
            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 2, // Size of the length prefix
                    lengthType: 'UInt16LE',
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'Test');

            // Offset should be increased by the string length
            expect(context.offset).toBe(4);
        });

        test('should respect the position in the descriptor', () => {
            const context = <any> {
                buffer: Buffer.alloc(20),
                descriptor: {
                    position: 5, // Start at position 5
                    type: 'utf8',
                    size: 2, // Size of the length prefix
                    lengthType: 'UInt16LE',
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'Data');

            // The length prefix should be at position 5
            expect(context.buffer.readUInt16LE(5)).toBe(4);
            // The string should follow at position 7
            expect(context.buffer.toString('utf8', 7, 11)).toBe('Data');
        });
    });

    describe('when writing null-terminated string', () => {
        test('should write a string with null termination', () => {
            const context = <any> {
                buffer: Buffer.alloc(20),
                descriptor: {
                    position: 0,
                    type: 'ascii',
                    size: 0, // No fixed size
                    nullTerminated: true,
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'ABC');

            // String should be null-terminated
            expect(context.buffer.toString('ascii', 0, 4)).toBe('ABC\0');
        });

        test('should not add a null terminator if the string already has one', () => {
            const context = <any> {
                buffer: Buffer.alloc(20),
                descriptor: {
                    position: 0,
                    type: 'ascii',
                    size: 0, // No fixed size
                    nullTerminated: true,
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'XYZ\0');

            // String should remain as is
            expect(context.buffer.toString('ascii', 0, 4)).toBe('XYZ\0');
        });

        test('should update the offset correctly for null-terminated strings', () => {
            const buffer = Buffer.alloc(20);
            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'ascii',
                    size: 0, // No fixed size
                    nullTerminated: true,
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'Test');

            // Offset should be increased by the string length
            expect(context.offset).toBe(5); // 'Test' length is 4, +1 for null
        });

        test('should respect a fixed size for null-terminated strings', () => {
            const context = <any> {
                buffer: Buffer.alloc(20),
                descriptor: {
                    position: 0,
                    type: 'ascii',
                    size: 10, // Fixed size of 10 bytes
                    nullTerminated: true,
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'Short');

            // String should be null-terminated and in the fixed size area
            expect(context.buffer.toString('ascii', 0, 6)).toBe('Short\0');
            // The rest of the fixed size should be untouched (zeros)
            expect(context.buffer.slice(6, 10).every((byte: number) => byte === 0)).toBe(true);
        });
    });

    describe('when writing fixed-size string', () => {
        test('should write a string in a fixed size area', () => {
            const buffer = Buffer.alloc(20);
            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 8, // Fixed size of 8 bytes
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'Fixed');

            // String should be written in the fixed size area
            expect(buffer.toString('utf8', 0, 5)).toBe('Fixed');
            // Size doesn't change offset since it's just writing in place
            expect(context.offset).toBe(0);
        });

        test('should truncate strings that exceed the fixed size', () => {
            const buffer = Buffer.alloc(20);
            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 3, // Fixed size of 3 bytes
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'LongString');

            // String should be truncated to the fixed size
            expect(buffer.toString('utf8', 0, 3)).toBe('Lon');
        });
    });

    describe('when using arrayOffset parameter', () => {
        test('should write a string at the specified array offset for length-prefixed', () => {
            const context = <any> {
                buffer: Buffer.alloc(30),
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 2, // Size of the length prefix
                    lengthType: 'UInt16LE',
                    kind: 'string'
                },
                offset: 0
            };

            // First string at position 0
            writeSingleString.call(context, 'First');

            // Reset offset for the test
            context.offset = 0;

            // Second string at position 10
            writeSingleString.call(context, 'Second', 10);

            // First string length at position 0
            expect(context.buffer.readUInt16LE(0)).toBe(5);
            expect(context.buffer.toString('utf8', 2, 7)).toBe('First');

            // Second string length at position 10
            expect(context.buffer.readUInt16LE(10)).toBe(6);
            expect(context.buffer.toString('utf8', 12, 18)).toBe('Second');
        });

        test('should write a string at the specified array offset for null-terminated', () => {
            const context = <any> {
                buffer: Buffer.alloc(20),
                descriptor: {
                    position: 0,
                    type: 'ascii',
                    size: 6, // Fixed slot size
                    nullTerminated: true,
                    kind: 'string'
                },
                offset: 0
            };

            // First string at position 0
            writeSingleString.call(context, 'One');

            // Reset offset for the test
            context.offset = 0;

            // Second string at position 6
            writeSingleString.call(context, 'Two', 6);

            // Check both strings
            expect(context.buffer.toString('ascii', 0, 4)).toBe('One\0');
            expect(context.buffer.toString('ascii', 6, 10)).toBe('Two\0');
        });

        test('should write a string at the specified array offset for fixed-size', () => {
            const buffer = Buffer.alloc(20);
            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 4, // Fixed size of 4 bytes per entry
                    kind: 'string'
                },
                offset: 0
            };

            // Write strings at different offsets
            writeSingleString.call(context, 'AAAA', 0);
            writeSingleString.call(context, 'BBBB', 4);
            writeSingleString.call(context, 'CCCC', 8);

            // Check all strings
            expect(buffer.toString('utf8', 0, 4)).toBe('AAAA');
            expect(buffer.toString('utf8', 4, 8)).toBe('BBBB');
            expect(buffer.toString('utf8', 8, 12)).toBe('CCCC');
            expect(context.offset).toBe(0); // Fixed size doesn't change offset
        });
    });

    describe('with different encodings', () => {
        test('should write strings with ascii encoding', () => {
            const buffer = Buffer.alloc(20);
            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'ascii',
                    size: 5,
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'ascii');

            expect(buffer.toString('ascii', 0, 5)).toBe('ascii');
        });

        test('should write strings with utf16le encoding', () => {
            const buffer = Buffer.alloc(20);
            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf16le',
                    size: 10, // 5 characters * 2 bytes
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'utf16');

            expect(buffer.toString('utf16le', 0, 10)).toBe('utf16');
        });

        test('should use utf8 when type is "string"', () => {
            const buffer = Buffer.alloc(20);
            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'string', // Should default to utf8
                    size: 6,
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'string');

            expect(buffer.toString('utf8', 0, 6)).toBe('string');
        });
    });

    describe('null-terminated strings handling', () => {
        test('should respect maxLength when writing null-terminated strings', () => {
            const context: any = {
                buffer: Buffer.alloc(10),
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    nullTerminated: true,
                    maxLength: 3,
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'Hello');

            // Should truncate to 'Hel' + null terminator
            expect(context.buffer.toString('utf8', 0, 3)).toBe('Hel');
            expect(context.buffer[3]).toBe(0); // Check for null terminator
            expect(context.offset).toBe(4); // 3 characters + 1 null byte
        });

        test('should throw error when string exceeds maxLength', () => {
            const context: any = {
                buffer: Buffer.from('This string is too long\x51'),
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 0,
                    nullTerminated: true,
                    maxLength: 5, // Set maxLength to 5 bytes
                    kind: 'string'
                },
                offset: 0
            };

            // Expect the function to throw an error since the string length (10) exceeds maxLength (5)
            expect(() => readSingleString.call(context))
                .toThrow('NullTerminated String exceeds maximum length of 5');
        });
    });
});

describe('writeStringArray', () => {
    describe('when writing length-prefixed string arrays', () => {
        test('should write an array of length-prefixed strings', () => {
            const context = <any> {
                buffer: Buffer.alloc(30),
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 2,
                    arraySize: 3,
                    lengthType: 'UInt16LE',
                    kind: 'string'
                },
                offset: 0
            };

            writeStringArray.call(context, [ 'One', 'Two', 'Three' ]);

            // Check the first string
            expect(context.buffer.readUInt16LE(0)).toBe(3); // Length of 'One'
            expect(context.buffer.toString('utf8', 2, 5)).toBe('One');

            // Check the second string
            expect(context.buffer.readUInt16LE(5)).toBe(3); // Length of 'Two'
            expect(context.buffer.toString('utf8', 7, 10)).toBe('Two');

            // Check the third string
            expect(context.buffer.readUInt16LE(10)).toBe(5); // Length of 'Three'
            expect(context.buffer.toString('utf8', 12, 17)).toBe('Three');
        });

        test('should update the offset correctly for length-prefixed strings', () => {
            const context = <any> {
                buffer: Buffer.alloc(30),
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 8, // Size of each entry including length prefix
                    arraySize: 2,
                    lengthType: 'UInt16LE',
                    kind: 'string'
                },
                offset: 0
            };

            writeStringArray.call(context, [ 'ABC', 'XYZ' ]);

            // Offset should be updated by the sum of string lengths
            // 'ABC' is 3 chars, 'XYZ' is 3 chars, total 6
            expect(context.offset).toBe(6);
        });
    });

    describe('when writing null-terminated string arrays', () => {
        test('should write an array of null-terminated strings', () => {
            const context = <any> {
                buffer: Buffer.alloc(30),
                descriptor: {
                    position: 0,
                    type: 'ascii',
                    size: 0,
                    arraySize: 3,
                    nullTerminated: true,
                    kind: 'string'
                },
                offset: 0
            };

            writeStringArray.call(context, [ 'Cat', 'Dog', 'Bird' ]);

            // Check all strings with null terminators
            expect(context.buffer.toString('ascii', 0, 4)).toBe('Cat\0');
            expect(context.buffer.toString('ascii', 4, 8)).toBe('Dog\0');
            expect(context.buffer.toString('ascii', 8, 13)).toBe('Bird\0');
        });

        test('should update the offset correctly for null-terminated strings', () => {
            const buffer = Buffer.alloc(30);
            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'ascii',
                    size: 0, // Size of each entry
                    arraySize: 2,
                    nullTerminated: true,
                    kind: 'string'
                },
                offset: 0
            };

            writeStringArray.call(context, [ 'A', 'BC' ]);

            // Offset should be updated by the sum of string lengths minus number of strings
            // 'A\0' is 2 chars, 'BC\0' is 3 chars
            expect(context.offset).toBe(5);
        });
    });

    describe('when writing fixed-size string arrays', () => {
        test('should write an array of fixed-size strings', () => {
            const buffer = Buffer.alloc(30);
            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 4, // Fixed size of 4 bytes per string
                    arraySize: 3,
                    kind: 'string'
                },
                offset: 0
            };

            writeStringArray.call(context, [ 'AAAA', 'BBBB', 'CCCC' ]);

            // Check all strings
            expect(buffer.toString('utf8', 0, 4)).toBe('AAAA');
            expect(buffer.toString('utf8', 4, 8)).toBe('BBBB');
            expect(buffer.toString('utf8', 8, 12)).toBe('CCCC');
        });

        test('should truncate strings that exceed fixed size', () => {
            const buffer = Buffer.alloc(30);
            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 3, // Fixed size of 3 bytes per string
                    arraySize: 3,
                    kind: 'string'
                },
                offset: 0
            };

            writeStringArray.call(context, [ 'AAAA', 'BBBB', 'CCCC' ]);

            // Check all strings are truncated
            expect(buffer.toString('utf8', 0, 3)).toBe('AAA');
            expect(buffer.toString('utf8', 3, 6)).toBe('BBB');
            expect(buffer.toString('utf8', 6, 9)).toBe('CCC');
        });
    });

    describe('when handling special cases', () => {
        test('should handle input arrays smaller than arraySize', () => {
            const context = <any> {
                buffer: Buffer.alloc(30),
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 4, // Size of each entry
                    arraySize: 4, // We want 4 entries
                    kind: 'string'
                },
                offset: 0
            };

            // Only provide 2 entries
            writeStringArray.call(context, [ 'Test', 'Data' ]);

            // First two slots should have our data
            expect(context.buffer.toString('utf8', 0, 4)).toBe('Test');
            expect(context.buffer.toString('utf8', 4, 8)).toBe('Data');

            // The next two slots should be empty strings
            expect(context.buffer.toString('utf8', 8, 12).trim()).toBe('\0\0\0\0');
            expect(context.buffer.toString('utf8', 12, 16).trim()).toBe('\0\0\0\0');
        });

        test('should handle input arrays larger than arraySize by truncating', () => {
            const context = <any> {
                buffer: Buffer.alloc(30),
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 2, // Size of each entry
                    arraySize: 2, // We only want 2 entries
                    lengthType: 'UInt16LE',
                    kind: 'string'
                },
                offset: 0
            };

            // Provide 3 entries, but only 2 should be written
            writeStringArray.call(context, [ 'First', 'Second', 'Third' ]);

            // Check that only the first two were written
            expect(context.buffer.readUInt16LE(0)).toBe(5); // Length of 'First'
            expect(context.buffer.toString('utf8', 2, 7)).toBe('First');

            expect(context.buffer.readUInt16LE(7)).toBe(6); // Length of 'Second'
            expect(context.buffer.toString('utf8', 9, 15)).toBe('Second');

            // The third string should not be present
            // Looking at where it would start, we should see zeros/empty
            expect(context.buffer.readUInt16LE(16)).toBe(0);
        });

        test('should handle empty arrays', () => {
            const context = <any> {
                buffer: Buffer.alloc(20),
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 5,
                    arraySize: 3,
                    kind: 'string'
                },
                offset: 0
            };

            writeStringArray.call(context, []);

            // All elements should be empty strings
            for (let i = 0; i < 3; i++) {
                const pos = i * 5;
                expect(context.buffer.toString('utf8', pos, pos + 5).trim()).toBe('\0\0\0\0\0');
            }
        });

        test('should respect the position in the descriptor', () => {
            const context = <any> {
                buffer: Buffer.alloc(40),
                descriptor: {
                    position: 5, // Start at position 5
                    type: 'utf8',
                    size: 2,
                    arraySize: 2,
                    lengthType: 'UInt16LE',
                    kind: 'string'
                },
                offset: 0
            };

            writeStringArray.call(context, [ 'Pos1', 'Pos2' ]);

            // First string should start at position 5
            expect(context.buffer.readUInt16LE(5)).toBe(4); // Length of 'Pos1'
            expect(context.buffer.toString('utf8', 7, 11)).toBe('Pos1');

            expect(context.buffer.readUInt16LE(11)).toBe(4); // Length of 'Pos2'
            expect(context.buffer.toString('utf8', 13, 17)).toBe('Pos2');
        });
    });

    describe('with different encodings', () => {
        test('should write strings with ascii encoding', () => {
            const context = <any> {
                buffer: Buffer.alloc(30),
                descriptor: {
                    position: 0,
                    type: 'ascii',
                    size: 5, // Size of each entry
                    arraySize: 2,
                    kind: 'string'
                },
                offset: 0
            };

            writeStringArray.call(context, [ 'abc', 'def' ]);

            expect(context.buffer.toString('ascii', 0, 3)).toBe('abc');
            expect(context.buffer.toString('ascii', 5, 8)).toBe('def');
        });

        test('should write strings with utf16le encoding', () => {
            const buffer = Buffer.alloc(40);
            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf16le',
                    size: 10, // 5 chars * 2 bytes each
                    arraySize: 2,
                    kind: 'string'
                },
                offset: 0
            };

            writeStringArray.call(context, [ 'utf', '16le' ]);

            expect(buffer.toString('utf16le', 0, 6)).toBe('utf');
            expect(buffer.toString('utf16le', 10, 18)).toBe('16le');
        });
    });
});

describe('writeString', () => {
    describe('when descriptor has arraySize property', () => {
        test('should call writeStringArray with a string value converted to an array', () => {
            const context = <any> {
                buffer: Buffer.alloc(30),
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 10,
                    arraySize: 2,
                    kind: 'string'
                },
                offset: 0
            };

            // Pass a single string, should be wrapped in an array
            writeString.call(context, 'SingleValue');

            // Check that the string was written to the first position
            expect(context.buffer.toString('utf8', 0, 10)).toBe('SingleValu');
            // Second element should be empty
            expect(context.buffer.toString('utf8', 10, 20).trim()).toBe('\0'.repeat(10));
        });

        test('should call writeStringArray with an array of strings', () => {
            const buffer = Buffer.alloc(30);
            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 8,
                    arraySize: 3,
                    kind: 'string'
                },
                offset: 0
            };

            // Pass an array of strings
            writeString.call(context, [ 'One', 'Two', 'Three' ]);

            // Check that all strings were written
            expect(buffer.toString('utf8', 0, 3)).toBe('One');
            expect(buffer.toString('utf8', 8, 11)).toBe('Two');
            expect(buffer.toString('utf8', 16, 21)).toBe('Three');
        });

        test('should handle length-prefixed string arrays', () => {
            const context = <any> {
                buffer: Buffer.alloc(30),
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 2,
                    arraySize: 2,
                    lengthType: 'UInt16LE',
                    kind: 'string'
                },
                offset: 0
            };

            writeString.call(context, [ 'Short', 'Long string' ]);

            // First string
            expect(context.buffer.readUInt16LE(0)).toBe(5); // Length of 'Short'
            expect(context.buffer.toString('utf8', 2, 7)).toBe('Short');

            // Second string
            expect(context.buffer.readUInt16LE(7)).toBe(11); // Length of 'Long string'
            expect(context.buffer.toString('utf8', 9, 20)).toBe('Long string');
        });

        test('should handle null-terminated string arrays', () => {
            const context = <any> {
                buffer: Buffer.alloc(30),
                descriptor: {
                    position: 0,
                    type: 'ascii',
                    size: 0,
                    arraySize: 2,
                    nullTerminated: true,
                    kind: 'string'
                },
                offset: 0
            };

            writeString.call(context, [ 'Cat', 'Dog' ]);

            // Check strings with null terminators
            expect(context.buffer.toString('ascii', 0, 4)).toBe('Cat\0');
            expect(context.buffer.toString('ascii', 4, 8)).toBe('Dog\0');
        });
    });

    describe('when descriptor does not have arraySize property', () => {
        test('should call writeSingleString with a string value', () => {
            const context = <any> {
                buffer: Buffer.alloc(20),
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 10,
                    kind: 'string'
                },
                offset: 0
            };

            writeString.call(context, 'SingleString');

            // Check that the string was written
            expect(context.buffer.toString('utf8', 0, 10)).toBe('SingleStri');
        });

        test('should call writeSingleString with the first element of an array', () => {
            const context = <any> {
                buffer: Buffer.alloc(20),
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 8,
                    kind: 'string'
                },
                offset: 0
            };

            // Pass an array, but only the first element should be used
            writeString.call(context, [ 'FirstItem', 'SecondItem', 'ThirdItem' ]);

            // Only the first string should be written
            expect(context.buffer.toString('utf8', 0, 8)).toBe('FirstIte');
            // Rest of buffer should be empty or unchanged
            expect(context.buffer.toString('utf8', 8, 16).trim()).toBe('\0'.repeat(8));
        });

        test('should use empty string if array is empty', () => {
            const buffer = Buffer.alloc(20);
            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 8,
                    kind: 'string'
                },
                offset: 0
            };

            // Pass an empty array
            writeString.call(context, []);

            // Should write an empty string
            expect(buffer.toString('utf8', 0, 8).trim()).toBe('\0'.repeat(8));
        });

        test('should handle length-prefixed single string', () => {
            const context = <any> {
                buffer: Buffer.alloc(20),
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 2,
                    lengthType: 'UInt16LE',
                    kind: 'string'
                },
                offset: 0
            };

            writeString.call(context, 'Dynamic');

            // Check length prefix and string
            expect(context.buffer.readUInt16LE(0)).toBe(7); // Length of 'Dynamic'
            expect(context.buffer.toString('utf8', 2, 9)).toBe('Dynamic');
        });

        test('should handle null-terminated single string', () => {
            const context = <any> {
                buffer: Buffer.alloc(20),
                descriptor: {
                    position: 0,
                    type: 'ascii',
                    size: 0,
                    nullTerminated: true,
                    kind: 'string'
                },
                offset: 0
            };

            writeString.call(context, 'Terminated');

            // Check string with null terminator
            expect(context.buffer.toString('ascii', 0, 11)).toBe('Terminated\0');
        });
    });

    describe('handling different value types', () => {
        test('should handle undefined value by using empty string', () => {
            const context = <any> {
                buffer: Buffer.alloc(20),
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 10,
                    kind: 'string'
                },
                offset: 0
            };

            // @ts-expect-error - Testing runtime behavior with undefined
            writeString.call(context, undefined);

            // Should have written an empty string
            expect(context.buffer.toString('utf8', 0, 10).trim()).toBe('\0'.repeat(10));
        });

        test('should handle null value by using empty string', () => {
            const context = <any> {
                buffer: Buffer.alloc(20),
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 10,
                    kind: 'string'
                },
                offset: 0
            };

            // @ts-expect-error - Testing runtime behavior with null
            writeString.call(context, null);

            // Should have written an empty string
            expect(context.buffer.toString('utf8', 0, 10).trim()).toBe('\0'.repeat(10));
        });
    });

    describe('with respect to position and offset', () => {
        test('should respect the position in the descriptor for single string', () => {
            const buffer = Buffer.alloc(30);
            const context = <any> {
                buffer,
                descriptor: {
                    position: 5, // Start at position 5
                    type: 'utf8',
                    size: 10,
                    kind: 'string'
                },
                offset: 0
            };

            writeString.call(context, 'Positioned');

            // String should start at position 5
            expect(buffer.toString('utf8', 5, 15)).toBe('Positioned');
        });

        test('should respect the position in the descriptor for string array', () => {
            const buffer = Buffer.alloc(40);
            const context = <any> {
                buffer,
                descriptor: {
                    position: 5, // Start at position 5
                    type: 'utf8',
                    size: 8,
                    arraySize: 2,
                    kind: 'string'
                },
                offset: 0
            };

            writeString.call(context, [ 'First', 'Second' ]);

            // First string should start at position 5
            expect(buffer.toString('utf8', 5, 10)).toBe('First');
            // Second string should start at position 5 + 8 = 13
            expect(buffer.toString('utf8', 13, 19)).toBe('Second');
        });

        test('should update offset correctly for variable-length strings', () => {
            const buffer = Buffer.alloc(30);
            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf8',
                    size: 2, // Size of the length prefix
                    lengthType: 'UInt16LE',
                    kind: 'string'
                },
                offset: 0
            };

            writeString.call(context, 'OffsetTest');

            // Offset should be increased by the string length
            expect(context.offset).toBe(10); // Length of 'OffsetTest'
        });
    });

    describe('with different encodings', () => {
        test('should handle utf16le encoding for single strings', () => {
            const buffer = Buffer.alloc(20);
            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf16le',
                    size: 12, // 6 chars * 2 bytes
                    kind: 'string'
                },
                offset: 0
            };

            writeString.call(context, 'UTF16');

            expect(buffer.toString('utf16le', 0, 10)).toBe('UTF16');
        });

        test('should handle utf16le encoding for string arrays', () => {
            const buffer = Buffer.alloc(40);
            const context = <any> {
                buffer,
                descriptor: {
                    position: 0,
                    type: 'utf16le',
                    size: 12, // 6 chars * 2 bytes per entry
                    arraySize: 2,
                    kind: 'string'
                },
                offset: 0
            };

            writeString.call(context, [ 'A', 'B' ]);

            expect(buffer.toString('utf16le', 0, 2)).toBe('A');
            expect(buffer.toString('utf16le', 12, 14)).toBe('B');
        });
    });
});
