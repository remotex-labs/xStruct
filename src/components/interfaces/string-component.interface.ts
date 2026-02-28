/**
 * Import will remove at compile time
 */

import type { ContextInterface } from '@services/interfaces/struct-service.interface';
import type {
    UnsignedPrimitiveType,
    PositionedDescriptorInterface
} from '@components/interfaces/primitive-component.interface';

/**
 * Defines the supported string encoding types for data structures
 *
 * @remarks
 * This type represents the allowed string encoding formats that can be used when
 * working with string data in binary structures. Each encoding type handles character
 * representation differently:
 *
 * - 'utf8': UTF-8 encoding that supports the full Unicode character set
 * - 'ascii': ASCII encoding limited to 7-bit ASCII characters (0-127)
 * - 'string': Default string `utf8`
 *
 * These encoding types are typically used when specifying how string data should
 * be interpreted or stored in binary formats.
 *
 * @since 2.0.0
 */

export type StringType = 'utf8' | 'ascii' | 'string';

/**
 * Represents a type definition for arrays of primitive string types with a fixed size
 *
 * @remarks
 * This type defines the string format for declaring fixed-size arrays of primitive types using template literal syntax.
 * The format follows the pattern 'type[size]', where:
 * - 'type' is any valid PrimitiveType
 * - 'size' is a numeric value specifying the array length
 *
 * This string representation is typically used in schemas, configuration files, or
 * other declarative contexts where data structures are defined as strings.
 * The type enforces the correct syntax for array type declarations at compile time.
 *
 * @example
 * ```ts
 * // Valid StringArrayType examples:
 * const stringArray1: StringArrayType = 'utf8[10]';
 * const stringArray2: StringArrayType = 'ascii[5]';
 * const stringArray3: StringArrayType = 'UInt16LE[100]';
 * ```
 *
 * A parser function would typically convert this string representation into a
 * structured object that describes both the primitive type and its array size.
 *
 * @see StringType
 * @see PrimitiveType
 *
 * @since 2.0.0
 */

export type StringArrayType = `${ StringType }[${ number }]`;

/**
 * Represents a fixed-length string type declaration
 *
 * @remarks
 * This type defines the string format for declaring fixed-length strings using template literal syntax.
 * The format follows the pattern 'type(length)', where:
 * - 'type' is any valid StringType (utf8, ascii, string)
 * - 'length' is a numeric value specifying the exact byte length of the string
 *
 * Fixed-length strings occupy a predetermined number of bytes in the buffer, regardless of the
 * actual string content. Shorter strings will be padded, and longer strings will be truncated.
 *
 * @example
 * ```ts
 * // Valid StringFixedType examples:
 * const fixedString1: StringFixedType = 'utf8(20)';  // Exactly 20 bytes
 * const fixedString2: StringFixedType = 'ascii(50)'; // Exactly 50 bytes
 * const fixedString3: StringFixedType = 'string(100)'; // Exactly 100 bytes
 * ```
 *
 * @see StringType
 *
 * @since 2.1.0
 */

export type StringFixedType = `${ StringType }(${ number })`;

/**
 * Represents an array of fixed-length strings type declaration
 *
 * @remarks
 * This type defines the string format for declaring arrays of fixed-length strings using template literal syntax.
 * The format follows the pattern 'type(length)[size]', where:
 * - 'type' is any valid StringType (utf8, ascii, string)
 * - 'length' is a numeric value specifying the exact byte length of each string
 * - 'size' is a numeric value specifying the number of strings in the array
 *
 * Each string in the array will occupy exactly the specified number of bytes, with no length prefixes.
 * This is useful for creating compact binary structures with predictable memory layouts.
 *
 * @example
 * ```ts
 * // Valid StringFixedArrayType examples:
 * const fixedArray1: StringFixedArrayType = 'utf8(20)[10]';  // 10 strings, each 20 bytes
 * const fixedArray2: StringFixedArrayType = 'ascii(50)[5]';  // 5 strings, each 50 bytes
 * const fixedArray3: StringFixedArrayType = 'string(100)[3]'; // 3 strings, each 100 bytes
 * ```
 *
 * @see StringType
 * @see StringFixedType
 * @see StringArrayType
 *
 * @since 2.1.0
 */

export type StringFixedArrayType = `${ StringType }(${ number })[${ number }]`;

/**
 * Represents a type that can be either a single string or an array of strings
 *
 * @since 2.0.0
 */

export type StringDataType = string | Array<string>;

/**
 * Base interface for all string descriptor types providing common properties
 *
 * @property type - The string encoding format to use
 * @property arraySize - Optional fixed size when representing an array of strings
 *
 * @remarks
 * This interface serves as the foundation for all string descriptor types in the system.
 * It defines the minimal properties required for any string descriptor: the encoding type
 * and an optional array size for collections of strings.
 *
 * @since 2.0.0
 */

export interface BaseDescriptorInterface {
    type: StringType;
    arraySize?: number;
}

/**
 * Interface describing a fixed-size string field in a data structure
 *
 * @property type - The string encoding format to use (utf8, ascii, string, etc.)
 * @property size - Fixed size in bytes allocated for the string
 * @extends BaseDescriptorInterface
 *
 * @remarks
 * This interface defines a fixed-size string descriptor
 * that allocates exactly the specified number of bytes for string data.
 * The size property is required and determines the exact
 * byte length that will be used to store the string, regardless of the actual content length.
 *
 * Fixed-size strings are useful in scenarios where:
 * - Data structures need predictable memory layouts
 * - Working with binary formats that require fixed field sizes
 * - Creating record-based storage systems
 * - Interfacing with languages or systems that use fixed-size string buffers
 *
 * When encoding, if the actual string is shorter than the specified size, the remaining bytes will be padded.
 * If the string is longer, it will be truncated to fit the size.
 * The specific padding and truncation behavior depends on the implementation.
 *
 * @example
 * ```ts
 * // A fixed-size ASCII string of exactly 10 bytes
 * const nameField: StringDescriptorInterface = {
 *   type: 'ascii',
 *   size: 10
 * };
 *
 * // A fixed-size UTF-8 string of exactly 32 bytes, potentially storing fewer characters
 * // since UTF-8 characters can use multiple bytes
 * const descriptionField: StringDescriptorInterface = {
 *   type: 'utf8',
 *   size: 32
 * };
 *
 * // An array of 5 fixed-size strings, each 20 bytes long
 * const stringArray: StringDescriptorInterface = {
 *   type: 'ascii',
 *   size: 20,
 *   arraySize: 5
 * };
 * ```
 *
 * @since 2.0.0
 */

export interface StringDescriptorInterface extends BaseDescriptorInterface {
    size?: number;
    lengthType?: never;
    nullTerminated?: never;
}

/**
 * Interface for string descriptors with explicit length prefix type
 *
 * @property lengthType - The unsigned primitive type used to encode the string length prefix
 * @extends BaseDescriptorInterface
 *
 * @remarks
 * This interface describes strings that use a length prefix with a specific numeric type to indicate the string length.
 * The lengthType property determines the format, size, and
 * endianness of the length prefix that precedes the actual string data.
 *
 * Length-prefixed strings store the string's length before the string data itself,
 * allowing efficient reading and writing without having to scan for terminators or
 * rely on fixed-size fields.
 *
 * Common length prefix types include:
 * - UInt8: 1-byte unsigned integer (0-255 bytes)
 * - UInt16LE: 2-byte little-endian unsigned integer (0-65535 bytes)
 * - UInt16BE: 2-byte big-endian unsigned integer
 * - UInt32LE: 4-byte little-endian unsigned integer
 * - UInt32BE: 4-byte big-endian unsigned integer
 *
 * Length-prefixed strings are useful when:
 * - The string length needs to be known before reading the entire string
 * - Working with binary protocols that require explicit length information
 * - Implementing efficient skipping or random access within serialized data
 * - Handling strings that may contain null characters or other special values
 *
 * @example
 * ```ts
 * // A UTF-8 string with 2-byte little-endian length prefix
 * const standardString: LengthPrefixedDescriptorInterface = {
 *   type: 'utf8',
 *   lengthType: 'UInt16LE'
 * };
 *
 * // An ASCII string with 1-byte length prefix (for smaller strings)
 * const compactString: LengthPrefixedDescriptorInterface = {
 *   type: 'ascii',
 *   lengthType: 'UInt8'
 * };
 *
 * // A string with 4-byte length prefix for potentially very long strings
 * const largeString: LengthPrefixedDescriptorInterface = {
 *   type: 'utf8',
 *   lengthType: 'UInt32LE'
 * };
 * ```
 *
 * @since 2.0.0
 */

export interface LengthPrefixedDescriptorInterface extends BaseDescriptorInterface {
    lengthType: UnsignedPrimitiveType;
}

/**
 * Interface for null-terminated string descriptors
 *
 * @property nullTerminated - Indicates whether the string should be null-terminated
 * @property maxLength - Optional maximum length constraint in bytes (excluding null terminator)
 * @extends BaseDescriptorInterface
 *
 * @remarks
 * This interface describes strings that are terminated by a null character (a byte with value 0).
 * Null-terminated strings are common in C-based systems and many legacy file formats.
 *
 * When nullTerminated is true, the string will be read until a null byte is encountered,
 * and when writing, a null byte will be appended at the end of the string data.
 * If maxLength is specified, it sets an upper bound on the string length in bytes
 * (excluding the null terminator itself).
 *
 * Null-terminated strings are useful when:
 * - The maximum string length is unknown at serialization time
 * - Working with C-compatible protocols or file formats
 * - Dynamic string length is needed within a fixed buffer
 *
 * The maxLength property provides protection against excessively long strings or
 * malformed input where the null terminator might be missing.
 *
 * @example
 * ```ts
 * // A basic null-terminated UTF-8 string
 * const cString: NullTerminatedDescriptorInterface = {
 *   type: 'utf8',
 *   nullTerminated: true
 * };
 *
 * // A null-terminated ASCII string with a maximum length of 100 bytes
 * const limitedString: NullTerminatedDescriptorInterface = {
 *   type: 'ascii',
 *   nullTerminated: true,
 *   maxLength: 100
 * };
 *
 * // An array of 5 null-terminated strings
 * const stringArray: NullTerminatedDescriptorInterface = {
 *   type: 'utf8',
 *   nullTerminated: true,
 *   maxLength: 50,
 *   arraySize: 5
 * };
 * ```
 *
 * @since 2.0.0
 */

export interface NullTerminatedDescriptorInterface extends BaseDescriptorInterface {
    maxLength?: number;
    nullTerminated: boolean;
}

/**
 * Union type encompassing all possible string descriptor variants
 *
 * @remarks
 * This type represents any valid string descriptor configuration, combining the possible
 * variants from the base descriptor and its specialized extensions.
 * It allows a function or variable to accept or represent any valid string descriptor configuration.
 *
 * The variants include:
 * - Basic string descriptors (encoding type with optional size)
 * - Length-prefixed string descriptors (with explicit lengthType)
 * - Null-terminated string descriptors
 *
 * By default, when no specialized options are provided, strings are assumed to use a
 * 2-byte UInt16LE length prefix.
 *
 * @see StringDescriptorInterface
 * @see NullTerminatedDescriptorInterface
 * @see LengthPrefixedDescriptorInterface
 *
 * @since 2.0.0
 */

export type StringDescriptorType =
    | StringDescriptorInterface
    | NullTerminatedDescriptorInterface
    | LengthPrefixedDescriptorInterface;

/**
 * Describes a string with a fixed memory layout including both size and position information
 *
 * @remarks
 * This intersection type extends the standard StringDescriptorType by enforcing both size and offset properties.
 * The size property defines the exact number of bytes allocated for the string data,
 * while the offset property specifies the starting position within the buffer.
 *
 * For different descriptor interfaces, the size property has specific meanings:
 * - For `StringDescriptorInterface`: The exact number of bytes allocated for the string
 * - For `NullTerminatedDescriptorInterface`: The minimum size in the buffer (minimum size is null byte)
 * - For `LengthPrefixedDescriptorInterface`: The minimum number of bytes based on the prefix type
 *   (e.g., if UInt16 is used, the minimum size is 2 bytes)
 *
 * @see StringDescriptorType
 * @see PositionedDescriptorInterface
 *
 * @since 2.0.0
 */

export type PositionedStringDescriptorType = StringDescriptorType & PositionedDescriptorInterface;

/**
 * Represents a context interface for string operations, extending the base ContextInterface.
 *
 * @remarks
 * This interface provides the specialized descriptor needed for string positioning and handling.
 *
 * @see ContextInterface
 * @see PositionedStringDescriptorType
 *
 * @since 2.0.0
 */

export interface StringContextInterface extends ContextInterface {
    descriptor: PositionedStringDescriptorType;
}
