/**
 * Pointer tag identifier for packed heap references.
 *
 * @remarks
 * Packed pointers use a fixed ABI independent of pointer width.
 *
 * Layout:
 * - low 8 bits  → payload length
 * - remaining bits → heap offset
 *
 * Packed pointers are optimized for short heap-backed payloads and
 * avoid additional header decoding during reads.
 *
 * Unlike {@link TAG_FAR}, packed pointers do not store a varint length
 * prefix inside the heap buffer.
 *
 * @example
 * ```ts
 * const len = Number(ptr & PACKED_LEN_MASK);
 * const off = Number(ptr >> PACKED_LEN_BITS);
 * ```
 *
 * @see PACKED_LEN_BITS
 * @see PACKED_LEN_MASK
 *
 * @since 3.0.0
 */

export const TAG_PACKED = 0n;

/**
 * Pointer tag identifier for inline payload storage.
 *
 * @remarks
 * Inline pointers embed payload bytes directly inside the pointer
 * value itself using little-endian byte packing.
 *
 * The available inline capacity depends on the active pointer size and
 * excludes the upper tag bits reserved by the runtime layout.
 *
 * Inline pointers avoid heap allocation entirely and provide the
 * fastest read/write path for very small payloads.
 *
 * @example
 * ```ts
 * if (len <= inlineBytes) {
 *   // encode directly into pointer
 * }
 * ```
 *
 * @since 3.0.0
 */

export const TAG_INLINE = 1n;

/**
 * Pointer tag identifier for external heap references.
 *
 * @remarks
 * Far pointers reference payload data stored externally inside the
 * heap buffer.
 *
 * Heap payloads referenced by far pointers are encoded as:
 * - varint byte length
 * - raw payload bytes
 *
 * The pointer payload itself stores only the heap offset while the
 * length is decoded lazily during reads.
 *
 * Far pointers are used when payloads exceed the limits supported by
 * {@link TAG_INLINE} or {@link TAG_PACKED}.
 *
 * @example
 * ```ts
 * const ptr = farTag | BigInt(offset);
 * ```
 *
 * @since 3.0.0
 */

export const TAG_FAR = 2n;

/**
 * Fixed `bit` width reserved for inline payload length encoding.
 *
 * @remarks
 * Inline pointer layouts reserve exactly 4 bits for the payload length
 * field, allowing lengths from 0 to {@link INLINE_LEN_MASK} to be stored
 * without a separate heap header.
 *
 * These 4 bits occupy the lowest positions of the inline payload region,
 * immediately above the tag bits. The remaining bits store the actual
 * payload bytes shifted left by this amount.
 *
 * This constant is part of the stable inline pointer ABI and must
 * never vary with runtime layout configuration.
 *
 * Memory layout (32-bit pointer example):
 * ```
 * ┌──────────┬───────────────────────────┬──────────────┐
 * │  tag (2) │      payload bytes        │   len (4)    │
 * │  31..30  │         29..4             │    3..0      │
 * └──────────┴───────────────────────────┴──────────────┘
 *
 * ptrSize=1  │ bits=8  │ tag=2 │ payload=2 │ len=4 │ capacity: 0 bytes
 * ptrSize=2  │ bits=16 │ tag=2 │ payload=10│ len=4 │ capacity: 1 byte
 * ptrSize=4  │ bits=32 │ tag=2 │ payload=26│ len=4 │ capacity: 3 bytes
 * ptrSize=6  │ bits=48 │ tag=2 │ payload=42│ len=4 │ capacity: 5 bytes
 * ptrSize=8  │ bits=64 │ tag=2 │ payload=58│ len=4 │ capacity: 7 bytes
 * ```
 *
 * @example
 * ```ts
 * // encode
 * let payload = BigInt(len);
 * for (let i = 0; i < len; i++) payload |= BigInt(data[i]) << (INLINE_LEN_BITS + BigInt(i * 8));
 *
 * // decode
 * const len = Number(payload & INLINE_LEN_MASK);
 * ```
 *
 * @see TAG_INLINE
 * @see INLINE_LEN_MASK
 *
 * @since 3.0.0
 */

export const INLINE_LEN_BITS = 4n;

/**
 * Bit mask used to extract inline payload lengths.
 *
 * @remarks
 * Represents the fixed-width mask applied to inline pointer values to
 * decode the embedded payload length field.
 *
 * The mask width matches {@link INLINE_LEN_BITS}, covering the lowest
 * 4 bits of the payload region. Supports lengths from 0 to 15, which
 * exceeds the maximum inline capacity of any supported pointer size.
 *
 * Memory layout (32-bit pointer example, 2 payload bytes):
 * ```text
 * ┌──────────┬──────────────────┬──────────────────┬──────────────┐
 * │  tag (2) │    byte[1] (8)   │    byte[0] (8)   │   len (4)    │
 * │  31..30  │      27..20      │      19..12      │    3..0      │
 * │    01    │    data[1]       │    data[0]       │   0x02       │
 * └──────────┴──────────────────┴──────────────────┴──────────────┘
 * ```
 *
 * @example
 * ```ts
 * const len = Number(payload & INLINE_LEN_MASK);
 * ```
 *
 * @see TAG_INLINE
 * @see INLINE_LEN_BITS
 *
 * @since 3.0.0
 */

export const INLINE_LEN_MASK = 0xFn;

/**
 * Fixed bit width reserved for packed payload lengths.
 *
 * @remarks
 * Packed pointer layouts always reserve exactly 8 bits for the payload
 * length field regardless of pointer size.
 *
 * This constant is part of the stable packed pointer ABI and must
 * never vary with runtime layout configuration.
 *
 * @example
 * ```ts
 * const off = ptr >> PACKED_LEN_BITS;
 * ```
 *
 * @see PACKED_LEN_MASK
 * @since 3.0.0
 */

export const PACKED_LEN_BITS = 8n;

/**
 * Bit mask used to extract packed payload lengths.
 *
 * @remarks
 * Represents the fixed-width mask applied to packed pointer values to
 * decode the embedded payload length field.
 *
 * The mask width matches {@link PACKED_LEN_BITS}.
 *
 * @example
 * ```ts
 * const len = Number(ptr & PACKED_LEN_MASK);
 * ```
 *
 * @see PACKED_LEN_BITS
 * @since 3.0.0
 */

export const PACKED_LEN_MASK = 0xFFn;

/**
 * Maximum payload length encodable by packed pointers.
 *
 * @remarks
 * Packed pointers store payload lengths using a fixed 8-bit field,
 * limiting the maximum inline heap-backed payload size to 255 bytes.
 *
 * Payloads larger than this threshold automatically fall back to
 * {@link TAG_FAR} allocation semantics.
 *
 * @example
 * ```ts
 * if (len <= PACKED_MAX_LEN) {
 *   // encode as packed pointer
 * }
 * ```
 *
 * @see TAG_FAR
 * @see TAG_PACKED
 *
 * @since 3.0.0
 */

export const PACKED_MAX_LEN = 0xFF;

/**
 * Maximum heap offset encodable by packed pointers.
 *
 * @remarks
 * Packed pointers reserve all remaining payload bits for heap offsets
 * after the fixed 8-bit length field.
 *
 * The packed offset field is permanently limited to 24 bits and does
 * not scale with pointer width.
 *
 * Heap offsets exceeding this value must use {@link TAG_FAR}.
 *
 * @example
 * ```ts
 * if (off > PACKED_MAX_OFF) {
 *   // fallback to far pointer
 * }
 * ```
 *
 * @see TAG_FAR
 * @see TAG_PACKED
 *
 * @since 3.0.0
 */

export const PACKED_MAX_OFF = (1 << 24) - 1;

/**
 * All supported runtime pointer widths in bytes.
 *
 * @remarks
 * Defines every valid pointer size supported by the heap serialization
 * runtime.
 *
 * Pointer size affects:
 * - inline payload capacity
 * - maximum far pointer offset range
 * - numeric return representation
 * - layout bit allocation
 *
 * @see getLayout
 * @since 3.0.0
 */

export const POINTER_SIZES = [ 1, 2, 4, 6, 8 ] as const;
