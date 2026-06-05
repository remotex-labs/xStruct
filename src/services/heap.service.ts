/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { PointerSizeType } from '@interfaces/heap.interface';
import type { LayoutInterface, HeapContextInterface, PointerType } from '@services/interfaces/heap-service.interface';

/**
 * imports
 */

import { xStructRangeError } from '@errors/range.error';
import { bufferGrow } from '@components/buffer.component';
import { TAG_FAR, TAG_INLINE, TAG_PACKED, PACKED_LEN_MASK } from '@constants/heap.constant';
import { PACKED_LEN_BITS, PACKED_MAX_LEN, PACKED_MAX_OFF, INLINE_LEN_BITS, INLINE_LEN_MASK } from '@constants/heap.constant';

/**
 * Cache of computed heap layouts indexed by pointer size.
 *
 * @remarks
 * Stores precomputed {@link LayoutInterface} objects for each supported {@link PointerSizeType}
 * so {@link getLayout} never reconstructs the same layout twice. Hot paths in {@link heapRead}
 * and {@link heapWrite} call {@link getLayout} on every invocation, so avoiding repeated bit
 * arithmetic and object allocation here has a measurable impact.
 *
 * Entries are written once by {@link buildLayout} and never mutated afterward, making them
 * safe to share across all heap operations without copying.
 *
 * @since 3.0.0
 */

export const cache = new Map<PointerSizeType, LayoutInterface>();

/**
 * Derives a complete {@link LayoutInterface} from a pointer size.
 *
 * @param ptrSize - Pointer width in bytes. Must be a valid {@link PointerSizeType}.
 * @returns A fully populated {@link LayoutInterface} encoding all bit-level rules
 * for the given pointer width.
 *
 * @remarks
 * Splits a fixed-width integer into a 2-bit tag region at the top and a payload
 * region covering the remaining bits. The tag selects one of three pointer kinds
 * at runtime: inline, packed, or far.
 *
 * The derivation steps are:
 *
 * - `bits = ptrSize * 8` - total bit capacity of the pointer.
 * - `tagShift = bits - 2` - position of the tag field; the top 2 bits are reserved.
 * - `payloadMask = (1n << tagShift) - 1n` - isolates all non-tag bits.
 *
 * From `payloadMask` the layout derives `inlineMask` and `farOffMask` (both equal
 * to `payloadMask`), `inlineBytes` as `(bits - 2) >> 3`, and `farTag` as the
 * pre-shifted far tag constant.
 *
 * `returnBig` is set to `true` when `bits > 48`, meaning pointer values must be
 * returned as `BigInt` to avoid precision loss in JavaScript number arithmetic.
 *
 * The result is purely deterministic and independent of heap state; it encodes
 * only structural rules for pointer interpretation.
 *
 * @example
 * ```ts
 * const layout = buildLayout(4);
 * layout.inlineBytes; // 3 - a 32-bit pointer can embed up to 3 bytes inline
 * ```
 *
 * @since 3.0.0
 */

export function buildLayout(ptrSize: PointerSizeType): LayoutInterface {
    const bits = ptrSize * 8;
    const tagShift = BigInt(bits - 2);
    const payloadMask = (1n << tagShift) - 1n;

    return {
        bits,
        tagShift,
        returnBig: bits > 48,
        inlineMask: payloadMask,
        farOffMask: payloadMask,
        inlineBytes: (bits - 2) >> 3,
        farTag: TAG_FAR << tagShift
    };
}

/**
 * Returns the {@link LayoutInterface} for the given pointer size, building it on first access.
 *
 * @param ptrSize - Pointer width in bytes. Must be a valid {@link PointerSizeType}.
 * @returns The cached or newly constructed {@link LayoutInterface} for `ptrSize`.
 *
 * @remarks
 * Memoizes {@link buildLayout} using {@link cache}. On the first call for a given
 * `ptrSize` the layout is built and stored; all later calls return the cached
 * instance directly with a single Map lookup.
 *
 * @example
 * ```ts
 * const layout = getLayout(4);
 * layout.inlineBytes; // 3
 * ```
 *
 * @see buildLayout
 * @since 3.0.0
 */

export function getLayout(ptrSize: PointerSizeType): LayoutInterface {
    let layout = cache.get(ptrSize);
    if (layout !== undefined) return layout;

    layout = buildLayout(ptrSize);
    cache.set(ptrSize, layout);

    return layout;
}

/**
 * Encodes a non-negative integer into variable-length integer (varint) format.
 *
 * @param buf - Target buffer to write into. Must have enough capacity at `position`.
 * @param position - Byte offset in `buf` at which to begin writing.
 * @param value - Non-negative integer to encode.
 * @returns The number of bytes written.
 *
 * @remarks
 * Uses 7-bit continuation encoding: each output byte carries 7 data bits in its
 * lower bits and sets the MSB to `1` when more bytes follow. The final byte has
 * MSB `0`. A value of `0` encodes as a single `0x00` byte; values up to `127`
 * encode as one byte; larger values grow by one byte per additional 7 bits.
 *
 * Used by {@link heapWrite} to prefix far-pointer payloads with their length so
 * {@link heapRead} can recover the length without storing it in the pointer itself.
 *
 * @example
 * ```ts
 * const buf = Buffer.alloc(4);
 * const written = varintWrite(buf, 0, 128); // written === 2
 * ```
 *
 * @see varintRead
 * @since 3.0.0
 */

export function varintWrite(buf: Buffer, position: number, value: number): number {
    let written = 0;
    let n = value;

    while (n > 0x7F) {
        buf[position + written++] = (n & 0x7F) | 0x80;
        n >>>= 7;
    }

    buf[position + written++] = n & 0x7F;

    return written;
}

/**
 * Decodes a variable-length integer (varint) from a buffer.
 *
 * @param buf - Source buffer containing the encoded varint.
 * @param position - Byte offset in `buf` at which to begin reading.
 * @returns A tuple of `[value, bytesRead]` where `value` is the decoded integer
 * and `bytesRead` is the number of bytes consumed.
 *
 * @remarks
 * Reverses the encoding produced by {@link varintWrite}. Reads bytes starting at
 * `position`, accumulating 7-bit groups until a byte with MSB `0` is encountered.
 * Each group is shifted left by 7 bits times its position index before being added
 * to the accumulator.
 *
 * Used by {@link heapRead} to recover the payload length from the varint prefix
 * written by {@link heapWrite} for far pointers.
 *
 * @example
 * ```ts
 * const [ len, bytesRead ] = varintRead(buf, 0);
 * ```
 *
 * @see varintWrite
 * @since 3.0.0
 */

export function varintRead(buf: Buffer, position: number): [ value: number, bytesRead: number ] {
    let value = 0;
    let shift = 0;
    let bytesRead = 0;
    let byte: number;

    do {
        byte = buf[position + bytesRead++];
        value += (byte & 0x7F) * (1 << shift);
        shift += 7;
    } while (byte & 0x80);

    return [ value, bytesRead ];
}

/**
 * Decodes a heap pointer and returns the buffer slice it references.
 *
 * @param ptr - Encoded heap pointer produced by {@link heapWrite}. Accepted as
 * either `number` or `bigint` regardless of the pointer width used during encoding.
 * @param ptrSize - Pointer width in bytes used to select the layout for decoding.
 * Defaults to `4`.
 * @returns A `Buffer` view of the referenced data. Inline pointers return a freshly
 * allocated `Buffer`; packed and far pointers return a zero-copy `subarray` of
 * `this.buffer`.
 *
 * @remarks
 * The pointer is first normalized by masking to its active bit width to handle
 * sign-extended or oversized values safely before tag extraction.
 *
 * Decoding is selected by the top 2 bits of the normalized pointer:
 *
 * - `TAG_INLINE` - payload bytes are embedded directly in the pointer value.
 *   Each byte is extracted from the payload region via 8-bit shifts and written
 *   into a newly allocated `Buffer`. The heap buffer is not accessed.
 * - `TAG_PACKED` - the pointer encodes a heap offset and a payload length using
 *   the fixed packed ABI (`PACKED_LEN_BITS` / `PACKED_LEN_MASK`). Returns a
 *   zero-copy `subarray` of `this.buffer`. No length header exists in the heap.
 * - `TAG_FAR` - the pointer encodes only a heap offset. A varint length prefix is
 *   read from `this.buffer` at that offset via {@link varintRead}, and the payload
 *   is returned as a `subarray` immediately following the header.
 *
 * A pointer whose top 2 bits are `0b11` uses the reserved tag, which {@link heapWrite}
 * never produces and which has no defined encoding; it decodes to an empty `Buffer`.
 *
 * @example
 * ```ts
 * const buf = heapRead.call(ctx, ptr, 4);
 * ```
 *
 * @see heapWrite
 * @since 3.0.0
 */

export function heapRead(this: HeapContextInterface, ptr: PointerType, ptrSize: PointerSizeType = 4): Buffer {
    const layout = getLayout(ptrSize);
    const normalized = BigInt(ptr) & ((1n << BigInt(layout.bits)) - 1n);

    switch ((normalized >> layout.tagShift) & 0x3n) {
        case TAG_INLINE: {
            const payload = normalized & layout.inlineMask;
            if (payload === 0n) return Buffer.alloc(0);

            const len = Number(payload & INLINE_LEN_MASK);
            const out = Buffer.allocUnsafe(len);
            for (let i = 0; i < len; i++) {
                out[i] = Number((payload >> (INLINE_LEN_BITS + BigInt(i * 8))) & 0xFFn);
            }

            return out;
        }

        case TAG_PACKED: {
            const len = Number(normalized & PACKED_LEN_MASK);
            const off = Number((normalized >> PACKED_LEN_BITS) & BigInt(PACKED_MAX_OFF));

            return this.buffer.subarray(off, off + len);
        }

        case TAG_FAR: {
            const off = Number(normalized & layout.farOffMask);
            const [ len, headerLen ] = varintRead(this.buffer, off);

            return this.buffer.subarray(off + headerLen, off + headerLen + len);
        }

        default: {
            return Buffer.alloc(0);
        }
    }
}

/**
 * Writes a buffer into the heap and returns an encoded pointer.
 *
 * @param data - Payload to store. Its `byteLength` determines which encoding tier is used.
 * @param ptrSize - Pointer width in bytes used for encoding. Defaults to `4`.
 * @returns An encoded pointer as a `number` for pointer sizes up to 48 bits, or a
 * `bigint` for wider sizes where JavaScript number precision would be insufficient.
 *
 * @throws {@link xStructRangeError} when `this.top` has reached or exceeded
 * `layout.farOffMask` before any heap writing occurs. The error carries `actual` as
 * the current `this.top` value, `min` as `0n`, and `max` as `layout.farOffMask`.
 * This check runs before the packed path, so it fires even when the payload would
 * otherwise qualify for packed encoding.
 *
 * @remarks
 * Encodes the payload using one of three strategies, selected in order:
 *
 * 1. Inline - `data.byteLength <= layout.inlineBytes`.
 *    Bytes packed directly into the pointer value using 8-bit shifts. No heap write occurs and `this.top`
 *    is not modified.
 *
 * 2. Packed - `data.byteLength <= PACKED_MAX_LEN` and `this.top <= PACKED_MAX_OFF`.
 *    Data is copied into `this.buffer` at the current offset with no length header.
 *    The pointer encodes both offset and length using the fixed packed ABI
 *    (`PACKED_LEN_BITS`).
 *
 * 3. Far - all other cases. A varint length prefix is written into `this.buffer`
 *    immediately before the payload via {@link varintWrite}. The pointer encodes
 *    only the heap offset; the length is recovered at read time by {@link heapRead}
 *    using {@link varintRead}.
 *
 * For paths 2 and 3, `this.buffer` is grown via {@link bufferGrow} before writing
 * when `this.top + data.byteLength + 10 > this.buffer.byteLength`.
 *
 * @example
 * ```ts
 * // Inline: payload fits in pointer bits, heap untouched
 * const ptr = heapWrite.call(ctx, Buffer.from([ 0x01 ]), 4);
 *
 * // Packed: small payload, fixed ABI, no varint header
 * const ptr = heapWrite.call(ctx, Buffer.alloc(32, 0xFF), 4);
 *
 * // Far: large payload, varint-prefixed in heap
 * const ptr = heapWrite.call(ctx, largeBuffer, 8);
 * ```
 *
 * @see heapRead
 * @see bufferGrow
 * @see varintWrite
 *
 * @since 3.0.0
 */

export function heapWrite(this: HeapContextInterface, data: Buffer, ptrSize: PointerSizeType = 4): PointerType {
    const layout = getLayout(ptrSize);
    const len = data.byteLength;

    if (len <= layout.inlineBytes) {
        let payload = BigInt(len); // low 4 bits = length
        for (let i = 0; i < len; i++) payload |= BigInt(data[i]) << (INLINE_LEN_BITS + BigInt(i * 8));
        const ptr = (TAG_INLINE << layout.tagShift) | (payload & layout.inlineMask);

        return layout.returnBig ? ptr : Number(ptr);
    }

    if (BigInt(this.top) >= layout.farOffMask) {
        throw new xStructRangeError('Heap has overflow the addressable for this pointer size', {
            actual: this.top,
            min: 0n,
            max: layout.farOffMask
        });
    }

    const needed = len + 10;
    if (this.top + needed > this.buffer.byteLength) this.buffer = bufferGrow(this.buffer, needed);
    const off = this.top;

    if (len <= PACKED_MAX_LEN && off <= PACKED_MAX_OFF) {
        const ptr = (BigInt(off) << PACKED_LEN_BITS) | BigInt(len);
        if (ptr <= (1n << BigInt(layout.bits - 2)) - 1n) {
            data.copy(this.buffer, off);
            this.top += len;

            return layout.returnBig ? ptr : Number(ptr);
        }
    }

    const vlen = varintWrite(this.buffer, off, len);
    data.copy(this.buffer, off + vlen);
    this.top += vlen + len;
    const ptr = layout.farTag | BigInt(off);

    return layout.returnBig ? ptr : Number(ptr);
}
