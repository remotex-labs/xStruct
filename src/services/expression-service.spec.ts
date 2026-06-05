/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { ExpressionType } from '@interfaces/expression.interface';
import type { StringDescriptorInterface } from '@interfaces/descriptor.interface';

/**
 * Imports
 */

import { DescriptorKind } from '@constants/descriptor.constant';
import { xStructExpressionError } from '@errors/expression.error';
import { ExpressionErrorCode } from '@constants/expression.constant';
import { buildPrimitive, parseExpression } from '@services/expression.service';
import { fail, is, consume, buildGroupedDescriptor } from '@services/expression.service';
import { scanIdentifier, scanInt, scanBracketedSize, buildString } from '@services/expression.service';

/**
 * Tests
 */

describe('fail', () => {
    test('throws xStructExpressionError with correct cursor data', () => {
        const cursor = { source: 'abc', index: 2 };

        expect(() =>
            fail(cursor, 'Some message', ExpressionErrorCode.Expected)
        ).toThrow(xStructExpressionError);
    });

    test('passes error code and arg correctly', () => {
        const cursor = { source: 'abc', index: 1 };

        try {
            fail(cursor, 'Some message u32le', ExpressionErrorCode.UnknownType);
        } catch (e) {
            const err = e as xStructExpressionError;

            expect(err.code).toBe(ExpressionErrorCode.UnknownType);
            expect(err.message).toContain('u32le');
            expect(err.source).toBe('abc');
            expect(err.position).toBe(1);
        }
    });
});

describe('is', () => {
    test('returns true when char matches code', () => {
        const cursor = { source: 'abc', index: 0 };
        const result = is(cursor, 'a'.charCodeAt(0));

        expect(result).toBe(true);
    });

    test('returns false when char does not match code', () => {
        const cursor = { source: 'abc', index: 0 };
        const result = is(cursor, 'b'.charCodeAt(0));

        expect(result).toBe(false);
    });

    test('respects cursor index position', () => {
        const cursor = { source: 'abc', index: 1 };
        const result = is(cursor, 'b'.charCodeAt(0));

        expect(result).toBe(true);
    });
});

describe('consume', () => {
    test('increments cursor index when char matches', () => {
        const cursor = { source: 'abc', index: 0 };
        consume(cursor, 'a'.charCodeAt(0));

        expect(cursor.index).toBe(1);
    });

    test('does not increment and throws when char does not match', () => {
        const cursor = { source: 'abc', index: 0 };

        expect(() =>
            consume(cursor, 'b'.charCodeAt(0))
        ).toThrow(xStructExpressionError);

        expect(cursor.index).toBe(0);
    });

    test('passes expected character to fail', () => {
        const cursor = { source: 'abc', index: 0 };

        try {
            consume(cursor, 'z'.charCodeAt(0));
        } catch (e) {
            const err = e as xStructExpressionError;

            expect(err.code).toBe(ExpressionErrorCode.Expected);
            expect(err.message).toContain('z');
        }
    });
});

describe('scanIdentifier', () => {
    test('scans full identifier with letters and numbers', () => {
        const cursor = { source: 'abc123', index: 0 };

        const result = scanIdentifier(cursor);

        expect(result).toBe('abc123');
        expect(cursor.index).toBe(6);
    });

    test('stops at invalid character', () => {
        const cursor = { source: 'abc-123', index: 0 };

        const result = scanIdentifier(cursor);

        expect(result).toBe('abc');
        expect(cursor.index).toBe(3);
    });

    test('fails when no identifier found', () => {
        const cursor = { source: '-abc', index: 0 };

        expect(() => scanIdentifier(cursor)).toThrow(xStructExpressionError);

        expect(cursor.index).toBe(0);
    });

    test('fails at end of input when empty identifier', () => {
        const cursor = { source: '', index: 0 };

        expect(() => scanIdentifier(cursor)).toThrow(xStructExpressionError);
    });

    test('stops before array bracket', () => {
        const cursor = { source: 'u32le[8]', index: 0 };

        const result = scanIdentifier(cursor);

        expect(result).toBe('u32le');
        expect(cursor.index).toBe(5);
    });

    test('stops before parenthesis', () => {
        const cursor = { source: 'utf8(8)', index: 0 };

        const result = scanIdentifier(cursor);

        expect(result).toBe('utf8');
        expect(cursor.index).toBe(4);
    });

    test('stops before colon (bitfield)', () => {
        const cursor = { source: 'u8:4', index: 0 };

        const result = scanIdentifier(cursor);

        expect(result).toBe('u8');
        expect(cursor.index).toBe(2);
    });

    test('stops before double pointer', () => {
        const cursor = { source: 'u32le**', index: 0 };

        const result = scanIdentifier(cursor);

        expect(result).toBe('u32le');
        expect(cursor.index).toBe(5);
    });

    test('does not consume trailing structured syntax', () => {
        const cursor = { source: 'u16le[4][2]', index: 0 };

        const result = scanIdentifier(cursor);

        expect(result).toBe('u16le');
        expect(cursor.index).toBe(5);
    });
});

describe('scanInt', () => {
    test('scans integer value and advances cursor', () => {
        const cursor = { source: '123abc', index: 0 };
        const result = scanInt(cursor);

        expect(result).toBe(123);
        expect(cursor.index).toBe(3);
    });

    test('stops at non-digit character', () => {
        const cursor = { source: '42x99', index: 0 };
        const result = scanInt(cursor);

        expect(result).toBe(42);
        expect(cursor.index).toBe(2);
    });

    test('fails when no digits found', () => {
        const cursor = { source: 'abc', index: 0 };

        expect(() =>
            scanInt(cursor)
        ).toThrow(xStructExpressionError);

        expect(cursor.index).toBe(0);
    });

    test('fails when result is zero', () => {
        const cursor = { source: '0abc', index: 0 };

        expect(() =>
            scanInt(cursor)
        ).toThrow(xStructExpressionError);
    });

    test('fails when value is negative-equivalent (leading zeros only)', () => {
        const cursor = { source: '000', index: 0 };

        expect(() =>
            scanInt(cursor)
        ).toThrow(xStructExpressionError);
    });
});

describe('scanBracketedSize', () => {
    test('returns undefined when bracket is missing and not required', () => {
        const cursor = { source: 'abc', index: 0 };
        const result = scanBracketedSize(cursor, false);

        expect(result).toBeUndefined();
        expect(cursor.index).toBe(0);
    });

    test('fails when bracket is missing and required', () => {
        const cursor = { source: 'abc', index: 0 };

        expect(() =>
            scanBracketedSize(cursor, true)
        ).toThrow(xStructExpressionError);

        expect(cursor.index).toBe(0);
    });

    test('parses bracketed integer size', () => {
        const cursor = { source: '[12]', index: 0 };
        const result = scanBracketedSize(cursor, true);

        expect(result).toBe(12);
        expect(cursor.index).toBe(4);
    });

    test('parses bracketed size and stops correctly after consume', () => {
        const cursor = { source: '[7]x', index: 0 };
        const result = scanBracketedSize(cursor, true);

        expect(result).toBe(7);
        expect(cursor.index).toBe(3);
    });
});

describe('buildString', () => {
    test('requires size when pointers is 0', () => {
        const cursor = { source: '[8]', index: 0 };
        const result = buildString(cursor, 'utf8', 0);

        expect(result).toEqual({
            kind: DescriptorKind.String,
            type: 'utf8',
            shape: [ 8 ]
        });
    });

    test('sets shape to 0 when pointers > 0', () => {
        const cursor = { source: 'abc', index: 0 };
        const result = buildString(cursor, 'utf8', 1);

        expect(result.shape).toEqual([ 0 ]);
    });

    test('reads array size when pointers < 2', () => {
        const cursor = { source: '[8]', index: 0 };
        const result = buildString(cursor, 'utf8', 1);

        expect(result.shape).toEqual([ 8, 0 ]);
    });

    test('sets arraySize to 0 when pointers >= 2', () => {
        const cursor = { source: '[8]', index: 0 };
        const result = buildString(cursor, 'utf8', 2);
        expect(result.shape).toEqual([ 8, 0, 0 ]);
    });
});

describe('buildPrimitive', () => {
    test('parses bitfield when allowed', () => {
        const cursor = { source: ':8', index: 0 };
        const result = buildPrimitive(cursor, 'u32be', 0, true);

        expect(result).toEqual({
            kind: DescriptorKind.Bitfield,
            type: 'u32be',
            bitSize: 8
        });
    });

    test('fails bitfield when not allowed (float type)', () => {
        const cursor = { source: ':8', index: 0 };

        expect(() =>
            buildPrimitive(cursor, 'f32be', 0, false)
        ).toThrow(xStructExpressionError);
    });

    test('fails bitfield when pointers exist', () => {
        const cursor = { source: ':8', index: 0 };

        expect(() =>
            buildPrimitive(cursor, 'u32be', 1, true)
        ).toThrow(xStructExpressionError);
    });

    test('returns primitive with pointer and no array', () => {
        const cursor = { source: 'u32', index: 0 };

        const result = buildPrimitive(cursor, 'u32be', 1, true);

        expect(result).toEqual({
            kind: DescriptorKind.Primitive,
            type: 'u32be',
            shape: [ 0 ]
        });
    });

    test('parses primitive with array size', () => {
        const cursor = { source: '[4]', index: 0 };
        const result = buildPrimitive(cursor, 'u32be', 2, true);

        expect(result).toEqual({
            kind: DescriptorKind.Primitive,
            type: 'u32be',
            shape: [ 4, 0, 0 ]
        });
    });

    test('parses primitive with no array size', () => {
        const cursor = { source: 'u32', index: 0 };
        const result = buildPrimitive(cursor, 'u32le', 0, true);

        expect(result.kind).toBe(DescriptorKind.Primitive);
        expect(result.type).toBe('u32le');
    });
});

describe('buildParenString', () => {
    test('fails when pointers is not 1', () => {
        const cursor = { source: '(utf8[8])', index: 1 } as any;

        expect(() =>
            buildGroupedDescriptor(cursor, 0)
        ).toThrow(xStructExpressionError);
    });

    test('fails when identifier is unknow type', () => {
        const cursor = { source: '(unknow[8])', index: 1 } as any;

        expect(() =>
            buildGroupedDescriptor(cursor, 1)
        ).toThrow(xStructExpressionError);
    });

    test('parses paren string with size', () => {
        const cursor = { source: '(utf8[8])', index: 1 } as any;
        const result = buildGroupedDescriptor(cursor, 1);

        expect(result).toEqual({
            kind: DescriptorKind.String,
            type: 'utf8',
            shape: [ 0, 8 ]
        });
    });

    test('parses paren string with array size', () => {
        const cursor = { source: '(utf8[8])[4]', index: 1 } as any;
        const result = buildGroupedDescriptor(cursor, 1) as StringDescriptorInterface;

        expect(result.shape).toEqual([ 4, 0, 8 ]);
    });

    test('advances cursor past closing parenthesis', () => {
        const cursor = { source: '(utf8[8])', index: 1 } as any;
        buildGroupedDescriptor(cursor, 1);

        expect(cursor.index).toBe(9);
    });
});

describe('parseExpression - valid', () => {
    describe('PrimitiveExpressionType', () => {
        test.each(
            { input: 'u8', label: 'u8 scalar' },
            { input: 'i8', label: 'i8 scalar' },
            { input: 'u16le', label: 'u16le scalar' },
            { input: 'u16be', label: 'u16be scalar' },
            { input: 'i16le', label: 'i16le scalar' },
            { input: 'i16be', label: 'i16be scalar' },
            { input: 'u32le', label: 'u32le scalar' },
            { input: 'u32be', label: 'u32be scalar' },
            { input: 'i32le', label: 'i32le scalar' },
            { input: 'i32be', label: 'i32be scalar' },
            { input: 'u64le', label: 'u64le scalar' },
            { input: 'u64be', label: 'u64be scalar' },
            { input: 'i64le', label: 'i64le scalar' },
            { input: 'i64be', label: 'i64be scalar' },
            // Floats - bare
            { input: 'f32le', label: 'f32le scalar' },
            { input: 'f32be', label: 'f32be scalar' },
            { input: 'f64le', label: 'f64le scalar' },
            { input: 'f64be', label: 'f64be scalar' }
        )('$label → Primitive', ({ input }) => {
            const result = parseExpression(input as ExpressionType);
            expect(result.kind).toBe(DescriptorKind.Primitive);
            expect((result as any).arraySize).toBeUndefined();
        });

        test.each(
            { input: '*u8', label: '*u8' },
            { input: '*u32le', label: '*u32le' },
            { input: '*f32le', label: '*f32le' },
            { input: '*i64be', label: '*i64be' }
        )('$label → Primitive pointer', ({ input }) => {
            const result = parseExpression(input as ExpressionType) as StringDescriptorInterface;
            expect(result.kind).toBe(DescriptorKind.Primitive);
            expect(result.shape).toEqual([ 0 ]);
        });

        test.each(
            { input: 'u8[4]', size: 4, label: 'u8 array' },
            { input: 'u32le[8]', size: 8, label: 'u32le array' },
            { input: 'f64be[2]', size: 2, label: 'f64be array' },
            { input: 'i16le[1]', size: 1, label: 'i16le array single' }
        )('$label → Primitive array', ({ input, size }) => {
            const result = parseExpression(input as ExpressionType) as StringDescriptorInterface;
            expect(result.kind).toBe(DescriptorKind.Primitive);
            expect(result.shape).toEqual([ size ]);
        });
    });

    describe('BitFieldExpressionType', () => {
        test.each(
            { input: 'u8:4', bitSize: 4, label: 'u8 bitfield 4' },
            { input: 'u8:1', bitSize: 1, label: 'u8 bitfield min' },
            { input: 'u8:8', bitSize: 8, label: 'u8 bitfield max' },
            { input: 'u16le:12', bitSize: 12, label: 'u16le bitfield' },
            { input: 'i32be:31', bitSize: 31, label: 'i32be bitfield' },
            { input: 'u64le:63', bitSize: 63, label: 'u64le bitfield' }
        )('$label → Bitfield', ({ input, bitSize }) => {
            const result = parseExpression(input as ExpressionType);
            expect(result.kind).toBe(DescriptorKind.Bitfield);
            expect((result as any).bitSize).toBe(bitSize);
        });
    });

    describe('StringExpressionType', () => {
        test.each(
            { input: '*utf8', label: '*utf8 pointer' },
            { input: '*ascii', label: '*ascii pointer' },
            { input: '*latin1', label: '*latin1 pointer' },
            { input: '*utf16le', label: '*utf16le pointer' }
        )('$label → String pointer', ({ input }) => {
            const result = parseExpression(input as ExpressionType) as StringDescriptorInterface;
            expect(result.kind).toBe(DescriptorKind.String);
            expect(result.shape).toEqual([ 0 ]);
        });

        test.each(
            { input: '**utf8', label: '**utf8 double pointer' },
            { input: '**ascii', label: '**ascii double pointer' },
            { input: '**utf16le', label: '**utf16le double pointer' }
        )('$label → String double pointer', ({ input }) => {
            const result = parseExpression(input as ExpressionType) as StringDescriptorInterface;
            expect(result.kind).toBe(DescriptorKind.String);
            expect(result.shape).toEqual([ 0, 0 ]);
        });

        test.each(
            { input: 'utf8[32]', size: 32, label: 'utf8 fixed' },
            { input: 'ascii[16]', size: 16, label: 'ascii fixed' },
            { input: 'latin1[64]', size: 64, label: 'latin1 fixed' },
            { input: 'utf16le[8]', size: 8, label: 'utf16le fixed' }
        )('$label → String fixed', ({ input, size }) => {
            const result = parseExpression(input as ExpressionType) as StringDescriptorInterface;
            expect(result.kind).toBe(DescriptorKind.String);
            expect(result.shape).toEqual([ size ]);
        });

        test.each(
            { input: 'utf8[32][4]', size: 32, arraySize: 4, label: 'utf8 fixed array' },
            { input: 'ascii[16][8]', size: 16, arraySize: 8, label: 'ascii fixed array' },
            { input: 'utf16le[8][2]', size: 8, arraySize: 2, label: 'utf16le fixed array' }
        )('$label → String fixed array', ({ input, size, arraySize }) => {
            const result = parseExpression(input as ExpressionType) as StringDescriptorInterface;
            expect(result.kind).toBe(DescriptorKind.String);
            expect(result.shape).toEqual([ arraySize, size ]);
        });

        test.each(
            { input: '*utf8[4]', arraySize: 4, label: '*utf8 pointer array' },
            { input: '*ascii[8]', arraySize: 8, label: '*ascii pointer array' },
            { input: '*latin1[2]', arraySize: 2, label: '*latin1 pointer array' }
        )('$label → String pointer array', ({ input, arraySize }) => {
            const result = parseExpression(input as ExpressionType) as StringDescriptorInterface;
            expect(result.kind).toBe(DescriptorKind.String);
            expect(result.shape).toEqual([ arraySize, 0 ]);
        });

        test.each(
            { input: '*(utf8[32])', size: 32, label: '*(utf8[32]) grouped' },
            { input: '*(ascii[16])', size: 16, label: '*(ascii[16]) grouped' },
            { input: '*(utf16le[8])', size: 8, label: '*(utf16le[8]) grouped' }
        )('$label → String grouped pointer', ({ input, size }) => {
            const result = parseExpression(input as ExpressionType) as StringDescriptorInterface;
            expect(result.kind).toBe(DescriptorKind.String);
            expect(result.shape).toEqual([ 0, size ]);
        });

        test.each(
            { input: '*(utf8[32])[4]', size: 32, arraySize: 4, label: '*(utf8[32])[4] grouped array' },
            { input: '*(ascii[16])[2]', size: 16, arraySize: 2, label: '*(ascii[16])[2] grouped array' },
            { input: '*(utf16le[8])[8]', size: 8, arraySize: 8, label: '*(utf16le[8])[8] grouped array' }
        )('$label → String grouped pointer array', ({ input, size, arraySize }) => {
            const result = parseExpression(input as ExpressionType) as StringDescriptorInterface;
            expect(result.kind).toBe(DescriptorKind.String);
            expect(result.shape).toEqual([ arraySize, 0, size ]);
        });
    });
});

describe('parseExpression - invalid', () => {
    test.each(
        {
            label: 'empty string',
            input: '',
            code: ExpressionErrorCode.EmptyExpression
        },
        {
            label: 'whitespace only',
            input: '   ',
            code: ExpressionErrorCode.EmptyExpression
        },
        {
            label: 'unknown bare type',
            input: 'unknown',
            code: ExpressionErrorCode.UnknownType
        },
        {
            label: 'unknown type with pointer',
            input: '*unknown',
            code: ExpressionErrorCode.UnknownType
        },
        {
            label: 'trailing garbage after primitive',
            input: 'u32le!!',
            code: ExpressionErrorCode.UnexpectedTrailingInput
        },
        {
            label: 'trailing garbage after array',
            input: 'u32le[4]!!',
            code: ExpressionErrorCode.UnexpectedTrailingInput
        },
        {
            label: 'missing bracket after type in grouped string',
            input: '*(utf8)',
            code: ExpressionErrorCode.Expected
        },
        {
            label: 'bitfield on float',
            input: 'f32le:4',
            code: ExpressionErrorCode.BitfieldForbidsFloat
        },
        {
            label: 'bitfield with pointer',
            input: '*u8:4',
            code: ExpressionErrorCode.BitfieldForbidsPointer
        },
        {
            label: 'unclosed bracket',
            input: 'u32le[4',
            code: ExpressionErrorCode.Expected
        },
        {
            label: 'bracket with no size',
            input: 'u32le[]',
            code: ExpressionErrorCode.ExpectedInteger
        },
        {
            label: 'string without size bracket',
            input: 'utf8',
            code: ExpressionErrorCode.Expected
        },
        {
            label: 'missing closing paren in grouped string',
            input: '*(utf8[8]',
            code: ExpressionErrorCode.Expected
        }
    )('$label → $code', ({ input, code }) => {
        expect(() => parseExpression(input as ExpressionType)).toThrow(
            expect.objectContaining({
                name: xStructExpressionError.name,
                code
            })
        );
    });
});

describe('buildParenString', () => {
    test('fails when pointers is not 1', () => {
        const cursor = { source: '(utf8[8])', index: 1 } as any;

        expect(() =>
            buildGroupedDescriptor(cursor, 0)
        ).toThrow(xStructExpressionError);
    });

    test('parses paren string with size - arraySize defaults to 0 not undefined', () => {
        const cursor = { source: '(utf8[8])', index: 1 } as any;
        const result = buildGroupedDescriptor(cursor, 1);

        expect(result).toEqual({
            kind: DescriptorKind.String,
            type: 'utf8',
            shape: [ 0, 8 ]
        });
    });

    test('parses paren string with explicit array size', () => {
        const cursor = { source: '(utf8[8])[4]', index: 1 } as any;
        const result = buildGroupedDescriptor(cursor, 1);

        expect(result).toEqual({
            kind: DescriptorKind.String,
            type: 'utf8',
            shape: [ 4, 0, 8 ]
        });
    });

    test('parses ascii with size 2 - arraySize is 0', () => {
        const cursor = { source: '(ascii[2])', index: 1 } as any;
        const result = buildGroupedDescriptor(cursor, 1) as StringDescriptorInterface;

        expect(result.shape).toEqual([ 0, 2 ]);
    });

    test('advances cursor past closing parenthesis when no array', () => {
        const cursor = { source: '(utf8[8])', index: 1 } as any;
        buildGroupedDescriptor(cursor, 1);

        expect(cursor.index).toBe(9);
    });

    test('advances cursor past closing bracket when array present', () => {
        const cursor = { source: '(utf8[8])[4]', index: 1 } as any;
        buildGroupedDescriptor(cursor, 1);

        expect(cursor.index).toBe(12);
    });

    test('fails when closing paren is missing', () => {
        const cursor = { source: '(utf8[8]', index: 1 } as any;

        expect(() =>
            buildGroupedDescriptor(cursor, 1)
        ).toThrow(xStructExpressionError);
    });

    test('fails when size bracket is missing inside parens', () => {
        const cursor = { source: '(utf8)', index: 1 } as any;

        expect(() =>
            buildGroupedDescriptor(cursor, 1)
        ).toThrow(xStructExpressionError);
    });
});

describe('parseExpression - grouped pointer string', () => {
    test('*(utf8[32]) - arraySize is 0, not undefined', () => {
        const result = parseExpression('*(utf8[32])' as ExpressionType) as StringDescriptorInterface;

        expect(result.kind).toBe(DescriptorKind.String);
        expect(result.shape).toEqual([ 0, 32 ]);
    });

    test('*(ascii[16]) - arraySize is 0', () => {
        const result = parseExpression('*(ascii[16])' as ExpressionType) as StringDescriptorInterface;
        expect(result.shape).toEqual([ 0, 16 ]);
    });

    test('*(utf16le[8]) - arraySize is 0', () => {
        const result = parseExpression('*(utf16le[8])' as ExpressionType) as StringDescriptorInterface;
        expect(result.shape).toEqual([ 0, 8 ]);
    });

    test('*(ascii[2]) - the original bug case', () => {
        const result = parseExpression('*(ascii[2])' as ExpressionType) as StringDescriptorInterface;

        expect(result.kind).toBe(DescriptorKind.String);
        expect(result.shape).toEqual([ 0, 2 ]);
    });

    test('*(utf8[32])[4] - explicit array size preserved', () => {
        const result = parseExpression('*(utf8[32])[4]' as ExpressionType) as StringDescriptorInterface;
        expect(result.shape).toEqual([ 4, 0, 32 ]);
    });

    test('*(ascii[16])[2] - explicit array size preserved', () => {
        const result = parseExpression('*(ascii[16])[2]' as ExpressionType) as StringDescriptorInterface;
        expect(result.shape).toEqual([ 2, 0, 16 ]);
    });
});

describe('parseExpression - string pointer forms', () => {
    test('*utf8 scalar pointer - arraySize undefined (no bracket, non-paren form)', () => {
        const result = parseExpression('*utf8' as ExpressionType) as StringDescriptorInterface;

        expect(result.kind).toBe(DescriptorKind.String);
        expect(result.shape).toEqual([ 0 ]);
    });

    test('*utf8[4] - dynamic array of heap strings', () => {
        const result = parseExpression('*utf8[4]' as ExpressionType) as StringDescriptorInterface;
        expect(result.shape).toEqual([ 4, 0 ]);
    });

    test('**utf8 - double pointer, arraySize 0', () => {
        const result = parseExpression('**utf8' as ExpressionType) as StringDescriptorInterface;
        expect(result.shape).toEqual([ 0, 0 ]);
    });
});

describe('parseExpression - invalid grouped string', () => {
    test('(utf8[8]) without pointer - GroupedStringRequiresSinglePointer', () => {
        expect(() =>
            parseExpression('(utf8[8])' as ExpressionType)
        ).toThrow(expect.objectContaining({
            code: ExpressionErrorCode.GroupedStringRequiresSinglePointer
        }));
    });

    test('*(utf8) missing size inside parens - Expected', () => {
        expect(() =>
            parseExpression('*(utf8)' as ExpressionType)
        ).toThrow(expect.objectContaining({
            code: ExpressionErrorCode.Expected
        }));
    });

    test('*(utf8[8] missing closing paren - Expected', () => {
        expect(() =>
            parseExpression('*(utf8[8]' as ExpressionType)
        ).toThrow(expect.objectContaining({
            code: ExpressionErrorCode.Expected
        }));
    });
});
