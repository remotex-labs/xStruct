/**
 * Import will remove at compile time
 */

import type {
    BitFieldInterface,
    BitSizeType,
    FieldInterface,
    FieldTypesType,
    PrimitiveType,
    SchemaInterface,
    StructSchemaInterface
} from '@services/interfaces/struct.interface';

export class Struct {
    /**
     * Size of the struct
     */

    readonly size: number = 0;

    /**
     * Struct schema
     */

    private readonly schema: SchemaInterface = {};

    /**
     * Creates a new `Struct` instance with the provided schema.
     * The schema can contain primitive types, bit fields, or string fields.
     * The constructor automatically parses bit fields and calculates the size of the schema.
     *
     * @param schema - The schema of the struct, where each field can be a string (for primitive types or bit fields),
     * or an object describing a string field (with `type` and `size`).
     */

    constructor(schema: StructSchemaInterface) {
        for (const key in schema) {
            this.size += this.resolveField(key, schema[key]);
        }

        console.log(this.schema)
    }

    /**
     * The `parseBitField` method converts a bit field string (e.g., 'uint:1', 'int:2') into a `BitFieldInterface` object.
     * It parses the field type and size from the input string and returns an object representing the bit field.
     *
     * - **Input**: A string in the format `'type:size'`, where `type` can be either `'int'` (signed integer) or `'uint'` (unsigned integer), and `size` is the number of bits.
     * - **Output**: A `BitFieldInterface` object with the corresponding `type` and `size` properties.
     *
     * ## Example:
     *
     * ```ts
     * const result = parseBitField('uint:1');
     * console.log(result); // { type: 'uint', size: 1 }
     *
     * const result2 = parseBitField('int:2');
     * console.log(result2); // { type: 'int', size: 2 }
     * ```
     *
     * ## Error Handling:
     * - If the input string does not match the expected format (`'int:n'` or `'uint:n'`),
     * an error is thrown indicating an invalid bit field format.
     *
     * @param field - A string representing a bit field in the format `'type:size'`.
     * @returns A `BitFieldInterface` object representing the parsed bit field.
     * @throws {Error} If the input string does not match the expected format.
     */

    private parseBitField(field: string): BitFieldInterface {
        const match = field.match(/^(int|uint):(\d+)$/); // Matches patterns like 'uint:1', 'int:2'
        if (!match) {
            throw new Error(`Invalid bit field format: ${ field }`);
        }

        const type = match[1] as 'int' | 'uint';  // 'int' or 'uint'
        const size = parseInt(match[2], 10);  // Size in bits

        return { type, size };
    }

    /**
     * The `getFieldSize` method calculates the size (in bytes) of a field based on its type.
     * It supports both primitive types and more complex types like bit fields and strings.
     *
     * - **For primitive types** (e.g., `'Int8'`, `'UInt8'`, `'Int16LE'`, etc.), the function returns the corresponding size in bytes.
     * - **For bit fields** (e.g., `'uint:1'`, `'int:2'`), the function first converts the size from bits to bytes.
     * - **For string fields**, the function returns the size in bytes directly as provided by the `size` property.
     * - **For bit field objects** (`int` or `uint` types), the function calculates the size in bytes by dividing the size (in bits) by 8.
     *
     * ## Example:
     *
     * ```ts
     * const result1 = this.getFieldSize('Int8');
     * console.log(result1); // 1 byte
     *
     * const result2 = this.getFieldSize('uint:2');
     * console.log(result2); // 1 byte (rounded from 0.25 bytes)
     *
     * const result3 = this.getFieldSize({ type: 'string', size: 10 });
     * console.log(result3); // 10 bytes (direct size for string)
     *
     * const result4 = this.getFieldSize({ type: 'int', size: 4 });
     * console.log(result4); // 1 byte (rounded from 0.5 bytes)
     * ```
     *
     * ## Error Handling:
     * - If the input type is unsupported or the field format is invalid, an error is thrown.
     *
     * @param field - The field whose size is to be calculated. This can be a string (primitive type or bit field),
     * or an object of type `FieldInterface`, `BitFieldInterface`, or `PrimitiveType`.
     * @returns The size of the field in bytes.
     * @throws {TypeError} If the field type is unsupported or the field format is invalid.
     */

    private getFieldSize(field: PrimitiveType | FieldInterface | BitFieldInterface | string): number {
        if (typeof field === 'string') {
            switch (field) {
                case 'Int8':
                case 'UInt8':
                    return 1;  // 1 byte
                case 'Int16LE':
                case 'Int16BE':
                case 'UInt16LE':
                case 'UInt16BE':
                    return 2;  // 2 bytes
                case 'Int32LE':
                case 'Int32BE':
                case 'UInt32LE':
                case 'UInt32BE':
                    return 4;  // 4 bytes
                case 'Int64LE':
                case 'Int64BE':
                case 'UInt64LE':
                case 'UInt64BE':
                    return 8;  // 8 bytes
                default:
                    throw new Error(`Unsupported primitive type: ${ field }`);
            }
        } else if (field.type === 'string') {
            return field.size;
        } else if (field.type === 'int' || field.type === 'uint') {
            return Math.ceil(field.size / 8);
        } else {
            throw new TypeError(`Unsupported field type: ${ field }`);
        }
    }

    /**
     * The `resolveField` method processes a field definition, calculates its size and type,
     * and updates the schema for a struct with the field's metadata.
     *
     * - **For primitive types** (e.g., `'Int8'`, `'UInt16LE'`),
     * the function uses the provided type to determine the size.
     * - **For bit fields** (e.g., `'uint:1'`, `'int:2'`),
     * the function parses the string to extract the type and size, and then converts the size from bits to bytes.
     * - **For object fields** (e.g., `FieldInterface` or `BitFieldInterface`),
     * the function calculates the size based on the type and size properties, handling positions when available.
     *
     * ## Example:
     *
     * ```ts
     * const field: PrimitiveType = 'Int8'; // A simple primitive field
     * this.resolveField('field1', field); // Adds 'field1' with size of 1 byte
     *
     * const bitField: string = 'uint:3'; // A bit field
     * this.resolveField('field2', bitField); // Adds 'field2' with size of 1 byte (rounded from 0.375 bytes)
     * ```
     *
     * ## Error Handling:
     * - If an unsupported field type or invalid bit field format is provided, an error is thrown.
     *
     * @param key - The name of the field in the schema.
     * @param field - The field definition, which can be:
     *   - A primitive type string (e.g., `'Int8'`, `'UInt16LE'`),
     *   - A bit field string (e.g., `'uint:1'`, `'int:2'`),
     *   - A `FieldInterface` or `BitFieldInterface` object.
     *
     * @returns The size of the field in bytes.
     * @throws {TypeError} If the field type is unsupported or the bit field format is invalid.
     */

    private resolveField(key: string, field: PrimitiveType | FieldInterface | BitFieldInterface | BitSizeType): number {
        let type: FieldTypesType;
        let size: number;
        let position: number | undefined;
        let isBitfield = false;
        const offset = this.size;

        // Handle the case when the field is a string (primitive type or bit field).
        if (typeof field === 'string') {
            if (field.includes(':')) {
                // It's a bit field (e.g., 'uint:1', 'int:2').
                field = this.parseBitField(field);
                type = field.type;
                isBitfield = true;
            } else {
                // It's a primitive type (e.g., 'Int8', 'UInt16LE').
                type = <PrimitiveType> field;
            }

            size = this.getFieldSize(field);
        } else {
            // Handle the case when the field is an object (FieldInterface or BitFieldInterface).
            type = field.type;
            size = field.type === 'string' ? field.size : this.getFieldSize(field);

            // Set the position if available (for non-bit fields).
            if ('position' in field) {
                position = field.position;
            }
        }

        this.schema[key] = {
            size,
            type,
            offset,
            position,
            isBitfield
        };

        return size;
    }
}
