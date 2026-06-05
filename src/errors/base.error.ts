/**
 * Base error class for the xStruct Core library.
 *
 * @remarks
 * Extends the native {@link Error} and fixes two transpilation pitfalls that affect all derived error classes.
 * First, `Object.setPrototypeOf` restores the correct
 * prototype so `instanceof` checks work reliably after TypeScript or Babel compilation.
 * Second, `Error.captureStackTrace` is called when available so the constructor frame
 * is stripped from the stack trace, leaving only the throw site.
 *
 * Subclasses pass their display name through the `name` parameter of `super()`.
 * The `name` field is set before the prototype is fixed so it is always visible on
 * the instance regardless of how the subclass is compiled.
 *
 * {@link toJSON} collects all non-null enumerable own properties added by subclasses,
 * then overwrites `name`, `message`, and `stack` so those three fields always reflect
 * the actual error state even if a subclass assigns a conflicting key.
 *
 * @example
 * ```ts
 * class HeapOverflowError extends xStructBaseError {
 *     readonly offset: number;
 *
 *     constructor(offset: number, max: number) {
 *         super(`heap offset ${ offset } exceeds max ${ max }`, 'HeapOverflowError');
 *         this.offset = offset;
 *     }
 * }
 *
 * const err = new HeapOverflowError(512, 255);
 * err instanceof xStructBaseError; // true
 * err.toJSON();
 * // { offset: 512, name: 'HeapOverflowError', message: '...', stack: '...' }
 * ```
 *
 * @since 1.0.0
 */

export class xStructBaseError extends Error {
    /**
     * Creates an {@link xStructBaseError} instance.
     *
     * @param message - Human-readable description of the error condition.
     * @param name - Value written to {@link Error.name}, used as the error identifier
     * in logs and `toJSON` output. Defaults to `'xStructError'`.
     *
     * @since 1.0.0
     */

    constructor(message: string, name: string = 'xStructError') {
        super(message);

        this.name = name;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace?.(this, this.constructor);
    }

    /**
     * Serializes the error to a plain JSON-safe object.
     *
     * @remarks
     * Collects all enumerable own properties whose value is not `null` or `undefined`,
     * then merges `name`, `message`, and `stack` on top so they always reflect the
     * current instance state. The merge order means subclass properties appear first
     * in the result and the three standard fields always win on key collision.
     *
     * @returns Plain object containing `name`, `message`, `stack`, and any additional
     * enumerable own properties set by the subclass.
     *
     * @since 1.0.0
     */

    toJSON(): Record<string, unknown> {
        const extra = Object.fromEntries(
            Object.entries(this).filter(([ , v ]) => v != null)
        );

        return {
            ...extra,
            name: this.name,
            message: this.message,
            stack: this.stack
        };
    }
}
