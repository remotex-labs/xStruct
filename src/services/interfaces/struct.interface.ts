/**
 * Represents the size of a bitfield for both signed (int) and unsigned (uint) integers.
 *
 * The `BitSizeType` type can either be for a signed integer (`int:<size>`) or an unsigned integer (`uint:<size>`),
 * where the size is specified as a value from 1 to 8 bits. This allows you to define bit sizes for individual fields
 * within a data structure that can hold either signed or unsigned integers.
 *
 * **Examples:**
 * - `uint:1`  - An unsigned integer with a size of 1 bit
 * - `int:8`   - A signed integer with a size of 8 bits
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
 * const field1: BitSizeType = 'uint:4';  // 4-bit unsigned integer
 * const field2: BitSizeType = 'int:7';   // 7-bit signed integer
 * ```
 */

type BitSizeIntType = `int:${ 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 }`;
type BitSizeUIntType = `uint:${ 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 }`;
export type BitSizeType = BitSizeIntType | BitSizeUIntType;

/**
 * The `BitFieldInterface` defines the structure of a bitfield, representing a field
 * in a data structure where each field has a specified size, type, and position.
 *
 * - **`size`**: The size of the field, in bits.
 * - **`type`**: The type of the field, which can either be `'int'` (signed integer) or `'uint'` (unsigned integer).
 * - **`position`**: The bit position of the field within the larger structure. Position is zero-indexed, meaning the first bit is position 0.
 *
 * If the `position` is not explicitly specified, the field will be positioned based on the order in the struct.
 * This means that the fields are assigned positions sequentially starting from position 0 for the first field,
 * position 1 for the second field, and so on.
 *
 * This interface is typically used when defining fields in a bitfield, where each field's size,
 * type, and position need to be explicitly specified, or when using the default sequential positioning.
 *
 * @example
 * ```ts
 * const myBitfield = {
 *     field1: { size: 3, type: 'uint' }, // This will be at position 0
 *     field2: { size: 5, type: 'int' },  // This will be at position 3
 * };
 * ```
 */

export interface BitFieldInterface {
    size: number;
    type: 'int' | 'uint';
    position?: number;
}

/**
 * The `FieldInterface` defines the structure of a field that is of type `string`.
 *
 * - **`size`**: The length of the string field, in bytes. For strings, this value indicates how many characters the string can hold.
 * - **`type`**: The type of the field, which is always `'string'` for this interface.
 *
 * This interface is typically used when defining string fields within a larger data structure.
 */

export interface FieldInterface {
    size: number;
    type: 'string';
}

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
    | 'Int64LE'
    | 'Int64BE'
    | 'UInt64LE'
    | 'UInt64BE';

/**
 * The `StructSchemaInterface` defines the structure of a schema used to describe the layout of a data structure (e.g., a binary struct).
 *
 * Each property in the schema corresponds to a field in the struct. The field's type can be one of several possible types, including:
 *
 * - **PrimitiveType**: Defines the type of primitive data (e.g., integers of various sizes and endianness).
 * - **FieldInterface**: Defines a string field with a specified length.
 * - **BitFieldInterface**: Defines a field with a specific number of bits, including details such as position and size.
 * - **BitSizeType**: A special type representing bit-sized fields (e.g., `uint:1`, `int:2`).
 *
 * This interface is used to create a schema for a struct, where each key is the field's name and the value is the field's type definition.
 *
 * @example
 * ```ts
 * const schema: StructSchemaInterface = {
 *     field1: PrimitiveType.Int32LE,
 *     field2: { type: 'string', size: 10 },
 *     field3: { type: 'int', position: 5, size: 3 },
 *     field4: 'uint:4',
 * };
 * ```
 */

export interface StructSchemaInterface {
    [name: string]: PrimitiveType | FieldInterface | BitFieldInterface | BitSizeType
}

/**
 * The `FieldTypesType` defines the possible types that can be used for fields in a schema. It is a union type
 * that includes both primitive types and specific field types used in structured data definitions.
 *
 * The following types are supported:
 *
 * - **PrimitiveType**: Represents a primitive data type, such as `Int8`, `UInt16LE`, etc. These types are typically
 *   used for defining numerical data of varying sizes and endianness.
 * - **'int'**: Represents a signed integer field, commonly used for integer values.
 * - **'uint'**: Represents an unsigned integer field, used for integer values that cannot be negative.
 * - **'string'**: Represents a fixed-length string field, where the size of the string is predetermined.
 *
 * This type is used to define the `type` property within the schema, determining the data format for each field.
 * It ensures that the field types are consistent and compatible with the underlying data structure.
 */

export type FieldTypesType = PrimitiveType | 'int' | 'uint' | 'string';

/**
 * The `SchemaInterface` defines the structure of a schema used to describe how data is represented
 * in a buffer, including field types, sizes, offsets, and positions. This interface provides flexibility
 * to define both primitive fields (e.g., integers, strings) and bitfields.
 *
 * Each field in the schema corresponds to a byte or group of bytes in the data structure, with the ability
 * to specify its type, size, and position, especially when dealing with bitfields.
 *
 * The schema supports the following field types:
 *
 * - **PrimitiveType**: Defines a primitive data type (e.g., integers, strings).
 * - **int**: A signed integer type.
 * - **uint**: An unsigned integer type.
 * - **string**: A fixed-length string.
 *
 * Fields can also be bitfields, represented by setting the `bit` property to `true`. These fields are treated
 * as part of a bitmap, allowing precise control over individual bits within a byte or a sequence of bytes.
 *
 * @example
 * ```ts
 * const schema: SchemaInterface = {
 *   id: {
 *     type: 'uint',    // unsigned integer type
 *     bit: false,      // not a bitfield
 *     size: 4,         // 4 bytes
 *     offset: 0        // starts at byte 0
 *   },
 *   flag: {
 *     type: 'uint',    // unsigned integer type
 *     bit: true,       // part of a bitfield
 *     size: 1,         // 1 byte
 *     offset: 4,       // starts at byte 4
 *     position: 0      // starts at the least significant bit
 *   },
 *   username: {
 *     type: 'string',  // string type
 *     bit: false,      // not a bitfield
 *     size: 20,        // fixed-length string of 20 bytes
 *     offset: 5        // starts at byte 5
 *   }
 * };
 * ```
 *
 * Each property in the schema has the following structure:
 *
 * - `type`: Specifies the data type of the field. It can be one of:
 *   - `PrimitiveType` (e.g., `Int8`, `UInt16LE`, etc.),
 *   - `'int'` (signed integer),
 *   - `'uint'` (unsigned integer),
 *   - `'string'` (fixed-length string).
 *
 * - `isBitfield`: A boolean flag indicating if the field is part of a bitfield (`true`) or not (`false`).
 *
 * - `size`: The size of the field in bytes. For primitive types, it is typically 1, 2, 4, or 8 bytes.
 *   For strings, this defines the fixed length in bytes.
 *
 * - `offset`: The byte offset where this field begins in the buffer. This allows precise placement of fields
 *   in the overall data structure.
 *
 * - `position?`: An optional property, relevant only if `bit` is `true`. It indicates the bit position within
 *   the byte where the bitfield starts (0 for the least significant bit, 7 for the most significant bit).
 *
 * This interface is useful for encoding or decoding structured binary data, such as network packets or file formats,
 * where precise control over byte and bit positions is needed.
 */

export interface SchemaInterface {
    [name: string]: {
        type: FieldTypesType;
        size: number;
        offset: number, // offset of the byte for this bitmap or premitive type
        isBitfield: boolean,
        position?: number; // only in bitmap true
    }
}
