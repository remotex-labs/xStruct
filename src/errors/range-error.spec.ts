/**
 * Imports
 */

import { xStructBaseError } from '@errors/base.error';
import { xStructRangeError } from '@errors/range.error';

/**
 * Tests
 */

describe('xStructRangeError', () => {
    describe('prototype chain', () => {
        test('is an instance of xStructRangeError', () => {
            const err = new xStructRangeError('out of range', { actual: 5, min: 0, max: 4 });

            expect(err).toBeInstanceOf(xStructRangeError);
        });

        test('is an instance of xStructBaseError', () => {
            const err = new xStructRangeError('out of range', { actual: 5, min: 0, max: 4 });

            expect(err).toBeInstanceOf(xStructBaseError);
        });

        test('is an instance of Error', () => {
            const err = new xStructRangeError('out of range', { actual: 5, min: 0, max: 4 });

            expect(err).toBeInstanceOf(Error);
        });
    });

    describe('fields', () => {
        test.each`
            field       | actual | min  | max  | expected
            ${ 'actual' } | ${ 5 } | ${ 0 } | ${ 4 } | ${ 5 }
            ${ 'min' }    | ${ 5 } | ${ 0 } | ${ 4 } | ${ 0 }
            ${ 'max' }    | ${ 5 } | ${ 0 } | ${ 4 } | ${ 4 }
        `('sets $field correctly', ({ field, actual, min, max, expected }: Record<string, any>) => {
            const err = new xStructRangeError('out of range', { actual, min, max });

            expect(err[field as keyof xStructRangeError]).toBe(expected);
        });

        test('sets message', () => {
            const err = new xStructRangeError('out of range', { actual: 5, min: 0, max: 4 });

            expect(err.message).toBe('out of range');
        });

        test('sets name to xStructRangeError', () => {
            const err = new xStructRangeError('out of range', { actual: 5, min: 0, max: 4 });

            expect(err.name).toBe('xStructRangeError');
        });

        test('has a non-empty stack trace', () => {
            const err = new xStructRangeError('out of range', { actual: 5, min: 0, max: 4 });

            expect(err.stack).toEqual(expect.any(String));
            expect(err.stack!.length).toBeGreaterThan(0);
        });
    });

    describe('bigint range values', () => {
        test.each`
            field         | expected
            ${ 'actual' } | ${ 64n }
            ${ 'min' }    | ${ 0n }
            ${ 'max' }    | ${ 63n }
        `('stores bigint $field correctly', ({ field, expected }) => {
            const err = new xStructRangeError('bigint overflow', { actual: 64n, min: 0n, max: 63n });

            expect(err[field as keyof xStructRangeError]).toBe(expected);
        });
    });

    describe('toJSON', () => {
        test('includes name, message, and stack', () => {
            const err = new xStructRangeError('out of range', { actual: 5, min: 0, max: 4 });

            expect(err.toJSON()).toMatchObject({
                name: 'xStructRangeError',
                message: 'out of range',
                stack: expect.any(String)
            });
        });

        test('includes actual, min, and max', () => {
            const err = new xStructRangeError('out of range', { actual: 5, min: 0, max: 4 });

            expect(err.toJSON()).toMatchObject({ actual: 5, min: 0, max: 4 });
        });

        test('omits null and undefined own properties', () => {
            const err = new xStructRangeError('out of range', { actual: 5, min: 0, max: 4 });
            (err as any).extra = null;

            expect(err.toJSON()).not.toHaveProperty('extra');
        });
    });
});
