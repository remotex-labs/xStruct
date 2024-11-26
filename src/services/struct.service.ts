/**
 * Import will remove at compile time
 */

import type {
    BitSizeType,
    PrimitiveType,
    FieldInterface,
    SchemaInterface,
    ParseFieldInterface,
    StructSchemaInterface
} from '@services/interfaces/struct.interface';

export class Struct {
    /**
     * The `size` property represents the total size of the struct in bytes.
     * This value is calculated by summing the sizes of all fields in the struct,
     * taking into account both the bitfield and non-bitfield fields, as well as any padding needed for alignment.
     * The `size` is a read-only property and reflects the total memory required to store the struct, including all its fields
     * and their respective positions and offsets.
     *
     * - **Type**: `number`
     * - **Description**: The total size of the struct in bytes.
     *
     * ## Example:
     * ```ts
     * const structSize = myStruct.size;
     * console.log(structSize); // Logs the total size of the struct in bytes
     * ```
     */

    readonly size: number;

    /**
     * The `schema` property stores the parsed representation of a struct schema.
     * It is a read-only object that maps each field name to an object describing the field's type, size, offset, and other relevant attributes.
     * The schema object is populated when the struct is parsed, and it reflects the internal structure of the struct.
     *
     * - **Type**: `SchemaInterface`
     * - **Description**: A read-only object containing the parsed schema for the struct. It includes information about the fields such as:
     *   - `type`: The type of the field (e.g., `'UInt8'`, `'Int16'`).
     *   - `size`: The size of the field in bytes.
     *   - `offset`: The offset of the field within the struct, measured in bytes.
     *   - `isBits`: A boolean indicating whether the field is a bitfield or a regular field.
     *   - `position`: (optional) The bit position within the byte for bitfield fields.
     *
     * ## Example:
     * ```ts
     * const structSchema = myStruct.schema;
     * console.log(structSchema);
     * // Expected output format:
     * // {
     * //   field1: { type: 'UInt8', size: 1, isBits: false, offset: 0 },
     * //   field2: { type: 'UInt8:4', size: 4, isBits: true, offset: 1, position: 0 }
     * // }
     * ```
     */

    private readonly schema: SchemaInterface = {};

    /**
     * The constructor initializes a new instance of the class by parsing the provided struct schema.
     * It takes a `StructSchemaInterface` object, processes the schema to determine the field types, sizes, and offsets,
     * and calculates the total size of the struct in bytes. The result is stored in the `size` property.
     *
     * - **Input**:
     *   - `schema` (StructSchemaInterface): The struct schema object representing the field names and their associated type/size information.
     *     Each field is represented either as a string (e.g., `'UInt8'`, `'UInt8:4'`) or a more complex object indicating its type.
     *
     * - **Output**:
     *   - The constructor does not return a value. Instead, it initializes the `size` property, which represents the total size of the struct.
     *     The struct size is calculated in bytes by calling the `parseSchema` method.
     *
     * ## Example:
     * ```ts
     * const structSchema: StructSchemaInterface = {
     *     field1: 'UInt8',
     *     field2: 'UInt8:4',
     *     field3: 'UInt16'
     * };
     *
     * const struct = new MyStruct(structSchema);
     * console.log(struct.size); // Outputs the total size of the struct in bytes.
     * ```
     *
     * ## Notes:
     * - The constructor invokes `parseSchema` to process the schema and determine the overall struct size based on the field definitions.
     * - The `size` property will be set to the calculated size in bytes after the constructor completes.
     */

    constructor(schema: StructSchemaInterface) {
        this.size = this.parseSchema(schema);
        console.log(this.schema);
    }

    /**
     * The `parseBitField` method converts bit field string (e.g., `'Int8:1'`, `'UInt8:2'`) into a `ParseFieldInterface` object.
     * It parses the field type and size from the input string and returns an object representing the bit field with the correct
     * type and size properties, while also indicating that the size is in bits.
     *
     * - **Input**: A `BitSizeType` string in the format `'type:size'`,
     *   where `type` can be either `'Int8'` (signed integer) or `'UInt8'` (unsigned integer),
     *   and `size` is the number of bits.
     * - **Output**: A `ParseFieldInterface` object with the corresponding `type`, `size`, and `isBits` properties.
     *
     * ## Example:
     *
     * ```ts
     * const result = parseBitField('UInt8:1');
     * console.log(result); // { type: 'UInt8', size: 1, isBits: true }
     *
     * const result2 = parseBitField('Int8:2');
     * console.log(result2); // { type: 'Int8', size: 2, isBits: true }
     * ```
     *
     * ## Error Handling:
     * - If the input string does not match the expected format (`'Int8:n'` or `'UInt8:n'`),
     *   an error is thrown indicating an invalid bit field format.
     *
     * @param field - A `BitSizeType` string representing bit field in the format `'type:size'`.
     * @returns A `ParseFieldInterface` object representing the parsed bit field, with `isBits: true`.
     * @throws {Error} If the input string does not match the expected format.
     */

    private parseBitField(field: BitSizeType): ParseFieldInterface {
        const match = field.match(/^(Int8|UInt8):(\d+)$/);
        if (!match) {
            throw new Error(`Invalid bit field format: ${ field }`);
        }

        const type = match[1] as 'UInt8' | 'Int8';
        const size = parseInt(match[2], 10);  // Size in bits

        return { type, size, isBits: true };
    }

    /**
     * The `parsePrimitiveField` method parses a given primitive type and returns a `ParseFieldInterface` object
     * that represents the parsed field with its corresponding size (in bytes).
     * This method supports common primitive types like signed and unsigned integers in various byte sizes.
     *
     * - **Input**: A `PrimitiveType` representing the type of the primitive field.
     *   The supported types include:
     *   - `'Int8'`, `'UInt8'` — 1 byte
     *   - `'Int16LE'`, `'Int16BE'`, `'UInt16LE'`, `'UInt16BE'` — 2 bytes
     *   - `'Int32LE'`, `'Int32BE'`, `'UInt32LE'`, `'UInt32BE'` — 4 bytes
     *   - `'Int64LE'`, `'Int64BE'`, `'UInt64LE'`, `'UInt64BE'` — 8 bytes
     *
     * - **Output**: A `ParseFieldInterface` object with the corresponding `type`, `size` (in bytes),
     * and `isBits` (set to `false`).
     *
     * ## Example:
     *
     * ```ts
     * const field1 = parsePrimitiveField('Int8');
     * console.log(field1); // { type: 'Int8', size: 1, isBits: false }
     *
     * const field2 = parsePrimitiveField('UInt16LE');
     * console.log(field2); // { type: 'UInt16LE', size: 2, isBits: false }
     * ```
     *
     * ## Error Handling:
     * - If the provided type is unsupported, the method throws a `TypeError`.
     *
     * @param type - The type of the field, which can be one of the supported primitive types.
     * @returns A `ParseFieldInterface` object representing the field type and size in bytes, with `isBits` set to `false`.
     * @throws {TypeError} If the input type is unsupported.
     */

    private parsePrimitiveField(type: PrimitiveType): ParseFieldInterface {
        const typeSizes: { [key in PrimitiveType]: number } = {
            'Int8': 1, 'UInt8': 1,
            'Int16LE': 2, 'Int16BE': 2, 'UInt16LE': 2, 'UInt16BE': 2,
            'Int32LE': 4, 'Int32BE': 4, 'UInt32LE': 4, 'UInt32BE': 4,
            'Int64LE': 8, 'Int64BE': 8, 'UInt64LE': 8, 'UInt64BE': 8
        };

        if (typeSizes[type]) {
            return { type, size: typeSizes[type], isBits: false };
        }

        throw new TypeError(`Unsupported primitive type: ${ type }`);
    }

    /**
     * The `parseField` method parses a given field, determining whether it's a string type or an object
     * and returns a `ParseFieldInterface` object. It will call the appropriate parsing function based on
     * whether the field is a bit field or a primitive type.
     *
     * - **Input**: A `FieldInterface` or string that represents the field type.
     * - **Output**: A `ParseFieldInterface` object with the parsed field details (type, size, isBit).
     *
     * ## Example:
     * ```ts
     * const fieldObject = parseField('Int8'); // Returns { type: 'Int8', size: 1, isBit: false }
     * const fieldObject2 = parseField('UInt8:4'); // Returns { type: 'UInt8', size: 4, isBit: true }
     * ```
     *
     * @param field - The field to parse, which could be a string or an object.
     * @returns A `ParseFieldInterface` object representing the parsed field.
     */

    private parseField(field: FieldInterface | string): ParseFieldInterface {
        if (typeof field === 'string') {
            return field.includes(':')
                ? this.parseBitField(field as BitSizeType)
                : this.parsePrimitiveField(field as PrimitiveType);
        }

        return field;
    }

    /**
     * The `processBitfield` method updates the accumulator and the schema with the bitfield details.
     * It calculates the offset and position for bitfields and manages the byte and bit size accumulation
     * to ensure proper alignment and offset handling when parsing fields in a struct schema.
     *
     * - **Input**:
     *   - `name` (string): The name of the field being processed.
     *   - `accumulator` (object): An object that tracks the number of bits and bytes accumulated so far.
     *     - `bits` (number): The current number of accumulated bits.
     *     - `bytes` (number): The current number of accumulated bytes.
     *   - `field` (ParseFieldInterface): The field object, containing details like `type` (e.g., 'UInt8') and `size` (number of bits for bitfields).
     *
     * - **Output**:
     *   - This method updates the `schema` object with the parsed field information, including its `type`, `size`, `offset`, and `position`.
     *   - It modifies the accumulator, adjusting `bits` and `bytes` based on the size of the bitfield.
     *
     * ## Example:
     * ```ts
     * const accumulator = { bits: 0, bytes: 0 };
     * const field = { type: 'UInt8', size: 4, isBits: true };
     * const name = 'T1';
     * processBitfield(name, accumulator, field);
     * console.log(accumulator); // { bits: 4, bytes: 1 }
     * console.log(this.schema[name]); // { type: 'UInt8', size: 4, isBits: true, offset: 0, position: 0 }
     * ```
     *
     * ## Error Handling:
     * - This method assumes that the input `field` is always a valid bitfield (i.e., `field.isBits` is `true`).
     *
     * @param name - The name of the field to be processed.
     * @param accumulator - An object containing the current accumulation of bits and bytes.
     * @param field - A `ParseFieldInterface` object representing the field, including type and size (in bits).
     */

    private processBitfield(name: string, accumulator: { bits: number, bytes: number }, field: ParseFieldInterface): void {
        const nextTotalBits = accumulator.bits + field.size;
        if (nextTotalBits > 8) {
            accumulator.bits = 0;
            accumulator.bytes += 1;
        }

        this.schema[name] = {
            type: field.type,
            size: field.size,
            isBits: true,
            offset: accumulator.bytes,
            position: accumulator.bits
        };

        accumulator.bits += field.size;
    }

    /**
     * The `parseSchema` method processes a struct schema and builds a detailed `schema` object.
     * It iterates over each field in the struct schema, parses the field type, size, and determines whether the field
     * is a bitfield or a regular type (e.g., primitive type like 'UInt8', 'Int16').
     * Based on the type, it updates the schema and accumulates the total byte and bit sizes, ensuring proper alignment
     * and offsets for each field.
     *
     * - **Input**:
     *   - `schema` (StructSchemaInterface): An object representing the struct schema, where each key is a field name,
     *     and its value is either a string (e.g., 'UInt8', 'UInt8:4')
     *     or a more complex object that represents the field type.
     *
     * - **Output**:
     *   - This method returns the total size of the struct in bytes,
     *   calculated based on the field sizes and their positions.
     *   - The method also updates the `schema` object with each field’s `type`, `size`, `isBits`, `offset`, and `position`.
     *     - For non-bitfields, the field's offset is tracked in bytes.
     *     - For bitfields, the offset is tracked in bytes, and the position within the byte is also recorded.
     *
     * ## Example:
     * ```ts
     * const schema: StructSchemaInterface = {
     *     field1: 'UInt8',
     *     field2: 'UInt8:4',
     *     field3: 'UInt16'
     * };
     * const structSize = parseSchema(schema);
     * console.log(this.schema);
     * console.log(structSize); // Expected Output: 4 bytes
     * // Expected schema output:
     * // {
     * //   field1: { type: 'UInt8', size: 1, isBits: false, offset: 0 },
     * //   field2: { type: 'UInt8', size: 4, isBits: true, offset: 1, position: 0 },
     * //   field3: { type: 'UInt16', size: 2, isBits: false, offset: 2 }
     * // }
     * ```
     *
     * ## Error Handling:
     * - This method assumes that the input schema is valid and that `parseField` and `processBitfield` functions
     *   will properly handle the input field types.
     *
     * @param schema - The struct schema object containing field names and type/size information for each field.
     * @returns The total size of the struct in bytes.
     */

    private parseSchema(schema: StructSchemaInterface): number {
        const accumulator = {
            bits: 0,
            bytes: 0
        };

        for (const fieldName in schema) {
            const field = schema[fieldName];
            const fieldObject: ParseFieldInterface = this.parseField(field);

            if (!fieldObject.isBits) {
                if (accumulator.bits > 0) {
                    accumulator.bits = 0;
                    accumulator.bytes += 1;
                }

                this.schema[fieldName] = {
                    type: fieldObject.type,
                    size: fieldObject.size,
                    isBits: false,
                    offset: accumulator.bytes
                };

                accumulator.bits = 0;
                accumulator.bytes += fieldObject.size;
                continue;
            }

            this.processBitfield(fieldName, accumulator, fieldObject);
        }

        return ++accumulator.bytes;
    }
}
