/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { IntegerPipeType, FloatPipeType } from '@pipes/interfaces/primitive-pipe.interface';

/**
 * Low-level binary buffer reader for integer primitive types.
 *
 * @remarks
 * Provides direct decoding of fixed-width integer values from a Node.js Buffer.
 *
 * Supports:
 * - Signed and unsigned integers
 * - 8/16/32/64-bit widths
 * - Little-endian and big-endian formats
 *
 * All operations are stateless and require explicit `(buffer, offset)` inputs.
 * 64-bit values are returned as `bigint`.
 *
 * @example
 * ```ts
 * const buf = Buffer.allocUnsafe(8);
 * buf.writeUInt32LE(42, 0);
 *
 * readIntegerPipe.u32le(buf, 0); // 42
 * ```
 *
 * @see writeIntegerPipe
 * @since 3.0.0
 */

export const readIntegerPipe = {
    u8: (buf: Buffer, offset: number) => buf.readUInt8(offset),
    i8: (buf: Buffer, offset: number) => buf.readInt8(offset),

    u16le: (buf: Buffer, offset: number) => buf.readUInt16LE(offset),
    i16le: (buf: Buffer, offset: number) => buf.readInt16LE(offset),

    u16be: (buf: Buffer, offset: number) => buf.readUInt16BE(offset),
    i16be: (buf: Buffer, offset: number) => buf.readInt16BE(offset),

    u32le: (buf: Buffer, offset: number) => buf.readUInt32LE(offset),
    i32le: (buf: Buffer, offset: number) => buf.readInt32LE(offset),

    u32be: (buf: Buffer, offset: number) => buf.readUInt32BE(offset),
    i32be: (buf: Buffer, offset: number) => buf.readInt32BE(offset),

    u64le: (buf: Buffer, offset: number) => buf.readBigUInt64LE(offset),
    i64le: (buf: Buffer, offset: number) => buf.readBigInt64LE(offset),

    u64be: (buf: Buffer, offset: number) => buf.readBigUInt64BE(offset),
    i64be: (buf: Buffer, offset: number) => buf.readBigInt64BE(offset)
} as const;

/**
 * Low-level binary buffer writer for integer primitive types.
 *
 * @remarks
 * Encodes fixed-width integer values into a Node.js Buffer at a given offset.
 *
 * Supports:
 * - Signed and unsigned integers
 * - 8/16/32/64-bit widths
 * - Little-endian and big-endian formats
 *
 * All operations mutate the buffer in-place and are stateless.
 * 64-bit values require `bigint`.
 *
 * @example
 * ```ts
 * const buf = Buffer.allocUnsafe(8);
 *
 * writeIntegerPipe.u32le(buf, 0, 42);
 * readIntegerPipe.u32le(buf, 0); // 42
 * ```
 *
 * @see readIntegerPipe
 * @since 3.0.0
 */

export const writeIntegerPipe = {
    u8: (buf: Buffer, offset: number, value: number) => buf.writeUInt8(value, offset),
    i8: (buf: Buffer, offset: number, value: number) => buf.writeInt8(value, offset),

    u16le: (buf: Buffer, offset: number, value: number) => buf.writeUInt16LE(value, offset),
    i16le: (buf: Buffer, offset: number, value: number) => buf.writeInt16LE(value, offset),

    u16be: (buf: Buffer, offset: number, value: number) => buf.writeUInt16BE(value, offset),
    i16be: (buf: Buffer, offset: number, value: number) => buf.writeInt16BE(value, offset),

    u32le: (buf: Buffer, offset: number, value: number) => buf.writeUInt32LE(value, offset),
    i32le: (buf: Buffer, offset: number, value: number) => buf.writeInt32LE(value, offset),

    u32be: (buf: Buffer, offset: number, value: number) => buf.writeUInt32BE(value, offset),
    i32be: (buf: Buffer, offset: number, value: number) => buf.writeInt32BE(value, offset),

    u64le: (buf: Buffer, offset: number, value: bigint) => buf.writeBigUInt64LE(BigInt(value), offset),
    i64le: (buf: Buffer, offset: number, value: bigint) => buf.writeBigInt64LE(BigInt(value), offset),

    u64be: (buf: Buffer, offset: number, value: bigint) => buf.writeBigUInt64BE(BigInt(value), offset),
    i64be: (buf: Buffer, offset: number, value: bigint) => buf.writeBigInt64BE(BigInt(value), offset)
} as const;

/**
 * Low-level binary buffer reader for floating-point primitive types.
 *
 * @remarks
 * Provides direct decoding of IEEE-754 floating-point values from a Node.js Buffer.
 *
 * Supports:
 * - 32-bit floats (f32)
 * - 64-bit doubles (f64)
 * - Little-endian and big-endian formats
 *
 * All operations are stateless and require explicit `(buffer, offset)` inputs.
 * Floating-point values are returned as JavaScript `number`
 * (IEEE-754 double precision).
 *
 * @example
 * ```ts
 * const buf = Buffer.allocUnsafe(8);
 * buf.writeFloatLE(1.5, 0);
 *
 * readFloatPipe.f32le(buf, 0); // 1.5
 * ```
 *
 * @see writeFloatPipe
 * @since 3.0.0
 */

export const readFloatPipe = {
    f32le: (buf: Buffer, offset: number) => buf.readFloatLE(offset),
    f32be: (buf: Buffer, offset: number) => buf.readFloatBE(offset),
    f64le: (buf: Buffer, offset: number) => buf.readDoubleLE(offset),
    f64be: (buf: Buffer, offset: number) => buf.readDoubleBE(offset)
} as const;

/**
 * Low-level binary buffer writer for floating-point primitive types.
 *
 * @remarks
 * Encodes IEEE-754 floating-point values into a Node.js Buffer at a given offset.
 * Supports:
 * - 32-bit floats (f32)
 * - 64-bit doubles (f64)
 * - Little-endian and big-endian formats
 *
 * All operations mutate the buffer in-place and are stateless.
 * Floating-point values use JavaScript `number` (IEEE-754 double precision).
 *
 * @example
 * ```ts
 * const buf = Buffer.allocUnsafe(8);
 *
 * writeFloatPipe.f32le(buf, 0, 1.5);
 * readFloatPipe.f32le(buf, 0); // 1.5
 * ```
 *
 * @see readFloatPipe
 * @since 3.0.0
 */

export const writeFloatPipe = {
    f32le: (buf: Buffer, offset: number, value: number) => buf.writeFloatLE(value, offset),
    f32be: (buf: Buffer, offset: number, value: number) => buf.writeFloatBE(value, offset),
    f64le: (buf: Buffer, offset: number, value: number) => buf.writeDoubleLE(value, offset),
    f64be: (buf: Buffer, offset: number, value: number) => buf.writeDoubleBE(value, offset)
} as const;

/**
 * Checks whether a type identifier is a valid integer primitive pipe key.
 *
 * @remarks
 * Performs a runtime lookup against {@link writeIntegerPipe} to determine
 * whether the provided name corresponds to a supported integer encoding.
 *
 * This includes:
 * - 8/16/32/64-bit signed and unsigned integers
 * - Little-endian and big-endian variants
 *
 * @example
 * ```ts
 * isInteger('u32le'); // true
 * isInteger('f32le'); // false
 * ```
 *
 * @see writeIntegerPipe
 * @since 3.0.0
 */

export function isInteger(name: string): name is IntegerPipeType {
    return name in writeIntegerPipe;
}

/**
 * Checks whether a type identifier is a valid floating-point primitive pipe key.
 *
 * @remarks
 * Performs a runtime lookup against {@link writeFloatPipe} to determine
 * whether the provided name corresponds to a supported IEEE-754 encoding.
 *
 * Supported float formats:
 * - f32le / f32be (32-bit float)
 * - f64le / f64be (64-bit double)
 *
 * @example
 * ```ts
 * isFloat('f32le'); // true
 * isFloat('u32le'); // false
 * ```
 *
 * @see writeFloatPipe
 * @since 3.0.0
 */

export function isFloat(name: string): name is FloatPipeType {
    return name in writeFloatPipe;
}
