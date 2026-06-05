/**
 * Cursor state used for sequential parsing of an input string.
 *
 * @remarks
 * Represents the mutable parsing state used by all expression scanning
 * and builder functions. The cursor advances as the parser consumes input.
 *
 * This structure is the core context object for the expression parser and
 * is passed through all parsing stages.
 *
 * @example
 * ```ts
 * const cursor: CursorType = {
 * source: "u32le[4]",
 * index: 0
 * };
 * ```
 *
 * @since 3.0.0
 */

export type CursorType = {
    /**
     * Current position within the source string.
     * @since 3.0.0
     */

    index: number;

    /**
     * Input source string being parsed.
     * @since 3.0.0
     */

    source: string;
};
