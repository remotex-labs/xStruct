/**
 * Grows a Buffer using exponential capacity doubling.
 *
 * @param buffer - Source buffer to grow from
 * @param extra - Additional bytes required beyond current capacity
 * @returns A new buffer with increased capacity containing copied data
 *
 * @remarks
 * Allocates a new buffer with enough capacity to fit the existing
 * data plus the requested additional space, then copies the original contents into the new buffer.
 *
 * The growth strategy follows a power-of-two exponential policy:
 * - Initial capacity defaults to 256 bytes
 * - Capacity doubles until it satisfies the required size
 *
 * This minimizes reallocations while maintaining amortized O(1)
 * append performance for sequential writes.
 *
 * The function does not mutate the original buffer.
 * Instead, it returns a newly allocated buffer containing the previous contents.
 *
 * @example
 * ```ts
 * const buf = Buffer.alloc(10);
 * const grown = bufferGrow(buf, 100);
 * ```
 *
 * @since 3.0.0
 */

export function bufferGrow(buffer: Buffer, extra: number): Buffer {
    const offset = buffer.byteLength;
    const required = offset + extra;

    let cap = offset || 256;
    while (cap < required) cap *= 2;

    const next = Buffer.allocUnsafe(cap);
    if (offset > 0) buffer.copy(next, 0, 0, offset);

    return next;
}
