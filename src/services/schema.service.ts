/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { LeafInterface } from '@components/interfaces/shape-component.interface';
import type { DefinitionContextInterface } from '@services/interfaces/schema-service.interface';
import type { IntegerPipeType, FloatPipeType } from '@pipes/interfaces/primitive-pipe.interface';
import type { DescriptorType, BitfieldDescriptorInterface } from '@interfaces/descriptor.interface';
import type { SchemaType, SchemaItemType, ContextInterface } from '@services/interfaces/schema-service.interface';
import type { DefinitionItemType, DefinitionSchemaInterface } from '@services/interfaces/schema-service.interface';

/**
 * Imports
 */

import { xStructBaseError } from '@errors/base.error';
import { POINTER_SIZES } from '@constants/heap.constant';
import { CharCode } from '@constants/expression.constant';
import { parseExpression } from '@services/expression.service';
import { primitiveByteSize, DescriptorKind } from '@constants/descriptor.constant';
import { compileShape, encodeShape, decodeShape } from '@components/shape.component';
import { readIntegerPipe, readFloatPipe, writeIntegerPipe, writeFloatPipe } from '@pipes/primitive.pipe';

/**
 * Normalizes a pointer size to a supported width, defaulting to 4 bytes.
 *
 * @param pointer - Requested pointer width
 * @returns A valid {@link POINTER_SIZES} entry
 *
 * @since 3.0.0
 */

function getPointerSize(pointer?: number): DefinitionContextInterface['pointerSize'] {
    return (POINTER_SIZES as readonly number[]).includes(pointer ?? 0)
        ? pointer as DefinitionContextInterface['pointerSize']
        : 4;
}

/**
 * Resolves a schema entry into a concrete {@link DescriptorType}.
 *
 * @param field - Expression string, nested struct, or raw descriptor
 * @returns The resolved descriptor
 *
 * @remarks
 * Nested structs are detected structurally (no `kind` discriminator) to avoid a
 * runtime dependency on the {@link Struct} class and the resulting import cycle.
 *
 * @since 3.0.0
 */

function toDescriptor(field: SchemaItemType): DescriptorType {
    if (typeof field === 'string') return parseExpression(field);
    if ('kind' in field) return field;

    return { kind: DescriptorKind.Struct, type: field };
}

/**
 * Closes the active bitfield container, committing its byte size.
 *
 * @param ctx - Mutable parse context
 * @param type - Integer type opening a new container, or `null` to only close
 * @param size - Byte width of the new container
 *
 * @since 3.0.0
 */

function flushBitfield(ctx: DefinitionContextInterface, type: IntegerPipeType | null = null, size = 0): void {
    if (!ctx.bitFieldType && !type) return;
    if (ctx.union) ctx.maxBytes = Math.max(ctx.maxBytes, ctx.bitFieldSize);
    else ctx.bytes += ctx.bitFieldSize;

    ctx.bits = 0;
    ctx.bitFieldType = type;
    ctx.bitFieldSize = size;
}

/**
 * Builds a shaped field item, advancing the context cursor by its stack size.
 *
 * @param ctx - Mutable parse context
 * @param shape - Layout dimensions (right-to-left); `[]` is a scalar
 * @param elementSize - Byte size of the innermost element
 * @param leaf - Leaf serialization pair
 * @returns A compiled {@link DefinitionItemType}
 *
 * @since 3.0.0
 */

function shapedItem(ctx: DefinitionContextInterface, shape: number[], elementSize: number, leaf: LeafInterface): DefinitionItemType {
    flushBitfield(ctx);

    const position = ctx.bytes;
    const { pointerSize } = ctx;
    const levels = compileShape(shape, elementSize, pointerSize);
    ctx.bytes += levels[0]?.size ?? elementSize;

    const shapeCtx = { ...leaf, levels, elementSize, pointerSize };
    const decode = decodeShape.bind(shapeCtx);
    const encode = encodeShape.bind(shapeCtx);

    return {
        position,
        read: (c: ContextInterface, pos: number) => decode(c.heap, c.buffer, c.offset + pos),
        write: (c: ContextInterface, value: unknown, pos: number) => encode(c.heap, c.buffer, c.offset + pos, value)
    };
}

/**
 * Builds a packed bitfield item, sharing a container with adjacent bitfields.
 *
 * @param ctx - Mutable parse context
 * @param descriptor - Bitfield descriptor
 * @returns A compiled {@link DefinitionItemType}
 *
 * @throws xStructBaseError - On an unknown type, an out-of-range width, a 64-bit container,
 * or an explicit `bitOffset` that is out of range or overlaps an earlier field
 *
 * @remarks
 * The bit offset defaults to the running cursor (sequential packing). A descriptor may set
 * an explicit `bitOffset` to place the field at a fixed position in the container, provided it
 * does not overlap an earlier field - it must be at or after the running cursor. The cursor
 * then advances to `bitOffset + bitSize` so later auto-packed fields follow it.
 *
 * @since 3.0.0
 */

function bitfieldItem(ctx: DefinitionContextInterface, descriptor: BitfieldDescriptorInterface): DefinitionItemType {
    const { type, bitSize, bitOffset: explicit } = descriptor;
    const byteSize = primitiveByteSize(type);

    if (!byteSize || byteSize > 4) throw new xStructBaseError(`Invalid bitfield container type: '${ type }'`);
    const containerBits = byteSize * 8;
    if (bitSize <= 0 || bitSize > containerBits)
        throw new xStructBaseError(`bitSize '${ bitSize }' is out of range for '${ type }' (1-${ containerBits })`);
    if (explicit !== undefined && explicit < ctx.bits)
        throw new xStructBaseError(`bitOffset '${ explicit }' overlaps a previous bitfield in '${ type }' (next free bit is ${ ctx.bits })`);

    const start = explicit ?? ctx.bits;
    if (ctx.bitFieldType !== type || start + bitSize > containerBits) flushBitfield(ctx, type, byteSize);

    const position = ctx.bytes;
    const bitOffset = explicit ?? ctx.bits;
    ctx.bits = bitOffset + bitSize;

    const shift = 32 - bitSize;
    const mask = 0xFFFFFFFF >>> shift;
    const clearMask = ~(mask << bitOffset);
    const signed = type.charCodeAt(0) === CharCode.LowerI;
    const read = readIntegerPipe[type];
    const write = writeIntegerPipe[type];

    return {
        position,
        read(c: ContextInterface, pos: number): number {
            const bits = ((read(c.buffer, c.offset + pos) as number) >>> bitOffset) & mask;

            return signed ? ((bits << shift) >> shift) : (bits >>> 0);
        },
        write(c: ContextInterface, value: number, pos: number): void {
            const offset = c.offset + pos;
            const raw = read(c.buffer, offset) as number;
            const next = ((raw & clearMask) | ((value & mask) << bitOffset)) >>> 0;
            write(c.buffer, offset, next as never);
        }
    };
}

/**
 * Builds a field item for any non-bitfield descriptor.
 *
 * @param ctx - Mutable parse context
 * @param descriptor - Struct, string, or primitive descriptor
 * @returns A compiled {@link DefinitionItemType}
 *
 * @throws xStructBaseError - On an unknown primitive type
 *
 * @since 3.0.0
 */

function valueItem(ctx: DefinitionContextInterface, descriptor: Exclude<DescriptorType, BitfieldDescriptorInterface>): DefinitionItemType {
    if (descriptor.kind === DescriptorKind.Struct) {
        const { shape = [] } = descriptor;
        const type = descriptor.type.resolveForParent(ctx.pointerSize);

        return shapedItem(ctx, shape, type.size, {
            decode: (buf, offset, opts) =>
                type.toObject(buf.subarray(offset, offset + type.size), opts?.heap),
            encode: (buf, offset, value, opts) =>
                type.toBuffer(value as object, opts?.heap).copy(buf, offset)
        });
    }

    if (descriptor.kind === DescriptorKind.String) {
        const { type, shape = [ 0 ] } = descriptor;

        return shapedItem(ctx, shape, 1, {
            stringEncoding: type,
            decode: (buf, offset, opts) =>
                buf.toString(type, offset, offset + (opts?.length ?? 1)),
            encode: (buf, offset, value, opts) =>
                buf.write((value as string) ?? '', offset, opts?.length ?? 1, type)
        });
    }

    const { type, shape = [] } = descriptor;
    const read = readIntegerPipe[type as IntegerPipeType] ?? readFloatPipe[type as FloatPipeType];
    const write = writeIntegerPipe[type as IntegerPipeType] ?? writeFloatPipe[type as FloatPipeType];
    if (!read || !write) throw new xStructBaseError(`Invalid primitive type: '${ type }'`);

    return shapedItem(ctx, shape, primitiveByteSize(type), { decode: read, encode: write as LeafInterface['encode'] });
}

/**
 * Compiles a schema into a flat field map with a fixed stack size.
 *
 * @param schema - Field definitions keyed by name
 * @param pointer - Pointer width for heap-backed fields (default 4)
 * @param union - When true, all fields overlap at offset 0 and the size is the widest field
 * @returns The compiled {@link DefinitionSchemaInterface}
 *
 * @throws xStructBaseError - On an invalid descriptor encountered while parsing
 *
 * @example
 * ```ts
 * const { size, fields } = schemaParse({ id: 'u32le', name: '*utf8' });
 * ```
 *
 * @since 3.0.0
 */

export function schemaParse(schema: SchemaType, pointer?: number, union = false): DefinitionSchemaInterface {
    const fields = new Map<string, DefinitionItemType>();
    const ctx: DefinitionContextInterface = {
        union,
        bits: 0,
        bytes: 0,
        maxBytes: 0,
        bitFieldSize: 0,
        bitFieldType: null,
        pointerSize: getPointerSize(pointer)
    };

    for (const name of Object.keys(schema)) {
        const descriptor = toDescriptor(schema[name]);
        fields.set(name, descriptor.kind === DescriptorKind.Bitfield
            ? bitfieldItem(ctx, descriptor)
            : valueItem(ctx, descriptor)
        );

        if (union) {
            ctx.maxBytes = Math.max(ctx.maxBytes, ctx.bytes);
            ctx.bytes = 0;
        }
    }

    flushBitfield(ctx);

    return { size: union ? ctx.maxBytes : ctx.bytes, pointerSize: ctx.pointerSize, fields };
}
