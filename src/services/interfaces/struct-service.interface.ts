/**
 * Import will remove at compile time
 */

import type { Struct } from '@services/struct.service';
import type { BitFieldType } from '@components/interfaces/bitfield-component.interface';
import type { StringDescriptorType } from '@components/interfaces/string-component.interface';
import type { PrimitiveArrayType } from '@components/interfaces/primitive-component.interface';
import type { StructDescriptorInterface } from '@components/interfaces/struct-component.interface';
import type { StringType, StringArrayType } from '@components/interfaces/string-component.interface';
import type { BitfieldDescriptorInterface } from '@components/interfaces/bitfield-component.interface';
import type { PositionedStringDescriptorType } from '@components/interfaces/string-component.interface';
import type { PositionedStructDescriptorType } from '@components/interfaces/struct-component.interface';
import type { PositionedBitfieldDescriptorType } from '@components/interfaces/bitfield-component.interface';
import type { PrimitiveType, FloatPrimitiveType } from '@components/interfaces/primitive-component.interface';
import type { PositionedPrimitiveDescriptorType } from '@components/interfaces/primitive-component.interface';
import type { StringFixedType, StringFixedArrayType } from '@components/interfaces/string-component.interface';

/**
 * Represents the various string format specifications that can be used in field definitions
 * within binary struct schemas, supporting primitive types, arrays, and bit fields.
 *
 * @see StringType
 * @see BitFieldType
 * @see PrimitiveType
 * @see StringArrayType
 * @see StringFixedType
 * @see FloatPrimitiveType
 * @see PrimitiveArrayType
 * @see StringFixedArrayType
 *
 * @since 2.0.0
 */

export type StringFieldType =
    | StringType
    | BitFieldType
    | PrimitiveType
    | StringArrayType
    | StringFixedType
    | FloatPrimitiveType
    | PrimitiveArrayType
    | StringFixedArrayType;

/**
 * Represents the possible field types that can be used in a descriptor definition
 * to specify the structure of binary data.
 *
 * @see StringDescriptorType
 * @see StructDescriptorInterface
 * @see BitfieldDescriptorInterface
 *
 * @since 2.0.0
 */

export type DescriptorFieldType =
    | StringDescriptorType
    | StructDescriptorInterface
    | BitfieldDescriptorInterface;

/**
 * Represents field types within a descriptor that include positioning information,
 * allowing for precise memory layout definition in binary structures.
 *
 * @see PositionedStringDescriptorType
 * @see PositionedStructDescriptorType
 * @see PositionedBitfieldDescriptorType
 * @see PositionedPrimitiveDescriptorType
 *
 * @since 2.0.0
 */

export type PositionedDescriptorFieldType =
    | PositionedStringDescriptorType
    | PositionedStructDescriptorType
    | PositionedBitfieldDescriptorType
    | PositionedPrimitiveDescriptorType;

/**
 * Represents an accumulator that tracks binary data metrics during parsing or serialization,
 * including bit and byte positions, and bitfield information.
 *
 * @see PrimitiveType
 *
 * @since 2.0.0
 */

export interface AccumulatorInterface {
    bits: number;
    bytes: number;
    bitFieldSize: number;
    bitFieldType: PrimitiveType;
}

/**
 * Represents the union of all possible field types that can be used in a binary structure definition,
 * including descriptors, string fields, and complete struct definitions.
 *
 * @see Struct
 * @see StringFieldType
 * @see DescriptorFieldType
 *
 * @since 2.0.0
 */

export type FieldsType = DescriptorFieldType | StringFieldType | Struct;

/**
 * Defines the structure of a binary data schema as a dictionary of named fields.
 * Each field in the schema is mapped to a specific field type representation.
 *
 * @see FieldsType
 * @since 2.0.0
 */

export interface StructSchemaInterface {
    [name: string]: FieldsType;
}

/**
 * Represents the context for binary data operations, providing access to the
 * underlying buffer, current position, and type descriptor information.
 *
 * @see PositionedDescriptorFieldType
 * @since 2.0.0
 */

export interface ContextInterface {
    buffer: Buffer;
    offset: number;
    descriptor: PositionedDescriptorFieldType
}
