
/**
 * Import will remove at compile time
 */

import type { StringContextInterface } from '@components/interfaces/string-component.interface';

/**
 * Imports
 */

import { readStringArray, writeStringArray, readSingleString } from '@components/string.component';
import {  writeSingleString, parseStringDescriptor, STRING_PRIMITIVE_LIST } from '@components/string.component';

/**
 * Tests
 */

describe('parseStringDescriptor', () => {
    describe('dynamic length-prefixed strings', () => {
        test('should parse simple string type without length or array size', () => {
            const result = parseStringDescriptor('utf8', 0);

            expect(result).toEqual({
                type: 'utf8',
                lengthType: 'UInt16LE',
                arraySize: undefined,
                position: 0,
                size: 2,
                kind: 'string'
            });
        });

        test('should parse ascii type', () => {
            const result = parseStringDescriptor('ascii', 10);

            expect(result).toEqual({
                type: 'ascii',
                lengthType: 'UInt16LE',
                arraySize: undefined,
                position: 10,
                size: 2,
                kind: 'string'
            });
        });

        test('should parse string type', () => {
            const result = parseStringDescriptor('string', 5);

            expect(result).toEqual({
                type: 'string',
                lengthType: 'UInt16LE',
                arraySize: undefined,
                position: 5,
                size: 2,
                kind: 'string'
            });
        });
    });

    describe('fixed-length strings', () => {
        test('should parse fixed-length string with parentheses notation', () => {
            const result = parseStringDescriptor('utf8(20)', 0);

            expect(result).toEqual({
                type: 'utf8',
                arraySize: undefined,
                position: 0,
                size: 20,
                kind: 'string'
            });
        });

        test('should parse fixed-length ascii string', () => {
            const result = parseStringDescriptor('ascii(50)', 100);

            expect(result).toEqual({
                type: 'ascii',
                arraySize: undefined,
                position: 100,
                size: 50,
                kind: 'string'
            });
        });

        test('should parse fixed-length string with size 1', () => {
            const result = parseStringDescriptor('string(1)', 0);

            expect(result).toEqual({
                type: 'string',
                arraySize: undefined,
                position: 0,
                size: 1,
                kind: 'string'
            });
        });

        test('should parse fixed-length string with large size', () => {
            const result = parseStringDescriptor('utf8(1024)', 0);

            expect(result).toEqual({
                type: 'utf8',
                arraySize: undefined,
                position: 0,
                size: 1024,
                kind: 'string'
            });
        });
    });

    describe('dynamic string arrays', () => {
        test('should parse array of dynamic strings', () => {
            const result = parseStringDescriptor('utf8[10]', 24);

            expect(result).toEqual({
                type: 'utf8',
                lengthType: 'UInt16LE',
                arraySize: 10,
                position: 24,
                size: 2,
                kind: 'string'
            });
        });

        test('should parse array of dynamic ascii strings', () => {
            const result = parseStringDescriptor('ascii[5]', 0);

            expect(result).toEqual({
                type: 'ascii',
                lengthType: 'UInt16LE',
                arraySize: 5,
                position: 0,
                size: 2,
                kind: 'string'
            });
        });

        test('should parse array with size 1', () => {
            const result = parseStringDescriptor('string[1]', 50);

            expect(result).toEqual({
                type: 'string',
                lengthType: 'UInt16LE',
                arraySize: 1,
                position: 50,
                size: 2,
                kind: 'string'
            });
        });
    });

    describe('fixed-length string arrays', () => {
        test('should parse array of fixed-length strings', () => {
            const result = parseStringDescriptor('utf8(20)[10]', 100);

            expect(result).toEqual({
                type: 'utf8',
                arraySize: 10,
                position: 100,
                size: 20,
                kind: 'string'
            });
        });

        test('should parse array of fixed-length ascii strings', () => {
            const result = parseStringDescriptor('ascii(50)[5]', 0);

            expect(result).toEqual({
                type: 'ascii',
                arraySize: 5,
                position: 0,
                size: 50,
                kind: 'string'
            });
        });

        test('should parse small fixed-length string array', () => {
            const result = parseStringDescriptor('string(5)[3]', 200);

            expect(result).toEqual({
                type: 'string',
                arraySize: 3,
                position: 200,
                size: 5,
                kind: 'string'
            });
        });
    });

    describe('case insensitivity', () => {
        test('should parse uppercase string types', () => {
            const result = parseStringDescriptor('UTF8(10)', 0);

            expect(result.type).toBe('utf8');
            expect(result.size).toBe(10);
        });

        test('should parse mixed case string types', () => {
            const result = parseStringDescriptor('AsCiI[5]', 0);

            expect(result.type).toBe('ascii');
            expect(result.arraySize).toBe(5);
        });

        test('should parse STRING type', () => {
            const result = parseStringDescriptor('STRING(20)[3]', 0);

            expect(result.type).toBe('string');
            expect(result.size).toBe(20);
            expect(result.arraySize).toBe(3);
        });
    });

    describe('error cases', () => {
        test('should throw error for invalid string type', () => {
            expect(() => {
                parseStringDescriptor('invalid', 0);
            }).toThrow('Invalid string descriptor: invalid');
        });

        test('should throw error for invalid format', () => {
            expect(() => {
                parseStringDescriptor('utf8()', 0);
            }).toThrow('Invalid string descriptor: utf8()');
        });

        test('should throw error for invalid array syntax', () => {
            expect(() => {
                parseStringDescriptor('utf8[]', 0);
            }).toThrow('Invalid string descriptor: utf8[]');
        });

        test('should throw error for malformed fixed-length syntax', () => {
            expect(() => {
                parseStringDescriptor('utf8(abc)', 0);
            }).toThrow('Invalid string descriptor: utf8(abc)');
        });

        test('should throw error for malformed array syntax', () => {
            expect(() => {
                parseStringDescriptor('utf8[abc]', 0);
            }).toThrow('Invalid string descriptor: utf8[abc]');
        });
    });

    describe('edge cases', () => {
        test('should handle zero position', () => {
            const result = parseStringDescriptor('utf8(10)', 0);

            expect(result.position).toBe(0);
        });

        test('should handle default position parameter', () => {
            const result = parseStringDescriptor('utf8(10)');

            expect(result.position).toBe(0);
        });

        test('should handle large position values', () => {
            const result = parseStringDescriptor('utf8(10)', 999999);

            expect(result.position).toBe(999999);
        });

        test('should handle large fixed length values', () => {
            const result = parseStringDescriptor('utf8(65535)', 0);

            expect(result.size).toBe(65535);
        });

        test('should handle large array size values', () => {
            const result = parseStringDescriptor('utf8(10)[1000]', 0);

            expect(result.arraySize).toBe(1000);
        });
    });
});

describe('readSingleString with fixed-length strings', () => {
    describe('basic fixed-length string reading', () => {
        test('should read a fixed-length string that fills the entire size', () => {
            const buffer = Buffer.from('Hello', 'utf8');
            const context: StringContextInterface = {
                buffer,
                descriptor: {
                    type: 'utf8',
                    position: 0,
                    size: 5,
                    kind: 'string'
                },
                offset: 0
            };

            const result = readSingleString.call(context);

            expect(result).toBe('Hello');
        });

        test('should read a fixed-length string with padding', () => {
            const buffer = Buffer.alloc(10);
            buffer.write('Hi', 0, 'utf8');

            const context: StringContextInterface = {
                buffer,
                descriptor: {
                    type: 'utf8',
                    position: 0,
                    size: 10,
                    kind: 'string'
                },
                offset: 0
            };

            const result = readSingleString.call(context);

            expect(result).toBe('Hi\0\0\0\0\0\0\0\0');
        });

        test('should read a fixed-length ascii string', () => {
            const buffer = Buffer.from('ABCDE', 'ascii');
            const context: StringContextInterface = {
                buffer,
                descriptor: {
                    type: 'ascii',
                    position: 0,
                    size: 5,
                    kind: 'string'
                },
                offset: 0
            };

            const result = readSingleString.call(context);

            expect(result).toBe('ABCDE');
        });
    });

    describe('fixed-length strings with offset', () => {
        test('should read fixed-length string with buffer offset', () => {
            const buffer = Buffer.from('XXXXXHello', 'utf8');
            const context: StringContextInterface = {
                buffer,
                descriptor: {
                    type: 'utf8',
                    position: 5,
                    size: 5,
                    kind: 'string'
                },
                offset: 0
            };

            const result = readSingleString.call(context);

            expect(result).toBe('Hello');
        });

        test('should read fixed-length string with context offset', () => {
            const buffer = Buffer.from('Hello', 'utf8');
            const context: StringContextInterface = {
                buffer,
                descriptor: {
                    type: 'utf8',
                    position: 0,
                    size: 5,
                    kind: 'string'
                },
                offset: 0
            };

            const result = readSingleString.call(context);

            expect(result).toBe('Hello');
        });

        test('should read fixed-length string with array offset', () => {
            const buffer = Buffer.from('AAAAABBBBBCCCCCHello', 'utf8');
            const context: StringContextInterface = {
                buffer,
                descriptor: {
                    type: 'utf8',
                    position: 0,
                    size: 5,
                    kind: 'string'
                },
                offset: 0
            };

            const result = readSingleString.call(context, 15);

            expect(result).toBe('Hello');
        });
    });
});

describe('writeSingleString with fixed-length strings', () => {
    describe('basic fixed-length string writing', () => {
        test('should write a string that exactly fits the fixed size', () => {
            const buffer = Buffer.alloc(5);
            const context: StringContextInterface = {
                buffer,
                descriptor: {
                    type: 'utf8',
                    position: 0,
                    size: 5,
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'Hello');

            expect(buffer.toString('utf8')).toBe('Hello');
        });

        test('should truncate a string that exceeds the fixed size', () => {
            const buffer = Buffer.alloc(5);
            const context: StringContextInterface = {
                buffer,
                descriptor: {
                    type: 'utf8',
                    position: 0,
                    size: 5,
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'Hello World');

            expect(buffer.toString('utf8')).toBe('Hello');
        });

        test('should pad a string that is shorter than the fixed size', () => {
            const buffer = Buffer.alloc(10);
            const context: StringContextInterface = {
                buffer,
                descriptor: {
                    type: 'utf8',
                    position: 0,
                    size: 10,
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'Hi');

            expect(buffer.subarray(0, 2).toString('utf8')).toBe('Hi');
            expect(buffer.subarray(2).every(byte => byte === 0)).toBe(true);
        });
    });

    describe('fixed-length strings with different encodings', () => {
        test('should write fixed-length ascii string', () => {
            const buffer = Buffer.alloc(5);
            const context: StringContextInterface = {
                buffer,
                descriptor: {
                    type: 'ascii',
                    position: 0,
                    size: 5,
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'ABCDE');

            expect(buffer.toString('ascii')).toBe('ABCDE');
        });

        test('should write fixed-length string type (defaults to utf8)', () => {
            const buffer = Buffer.alloc(5);
            const context: StringContextInterface = {
                buffer,
                descriptor: {
                    type: 'string',
                    position: 0,
                    size: 5,
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'Test!');

            expect(buffer.toString('utf8')).toBe('Test!');
        });
    });

    describe('fixed-length strings with offsets', () => {
        test('should write fixed-length string with position offset', () => {
            const buffer = Buffer.alloc(10);
            const context: StringContextInterface = {
                buffer,
                descriptor: {
                    type: 'utf8',
                    position: 5,
                    size: 5,
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'Hello');

            expect(buffer.subarray(0, 5).every(byte => byte === 0)).toBe(true);
            expect(buffer.subarray(5, 10).toString('utf8')).toBe('Hello');
        });

        test('should write fixed-length string with array offset', () => {
            const buffer = Buffer.alloc(20);
            const context: StringContextInterface = {
                buffer,
                descriptor: {
                    type: 'utf8',
                    position: 0,
                    size: 5,
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'Test1', 0);
            writeSingleString.call(context, 'Test2', 5);
            writeSingleString.call(context, 'Test3', 10);

            expect(buffer.subarray(0, 5).toString('utf8')).toBe('Test1');
            expect(buffer.subarray(5, 10).toString('utf8')).toBe('Test2');
            expect(buffer.subarray(10, 15).toString('utf8')).toBe('Test3');
        });
    });

    describe('edge cases', () => {
        test('should handle empty string by filling with zeros', () => {
            const buffer = Buffer.alloc(5);
            const context: StringContextInterface = {
                buffer,
                descriptor: {
                    type: 'utf8',
                    position: 0,
                    size: 5,
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, '');

            expect(buffer.every(byte => byte === 0)).toBe(true);
        });

        test('should handle null or undefined by converting to empty string', () => {
            const buffer = Buffer.alloc(5);
            const context: StringContextInterface = {
                buffer,
                descriptor: {
                    type: 'utf8',
                    position: 0,
                    size: 5,
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, null as any);

            expect(buffer.every(byte => byte === 0)).toBe(true);
        });

        test('should handle size of 1', () => {
            const buffer = Buffer.alloc(1);
            const context: StringContextInterface = {
                buffer,
                descriptor: {
                    type: 'utf8',
                    position: 0,
                    size: 1,
                    kind: 'string'
                },
                offset: 0
            };

            writeSingleString.call(context, 'A');

            expect(buffer.toString('utf8')).toBe('A');
        });
    });
});

describe('readStringArray with fixed-length strings', () => {
    test('should read array of fixed-length strings', () => {
        const buffer = Buffer.from('HelloWorldTests', 'utf8');
        const context: StringContextInterface = {
            buffer,
            descriptor: {
                type: 'utf8',
                position: 0,
                size: 5,
                arraySize: 3,
                kind: 'string'
            },
            offset: 0
        };

        const result = readStringArray.call(context);

        expect(result).toEqual([ 'Hello', 'World', 'Tests' ]);
    });

    test('should read array of fixed-length strings with padding', () => {
        const buffer = Buffer.alloc(30);
        buffer.write('Hi', 0, 'utf8');
        buffer.write('Bye', 10, 'utf8');
        buffer.write('Ok', 20, 'utf8');

        const context: StringContextInterface = {
            buffer,
            descriptor: {
                type: 'utf8',
                position: 0,
                size: 10,
                arraySize: 3,
                kind: 'string'
            },
            offset: 0
        };

        const result = readStringArray.call(context);

        expect(result.length).toBe(3);
        expect(result[0].startsWith('Hi')).toBe(true);
        expect(result[1].startsWith('Bye')).toBe(true);
        expect(result[2].startsWith('Ok')).toBe(true);
    });
});

describe('writeStringArray with fixed-length strings', () => {
    test('should write array of fixed-length strings', () => {
        const buffer = Buffer.alloc(15);
        const context: StringContextInterface = {
            buffer,
            descriptor: {
                type: 'utf8',
                position: 0,
                size: 5,
                arraySize: 3,
                kind: 'string'
            },
            offset: 0
        };

        writeStringArray.call(context, [ 'Hello', 'World', 'Tests' ]);

        expect(buffer.subarray(0, 5).toString('utf8')).toBe('Hello');
        expect(buffer.subarray(5, 10).toString('utf8')).toBe('World');
        expect(buffer.subarray(10, 15).toString('utf8')).toBe('Tests');
    });

    test('should handle array with fewer elements than arraySize', () => {
        const buffer = Buffer.alloc(15);
        const context: StringContextInterface = {
            buffer,
            descriptor: {
                type: 'utf8',
                position: 0,
                size: 5,
                arraySize: 3,
                kind: 'string'
            },
            offset: 0
        };

        writeStringArray.call(context, [ 'Hi' ]);

        expect(buffer.subarray(0, 2).toString('utf8')).toBe('Hi');
        // Remaining bytes should be zeros
        expect(buffer.subarray(5).every(byte => byte === 0)).toBe(true);
    });

    test('should truncate strings that exceed fixed size in array', () => {
        const buffer = Buffer.alloc(15);
        const context: StringContextInterface = {
            buffer,
            descriptor: {
                type: 'utf8',
                position: 0,
                size: 5,
                arraySize: 3,
                kind: 'string'
            },
            offset: 0
        };

        writeStringArray.call(context, [ 'HelloWorld', 'Test', 'OK' ]);

        expect(buffer.subarray(0, 5).toString('utf8')).toBe('Hello');
        expect(buffer.subarray(5, 9).toString('utf8')).toBe('Test');
        expect(buffer.subarray(10, 12).toString('utf8')).toBe('OK');
    });
});

describe('STRING_PRIMITIVE_LIST', () => {
    test('should contain all valid string types', () => {
        expect(STRING_PRIMITIVE_LIST.has('utf8')).toBe(true);
        expect(STRING_PRIMITIVE_LIST.has('ascii')).toBe(true);
        expect(STRING_PRIMITIVE_LIST.has('string')).toBe(true);
    });

    test('should not contain invalid types', () => {
        expect(STRING_PRIMITIVE_LIST.has('utf16')).toBe(false);
        expect(STRING_PRIMITIVE_LIST.has('unicode')).toBe(false);
        expect(STRING_PRIMITIVE_LIST.has('binary')).toBe(false);
    });

    test('should have exactly 3 types', () => {
        expect(STRING_PRIMITIVE_LIST.size).toBe(3);
    });
});
