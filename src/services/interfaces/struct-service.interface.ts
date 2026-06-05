/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { HeapRuntimeInterface, PointerSizeType } from '@interfaces/heap.interface';

/**
 * Construction options for {@link Struct} and {@link Union}.
 *
 * @remarks
 * Every option is optional; an empty object yields a struct with a 4-byte pointer
 * width that inherits its parent's context when nested.
 *
 * @example
 * ```ts
 * const options: StructOptionsInterface = { pointerSize: 8, inherit: false };
 * ```
 *
 * @see {@link Struct}
 *
 * @since 3.0.0
 */

export interface StructOptionsInterface {
    /**
     * Externally supplied heap to write into and read from.
     *
     * @remarks
     * When provided as a root, it is used instead of a per-call local heap, letting
     * several structs pool their pointer payloads into one heap region you control.
     *
     * When nested, this heap is used only if {@link StructOptionsInterface.inherit} is
     * `false`; otherwise the struct shares its parent's heap and this option is ignored.
     *
     * @since 3.0.0
     */

    heap?: HeapRuntimeInterface;

    /**
     * Pointer width, in bytes, for heap-backed fields. Defaults to `4`.
     *
     * @since 3.0.0
     */

    pointerSize?: PointerSizeType;

    /**
     * Whether a nested struct inherits its parent's context. Defaults to `true`.
     *
     * @remarks
     * Governs both pointer size and heap when this struct is embedded as a field:
     *
     * - `true` (default): the struct recompiles for the parent's pointer size and
     *   writes its pointer payloads into the parent's shared heap.
     * - `false`: the struct keeps its own pointer size and, when a
     *   {@link StructOptionsInterface.heap} is supplied, writes into that heap instead
     *   of the parent's. It behaves as a standalone struct even when nested.
     *
     * @since 3.0.0
     */

    inherit?: boolean;
}
