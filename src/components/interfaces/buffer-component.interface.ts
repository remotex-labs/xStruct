/**
 * Represents a buffer read method that returns a value of type T
 *
 * @template T - The type of value returned by the read method
 * @returns The value read from the buffer as type T
 * @since 2.0.0
 */

export type ReadMethodType<T extends number | bigint> = (offset?: number) => T;

/**
 * Represents a buffer write method that accepts a value of type T
 *
 * @template T - The type of value accepted by the write method
 * @returns The number of bytes written to the buffer
 * @since 2.0.0
 */

export type WriteMethodType<T extends number | bigint> = (value: T, offset?: number) => number;
