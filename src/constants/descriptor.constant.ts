/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { PrimitivePipeType } from '@pipes/interfaces/primitive-pipe.interface';

/**
 * Descriptor kind discriminators used by the descriptor system.
 *
 * @remarks
 * Identifies the concrete descriptor category represented by a parsed
 * expression descriptor object.
 *
 * Descriptor kinds:
 * - `Struct`    → Nested structure descriptor
 * - `String`    → String descriptor
 * - `Bitfield`  → Packed integer bitfield descriptor
 * - `Primitive` → Primitive numeric descriptor
 *
 * @since 3.0.0
 */

export const enum DescriptorKind {
    Struct,
    String,
    Bitfield,
    Primitive,
}

/**
 * Byte width of a primitive pipe type.
 *
 * @param type - Primitive pipe type, e.g. `'u32le'` or `'f64be'`.
 * @returns The fixed byte width: the type's bit width divided by 8.
 *
 * @remarks
 * Derived directly from the type name rather than a lookup table: the leading
 * `u`/`i`/`f` is dropped and the bit width is read off the digits (`'u16le'` → `16`),
 * then divided by 8. Endianness does not affect size. Used by the binary layout
 * system to compute offsets, buffer sizes, and array strides.
 *
 * Returns `0` for a name without a numeric width, so callers can treat that as an
 * invalid primitive.
 *
 * @example
 * ```ts
 * primitiveByteSize('u32le'); // 4
 * primitiveByteSize('f64be'); // 8
 * ```
 *
 * @since 3.0.0
 */

export function primitiveByteSize(type: PrimitivePipeType): number {
    return parseInt(type.slice(1), 10) >> 3;
}
