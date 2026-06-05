/**
 * Imports
 */

import { bufferGrow } from '@components/buffer.component';

/**
 * Tests
 */

describe('bufferGrow', () => {
    test('grows empty buffer using default capacity (256)', () => {
        const buf = Buffer.alloc(0);
        const next = bufferGrow(buf, 10);

        expect(next.length).toBeGreaterThanOrEqual(256);
        expect(next.length).toBeGreaterThanOrEqual(10);
    });

    test('copies existing buffer content correctly', () => {
        const buf = Buffer.from('hello');
        const next = bufferGrow(buf, 10);

        expect(next.toString('utf8', 0, 5)).toBe('hello');
    });

    test('keeps exact content for zero extra growth', () => {
        const buf = Buffer.from('abc');
        const next = bufferGrow(buf, 0);

        expect(next.toString('utf8', 0, 3)).toBe('abc');
        expect(next.length).toBeGreaterThanOrEqual(buf.length);
    });

    test('expands capacity sufficiently for required size', () => {
        const buf = Buffer.alloc(100).fill(1);
        const next = bufferGrow(buf, 200);

        expect(next.length).toBeGreaterThanOrEqual(300);
    });

    test('scales up for large growth requests', () => {
        const buf = Buffer.alloc(200);
        const next = bufferGrow(buf, 900);

        expect(next.length).toBeGreaterThanOrEqual(1100);
    });

    test('does not mutate original buffer', () => {
        const buf = Buffer.from('immutable');
        bufferGrow(buf, 50);

        expect(buf.toString()).toBe('immutable');
    });
});
