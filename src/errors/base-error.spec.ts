/**
 * Imports
 */

import { xStructBaseError } from '@errors/base.error';

/**
 * Tests
 */

describe('BaseError', () => {
    describe('constructor', () => {
        test('should create an instance with the provided message', () => {
            const message = 'Test error message';
            const error = new xStructBaseError(message);

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(xStructBaseError);
            expect(error.message).toBe(message);
            expect(error.name).toBe('xStructError');
        });

        test('should capture a stack trace', () => {
            const error = new xStructBaseError('Test error');
            expect(error.stack).toBeDefined();
        });
    });

    describe('toJSON', () => {
        test('should convert the error to a plain object with standard properties', () => {
            const message = 'Test error message';
            const error = new xStructBaseError(message);
            const jsonObject = error.toJSON();

            expect(jsonObject).toHaveProperty('message', message);
            expect(jsonObject).toHaveProperty('name');
            expect(jsonObject).toHaveProperty('stack');
        });

        test('should include custom properties in the JSON representation', () => {
            const error = new xStructBaseError('Test error');
            (error as any).code = 'ERR_CUSTOM';
            (error as any).statusCode = 400;

            const jsonObject = error.toJSON();

            expect(jsonObject).toHaveProperty('code', 'ERR_CUSTOM');
            expect(jsonObject).toHaveProperty('statusCode', 400);
        });

        test('should work correctly with JSON.stringify', () => {
            const error = new xStructBaseError('Test error');
            (error as any).extraData = { foo: 'bar' };

            const serialized = JSON.parse(JSON.stringify(error));

            expect(serialized).toHaveProperty('message', 'Test error');
            expect(serialized).toHaveProperty('extraData', { foo: 'bar' });
        });
    });

    describe('inheritance', () => {
        class CustomTestError extends xStructBaseError {
            constructor(message: string, public readonly code: string) {
                super(message);
                this.name = 'CustomTestError';
            }
        }

        test('should work with extended classes', () => {
            const error = new CustomTestError('Custom error message', 'ERR_CUSTOM');

            expect(error).toBeInstanceOf(xStructBaseError);
            expect(error).toBeInstanceOf(CustomTestError);
            expect(error.message).toBe('Custom error message');
            expect(error.name).toBe('CustomTestError');
            expect(error.code).toBe('ERR_CUSTOM');
        });

        test('should serialize extended classes correctly', () => {
            const error = new CustomTestError('Custom error message', 'ERR_CUSTOM');
            const jsonObject = error.toJSON();

            expect(jsonObject).toHaveProperty('message', 'Custom error message');
            expect(jsonObject).toHaveProperty('name', 'CustomTestError');
            expect(jsonObject).toHaveProperty('code', 'ERR_CUSTOM');
        });
    });
});
