/**
 * Import will remove at compile time
 */

import type { ContextInterface } from '@services/interfaces/struct-service.interface';

/**
 * Represents the signed primitive numeric types supported by the system
 *
 * @remarks
 * This type defines all the signed integer primitive types that can be used
 * throughout the application, particularly in bitfield operations and binary
 * data manipulation.
 *
 * The supported types include:
 * - `Int8`: 8-bit signed integer
 * - `Int16LE`: 16-bit signed integer in little-endian format
 * - `Int16BE`: 16-bit signed integer in big-endian format
 * - `Int32LE`: 32-bit signed integer in little-endian format
 * - `Int32BE`: 32-bit signed integer in big-endian format
 * - `BigInt64LE`: 64-bit signed integer in little-endian format
 * - `BigInt64BE`: 64-bit signed integer in big-endian format
 *
 * The endianness suffix indicates the byte order:
 * - `LE` (Little-Endian): Least significant byte first
 * - `BE` (Big-Endian): Most significant byte first
 *
 * Int8 has no endianness suffix as it consists of only one byte.
 *
 * @since 2.0.0
 */

export type SignedPrimitiveType =
    | 'Int8'
    | 'Int16LE'
    | 'Int16BE'
    | 'Int32LE'
    | 'Int32BE'
    | 'BigInt64LE'
    | 'BigInt64BE';

/**
 * Represents a type that can be either a single numeric value or an array of numeric values
 *
 * @since 2.0.0
 */

export type PrimitiveDataType = number | bigint | Array<number | bigint>;

/**
 * Represents the unsigned primitive numeric types supported by the system
 *
 * @remarks
 * This type defines all the unsigned integer primitive types that can be used
 * throughout the application, particularly in bitfield operations and binary
 * data manipulation.
 *
 * The supported types include:
 * - `UInt8`: 8-bit unsigned integer
 * - `UInt16LE`: 16-bit unsigned integer in little-endian format
 * - `UInt16BE`: 16-bit unsigned integer in big-endian format
 * - `UInt32LE`: 32-bit unsigned integer in little-endian format
 * - `UInt32BE`: 32-bit unsigned integer in big-endian format
 * - `BigUInt64LE`: 64-bit unsigned integer in little-endian format
 * - `BigUInt64BE`: 64-bit unsigned integer in big-endian format
 *
 * The endianness suffix indicates the byte order:
 * - `LE` (Little-Endian): Least significant byte first
 * - `BE` (Big-Endian): Most significant byte first
 *
 * UInt8 has no endianness suffix as it consists of only one byte.
 *
 * @since 2.0.0
 */

export type UnsignedPrimitiveType =
    | 'UInt8'
    | 'UInt16LE'
    | 'UInt16BE'
    | 'UInt32LE'
    | 'UInt32BE'
    | 'BigUInt64LE'
    | 'BigUInt64BE';

/**
 * Represents the floating-point primitive numeric types supported by the system
 *
 * @remarks
 * This type defines all the floating-point primitive types that can be used
 * throughout the application for binary data manipulation and structured data formats.
 *
 * The supported types include:
 * - `FloatLE`: 32-bit (4-byte) single-precision floating-point in little-endian format
 * - `FloatBE`: 32-bit (4-byte) single-precision floating-point in big-endian format
 * - `DoubleLE`: 64-bit (8-byte) double-precision floating-point in little-endian format
 * - `DoubleBE`: 64-bit (8-byte) double-precision floating-point in big-endian format
 *
 * The endianness suffix indicates the byte order:
 * - `LE` (Little-Endian): Least significant byte first
 * - `BE` (Big-Endian): Most significant byte first
 *
 * This type is typically used in conjunction with other primitive types when defining
 * binary data structures or when reading from/writing to binary formats that include
 * floating-point values.
 *
 * @since 2.0.0
 */

export type FloatPrimitiveType =
    | 'FloatLE'
    | 'FloatBE'
    | 'DoubleLE'
    | 'DoubleBE';

/**
 * Defines the various primitive data types used for structuring fields in a binary layout,
 * representing different integer sizes with their associated endianness (byte order)
 *
 * @remarks
 * Endianness determines how bytes are ordered in memory:
 * - LE (Little Endian): The least significant byte (LSB) is stored first
 * - BE (Big Endian): The most significant byte (MSB) is stored first
 *
 * This type is typically used in a schema
 * to specify the type of each field in a structure
 * when dealing with binary data formats or low-level data manipulation
 *
 * @example
 * ```ts
 * const myStruct = {
 *     field1: 'Int32LE',
 *     field2: 'UInt16BE',
 *     field3: 'Int8',
 * };
 * ```
 *
 * @see SignedPrimitiveType
 * @see UnsignedPrimitiveType
 *
 * @since 2.0.0
 */

export type PrimitiveType = SignedPrimitiveType | UnsignedPrimitiveType;

/**
 * Represents a primitive type with an optional array size specification,
 * combining a standard primitive type with an array size in the format `[]`
 *
 * @remarks
 * This type is a template literal type that combines any PrimitiveType with an array size specification.
 * The format consists of a valid primitive type (like 'Int8', 'UInt16BE', 'Int32LE') followed by
 * an array size in square brackets with a positive integer (e.g., 'UInt32BE[5]').
 *
 * It is used when a field needs to represent multiple elements of the same primitive type.
 *
 * @example
 * ```ts
 * const field1: PrimitiveArrayType = 'Int8[10]';      // Array of 10 signed 8-bit integers
 * const field2: PrimitiveArrayType = 'UInt32BE[5]';   // Array of 5 unsigned 32-bit integers in big-endian format
 * const field3: PrimitiveArrayType = 'Int16LE[100]';  // Array of 100 signed 16-bit integers in little-endian format
 * ```
 *
 * @since 2.0.0
 */

export type PrimitiveArrayType = `${ PrimitiveType | FloatPrimitiveType }[${ number }]`;

/**
 * Interface providing positioning information for descriptors within a buffer
 *
 * @property kind - Identifies the type of the descriptor (e.g., 'string', 'bitfield', 'primitive')
 * @property size - The size in bytes that this descriptor occupies in the buffer
 * @property position - The starting position of this descriptor within the buffer
 *
 * @remarks
 * Defines the essential properties needed to locate and size a data element within a buffer.
 * This interface is typically extended by more specific descriptor types that require
 * positioning information for serialization and deserialization operations.
 *
 * The 'kind' property serves as a discriminant to identify what type of data this descriptor
 * represents, allowing implementations to apply the appropriate serialization and
 * deserialization logic.
 *
 * @since 2.0.0
 */

export interface PositionedDescriptorInterface {
    kind?: 'string' | 'bitfield' | 'primitive' | 'struct';
    size: number;
    position: number;
}

/**
 * Describes a primitive data type with optional array sizing information
 *
 * @property type - The primitive data type to be used (signed or unsigned integer types)
 * @property arraySize - Optional size specification when the type represents an array
 *
 * @remarks
 * This interface serves as a descriptor for primitive data types in binary data structures.
 * It allows specifying both scalar primitive types and fixed-length arrays of primitive types.
 * When arraySize is undefined, the descriptor represents a single instance of the primitive.
 * When arraySize is provided, it indicates an array of the specified primitive type.
 *
 * @example
 * ```ts
 * // Single 8-bit unsigned integer
 * const descriptor1: PrimitiveDescriptorInterface = {
 *   type: 'UInt8'
 * };
 *
 * // Array of 5 little-endian 16-bit integers
 * const descriptor2: PrimitiveDescriptorInterface = {
 *   type: 'Int16LE',
 *   arraySize: 5
 * };
 * ```
 *
 * @see PrimitiveType
 * @see FloatPrimitiveType
 *
 * @since 2.0.0
 */

export interface PrimitiveDescriptorInterface {
    type: PrimitiveType | FloatPrimitiveType;
    arraySize?: number;
}

/**
 * A type that combines primitive type information with positioning data
 *
 * @remarks
 * This type combines the PrimitiveDescriptorInterface with PositionedDescriptorInterface,
 * creating a comprehensive descriptor
 * that contains both the primitive type information and its position within a buffer.
 * This is essential for serialization and deserialization
 * operations where both the data type and its location in memory must be known.
 *
 * The size property indicates the total number of bytes required to store the primitive type,
 * while the offset specifies the starting position within the buffer.
 * For array types, the size represents a single element's size, not the total array size.
 *
 * @example
 * ```ts
 * // A positioned 16-bit unsigned integer descriptor
 * const uint16Descriptor: PositionedPrimitiveDescriptorType = {
 *   type: 'UInt16LE',
 *   size: 2,
 *   offset: 0
 * };
 *
 * // A positioned descriptor for an array of 4 32-bit floating point values
 * const float32ArrayDescriptor: PositionedPrimitiveDescriptorType = {
 *   type: 'Float32LE',
 *   size: 4,
 *   offset: 8,
 *   arraySize: 4
 * };
 * ```
 *
 * @see PrimitiveDescriptorInterface
 * @see PositionedDescriptorInterface
 *
 * @since 2.0.0
 */

export type PositionedPrimitiveDescriptorType = PrimitiveDescriptorInterface & PositionedDescriptorInterface;

/**
 * Interface representing the context for primitive data type operations
 *
 * @remarks
 * Extends the base ContextInterface with a specialized descriptor for primitive data types
 *
 * @since 2.0.0
 */

export interface PrimitiveContextInterface extends ContextInterface {
    descriptor: PositionedPrimitiveDescriptorType;
}
