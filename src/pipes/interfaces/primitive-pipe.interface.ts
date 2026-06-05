/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { readIntegerPipe, writeIntegerPipe, readFloatPipe } from '@pipes/primitive.pipe';

/**
 * All integer-based primitive pipe operation keys.
 *
 * @remarks
 * Narrowed subset of {@link PrimitivePipeType} that includes only
 * integer and bigint operations.
 *
 * This excludes all IEEE-754 floating-point operations:
 * - f32le / f32be
 * - f64le / f64be
 *
 * @example
 * ```ts
 * type A = IntegerPipeType; // only integer + bigint ops
 * ```
 *
 * @see PrimitivePipeType
 * @since 3.0.0
 */

export type IntegerPipeType = keyof typeof readIntegerPipe;

/**
 * All floating-point primitive pipe operation keys.
 *
 * @remarks
 * Represents the union of all available IEEE-754 floating-point
 * read operations defined in {@link readFloatPipe}.
 *
 * This includes:
 * - 32-bit floating point (f32le, f32be)
 * - 64-bit floating point (f64le, f64be)
 *
 * All operations return JavaScript `number` values (IEEE-754 double precision),
 * even for 32-bit floats.
 *
 * This type is used to constrain float-specific decoding logic in the
 * binary expression and descriptor system.
 *
 * @example
 * ```ts
 * type A = FloatPipeType;
 * // "f32le" | "f32be" | "f64le" | "f64be"
 * ```
 *
 * @see readFloatPipe
 * @since 3.0.0
 */

export type FloatPipeType = keyof typeof readFloatPipe;

/**
 * All supported primitive pipe operation keys.
 *
 * @remarks
 * Represents the union of all available binary primitive operations
 * across integer and floating-point pipelines.
 *
 * This includes:
 * - Integer operations (u8, i32le, u64be, etc.)
 * - Floating-point operations (f32le, f64be, etc.)
 *
 * Each key maps directly to a runtime encoding/decoding function.
 * This type is used as the base operation set for all primitive
 * binary serialization and parsing logic.
 *
 * @example
 * ```ts
 * type A = PrimitivePipeType; // "u8" | "i32le" | "f32le" | ...
 * ```
 *
 * @see FloatPipeType
 * @see IntegerPipeType
 *
 * @since 3.0.0
 */

export type PrimitivePipeType = IntegerPipeType | FloatPipeType;

/**
 * Infers the decoded return type of integer buffer read operations.
 *
 * @template T - Integer pipe operation key
 *
 * @remarks
 * Resolves to the exact runtime return type of the corresponding
 * {@link readIntegerPipe} method.
 *
 * Type rules:
 * - 8/16/32-bit integers → `number`
 * - 64-bit integers → `bigint`
 *
 * This ensures type-safe decoding of integer binary values without manual casting.
 *
 * @example
 * ```ts
 * type A = ReadIntegerPipeType<'u32le'>; // number
 * type B = ReadIntegerPipeType<'u64le'>; // bigint
 * ```
 *
 * @see readIntegerPipe
 * @since 3.0.0
 */

export type ReadIntegerPipeType<T extends IntegerPipeType> = ReturnType<(typeof readIntegerPipe)[T]>;

/**
 * Infers the required input value type for integer buffer write operations.
 *
 * @template T - Integer pipe operation key
 *
 * @remarks
 * Extracts the value parameter type from the corresponding
 * {@link writeIntegerPipe} method.
 *
 * Type rules:
 * - 8/16/32-bit integers → `number`
 * - 64-bit integers → `bigint`
 *
 * This guarantees compile-time safety for integer encoding operations.
 *
 * @example
 * ```ts
 * type A = WriteIntegerPipeType<'u8'>;    // number
 * type B = WriteIntegerPipeType<'u64le'>; // bigint
 * ```
 *
 * @see writeIntegerPipe
 * @since 3.0.0
 */

export type WriteIntegerPipeType<T extends IntegerPipeType> = Parameters<(typeof writeIntegerPipe)[T]>[2];

