/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { Struct } from '@services/struct.service';
import type { DescriptorType } from '@interfaces/descriptor.interface';
import type { ExpressionType } from '@interfaces/expression.interface';
import type { IntegerPipeType } from '@pipes/interfaces/primitive-pipe.interface';
import type { HeapRuntimeInterface, PointerSizeType } from '@interfaces/heap.interface';

/**
 * Closes a descriptor object against the {@link Struct} surface.
 *
 * @remarks
 * A descriptor object and a bare {@link Struct} are both object forms in
 * {@link SchemaItemType}. Because `Struct` carries members such as `pointerSize` and
 * `size`, TypeScript treats those keys as "known" on the union and silently accepts a
 * descriptor that mixes them in (`{ type, kind, pointerSize: 4 }`). Intersecting each
 * descriptor with `never`-typed copies of every `Struct` member it does not itself
 * declare keeps the two forms mutually exclusive, so a descriptor cannot borrow
 * struct-instance members.
 *
 * @since 3.0.0
 */

type NoStructMembersType<T> = T & { [K in Exclude<keyof Struct, keyof T>]?: never };

/**
 * A single schema entry before it is compiled into a binary field.
 *
 * @remarks
 * Covers the three authoring forms accepted by {@link schemaParse}: an
 * {@link ExpressionType} string (e.g. `'*utf8'`), a nested {@link Struct}, or a pre-built
 * {@link DescriptorType}. Descriptor objects are closed against the {@link Struct} surface
 * by {@link NoStructMembersType}, so a stray `pointerSize` or `size` key is rejected at
 * compile time.
 *
 * @see {@link SchemaType}
 *
 * @since 3.0.0
 */

export type SchemaItemType = ExpressionType | NoStructMembersType<DescriptorType> | Struct;

/**
 * A full struct schema: field names mapped to their definitions.
 *
 * @see {@link SchemaItemType}
 *
 * @since 3.0.0
 */

export type SchemaType = Record<string, SchemaItemType>;

/**
 * Runtime context threaded through every field read and write.
 *
 * @remarks
 * Shared across all fields of a single {@link Struct.toBuffer} / {@link Struct.toObject}
 * call so each field can address the target buffer and resolve heap-backed values.
 *
 * @since 3.0.0
 */

export interface ContextInterface {
    /**
     * Buffer being read from or written to.
     *
     * @since 3.0.0
     */

    buffer: Buffer;

    /**
     * Base byte offset of the struct within {@link ContextInterface.buffer}.
     *
     * @since 3.0.0
     */

    offset: number;

    /**
     * Heap resolving pointer-backed (variable-length) field payloads.
     *
     * @since 3.0.0
     */

    heap: HeapRuntimeInterface;
}

/**
 * Mutable cursor state accumulated while {@link schemaParse} compiles a schema.
 *
 * @remarks
 * Tracks the running byte offset, union sizing, and the active bitfield container so
 * adjacent bitfields can pack into a single shared integer.
 *
 * @since 3.0.0
 */

export interface DefinitionContextInterface {
    /**
     * Bits already consumed in the active bitfield container.
     *
     * @since 3.0.0
     */

    bits: number;

    /**
     * Running byte offset of the next field in sequential layout.
     *
     * @since 3.0.0
     */

    bytes: number;

    /**
     * Whether fields overlap at offset 0 instead of being laid out sequentially.
     *
     * @since 3.0.0
     */

    union: boolean;

    /**
     * Widest field seen so far, used as the final size in union mode.
     *
     * @since 3.0.0
     */

    maxBytes: number;

    /**
     * Byte width of the active bitfield container.
     *
     * @since 3.0.0
     */

    bitFieldSize: number;

    /**
     * Pointer width, in bytes, every field is compiled for.
     *
     * @since 3.0.0
     */

    pointerSize: PointerSizeType;

    /**
     * Integer type of the active bitfield container, or `null` when none is open.
     *
     * @since 3.0.0
     */

    bitFieldType: IntegerPipeType | null;
}

/**
 * A compiled field: its fixed offset plus its read and write operations.
 *
 * @template T - Decoded value type of the field.
 *
 * @see {@link DefinitionSchemaInterface}
 *
 * @since 3.0.0
 */

export type DefinitionItemType<T = unknown> = {
    /**
     * Byte offset of the field within the struct.
     *
     * @since 3.0.0
     */

    readonly position: number;

    /**
     * Decodes the field value from the context buffer.
     *
     * @param ctx - Active read context.
     * @param position - Byte offset of the field.
     * @returns The decoded value.
     *
     * @since 3.0.0
     */

    read(ctx: ContextInterface, position: number): T;

    /**
     * Encodes a value into the context buffer.
     *
     * @param ctx - Active write context.
     * @param value - Value to encode.
     * @param position - Byte offset of the field.
     *
     * @since 3.0.0
     */

    write(ctx: ContextInterface, value: T, position: number): void;
};

/**
 * Result of compiling a schema: its fixed size, pointer width, and field map.
 *
 * @remarks
 * Returned by {@link schemaParse} and consumed by {@link Struct} to lay out and
 * serialize values.
 *
 * @see {@link SchemaType}
 *
 * @since 3.0.0
 */

export interface DefinitionSchemaInterface {
    /**
     * Total fixed (stack) size of the struct in bytes.
     *
     * @since 3.0.0
     */

    size: number;

    /**
     * Pointer width, in bytes, the layout was compiled for.
     *
     * @since 3.0.0
     */

    pointerSize: PointerSizeType;

    /**
     * Compiled fields keyed by name.
     *
     * @since 3.0.0
     */

    fields: Map<string, DefinitionItemType>;
}
