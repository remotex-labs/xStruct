/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { PointerType } from '@services/interfaces/heap-service.interface';
import type { HeapRuntimeInterface, PointerSizeType } from '@interfaces/heap.interface';
import type { LevelInfoInterface } from '@components/interfaces/shape-component.interface';
import type { ShapeContextInterface } from '@components/interfaces/shape-component.interface';

/**
 * Imports
 */

import { readIntegerPipe, writeIntegerPipe } from '@pipes/primitive.pipe';

/**
 * Precomputes per-dimension layout metadata for a shape.
 *
 * @param shape - Dimensions read right-to-left; `0` (or less) marks a pointer indirection
 * @param elementSize - Byte size of the innermost element
 * @param pointerSize - Byte size of a heap pointer
 * @returns One {@link LevelInfoInterface} per dimension, outermost first
 *
 * @remarks
 * For each level, `size` is the total bytes the level occupies on the stack
 * (`dim × stride`, or `pointerSize` for a pointer level) and `stride` is the
 * byte step between consecutive elements of the next inner level.
 *
 * @since 3.0.0
 */

export function compileShape(shape: Array<number>, elementSize: number, pointerSize: number): Array<LevelInfoInterface> {
    let currentSize = elementSize;
    const levels: Array<LevelInfoInterface> = new Array(shape.length);

    for (let i = shape.length - 1; i >= 0; i--) {
        levels[i] = {
            dim: shape[i],
            size: shape[i] < 1 ? pointerSize : shape[i] * currentSize,
            stride: currentSize
        };

        currentSize = shape[i] === 0 ? pointerSize : shape[i] * currentSize;
    }

    return levels;
}

/**
 * Normalizes a value into an indexable, length-bearing collection.
 *
 * @param data - Value to normalize
 * @param isString - When true, the string is returned as-is (already indexable)
 * @returns The original array/string, or a single-element array wrapping a scalar
 *
 * @since 3.0.0
 */

export function toItems(data: unknown, isString: boolean = false): Array<unknown> {
    if (isString) return data as Array<unknown>;
    if (Array.isArray(data)) return data;

    return [ data ];
}

/**
 * Reads an encoded heap pointer from a buffer.
 *
 * @param buffer - Source buffer
 * @param offset - Byte offset to read from
 * @param ptrSize - Pointer width in bytes
 * @returns The pointer as a `number`, or `bigint` when `ptrSize > 6`
 *
 * @since 3.0.0
 */

export function readPtr(buffer: Buffer, offset: number, ptrSize: PointerSizeType): PointerType {
    if (ptrSize > 6) return readIntegerPipe.u64le(buffer, offset);

    return buffer.readUIntLE(offset, ptrSize);
}

/**
 * Writes an encoded heap pointer into a buffer.
 *
 * @param buffer - Destination buffer
 * @param offset - Byte offset to write at
 * @param ptr - Pointer value (`bigint` required when `ptrSize > 6`)
 * @param ptrSize - Pointer width in bytes
 * @returns The next write offset, as returned by the underlying buffer write
 *
 * @since 3.0.0
 */

export function writePtr(buffer: Buffer, offset: number, ptr: PointerType, ptrSize: PointerSizeType): PointerType {
    if (ptrSize > 6) return writeIntegerPipe.u64le(buffer, offset, <bigint>ptr);

    return buffer.writeUIntLE(<number>ptr, offset, ptrSize);
}

/**
 * Recursively decodes a shaped value from a buffer.
 *
 * @param heap - Heap used to resolve pointer indirections
 * @param buffer - Source buffer
 * @param offset - Byte offset of the current element
 * @param level - Current dimension index (internal recursion cursor)
 * @returns The decoded value: a scalar/leaf at the innermost level, otherwise a nested array
 *
 * @remarks
 * Pointer levels (`dim < 1`) read an address, resolve it against the heap, and
 * derive the element count from the resolved payload length. A pointer level that
 * resolves to a single element returns that element directly rather than a
 * one-element array, mirroring how a pointer string returns one string. For strings,
 * the innermost level is decoded in one call rather than per character.
 *
 * @see ShapeContextInterface
 * @since 3.0.0
 */

export function decodeShape(this: ShapeContextInterface, heap: HeapRuntimeInterface, buffer: Buffer, offset: number, level: number = 0): unknown {
    if (level === this.levels.length) return this.decode(buffer, offset, { heap, length: this.elementSize });
    const info = this.levels[level];

    let length = info.dim;
    let source = buffer;
    if (info.dim < 1) {
        const address = readPtr(buffer, offset, this.pointerSize);

        source = heap.read(address, this.pointerSize);
        length = Math.floor(source.length / info.stride);
        offset = 0;
    }

    if(this.stringEncoding && level === this.levels.length - 1)
        return this.decode(source, offset, { heap, length });

    const result = new Array(length);
    for (let i = 0; i < length; i++) {
        result[i] = decodeShape.call(this, heap, source, offset + i * info.stride, level + 1);
    }


    return (info.dim < 1 && length === 1) ? result[0] : result;
}

/**
 * Recursively encodes a shaped value into a buffer.
 *
 * @param heap - Heap used to allocate pointer-backed payloads
 * @param buffer - Destination buffer
 * @param offset - Byte offset of the current element
 * @param data - Value to encode at this level
 * @param level - Current dimension index (internal recursion cursor)
 *
 * @remarks
 * Pointer levels (`dim < 1`) encode the payload into a freshly allocated buffer,
 * write it to the heap, and store the returned address inline. For strings, the
 * innermost level is encoded in one call rather than per character.
 *
 * @see ShapeContextInterface
 * @since 3.0.0
 */

export function encodeShape(this: ShapeContextInterface, heap: HeapRuntimeInterface, buffer: Buffer, offset: number, data: unknown, level: number = 0): void {
    if (level === this.levels.length) return this.encode(buffer, offset, data, { heap, length: this.elementSize });
    const items = toItems(data, typeof data === 'string');
    const info = this.levels[level];

    let length = info.dim;
    let targetOffset = offset;
    let target = buffer;

    if (info.dim < 1) {
        length = (this.stringEncoding && level === this.levels.length - 1) ? Buffer.byteLength(String(items), this.stringEncoding) : items.length;
        target = Buffer.allocUnsafe(length * info.stride);

        targetOffset = 0;
    }

    if (this.stringEncoding && level === this.levels.length - 1)
        this.encode(target, targetOffset, items, { heap, length });

    else for (let i = 0; i < length; i++) {
        encodeShape.call(this, heap, target, targetOffset + i * info.stride, items[i], level + 1);
    }

    if (info.dim < 1) {
        const address = heap.write(target, this.pointerSize);
        writePtr(buffer, offset, address, this.pointerSize);
    }
}
