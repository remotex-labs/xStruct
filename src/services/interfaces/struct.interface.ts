/**
 * Import will remove at compile time
 */

import type { Struct } from '@services/struct.service';

/**
 * Represents the size of a bitfield for both signed (int) and unsigned (uint) integers.
 *
 * The `BitSizeType` type can either be for a signed integer (`int:<size>`) or an unsigned integer (`UInt8:<size>`),
 * where the size is specified as a value from 1 to 8 bits. This allows you to define bit sizes for individual fields
 * within a data structure that can hold either signed or unsigned integers.
 *
 * **Examples:**
 * - `UInt8:1`  - An unsigned integer with a size of 1 bit
 * - `Int8:8`   - A signed integer with a size of 8 bits
 *
 * **Valid Sizes:**
 * The valid sizes for the bitfield are integers between 1 and 8, inclusive.
 *
 * **Usage:**
 * This type is useful for defining bitfields in a struct or data representation where precise control over
 * the number of bits used for each field is required.
 *
 * @example
 * ```ts
 * const field1: BitSizeType = 'UInt8:4';  // 4-bit unsigned integer
 * const field2: BitSizeType = 'Int8:7';   // 7-bit signed integer
 * ```
 */

type BitSizeIntType = `Int8:${ 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 }`;
type BitSizeUIntType = `UInt8:${ 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 }`;
export type BitSizeType = BitSizeIntType | BitSizeUIntType;

/**
 * The `PrimitiveType` type defines the various primitive data types used for structuring fields in a binary layout.
 * These types represent different integer sizes, both signed and unsigned, along with their associated endianness (byte order).
 *
 * ### Endianness:
 * - **LE** (Little Endian): The least significant byte (LSB) is stored first.
 * - **BE** (Big Endian): The most significant byte (MSB) is stored first.
 *
 * This type is typically used in a schema to specify the type of each field in a structure,
 * especially when dealing with binary data formats or low-level data manipulation where byte order matters.
 *
 * @example
 * ```ts
 * const myStruct = {
 *     field1: 'Int32LE',
 *     field2: 'UInt16BE',
 *     field3: 'Int8',
 * };
 * ```
 */

export type PrimitiveType =
    | 'Int8'
    | 'UInt8'
    | 'Int16LE'
    | 'Int16BE'
    | 'UInt16LE'
    | 'UInt16BE'
    | 'Int32LE'
    | 'Int32BE'
    | 'UInt32LE'
    | 'UInt32BE'
    | 'BigInt64LE'
    | 'BigInt64BE'
    | 'BigUInt64LE'
    | 'BigUInt64BE';

/**
 * The FieldInterface defines the structure of a field that is of type string.
 *
 * - **size**: The length of the string field, in bytes.
 * For strings, this value indicates how many characters the string can hold.
 * - **type**: The type of the field, which is always 'string' for this interface.
 *
 * This interface is typically used when defining string fields within a larger data structure.
 */

export interface FieldInterface {
    type: 'string';
    size: number;
}

/**
 * The `ParseFieldInterface` defines the structure of a field that can be parsed for its type and size.
 * This interface is used when processing fields that can represent various types, including primitive types,
 * integers, unsigned integers, bit fields, and strings.
 *
 * - **`type`**: The type of the field.
 *   It can be one of the following:
 *   - `PrimitiveType` (e.g., `'Int8'`, `'UInt8'`, `'Int16'`, etc.) — Represents basic data types.
 *   - `'string'` — A string type.
 *   - `BitSizeType` (e.g., `'Int:2'`, `'UInt:3'`) — Represents a bit field size, where `Int` and `UInt` are integer types
 *     with a specified number of bits.
 *
 * - **`size`**: The size of the field.
 *   The interpretation of `size` depends on the `type`:
 *   - For **primitive types** (e.g., `'Int8'`, `'UInt8'`), the `size` represents the number of bytes.
 *   - For **string fields**, `size` represents the number of characters in the string (measured in bytes).
 *   - For **bit field types** (e.g., `'Int:n'`, `'UInt:n'`), `size` indicates the number of bits specified for the field.
 *
 *   - **Important**: If `isBits` is `false`, the `size` represents the byte size of the field. If `isBits` is `true`, the `size` represents the bit size.
 *
 * - **`isBits`**: A boolean indicating whether the `size` is in bits (`true`) or bytes (`false`).
 *   - **`true`**: The `size` is in bits (e.g., for bit fields like `'UInt:3'`).
 *   - **`false`**: The `size` is in bytes (e.g., for primitive types like `'UInt8'` or strings).
 *
 * ## Example:
 *
 * ```ts
 * const field1: ParseFieldInterface = { type: 'Int8', size: 1, isBits: false };    // Signed integer, byte
 * const field2: ParseFieldInterface = { type: 'UInt8', size: 1, isBits: false };   // Unsigned integer, byte
 * const field3: ParseFieldInterface = { type: 'string', size: 10, isBits: false }; // String, 10 characters (bytes)
 * const field4: ParseFieldInterface = { type: 'UInt8', size: 8, isBits: true };   // 8-bit unsigned integer
 * const field5: ParseFieldInterface = { type: 'Int', size: 3, isBits: true };     // 3-bit signed integer (bit field)
 * ```
 *
 * This interface is typically used in contexts where fields need to be parsed and processed based on their types and sizes,
 * such as in binary data schemas or protocol parsing.
 */

export interface ParseFieldInterface {
    type: PrimitiveType | 'string' | Struct;
    size: number;
    isBits?: boolean;
}

/**
 * The `StructSchemaInterface` defines the layout of a schema used to describe the structure of a binary data format (e.g., a structured buffer or binary struct).
 *
 * Each property in the schema represents a field in the struct. The field's name serves as the key, and its value defines the field's type, size, and other metadata.
 * The type of each field is specified using the flexible `FieldsType`, which supports various data types and layouts.
 *
 * ## Supported Field Types:
 *
 * - **`PrimitiveType`**:
 *   Represents fixed-size integers of different sizes and endianness.
 *   Examples: `'Int16LE'`, `'UInt8'`, `'UInt32BE'`.
 *
 * - **`FieldInterface`**:
 *   Defines string or byte array fields with a specified length.
 *   Example: `{ type: 'string', size: 10 }` - A string field of 10 bytes.
 *
 * - **`BitSizeType`**:
 *   A shorthand for bit-sized fields using a string format like `'UInt8:3'` or `'Int8:7'`.
 *   Example: `'UInt8:3'` - A 3-bit unsigned integer.
 *
 * ## Usage:
 *
 * This interface enables defining a schema that can describe complex data layouts involving combinations of bitfields, primitive types, and string fields.
 *
 * ## Example:
 * ```ts
 * const schema: StructSchemaInterface = {
 *     header: 'UInt16LE',                  // A 16-bit unsigned integer (little-endian).
 *     name: { type: 'string', size: 10 },  // A string field with a length of 10 bytes.
 *     flags: 'UInt8:3',                    // A 3-bit unsigned integer.
 * };
 * ```
 *
 * ## Features:
 * - Enables precise control over the size and position of fields.
 * - Supports both byte-level and bit-level field definitions.
 * - Allows combining primitive, string, and bitfield types in a single schema.
 */

export interface StructSchemaInterface {
    [name: string]: BitSizeType | PrimitiveType | FieldInterface | Struct
}

/**
 * The `SchemaFieldType` represents the structure of a single field in a schema.
 * This type is used to describe
 * the characteristics of a field, including its type, size, offset, whether it's a bitfield, and the bit position
 * within the byte (if it's a bitfield).
 *
 * - **type**: The data type of the field. It can be a `PrimitiveType` (e.g., `'UInt8'`, `'Int16'`) or any string
 *   that represents the type of the field. For example, bitfields may be represented as strings with size information (e.g., `'UInt8:4'`).
 *
 * - **size**: The size of the field in bytes. For bitfields, this represents the number of bits, and for primitive types,
 *   it is the size of bytes (e.g., byte for `UInt8`, 2-bytes for `UInt16`).
 *
 * - **offset**: The byte offset of the field within the structure. This is used to determine where the field starts
 *   within the byte array or buffer.
 *
 * - **isBits**: A boolean flag indicating whether the field is a bitfield. If `true`, the field is a bitfield and occupies
 *   part of a byte. If `false`, it is a regular primitive type field.
 *
 * - **position** (optional): Only used for bitfields. This indicates the position of the bitfield within its byte.
 *   Bitfields are stored within bytes, and the `position` helps determine the specific bit's location within that byte.
 *
 * ## Example:
 * ```ts
 * const field1: SchemaFieldType = {
 *     type: 'UInt8',
 *     size: 1,
 *     offset: 0,
 *     isBits: false
 * };
 *
 * const field2: SchemaFieldType = {
 *     type: 'UInt8',
 *     size: 4,
 *     offset: 1,
 *     isBits: true,
 *     position: 0
 * };
 * ```
 *
 * ## Error Handling:
 * - This type is a descriptor for a field and is typically used as part of a larger schema structure. There are no specific
 *   error handling requirements, but ensure that fields are correctly defined with the appropriate size and type information.
 */

export type SchemaFieldType = {
    type: PrimitiveType | string | Struct;
    size: number;
    offset: number, // offset of the byte for this bitmap or primitive type
    isBits: boolean,
    position?: number; // only in bitmap true show the position in the bits
}

/**
 * The `SchemaInterface` defines the structure for a schema representing various fields,
 * including primitive types and bitmaps, with details about their types, sizes, offsets, and bit positions.
 * It allows for the definition of data schemas that include both byte-aligned and bit-aligned fields.
 *
 * Each entry in the schema is indexed by a `name` and contains details for a field, such as:
 * - **`type`**: The type of the field, which can be a `PrimitiveType` (e.g., `'Int8'`, `'UInt8'`) or any string type.
 * - **`size`**: The size of the field, measured in bytes or bits, depending on the field type.
 * - **`offset`**: The byte offset of the field within the data structure. It indicates where the field begins in the data.
 * - **`isBits`**: A boolean indicating whether the field is measured in bits (`true`) or bytes (`false`).
 * - **`position`** (optional): Used only for bit fields (`isBits: true`), this indicates the position of the bit field within a byte or a bitmap.
 *
 * ## Example:
 *
 * ```ts
 * const schema: SchemaInterface = {
 *   field1: {
 *     type: 'Int8',
 *     size: 1,
 *     offset: 0,
 *     isBits: false,
 *   },
 *   field2: {
 *     type: 'UInt8:3',
 *     size: 3,
 *     offset: 1,
 *     isBits: true,
 *     position: 0,
 *   },
 * };
 * ```
 *
 * In this example:
 * - `field1` is a 1-byte signed integer with no bit-specific information.
 * - `field2` is a 3-bit unsigned integer that starts at byte offset 1, with its position in the byte indicated by the `position` property.
 *
 * ## Error Handling:
 * - If the schema has incorrect types, sizes, or other misconfigurations, it should be validated separately before usage.
 *
 * @property {string} name - The name of the field in the schema.
 * @returns {object} The object representing the field with `type`, `size`, `offset`, `isBits`, and optionally `position`.
 */

export interface SchemaInterface {
    [name: string]: SchemaFieldType
}
