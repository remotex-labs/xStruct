/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { ExpressionErrorCode } from '@constants/expression.constant';

/**
 * Imports
 */

import { xStructBaseError } from '@errors/base.error';

/**
 * Structured parser error used by the expression parsing system.
 *
 * @remarks
 * Represents a syntax or semantic parsing failure produced while
 * parsing descriptor expressions.
 *
 * Stores:
 * - The parser error code
 * - Original input source
 * - Failure position within the source
 * - Fully formatted human-readable message
 *
 * @see ExpressionErrorCode
 * @since 3.0.0
 */

export class xStructExpressionError extends xStructBaseError {
    /**
     * Creates a new structured expression parsing error.
     *
     * @param message - Human-readable error message
     * @param source - Original expression source string
     * @param position - Zero-based parser failure position
     * @param code - Structured parser error code
     *
     * @example
     * ```ts
     * new xStructExpressionError(
     *   'Expected an integer, got end of input',
     *   'u32le:',
     *   6,
     *   ExpressionErrorCode.ExpectedInteger
     * );
     * ```
     *
     * @since 3.0.0
     */

    constructor(message: string, readonly source: string, readonly position: number, readonly code: ExpressionErrorCode) {
        super(message, 'xStructExpressionError');
    }
}
