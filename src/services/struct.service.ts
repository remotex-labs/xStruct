
/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { ContextInterface } from './interfaces/schema-service.interface';
import type { HeapRuntimeInterface, PointerSizeType } from '@interfaces/heap.interface';
import type { HeapContextInterface } from '@services/interfaces/heap-service.interface';
import type { DefinitionItemType, SchemaType } from './interfaces/schema-service.interface';
import type { StructOptionsInterface } from '@services/interfaces/struct-service.interface';

/**
 * Imports
 */

import { schemaParse } from './schema.service';
import { xStructBaseError } from '@errors/base.error';
import { heapRead, heapWrite } from '@services/heap.service';

/**
 * Compiles a schema once and serializes objects to and from binary buffers.
 *
 * @template T - Shape of the object this struct represents.
 *
 * @remarks
 * The schema is parsed a single time in the constructor into a flat field map and a
 * fixed `size`, which every later {@link Struct.toBuffer} / {@link Struct.toObject}
 * call reuses. Variable-length fields resolve through a heap: a root struct owns its
 * heap and appends it to the returned buffer, while a nested struct shares its parent's.
 *
 * @example
 * ```ts
 * const point = new Struct<{ x: number; y: number }>({ x: 'i32le', y: 'i32le' });
 * const buf = point.toBuffer({ x: 1, y: 2 });
 * point.toObject(buf); // { x: 1, y: 2 }
 * ```
 *
 * @see schemaParse
 * @since 3.0.0
 */

export class Struct<T extends object = object> {
    /**
     * Fixed (stack) size of the layout in bytes.
     *
     * @remarks
     * Counts only the fixed part of the struct. Pointer-backed fields contribute one
     * {@link Struct.pointerSize}-byte slot here; their variable-length payloads live in
     * the heap region appended after the struct, which is not included in this value.
     * Computed once in the constructor by {@link schemaParse}.
     *
     * @since 3.0.0
     */

    readonly size: number;

    /**
     * Pointer width, in bytes, the layout was compiled for.
     *
     * @remarks
     * Resolved from `options.pointerSize` (defaulting to `4`) and used for every
     * heap-backed field. A nested struct may differ from its parent unless it inherits
     * the parent's pointer size.
     *
     * @see PointerSizeType
     * @since 3.0.0
     */

    readonly pointerSize: PointerSizeType;

    /**
     * Compiled fields keyed by name, in declaration order.
     *
     * @remarks
     * The flat field map produced by {@link schemaParse}. Each entry carries its fixed
     * offset and its read/write operations, and is reused by every {@link Struct.toBuffer}
     * and {@link Struct.toObject} call.
     *
     * @see DefinitionItemType
     * @since 3.0.0
     */

    private readonly fields: Map<string, DefinitionItemType>;

    /**
     * Compiles the schema into a reusable binary layout.
     *
     * @param definition - Field definitions keyed by name.
     * @param options - Heap, pointer-size, and inheritance options.
     *
     * @remarks
     * Resolves the layout eagerly so `size`, `pointerSize`, and the field map are
     * available immediately and shared by every later read or write.
     *
     * @see StructOptionsInterface
     * @since 3.0.0
     */

    constructor(private readonly definition: SchemaType, private readonly options: StructOptionsInterface = {}) {
        const { size, fields, pointerSize } = schemaParse(definition, options.pointerSize, this.union);

        this.size = size;
        this.fields = fields;
        this.pointerSize = pointerSize;
    }

    /**
     * Whether fields overlap at offset 0 (union) instead of being laid out sequentially.
     *
     * @returns `false` for a plain struct; overridden to `true` by {@link Union}.
     *
     * @since 3.0.0
     */

    protected get union(): boolean {
        return false;
    }

    /**
     * Resolves this struct for embedding under a parent of the given pointer size.
     *
     * @param pointerSize - The parent's pointer width.
     * @returns A struct compiled for `pointerSize`: a recompiled copy when this struct
     * inherits from its parent and their pointer sizes differ, otherwise this struct unchanged.
     *
     * @remarks
     * Inheritance is on by default (`options.inherit !== false`). A struct opted out of
     * inheritance keeps its own pointer size and is returned unchanged. Recompilation
     * preserves the concrete class (a {@link Union} stays a union) by constructing
     * through `this.constructor`.
     *
     * @see StructOptionsInterface
     * @since 3.0.0
     */

    resolveForParent(pointerSize: PointerSizeType): Struct<T> {
        const inherit = this.options.inherit ?? true;
        if (!inherit || this.pointerSize === pointerSize) return this;
        const ctor = this.constructor as new (schema: SchemaType, options?: StructOptionsInterface) => Struct<T>;

        return new ctor(this.definition, { ...this.options, pointerSize });
    }

    /**
     * Deserializes a buffer into a structured object.
     *
     * @param buffer - Binary data to decode; must be at least `size` bytes.
     * @param parentHeap - Optional parent heap for resolving pointer-backed fields.
     * @returns The decoded object with every field populated.
     *
     * @throws xStructBaseError - When `buffer` is not a Buffer or is smaller than `size`.
     *
     * @remarks
     * Without `parentHeap`, pointer-backed fields are resolved against the heap region
     * trailing the fixed-size struct in `buffer`.
     *
     * @example
     * ```ts
     * struct.toObject(struct.toBuffer({ x: 1 })); // { x: 1 }
     * ```
     *
     * @see Struct.toBuffer
     * @since 3.0.0
     */

    toObject(buffer: Buffer, parentHeap?: HeapRuntimeInterface): Required<T> {
        if (!Buffer.isBuffer(buffer)) throw new xStructBaseError(
            `Expected a buffer, but received ${ typeof buffer }`
        );

        if (buffer.byteLength < this.size) throw new xStructBaseError(
            `Buffer size is less than expected: ${ buffer.byteLength } < ${ this.size }`
        );

        const { heap } = this.resolveHeap(parentHeap, buffer.subarray(this.size));
        const context: ContextInterface = { heap, buffer, offset: 0 };
        const result: Record<string, unknown> = {};

        for (const [ name, descriptor ] of this.fields) {
            result[name] = descriptor.read(context, descriptor.position);
        }

        return result as Required<T>;
    }

    /**
     * Serializes a structured object into a buffer.
     *
     * @param data - Object to encode; `undefined` fields are skipped (left zeroed).
     * @param parentHeap - Optional parent heap for writing pointer-backed fields.
     * @returns The encoded struct; when this call owns the heap, the heap region is
     * appended after the fixed-size struct.
     *
     * @throws xStructBaseError - When `data` is not an object.
     *
     * @remarks
     * With `parentHeap`, heap-allocated fields are written into it and no heap region
     * is appended, letting nested structs share one contiguous heap.
     *
     * @example
     * ```ts
     * struct.toBuffer({ x: 1, y: 2 });
     * ```
     *
     * @see Struct.toObject
     * @since 3.0.0
     */

    toBuffer(data: T, parentHeap?: HeapRuntimeInterface): Buffer {
        if (!data || typeof data !== 'object') throw new xStructBaseError(
            `Expected an object of fields, but received ${ typeof data }`
        );

        const { heap, heapCtx, isRoot } = this.resolveHeap(parentHeap);
        const context: ContextInterface = {
            heap,
            buffer: Buffer.alloc(this.size),
            offset: 0
        };

        for (const [ name, descriptor ] of this.fields) {
            if(data[name as keyof T] === undefined) continue;
            descriptor.write(context, data[name as keyof T], descriptor.position);
        }

        if (isRoot && heapCtx) {
            return Buffer.concat([ context.buffer, heapCtx.buffer.subarray(0, heapCtx.top) ]);
        }

        return context.buffer;
    }

    /**
     * Selects the heap backing a single serialization call.
     *
     * @param parentHeap - Heap delegated by an enclosing struct, if any.
     * @param seedBuffer - Initial buffer for a freshly created root heap.
     * @returns The heap to use, the owned heap context when this call is the root, and
     * whether this call owns (is the root of) the heap.
     *
     * @remarks
     * Resolution order:
     *
     * 1. An injected `options.heap` with inheritance disabled (`inherit === false`)
     *    wins even when nested, so the struct writes into its own heap.
     * 2. A delegated `parentHeap` (nested, non-root) - the inheriting default.
     * 3. An injected `options.heap` at the root.
     * 4. A new local heap seeded with `seedBuffer` (root).
     *
     * @since 3.0.0
     */

    private resolveHeap(parentHeap?: HeapRuntimeInterface, seedBuffer?: Buffer): { heap: HeapRuntimeInterface; heapCtx?: HeapContextInterface; isRoot: boolean } {
        const inherit = this.options.inherit ?? true;

        if (this.options.heap && !inherit) {
            return { heap: this.options.heap, isRoot: !parentHeap };
        }

        if (parentHeap) {
            return { heap: parentHeap, isRoot: false };
        }

        if (this.options.heap) {
            return { heap: this.options.heap, isRoot: true };
        }

        const heapCtx: HeapContextInterface = {
            top: 0,
            buffer: seedBuffer ?? Buffer.allocUnsafe(0)
        };

        return {
            heap: {
                read: heapRead.bind(heapCtx),
                write: heapWrite.bind(heapCtx)
            },
            heapCtx,
            isRoot: true
        };
    }
}
