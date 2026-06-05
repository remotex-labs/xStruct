/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { ExpressionType } from '@interfaces/expression.interface';
import type { StringPipeType } from '@pipes/interfaces/strings-pipe.interface';
import type { CursorType } from '@services/interfaces/expression-service.interface';
import type { BitfieldDescriptorInterface, DescriptorType } from '@interfaces/descriptor.interface';
import type { IntegerPipeType, PrimitivePipeType } from '@pipes/interfaces/primitive-pipe.interface';
import type { StringDescriptorInterface, PrimitiveDescriptorInterface } from '@interfaces/descriptor.interface';

/**
 * Imports
 */

import { isString } from '@pipes/strings.pipe';
import { isInteger, isFloat } from '@pipes/primitive.pipe';
import { DescriptorKind } from '@constants/descriptor.constant';
import { xStructExpressionError } from '@errors/expression.error';
import { CharCode, ExpressionErrorCode } from '@constants/expression.constant';

/**
 * Throws a structured expression parsing error.
 *
 * @param message - Error message describing the failure reason
 * @param cursor - Parser cursor containing source and position
 * @param code - Error code describing the failure reason
 *
 * @throws xStructExpressionError - Structured parsing error with cursor position and error code
 *
 * @remarks
 * Centralized error factory used by the expression parser.
 * Attaches source string and cursor index to the error for precise diagnostics.
 *
 * @example
 * ```ts
 * fail(cursor, 'Expected a type identifier', ExpressionErrorCode.ExpectedIdentifier);
 * ```
 *
 * @see xStructExpressionError
 * @since 3.0.0
 */

export function fail(cursor: CursorType, message: string, code: ExpressionErrorCode): never {
    throw new xStructExpressionError(message, cursor.source, cursor.index, code);
}

/**
 * Checks whether the current cursor character matches a specific character code.
 *
 * @param cursor - Parser cursor containing source and current index
 * @param code - Character code to compare against
 * @returns true - if the current character matches the given code
 *
 * @remarks
 * Performs a direct comparison using `charCodeAt` without advancing the cursor.
 * Used as a low-level primitive for expression parsing decisions.
 *
 * @example
 * ```ts
 * if (is(cursor, CharCode.Asterisk)) {
 *   // pointer detected
 * }
 * ```
 *
 * @since 3.0.0
 */

export function is(cursor: CursorType, code: CharCode): boolean {
    return cursor.source.charCodeAt(cursor.index) === code;
}

/**
 * Consumes an expected character from the input stream.
 *
 * @param cursor - Parser cursor containing a source and current index
 * @param code - Expected character code to consume
 *
 * @throws xStructExpressionError - When the current character does not match the expected code
 *
 * @remarks
 * Advances the cursor by one position if the expected character matches.
 * Otherwise, throws a structured parsing error via {@link fail}.
 * Used as a strict grammar enforcement primitive.
 *
 * @example
 * ```ts
 * consume (cursor, CharCode.RightBracket);
 * ```
 *
 * @see fail
 * @since 3.0.0
 */

export function consume(cursor: CursorType, code: CharCode): void {
    if (cursor.source.charCodeAt(cursor.index) !== code)
        fail(cursor, `Expected ${ String.fromCharCode(code) } got ${ cursor.source[cursor.index] }`, ExpressionErrorCode.Expected);
    cursor.index++;
}

/**
 * Scans an alphanumeric identifier from the input stream.
 *
 * @param cursor - Parser cursor containing a source and current index
 * @returns string - Extracted identifier string
 *
 * @throws xStructExpressionError - When no valid identifier is found at current position
 *
 * @remarks
 * Reads consecutive ASCII alphanumeric characters:
 * - A-Z
 * - a-z
 * - 0-9
 *
 * Stops at the first invalid character without consuming it.
 * Used for:
 * - Type identifiers
 * - Struct names
 * - Encoding identifiers
 *
 * @example
 * ```ts
 * scanIdentifier(cursor); // "u32le"
 * ```
 *
 * @since 3.0.0
 */

export function scanIdentifier(cursor: CursorType): string {
    const { source } = cursor;
    const start = cursor.index;

    while (cursor.index < source.length) {
        const c = source.charCodeAt(cursor.index);
        if (
            (c < CharCode.UpperA || c > CharCode.UpperZ) &&
            (c < CharCode.LowerA || c > CharCode.LowerZ) &&
            (c < CharCode.Zero || c > CharCode.Nine)
        ) break;
        cursor.index++;
    }

    if (cursor.index === start)
        fail(cursor, `Expected a type identifier, got ${ source[cursor.index] }`, ExpressionErrorCode.ExpectedIdentifier);

    return source.slice(start, cursor.index);
}

/**
 * Scans a positive integer from the input stream.
 *
 * @param cursor - Parser cursor containing source and current index
 * @returns Parsed integer value (`> 0`)
 *
 * @throws xStructExpressionError - When no digits are found or value is not positive
 *
 * @remarks
 * Reads a continuous sequence of ASCII digits and converts it into a number.
 * Constraints:
 * - Must contain at least one digit
 * - Must be strictly greater than 0
 * - Stops at the first non-digit character
 *
 * Used for:
 * - Array sizes
 * - Bitfield widths
 * - Fixed-size binary layout fields
 *
 * @example
 * ```ts
 * scanInt(cursor); // 32
 * ```
 *
 * @since 3.0.0
 */

export function scanInt(cursor: CursorType): number {
    const { source } = cursor;
    const start = cursor.index;
    let n = 0;

    while (cursor.index < source.length) {
        const c = source.charCodeAt(cursor.index);
        if (c < CharCode.Zero || c > CharCode.Nine) break;
        n = n * 10 + (c - CharCode.Zero);
        cursor.index++;
    }

    if (cursor.index === start)
        fail(cursor, `Expected an integer, got ${ source[cursor.index] }`,  ExpressionErrorCode.ExpectedInteger);

    if (n <= 0)
        fail(cursor, 'Size must be greater than 0', ExpressionErrorCode.SizeMustBePositive);

    return n;
}

/**
 * Scans an optional or required bracketed size expression.
 *
 * @param cursor - Parser cursor containing a source and current index
 * @param required - Whether the bracketed size is mandatory
 * @returns number - Parsed numeric size, or undefined when optional and not present
 *
 * @throws xStructExpressionError - When required bracket is missing or size is invalid
 *
 * @remarks
 * Parses expressions of the form `[number]`.
 *
 * Behavior:
 * - If `required` is true, absence of `[` triggers an error
 * - If optional, returns undefined when not present
 * - Validates positive integer size
 * - Consumes full-bracketed expression when present
 *
 * Used for:
 * - Array sizing
 * - Fixed-size fields
 * - Optional repetition modifiers
 *
 * @example
 * ```ts
 * scanBracketedSize(cursor, true); // 4
 * scanBracketedSize(cursor); // 4 | undefined
 * ```
 *
 * @since 3.0.0
 */

export function scanBracketedSize(cursor: CursorType, required: true): number;
export function scanBracketedSize(cursor: CursorType, required?: false): number | undefined;
export function scanBracketedSize(cursor: CursorType, required = false): number | undefined {
    if (!is(cursor, CharCode.LeftBracket)) {
        if (required) fail(cursor, ' Expected fix array "[N]"', ExpressionErrorCode.Expected);

        return undefined;
    }

    cursor.index++;
    const size = scanInt(cursor);
    consume(cursor, CharCode.RightBracket);

    return size;
}

/**
 * Builds a string descriptor from the parsed expression context.
 *
 * @param cursor - Parser cursor containing a source and current index
 * @param type - String encoding type (e.g., utf8, ascii)
 * @param pointers - Pointer depth applied to the string type
 * @returns {@link StringDescriptorInterface} - Constructed string descriptor object
 *
 * @throws xStructExpressionError - When required size is missing or invalid syntax is encountered
 *
 * @remarks
 * Constructs a structured string descriptor supporting fixed-size and array forms.
 * Pointer rules:
 * - `0 pointers`: requires a fixed `[size]`
 * - `1 pointer`: represents a pointer to a string (size = 0)
 * - `2 pointers`: pointer-to-pointer disables array sizing
 *
 * Supported forms:
 * - `utf8[32]`
 * - `utf8[32][4]`
 * - `*utf8`
 * - `*utf8[4]`
 *
 * Used for:
 * - Binary protocol string fields
 * - Fixed-size memory layout definitions
 * - Pointer-based string references
 *
 * @example
 * ```ts
 * buildString(cursor, "utf8", 0);
 * ```
 *
 * @see scanBracketedSize
 * @see StringDescriptorInterface
 *
 * @since 3.0.0
 */

export function buildString(cursor: CursorType, type: StringPipeType, pointers: number): StringDescriptorInterface {
    const size = pointers === 0 ? scanBracketedSize(cursor, true) : scanBracketedSize(cursor);
    const arraySize = pointers < 2 ? scanBracketedSize(cursor) : undefined;

    const shape: Array<number> = [];
    if (arraySize !== undefined) shape.push(arraySize);
    if (size !== undefined) shape.push(size);
    for (let i = 0; i < pointers; i++) shape.push(0);

    return { kind: DescriptorKind.String, type, shape };
}

/**
 * Builds a primitive or bitfield descriptor from the parsed expression context.
 *
 * @param cursor - Parser cursor containing a source and current index
 * @param type - Primitive type identifier (integer or float pipe type)
 * @param pointers - Pointer depth applied to the primitive type
 * @param allowBitfield - Whether bitfield syntax (`:n`) is allowed for this type
 * @returns {@link BitfieldDescriptorInterface} | {@link PrimitiveDescriptorInterface} - Constructed primitive or bitfield descriptor
 *
 * @throws xStructExpressionError - When pointer rules are violated or invalid syntax is used
 *
 * @remarks
 * Handles parsing of primitive numeric types, pointer forms, arrays, and bitfields.
 * Bitfield rules:
 * - Only allowed when `allowBitfield` is true (integer types only)
 * - Must use `:<bitSize>` suffix
 * - Requires `pointers === 0`
 *
 * Pointer rules:
 * - `*type` is allowed and produces a pointer primitive
 * - `**type` is forbidden
 * - Pointer and array combinations are restricted
 *
 * Supported forms:
 * - `u32le`
 * - `u32le[4]`
 * - `*u32le`
 * - `u32le:8`
 *
 * Used for:
 * - Binary protocol numeric fields
 * - Packed memory layouts
 * - Bitfield-encoded structures
 *
 * @example
 * ```ts
 * buildPrimitive(cursor, "u32le", 0, true);
 * ```
 * @see BitfieldDescriptorInterface
 * @see PrimitiveDescriptorInterface
 *
 * @since 3.0.0
 */

export function buildPrimitive(
    cursor: CursorType, type: PrimitivePipeType, pointers: number, allowBitfield: boolean
): BitfieldDescriptorInterface | PrimitiveDescriptorInterface {
    const shape: Array<number> = [];
    if (is(cursor, CharCode.Colon)) {
        if (!allowBitfield) fail(cursor, 'Bitfield ":" cannot be used with a float type', ExpressionErrorCode.BitfieldForbidsFloat);
        if (pointers !== 0) fail(cursor, 'Bitfield ":" cannot be used with a pointer type', ExpressionErrorCode.BitfieldForbidsPointer);
        cursor.index++;

        return { kind: DescriptorKind.Bitfield, type: type as IntegerPipeType, bitSize: scanInt(cursor) };
    }

    const size = scanBracketedSize(cursor);
    if(size) shape.push(size);
    if (pointers > 0) shape.push(...Array(pointers).fill(0));

    return { kind: DescriptorKind.Primitive, type, shape: shape };
}

/**
 * Builds a descriptor from a grouped type expression.
 *
 * @param cursor - Parser cursor positioned immediately after the opening parenthesis
 * @param pointers - Pointer depth applied to the grouped type
 * @returns {@link DescriptorType} Constructed descriptor representing the grouped type expression
 *
 * @remarks
 * Parses grouped type expressions of the form:
 * ```text
 * *(type[size])
 * **(type[size])
 * *(type[size])[arraySize]
 * ```
 *
 * Grouped expressions allow a fixed-size type declaration to be wrapped and
 * combined with pointer levels and an optional outer array dimension.
 *
 * The resulting descriptor shape is normalized using the following rules:
 * - Positive values represent fixed dimensions
 * - Outer array dimensions are stored first
 * - Pointer levels are stored from outermost to innermost
 * - The grouped size is stored as the innermost dimension
 *
 * Examples:
 * ```text
 * *(u32[4]) -> [0, 4]
 * **(u32[4]) -> [0, 0, 4]
 * ```
 *
 * @example
 * ```ts
 * buildGroupedDescriptor(cursor, 1);
 * ```
 *
 * @since 3.0.0
 */

export function buildGroupedDescriptor(cursor: CursorType, pointers: number): DescriptorType {
    if(pointers < 1) fail(cursor, 'Group requires pointer', ExpressionErrorCode.GroupedStringRequiresSinglePointer);

    const ident = scanIdentifier(cursor) as StringPipeType;
    const kind = isString(ident) ? DescriptorKind.String : DescriptorKind.Primitive;

    if(!isString(ident) && !isInteger(ident) && !isFloat(ident))
        fail(cursor, `Unknown group ${ ident }`, ExpressionErrorCode.UnknownType);

    const size = scanBracketedSize(cursor, true);
    consume(cursor, CharCode.RightParenthesis);

    const arraySize = scanBracketedSize(cursor);
    const shape: Array<number> = [];
    if (arraySize !== undefined) shape.push(arraySize);
    shape.push(...Array(pointers).fill(0));
    shape.push(size);

    return { kind: kind, type: ident, shape } as DescriptorType;
}

/**
 * Parses a full expression string into a structured descriptor.
 *
 * @param input - Expression string to parse (e.g. `*u32le[4]`)
 * @returns {@link DescriptorType} - Parsed descriptor representing primitive, string, bitfield, or struct type
 *
 * @throws xStructExpressionError - When the expression is empty, malformed, or contains invalid syntax
 *
 * @remarks
 * Entry point of the expression parser. Converts a textual type expression
 * into a strongly typed descriptor AST used for binary layout definition.
 *
 * Parsing stages:
 * - Reads pointer prefix (`*`, `**`)
 * - Detects grouped string syntax (`(...)`)
 * - Resolves type category (string, integer, float, struct)
 * - Delegates to specialized builders for each type
 * - Validates full consumption of input (no trailing characters allowed)
 *
 * Supported expression forms:
 * - `u32le`
 * - `u32le[4]`
 * - `*u8`
 * - `*(utf8[32])`
 * - `*ascii[16][4]`
 *
 * @example
 * ```ts
 * parseExpression("*u32le[4]");
 * ```
 *
 * @since 3.0.0
 */

export function parseExpression(input: ExpressionType): DescriptorType {
    const cursor: CursorType = { source: input.trim(), index: 0 };
    if (cursor.index >= cursor.source.length) fail(cursor, 'Expression cannot be empty', ExpressionErrorCode.EmptyExpression);

    let pointers = 0;
    while (is(cursor, CharCode.Asterisk)) {
        pointers++;
        cursor.index++;
    }

    let desc: DescriptorType;
    if (is(cursor, CharCode.LeftParenthesis)) {
        cursor.index++;
        desc = buildGroupedDescriptor(cursor, pointers);
    } else {
        const identStart = cursor.index;
        const ident = scanIdentifier(cursor);

        if (isString(ident))
            desc = buildString(cursor, ident as StringPipeType, pointers);
        else if (isInteger(ident))
            desc = buildPrimitive(cursor, ident, pointers, true);
        else if (isFloat(ident))
            desc = buildPrimitive(cursor, ident, pointers, false);
        else {
            cursor.index = identStart;
            fail(cursor, `Unknown type ${ ident }`, ExpressionErrorCode.UnknownType);
        }
    }

    if (cursor.index < cursor.source.length)
        fail(cursor, `Unexpected trailing input ${
            cursor.source.slice(cursor.index)
        }`, ExpressionErrorCode.UnexpectedTrailingInput);

    return desc;
}
