/**
 * Imports
 */

import { isString } from './strings.pipe';

/**
 * Tests
 */

test('isString detects string pipe', () => {
    expect(isString('utf8')).toBe(true);
    expect(isString('u32le')).toBe(false);
});
