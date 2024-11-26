/**
 * Import will remove at compile time
 */

import type {
    PrimitiveType,
    FieldInterface,
    BitFieldInterface,
    StructSchemaInterface
} from '@services/interfaces/struct.interface';

export class Struct {
    readonly size: number;

    /**
     * Creates a new `Struct` instance with the provided schema.
     * The schema can contain primitive types, bit fields, or string fields.
     * The constructor automatically parses bit fields and calculates the size of the schema.
     *
     * @param schema - The schema of the struct, where each field can be a string (for primitive types or bit fields),
     * or an object describing a string field (with `type` and `size`).
     */

    constructor(private readonly schema: StructSchemaInterface) {
        for (const key in schema) {
            const field = schema[key];
            if (typeof field === 'string' && field.includes(':')) {
                schema[key] = this.parseBitField(field);
            }
        }

        this.size = this.getSchemaSize();
    }

    toBuffer(data: Record<string, unknown>): Buffer {
        let offset = 0;
        const buffer = Buffer.alloc(this.size);

        for (const key in this.schema) {
            const field = this.schema[key];
        }

        return buffer;
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
            if (field.includes(':')) {
                return Math.ceil(this.parseBitField(field).size / 8);  // Convert from bits to bytes
            }

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
     * The `getSchemaSize` method calculates the total size of all fields in the schema in bytes.
     * It iterates over all the fields in the schema, calculates the size of each field using the `getFieldSize` method,
     * and sums them up to return the total size in bytes.
     *
     * - This method is typically used when you need to determine the total memory size or storage requirement
     *   for a given schema, where the schema contains multiple fields with different types (e.g., primitive types,
     *   bit fields, strings).
     *
     * ## Example:
     *
     * ```ts
     * const schema = {
     *     QR: 'uint:1',
     *     Opcode: 'uint:2',
     *     AA: 'uint:1',
     *     id: 'Int64LE',  // 8 bytes
     *     name: { type: 'string', size: 10 },  // 10 bytes for string
     * };
     *
     * const totalSize = this.getSchemaSize();  // Calculates the total size of the schema in bytes
     * console.log(totalSize);  // Outputs the total size in bytes
     * ```
     *
     * ## Behavior:
     * - The method uses the `getFieldSize` function to calculate the size of each individual field.
     * - It then accumulates the sizes of all fields in the schema and returns the sum.
     *
     * ## Error Handling:
     * - If any field in the schema is not supported by the `getFieldSize` function, an error will be thrown.
     *
     * @returns The total size of the schema in bytes, as a number.
     */

    private getSchemaSize(): number {
        let totalSizeInBytes = 0;

        for (const fieldName in this.schema) {
            const field = this.schema[fieldName];
            totalSizeInBytes += this.getFieldSize(field);
        }

        return totalSizeInBytes;
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
}
