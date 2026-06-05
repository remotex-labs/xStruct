/**
 * Represents an encoded heap pointer value.
 *
 * @remarks
 * Pointer values are returned as `number` for pointer sizes up to 48 bits,
 * where the value fits within safe JavaScript integer precision. For pointer
 * sizes exceeding 48 bits, `bigint` is returned to preserve all bits without
 * loss.
 *
 * Both forms are accepted as input by {@link heapRead}.
 *
 * @see LayoutInterface
 * @since 3.0.0
 */

export type PointerType = number | bigint;

/**
 * Runtime context passed to heap read and write operations.
 *
 * @remarks
 * Holds the mutable heap state shared across all {@link heapRead} and
 * {@link heapWrite} calls. Both fields may be mutated during a write:
 * `top` advances by the number of bytes written, and `buffer` may be
 * replaced entirely if growth is required.
 *
 * @see heapRead
 * @see heapWrite
 *
 * @since 3.0.0
 */

export interface HeapContextInterface {
    /**
     * Current write position in the heap buffer.
     *
     * @remarks
     * Points to the next free byte available for allocation. Advanced by
     * {@link heapWrite} after each packed or far write. Never modified by
     * inline writes since those store data inside the pointer itself.
     *
     * @since 3.0.0
     */

    top: number;

    /**
     * Backing buffer for all heap-allocated data.
     *
     * @remarks
     * May be replaced by a larger buffer during a writing if the remaining capacity is not enough.
     * Callers must not retain references to the old buffer after a writing call returns,
     * as the reference may no longer be valid.
     *
     * @since 3.0.0
     */

    buffer: Buffer;
}

/**
 * Precomputed bit-level layout for a specific pointer size.
 *
 * @remarks
 * Describes how a fixed-width integer is partitioned into a 2-bit tag region
 * and a payload region for a given {@link PointerSizeType}. Constructed by
 * {@link buildLayout} and cached by {@link getLayout}.
 *
 * All fields are derived purely from the pointer size and are immutable after
 * construction.
 *
 * @see getLayout
 * @see buildLayout
 *
 * @since 3.0.0
 */

export interface LayoutInterface {
    /**
     * Total bit width of the pointer.
     *
     * @remarks
     * Equal to `ptrSize * 8`. Determines the upper bound of all field widths
     * within the pointer and controls the normalization mask applied during
     * decoding in {@link heapRead}.
     */
    bits: number;

    /**
     * Precomputed far pointer tag shifted into position.
     *
     * @remarks
     * Equal to `TAG_FAR << tagShift`. Applied directly during far pointer
     * encoding in {@link heapWrite} to avoid repeated shift computation in the writing path.
     *
     * @since 3.0.0
     */

    farTag: bigint;

    /**
     * Bit position of the 2-bit tag field within the pointer.
     *
     * @remarks
     * Equal to `bits - 2`. The tag is extracted by shifting the normalized
     * pointer right by this amount and masking with `0x3n`.
     *
     * @since 3.0.0
     */

    tagShift: bigint;

    /**
     * Whether pointer values must be represented as `bigint`.
     *
     * @remarks
     * Set to `true` when `bits > 48`, meaning the pointer value exceeds safe
     * JavaScript integer precision and cannot be represented losslessly as a
     * `number`. When `true`, {@link heapWrite} returns a `bigint` instead of a `number`.
     *
     * @since 3.0.0
     */

    returnBig: boolean;

    /**
     * Bitmask isolating the heap offset field of a far pointer.
     *
     * @remarks
     * Used in {@link heapRead} to extract the offset via `normalized & farOffMask`,
     * and in {@link heapWrite} to validate that the current heap top does not
     * overflow the addressable range before writing a far pointer.
     *
     * @since 3.0.0
     */

    farOffMask: bigint;

    /**
     * Bitmask isolating the payload region of an inline pointer.
     *
     * @remarks
     * Equal to `(1n << tagShift) - 1n`, identical in value to `farOffMask`.
     * Used during inline encoding to strip any bits that would overlap the
     * tag region before embedding the payload into the pointer.
     *
     * @since 3.0.0
     */

    inlineMask: bigint;

    /**
     * Maximum number of bytes that can be stored inline in the pointer.
     *
     * @remarks
     * Equal to `(bits - 2) >> 3`. Payloads at or below this length are
     * encoded directly into the pointer value by {@link heapWrite} without
     * any heap allocation.
     *
     * @since 3.0.0
     */

    inlineBytes: number;
}
