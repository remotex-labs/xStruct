/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { HeapRuntimeInterface, PointerSizeType } from '@interfaces/heap.interface';

/**
 * Compiled metadata for one dimension of a shape.
 *
 * @remarks
 * Produced by {@link compileShape}, outermost dimension first. A `dim` below `1`
 * marks a pointer indirection level rather than a fixed array.
 *
 * @see {@link ShapeContextInterface}
 *
 * @since 3.0.0
 */

export interface LevelInfoInterface {
    /**
     * Element count of this dimension; `0` (or less) marks a pointer indirection.
     *
     * @since 3.0.0
     */

    dim: number;

    /**
     * Total bytes this level occupies on the stack (`dim × stride`, or one pointer).
     *
     * @since 3.0.0
     */

    size: number;

    /**
     * Byte step between consecutive elements of the next inner level.
     *
     * @since 3.0.0
     */

    stride: number;
}

/**
 * Heap and length context passed to a leaf encode/decode call.
 *
 * @since 3.0.0
 */

export interface ShapeOptionsInterface {
    /**
     * Heap used to allocate or resolve pointer-backed payloads.
     *
     * @since 3.0.0
     */

    heap: HeapRuntimeInterface,

    /**
     * Element count, or byte length for strings, available at this level.
     *
     * @since 3.0.0
     */

    length: number
}

/**
 * Innermost-element serialization pair, independent of the array/pointer layout.
 *
 * @template T - Decoded value type of the leaf element.
 *
 * @remarks
 * Carries only what is needed to read or write a single leaf element. The compiled
 * layout is added separately by {@link ShapeContextInterface}.
 *
 * @see {@link ShapeContextInterface}
 *
 * @since 3.0.0
 */

export interface LeafInterface<T = unknown> {
    /**
     * Encoding of the innermost level when it is a string; absent for non-string leaves.
     *
     * @remarks
     * Its presence marks the innermost level as a string, which is decoded and encoded in
     * a single call rather than element by element. Its value is the encoding used to size
     * a heap payload by its exact byte length (via `Buffer.byteLength`), so multibyte
     * encodings such as UTF-8 and UTF-16 are neither truncated nor over-allocated.
     *
     * @since 3.0.0
     */

    stringEncoding?: BufferEncoding;

    /**
     * Decodes a single leaf element from the buffer.
     *
     * @param buffer - Source buffer.
     * @param offset - Byte offset to read from.
     * @param options - Heap and length context for this element.
     * @returns The decoded value.
     *
     * @since 3.0.0
     */

    decode(buffer: Buffer, offset: number, options?: ShapeOptionsInterface): T;

    /**
     * Encodes a single leaf element into the buffer.
     *
     * @param buffer - Destination buffer.
     * @param offset - Byte offset to write at.
     * @param value - Value to encode.
     * @param options - Heap and length context for this element.
     *
     * @since 3.0.0
     */

    encode(buffer: Buffer, offset: number, value: T, options?: ShapeOptionsInterface): void;
}

/**
 * A {@link LeafInterface} plus its compiled layout - the `this` context bound by the
 * shape walkers.
 *
 * @template T - Decoded value type of the leaf element.
 *
 * @see {@link LeafInterface}
 *
 * @since 3.0.0
 */

export interface ShapeContextInterface<T = unknown> extends LeafInterface<T> {
    /**
     * Compiled per-dimension layout, outermost first.
     *
     * @since 3.0.0
     */

    levels: Array<LevelInfoInterface>;

    /**
     * Byte size of the innermost element.
     *
     * @since 3.0.0
     */

    elementSize: number;

    /**
     * Pointer width, in bytes, used for indirection levels.
     *
     * @since 3.0.0
     */

    pointerSize: PointerSizeType;
}
