/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { POINTER_SIZES } from '@constants/heap.constant';
import type { PointerType } from '@services/interfaces/heap-service.interface';

/**
 * All supported heap pointer byte widths.
 *
 * @remarks
 * Represents the union of every valid pointer size exposed by
 * {@link POINTER_SIZES}.
 *
 * Pointer sizes control runtime heap layout behavior including:
 * - inline payload capacity
 * - far pointer offset range
 * - pointer bit allocation
 * - numeric return representation
 *
 * This type is used throughout the heap serialization runtime to
 * strongly constrain pointer layout configuration at compile time.
 *
 * @example
 * ```ts
 * const size: PointerSizeType = 4;
 * ```
 *
 * @example
 * ```ts
 * function alloc(size: PointerSizeType): void {
 *   // heap allocation logic
 * }
 * ```
 *
 * @see POINTER_SIZES
 * @since 3.0.0
 */

export type PointerSizeType = typeof POINTER_SIZES[number];

/**
 * Heap runtime abstraction for reading and writing raw memory pointers.
 *
 * @remarks
 * Provides low-level heap access operations over encoded pointer values.
 * Implementations are responsible for managing pointer allocation,
 * memory decoding, and heap writes for a specific runtime strategy.
 *
 * @since 3.0.0
 */

export interface HeapRuntimeInterface {
    /**
     * Reads heap memory from the specified pointer.
     *
     * @param ptr - Encoded pointer value to read.
     * @param ptrSize - Optional pointer size in bytes used for decoding.
     *
     * @returns Buffer containing the decoded memory payload.
     *
     * @remarks
     * Decodes the provided pointer and returns the referenced memory payload
     * as a buffer. Implementations may support both inline and heap-allocated
     * pointer representations.
     *
     * @see PointerType
     * @see PointerSizeType
     *
     * @since 3.0.0
     */

    read(ptr: PointerType, ptrSize?: PointerSizeType): Buffer;

    /**
     * Writes buffer data into heap memory.
     *
     * @param data - Buffer payload to encode and write.
     * @param ptrSize - Optional pointer size in bytes used for encoding.
     *
     * @returns Encoded pointer referencing the written payload.
     *
     * @remarks
     * Encodes the provided buffer into a pointer representation. Depending on
     * the runtime implementation and payload size, data may be stored inline
     * inside the pointer itself or allocated within the heap buffer.
     *
     * @see PointerType
     * @see PointerSizeType
     *
     * @since 3.0.0
     */

    write(data: Buffer, ptrSize?: PointerSizeType): PointerType;
}
