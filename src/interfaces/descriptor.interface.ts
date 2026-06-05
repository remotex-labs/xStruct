/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { Struct } from '@services/struct.service';
import type { DescriptorKind } from '@constants/descriptor.constant';
import type { StringPipeType } from '@pipes/interfaces/strings-pipe.interface';
import type { IntegerPipeType, PrimitivePipeType } from '@pipes/interfaces/primitive-pipe.interface';

/**
 * Base descriptor shared across all non-bitfield binary descriptor types.
 *
 * @remarks
 * Represents the common structural definition for all value-based
 * binary descriptors in the system.
 * The shape array describes memory layout topology.
 *
 * It is evaluated RIGHT-TO-LEFT as a construction rule:
 * - `n > 0` → fixed-size stack allocation (compile-time known size)
 * - `0` → pointer indirection (heap or runtime-sized allocation)
 *
 * Memory rules:
 * - Stack contribution: elementSize × n
 * - Pointer contribution (0): fixed pointerSize on stack only
 *   (heap memory is not part of stack size)
 *
 * Core semantics:
 * - `0` = heap escape / indirection boundary
 * - `n > 0` = stack replication factor
 *
 * @since 3.0.0
 */

export interface BaseDescriptorInterface {
    /**
     * Describes the memory layout of a type using a right-to-left dimension array.
     *
     * @remarks
     * Each dimension is either:
     * - `n > 0` - fixed array of `n` elements, stack-allocated (`n × elementSize` bytes)
     * - `0` - pointer indirection, heap/runtime-allocated (`pointerSize` bytes on stack)
     *
     * Dimensions are read **right-to-left** (C declarator order):
     * the rightmost dimension is the innermost (closest to the base type).
     *
     * ---
     *
     * @example <caption>utf8[4] - fixed string, max 4 bytes, stack</caption>
     * ```ts
     * shape: [4]
     * // Stack: [char][char][char][char]  (4 bytes)
     * ```
     *
     * @example <caption>*utf8 - pointer to unbounded string, heap</caption>
     * ```ts
     * shape: [0]
     * // Stack: [ptr]
     * // Heap:  [char]...[char]  (runtime length)
     * ```
     *
     * @example <caption>*utf8[5] - 5 stack slots, each is a pointer to a heap string</caption>
     * ```ts
     * shape: [5, 0]
     * // Stack: [ptr][ptr][ptr][ptr][ptr]  (5 × pointerSize)
     * // Heap:  each ptr → [char]...[char]
     * ```
     *
     * @example <caption>*(utf8[4]) - pointer to a heap string of max 4 bytes</caption>
     * ```ts
     * shape: [0, 4]
     * // Stack: [ptr]
     * // Heap:  [char][char][char][char]  (max 4 bytes)
     * ```
     *
     * @example <caption>**utf8[6] - 6 stack slots, each a pointer-to-pointer</caption>
     * ```ts
     * shape: [6, 0, 0]
     * //
     * //  [ 6, 0, 0 ]
     * //    ↑  ↑  ↑
     * //    |  |  └── heap: pointer → T
     * //    |  └───────── heap: pointer → pointer
     * //    └──────────────── stack: array[6]
     * //
     * // Stack: [ptr][ptr][ptr][ptr][ptr][ptr]  (6 × pointerSize)
     * // Each ptr → ptr → T  (two levels of heap indirection)
     * ```
     *
     * @since 3.0.0
     */

    shape?: Array<number>;
}

/**
 * Descriptor for nested structured binary types.
 *
 * @remarks
 * Represents a structured serialization layout backed by a {@link Struct}
 * runtime definition.
 *
 * Used for recursive or composite binary schemas where fields are
 * themselves structured layouts with independent serialization logic.
 *
 * @since 3.0.0
 */

export interface StructDescriptorInterface extends BaseDescriptorInterface {
    /**
     * Runtime serializer implementation for the nested structure.
     *
     * @remarks
     * Provides bidirectional conversion between structured JavaScript values
     * and their binary buffer representation. Used internally during nested
     * struct encoding and decoding operations.
     *
     * @see Struct
     * @since 3.0.0
     */

    type: Struct;

    /**
     * Discriminator identifying this descriptor as a struct type.
     *
     * @remarks
     * Used during runtime descriptor dispatch to distinguish structured
     * serialization layouts from primitive descriptor variants.
     *
     * @see DescriptorKind.Struct
     * @since 3.0.0
     */

    kind: DescriptorKind.Struct;
}

/**
 * Descriptor for encoded string binary values.
 *
 * @remarks
 * Represents a string field encoded using a {@link StringPipeType}.
 *
 * Supports both fixed-capacity and runtime-sized string layouts via
 * the shared {@link BaseDescriptorInterface.shape} system.
 *
 * @since 3.0.0
 */

export interface StringDescriptorInterface extends BaseDescriptorInterface {
    /**
     * Runtime serialization type definition.
     *
     * @see StringPipeType
     * @since 3.0.0
     */

    type: StringPipeType;

    /**
     * Discriminator identifying this descriptor as a string type.
     *
     * @see DescriptorKind.String
     * @since 3.0.0
     */

    kind: DescriptorKind.String;
}

/**
 * Descriptor for primitive scalar binary values.
 *
 * @remarks
 * Represents low-level numeric or scalar binary operations defined by
 * {@link PrimitivePipeType}.
 *
 * Supports array and pointer-like layouts via BaseDescriptorInterface.
 *
 * @see BaseDescriptorInterface
 * @since 3.0.0
 */

export interface PrimitiveDescriptorInterface extends BaseDescriptorInterface {
    /**
     * Runtime serialization type definition.

     * @see PrimitivePipeType
     * @since 3.0.0
     */

    type: PrimitivePipeType;

    /**
     * Discriminator identifying this descriptor as a primitive type.
     *
     * @see DescriptorKind.Primitive
     * @since 3.0.0
     */

    kind: DescriptorKind.Primitive;
}

/**
 * Descriptor for packed integer bitfield values.
 *
 * @remarks
 * Represents a sub-byte integer field packed into a larger integer
 * storage unit defined by {@link IntegerPipeType}.
 *
 * Bitfields do not participate in {@link BaseDescriptorInterface.shape}
 * layouts and instead use explicit bit-level metadata.
 *
 * @since 3.0.0
 */

export interface BitfieldDescriptorInterface {
    /**
     * Discriminator identifying this descriptor as a bitfield type.
     *
     * @see DescriptorKind.Bitfield
     * @since 3.0.0
     */

    kind: DescriptorKind.Bitfield;

    /**
     * Integer storage type used for bitfield extraction.
     *
     * @see IntegerPipeType
     * @since 3.0.0
     */

    type: IntegerPipeType;

    /**
     * Number of bits occupied by this field.
     *
     * @since 3.0.0
     */

    bitSize: number;

    /**
     * Explicit bit offset of this field within its container.
     *
     * @remarks
     * When omitted, the field is packed sequentially after the previous bitfield in the same
     * container. When set, the field is placed at exactly this offset and the packing cursor
     * advances to `bitOffset + bitSize`, so explicit and auto-packed fields can coexist. The
     * offset may not overlap an earlier field, so it must satisfy
     * `cursor <= bitOffset` and `bitOffset + bitSize <= container bits`.
     *
     * @since 3.0.0
     */

    bitOffset?: number;
}

/**
 * Union of all supported binary descriptor types.
 *
 * @remarks
 * Represents the complete set of descriptor definitions supported by
 * the binary schema system.
 *
 * This includes:
 * - Struct descriptors
 * - String descriptors
 * - Bitfield descriptors
 * - Primitive descriptors
 *
 * Each descriptor variant is distinguished by its {@link DescriptorKind}.
 * This type is used as the root abstraction for:
 * - Layout validation
 * - Serialization pipelines
 * - Binary schema compilation
 * - Parsing and decoding logic
 *
 * @since 3.0.0
 */

export type DescriptorType =
    | StructDescriptorInterface
    | StringDescriptorInterface
    | BitfieldDescriptorInterface
    | PrimitiveDescriptorInterface;
