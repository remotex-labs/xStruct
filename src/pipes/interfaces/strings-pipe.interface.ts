/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { StringPipe } from '@pipes/strings.pipe';

/**
 * All supported string pipe write operation keys.
 *
 * @remarks
 * Represents the union of all available string encoding operations in
 * {@link StringPipe}.
 *
 * @example
 * ```ts
 * type A = StringPipeType; // "utf8" | "ascii" | "latin1" | "utf16le" ...
 * ```
 *
 * @see writeStringPipe
 * @since 3.0.0
 */

export type StringPipeType = typeof StringPipe[number];
