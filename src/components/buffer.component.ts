/**
 * Import will remove at compile time
 */

import type { ReadMethodType, WriteMethodType } from '@components/interfaces/buffer-component.interface';

/**
 * Retrieves a bound buffer method for reading from or writing to a Buffer
 *
 * @template T - The type of the returned buffer method
 *
 * @param buffer - The Buffer instance to get the method from
 * @param operation - The operation type ('read' or 'write')
 * @param type - The data type to read or write (e.g., 'UInt8', 'Int16LE')
 * @returns The bound buffer method of the specified type
 *
 * @throws Error - When the type parameter is empty or invalid
 * @throws Error - When the method does not exist on the Buffer object
 *
 * @remarks
 * This is a utility function that dynamically retrieves and binds Buffer methods.
 * It constructs method names by combining the operation and type parameters.
 * The returned method is bound to the buffer instance for immediate use.
 *
 * @example
 * ```ts
 * const buffer = Buffer.from([0x01, 0x02, 0x03, 0x04]);
 * const readUInt16LE = getBufferMethod<(offset: number) => number>(buffer, 'read', 'UInt16LE');
 * const value = readUInt16LE(0); // Returns 513 (0x0201)
 * ```
 *
 * @since 2.0.0
 */

export function getBufferMethod<T>(buffer: Buffer, operation: 'read' | 'write', type: string): T {
    const methodName = `${operation}${type}` as keyof Buffer;
    const method = <WriteMethodType<number>> buffer[methodName];

    if (!type)
        throw new Error(`Invalid type(${ type }) parameter`);

    if (!(methodName in buffer))
        throw new Error(`Method "${ methodName.toString() }" does not exist on Buffer`);

    return method.bind(buffer) as T;
}

/**
 * Gets a bound read method from a Buffer for the specified data type
 *
 * @template T - The type of value that will be read, defaults to number (number | bigint)
 *
 * @param buffer - The Buffer instance to read from
 * @param type - The data type to read (e.g., 'UInt8', 'Int16LE')
 * @returns A bound read method of the specified type
 *
 * @throws Error - When the type parameter is empty or invalid
 * @throws Error - When the method does not exist on the Buffer object
 *
 * @remarks
 * This function is a specialized wrapper around getBufferMethod that
 * specifically retrieves read methods from the Buffer instance.
 * It simplifies the API by fixing the operation parameter to 'read'.
 *
 * @example
 * ```ts
 * const buffer = Buffer.from([0x01, 0x02, 0x03, 0x04]);
 * const readUInt16LE = readMethod(buffer, 'UInt16LE');
 * const value = readUInt16LE(0); // Returns 513 (0x0201)
 * ```
 *
 * @see getBufferMethod - The underlying implementation
 * @since 2.0.0
 */

export function readMethod<T extends number | bigint = number>(buffer: Buffer, type: string): ReadMethodType<T> {
    return getBufferMethod<ReadMethodType<T>>(buffer, 'read', type);
}

/**
 * Gets a bound write method from a Buffer for the specified data type
 *
 * @template T - The type of value that will be written, defaults to number
 *
 * @param buffer - The Buffer instance to write to
 * @param type - The data type to write (e.g., 'UInt8', 'Int16LE')
 * @returns A bound write method of the specified type
 *
 * @throws Error - When the type parameter is empty or invalid
 * @throws Error - When the method does not exist on the Buffer object
 *
 * @remarks
 * This function is a specialized wrapper around getBufferMethod that
 * specifically retrieves write methods from the Buffer instance.
 * It simplifies the API by fixing the operation parameter to 'write'.
 *
 * @example
 * ```ts
 * const buffer = Buffer.alloc(4);
 * const writeUInt16LE = writeMethod(buffer, 'UInt16LE');
 * writeUInt16LE(513, 0); // Writes [0x01, 0x02, 0x00, 0x00] to buffer
 * ```
 *
 * @see getBufferMethod - The underlying implementation
 * @since 2.0.0
 */

export function writeMethod<T extends number | bigint = number>(buffer: Buffer, type: string): WriteMethodType<T> {
    return getBufferMethod<WriteMethodType<T>>(buffer, 'write', type);
}

/**
 * Splits a buffer into two parts with an optional gap between them
 *
 * @param buffer - The Buffer instance to split
 * @param splitPosition - The position at which to split the buffer
 * @param skipBytes - The number of bytes to skip after the split position
 * @returns A tuple containing two Buffer instances: the portion before the split and the portion after the gap
 *
 * @throws Error - When the split position is negative
 * @throws Error - When the split position exceeds the buffer length
 *
 * @remarks
 * This function divides a buffer at the specified position and allows skipping a number of bytes
 * after the split position before creating the second buffer.
 * If the skip extends beyond the buffer's length, the second buffer will be empty.
 *
 * @example
 * ```ts
 * const buffer = Buffer.from([1, 2, 3, 4, 5, 6]);
 * const [first, second] = splitBufferWithGap(buffer, 2, 1);
 * // first: Buffer [1, 2]
 * // second: Buffer [4, 5, 6]
 * ```
 *
 * @since 2.0.0
 */

export function splitBufferWithGap(buffer: Buffer, splitPosition: number, skipBytes: number = 0): [ Buffer, Buffer ] {
    if (splitPosition < 0)
        throw new Error('Split position cannot be negative');

    if (splitPosition > buffer.length)
        throw new Error('Split position cannot exceed buffer length');

    const beforeSplit = buffer.subarray(0, splitPosition);
    const afterPosition = splitPosition + skipBytes;

    if (afterPosition >= buffer.length)
        return [ beforeSplit, Buffer.alloc(0) ];

    return [ beforeSplit, buffer.subarray(afterPosition) ];
}
