/**
 * Imports
 */

import { xStructExpressionError } from './expression.error';
import { ExpressionErrorCode } from '@constants/expression.constant';

/**
 * Tests
 */

describe('xStructExpressionError', () => {
    test('stores structured fields correctly', () => {
        const err = new xStructExpressionError('Some message', 'u32le:', 5, ExpressionErrorCode.ExpectedInteger);

        expect(err.name).toBe('xStructExpressionError');
        expect(err.source).toBe('u32le:');
        expect(err.position).toBe(5);
        expect(err.code).toBe(ExpressionErrorCode.ExpectedInteger);
    });

    test('is instance of Error and xStructExpressionError', () => {
        const err = new xStructExpressionError('Some message', 'x', 0, ExpressionErrorCode.EmptyExpression);

        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(xStructExpressionError);
    });
});
