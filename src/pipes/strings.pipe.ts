/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { StringPipeType } from '@pipes/interfaces/strings-pipe.interface';

/**
 * Tuple of all supported string-encoding pipe identifiers.
 *
 * @remarks
 * Defines the complete set of string encodings recognized by the pipe system.
 * Used at runtime by {@link isString} to validate encoding names, and at the
 * type level as the source for {@link StringPipeType}.
 *
 * @since 3.0.0
 */

export const StringPipe = [ 'utf8', 'ascii', 'latin1', 'utf16le' ] as const;

/**
 * Checks whether a type identifier is a valid string primitive pipe key.
 *
 * @remarks
 * Performs a runtime lookup against {@link StringPipe} to determine
 * whether the provided name corresponds to a supported string encoding.
 *
 * @example
 * ```ts
 * isString('utf8');   // true
 * isString('u32le');  // false
 * ```
 *
 * @see StringPipe
 * @since 3.0.0
 */

export function isString(name: string): name is StringPipeType {
    return StringPipe.includes(<StringPipeType> name);
}
