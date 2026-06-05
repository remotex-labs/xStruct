/**
 * Imports
 */

import { xStructBaseError } from '@errors/base.error';

/**
 * Thrown when a numeric value falls outside its permitted range.
 *
 * @remarks
 * Extends {@link xStructBaseError} to carry the offending value alongside the
 * inclusive bounds that were violated, so catch sites and structured logs have
 * everything needed to diagnose the problem without parsing the message string.
 *
 * The `actual`, `min`, and `max` fields are all typed as `number | bigint` to
 * cover both regular heap offsets and wide-pointer BigInt values without
 * lossy conversion.
 *
 * @example
 * ```ts
 * throw new xStructRangeError('heap offset exceeds far field', {
 *     actual: off,
 *     min: 0,
 *     max: layout.farOffMask
 * });
 *
 * // err.toJSON()
 * // { actual: 64, min: 0, max: 63, name: 'xStructRangeError', message: '...', stack: '...' }
 * ```
 *
 * @since 3.0.0
 */

export class xStructRangeError extends xStructBaseError {
    /**
     * The value that violated the range constraint.
     * @since 3.0.0
     */

    readonly actual: number | bigint;

    /**
     * Inclusive lower bound of the permitted range.
     * @since 3.0.0
     */

    readonly min: number | bigint;

    /**
     * Inclusive upper bound of the permitted range.
     * @since 3.0.0
     */

    readonly max: number | bigint;

    /**
     * Creates an {@link xStructRangeError} instance.
     *
     * @param message - Human-readable description of the range violation.
     * @param range - Object containing `actual`, `min`, and `max` values that
     * describe what was received and what the valid bounds are.
     *
     * @since 3.0.0
     */

    constructor(message: string, range: { actual: number | bigint; min: number | bigint; max: number | bigint }) {
        super(message, 'xStructRangeError');

        this.min = range.min;
        this.max = range.max;
        this.actual = range.actual;
    }
}
