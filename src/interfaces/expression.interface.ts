/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { StringPipeType } from '@pipes/interfaces/strings-pipe.interface';
import type { IntegerPipeType, PrimitivePipeType } from '@pipes/interfaces/primitive-pipe.interface';

/**
 * Pointer expression token representing a pointer (`*`).
 *
 * @remarks
 * Used in the expression grammar to indicate an indirection level.
 *
 * @since 3.0.0
 */

export type SymbolPointerType = '*' | '**';

/**
 * Array suffix expression in the form `[N]`.
 *
 * @remarks
 * Represents a fixed-size array modifier where `N` is a numeric literal
 * indicating element count.
 *
 * Array semantics:
 * - `[N]` where `N >= 1` → fixed-size array
 * - Dynamic arrays are handled separately by descriptor rules
 *
 * @example
 * ```ts
 * type T = `u32${ArrayType}`; // u32[4]
 * ```
 *
 * @since 3.0.0
 */

export type ArrayType = `[${ number }]`;

/**
 * Bitfield expression of the form `type:bits`.
 *
 * @remarks
 * Encodes a packed integer field where:
 * - Left side is an {@link IntegerPipeType}
 * - Right side defines `bit` width
 *
 * @example
 * - `u32le:8`
 *
 * @since 3.0.0
 */

export type BitFieldExpressionType =
    `${ IntegerPipeType }:${ number }`;

/**
 * Primitive expression grammar for numeric types.
 *
 * @remarks
 * Defines all valid primitive numeric forms including:
 * - Raw primitives
 * - Pointer primitives
 * - Fixed-size arrays
 *
 * This is part of the expression DSL and is interpreted by the parser
 * into {@link PrimitiveDescriptorInterface}.
 *
 * @example
 * - `u32le`
 * - `*u32le`
 * - `u32le[4]`
 * - `*u32le[4]`
 *
 * @since 3.0.0
 */

export type PrimitiveExpressionType =
    | PrimitivePipeType
    | `${ SymbolPointerType }${ PrimitivePipeType }`
    | `${ PrimitivePipeType }${ ArrayType }`
    | `${ SymbolPointerType }${ PrimitivePipeType }${ ArrayType }`
    | `${ SymbolPointerType }(${ PrimitivePipeType }${ ArrayType })`;

/**
 * String expression grammar for encoded text fields.
 *
 * @remarks
 * Defines all valid string-related expressions and how they map to
 * memory layout semantics in the descriptor system.
 *
 * Each form represents a different combination of:
 *
 * - Encoding type (utf8, ascii, etc.)
 * - Pointer indirection level
 * - Fixed-size or dynamic length
 * - Array repetition
 * - Grouping precedence rules
 *
 * Supported patterns and their meaning:
 * - `*utf8`
 *   → Pointer to a string.
 *   The value is not stored inline instead, it references a memory address
 *   where the string resides.
 *
 * - `**utf8`
 *   → Double pointer to a string.
 *   Represents a pointer to a pointer (indirect string reference),
 *   typically used in heap-managed or external string tables.
 *
 * - `utf8[4]`
 *   → Fixed-size string array of 4 elements.
 *   Each element is an independent string instance.
 *
 * - `utf8[4][2]`
 *   → Two-dimensional fixed string array.
 *   Represents 2 groups of 4 strings (or vice versa depending on layout rules).
 *
 * - `*utf8[4]`
 *   → Pointer to a fixed-size array of 4 strings.
 *   The array is heap/external referenced, not embedded inline.
 *
 * - `*(utf8[4])`
 *   → Pointer to a grouped expression.
 *   The parentheses enforce that the pointer applies to the entire
 *   `utf8[4]` construct as a single unit.
 *
 * @since 3.0.0
 */

export type StringExpressionType =
    | `${ SymbolPointerType }${ StringPipeType }`
    | `${ StringPipeType }${ ArrayType }`
    | `${ StringPipeType }${ ArrayType }${ ArrayType }`
    | `${ SymbolPointerType }${ StringPipeType }${ ArrayType }`
    | `${ SymbolPointerType }(${ StringPipeType }${ ArrayType })`;

/**
 * Full expression grammar supported by the descriptor parser.
 *
 * @remarks
 * Union of all valid expression forms that can be parsed into a {@link DescriptorType}.
 *
 * Includes:
 * - Primitive expressions
 * - String expressions
 * - Bitfield expressions
 *
 * @since 3.0.0
 */

export type ExpressionType =
    | StringExpressionType
    | BitFieldExpressionType
    | PrimitiveExpressionType;
