/**
 * Import will remove at compile time
 */

import type {
    BitSizeType,
    FieldInterface,
    ParseFieldInterface,
    PrimitiveType,
    SchemaFieldType,
    SchemaInterface,
    StructSchemaInterface,
    WriteMethodType
} from '@services/interfaces/struct.interface';

export class Struct<T extends object = object> {
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
    }

    /**
     * The `toBuffer` method converts an object of type `T` into a `Buffer` by serializing its fields according to the schema
     * defined in the class. It iterates through the fields of the provided object, converts the data into the appropriate
     * binary format, and writes it to a `Buffer`.
     *
     * This method handles both regular fields (standard types) and bitfield fields (binary data represented as a series of bits).
     * It also supports nested `Struct` objects, serializing them into the buffer at the appropriate offsets.
     *
     * - **Input**:
     *   - `data`: An object of type `T` containing the data to be serialized. The object must contain fields matching the
     *     schema, with values that are either standard types or bitfields, depending on the field configuration. If the schema
     *     field is a nested `Struct`, the corresponding value in `data` must be an object.
     *
     * - **Output**:
     *   - A `Buffer` containing the binary data representing the provided object, serialized according to the schema.
     *
     * ## Example:
     * ```ts
     * const data = {
     *   field1: 10, // A value for the bitfield field
     *   field2: 177 // A value for the regular field
     * };
     *
     * const test = new Struct({
     *     field1: 'UInt8:4',
     *     field2: 'UInt8'
     * });
     *
     * const buffer = test.toBuffer(data);
     * console.log(buffer); // Buffer with serialized data based on the schema
     * ```
     *
     * ## Error Handling:
     * - If a field in the schema is missing in the input `data` object, it is ignored and not written to the buffer.
     * - The method assumes that the data in the object matches the field types defined in the schema. If the data type
     *   doesn't match, an error may occur during serialization.
     * - If a field is a nested `Struct`, the corresponding value in `data` must be an object. If the value is not an object
     *   (i.e., `null` or a primitive type), an error will be thrown indicating the mismatch:
     *   ```ts
     *   throw new Error(`Expected an object for field ${fieldName}, but received ${typeof nestedFieldValue}`);
     *   ```
     *
     * @param data - The object containing the data to be serialized into a buffer.
     * @returns A `Buffer` containing the serialized binary data of the object.
     */

    toBuffer(data: T): Buffer {
        const buffer = Buffer.alloc(this.size);
        if (!data || typeof data !== 'object') {
            throw new Error(`Expected an object of fields, but received ${ typeof data }`);
        }

        for (const fieldName in this.schema) {
            if (!(fieldName in data)) {
                continue;
            }

            const field = this.schema[fieldName];
            if (field.type instanceof Struct) {
                const nestedFieldValue = data[<keyof T> fieldName];
                if (nestedFieldValue) {
                    const nestedStructBuffer = field.type.toBuffer(nestedFieldValue);
                    buffer.set(nestedStructBuffer, field.offset);
                    continue;
                }

                throw new Error(`Expected an object for field ${ fieldName }, but received ${ typeof nestedFieldValue }`);
            } else if (field.isBits) {
                this.writeBitField(buffer, field, <number> data[<keyof T> fieldName]);
            } else {
                this.writeField(buffer, field, <unknown> data[<keyof T> fieldName]);
            }
        }

        return buffer;
    }

    /**
     * The `toObject` method converts a `Buffer` into an object by interpreting the buffer's data according to the schema
     * defined in the class.
     * It iterates through the schema fields, reads each field's value from the buffer, and maps them
     * to an object with the field names as keys.
     *
     * This method handles both regular fields (standard types) and bitfield fields
     * (binary data represented as a series of bits).
     *
     * - **Input**:
     *   - `buffer`: A `Buffer` containing the raw binary data to be interpreted.
     *   The method reads from this buffer according to the schema definition.
     *
     * - **Output**:
     *   - A new object of type `T`, where each field from the schema is populated with its
     *   corresponding value extracted from the buffer.
     *   The field values are either extracted from regular types or bitfields depending on their schema configuration.
     *
     * ## Example:
     * ```ts
     * const buffer = Buffer.from([ 0b11001010, 0b10110001 ]); // Example buffer with raw data
     * const test = new Struct({
     *     field1: 'UInt8:4',
     *     field2: 'UInt8'
     * });
     *
     * console.log(test.toObject(buffer)); // { field1: 10, field2: 177 }
     * ```
     *
     * ## Error Handling:
     * - The method assumes that the buffer contains enough data to extract values for all fields defined in the schema.
     * - If the buffer is too short to satisfy the field sizes,
     * or if the data cannot be properly interpreted based on the schema,
     * it may throw errors or return unexpected results.
     *
     * @param buffer - The buffer containing raw binary data to be parsed into an object.
     * @returns A new object of type `T` with values extracted from the buffer based on the schema.
     */

    toObject(buffer: Buffer): Required<T> {
        const result: Record<string, unknown> = {};
        for (const fieldName in this.schema) {
            const field = this.schema[fieldName];

            if (field.type instanceof Struct) {
                result[fieldName] = field.type.toObject(buffer.subarray(field.offset, field.offset + field.size));
            } else if (field.isBits) {
                result[fieldName] = this.readBitField(buffer, field);
            } else {
                result[fieldName] = this.readField(buffer, field);
            }
        }

        return result as Required<T>;
    }

    /**
     * The `validateBitfieldValue` method checks whether a given value fits within the bounds
     * of the specified bit field. It ensures that the value does not exceed the maximum or minimum
     * value allowed by the bit field's size and type (signed or unsigned).
     *
     * - **Input**:
     *   - `field` (SchemaFieldType): An object representing the bit field, which includes the
     *     `size` (number of bits) and `type` (either signed or unsigned integer type like `'Int8'`, `'UInt8'`).
     *   - `value` (number): The value to be validated against the bit field's bounds.
     *
     * - **Output**:
     *   - This method does not return any value. It throws a `RangeError` if the value is out of range.
     *
     * ## Example:
     *
     * ```ts
     * const field: SchemaFieldType = { type: 'UInt8', size: 8, offset: 0, isBits: true };
     * validateBitfieldValue(field, 255); // No error, valid value for UInt8.
     *
     * const field2: SchemaFieldType = { type: 'Int8', size: 8, offset: 0, isBits: true };
     * validateBitfieldValue(field2, -128); // No error, valid value for Int8.
     *
     * // Throws RangeError:
     * validateBitfieldValue(field, 256); // Throws RangeError: Value 256 does not fit within 8-bits for type UInt8
     * ```
     *
     * ## Error Handling:
     * - A `RangeError` is thrown if the provided `value` is less than the minimum allowed value or greater
     *   than the maximum allowed value for the specified bit field's type and size.
     *
     * @param field - A `SchemaFieldType` object representing the bit field with `type`, `size`, and other properties.
     * @param value - The value to validate against the bit field's range.
     * @throws {RangeError} If the value is outside the valid range for the bit field size and type.
     */

    private validateBitfieldValue(field: SchemaFieldType, value: number): void {
        const maxBitValue = (<string> field.type).startsWith('Int') ? (1 << field.size - 1) - 1 : (1 << field.size) - 1;
        const minBitValue = (<string> field.type).startsWith('Int') ? -(1 << (field.size - 1)) : 0;

        if (value < minBitValue || value > maxBitValue) {
            throw new RangeError(`Value ${ value } does not fit within ${ field.size } bits for type ${ field.type }`);
        }
    }

    /**
     * The `processValueForBitfield` method processes a given value based on the type of bit field (signed or unsigned).
     * For signed bit fields (e.g., `Int8`), it ensures proper sign extension using `BigInt.asIntN`.
     * For unsigned bit fields (e.g., `UInt8`), it returns the value as-is without any modification.
     *
     * - **Input**:
     *   - `field` (SchemaFieldType): The bit field object that includes the `type` (signed or unsigned) and `size` (number of bits).
     *   - `value` (number): The value to be processed for the bit field.
     *
     * - **Output**:
     *   - Returns a `number` that is the processed value, which is sign-extended if the bit field is signed, or the original value if the bit field is unsigned.
     *
     * ## Example:
     *
     * ```ts
     * const signedField: SchemaFieldType = { type: 'Int8', size: 8, offset: 0, isBits: true };
     * const signedValue = processValueForBitfield(signedField, -100);
     * console.log(signedValue);  // Ensures correct sign extension for Int8, returns processed value.
     *
     * const unsignedField: SchemaFieldType = { type: 'UInt8', size: 8, offset: 0, isBits: true };
     * const unsignedValue = processValueForBitfield(unsignedField, 200);
     * console.log(unsignedValue);  // Returns the original value (no sign extension for UInt8).
     * ```
     *
     * ## Error Handling:
     * - This method does not throw any errors but assumes that the value provided is within the valid range for the bit field.
     *   Any validation for out-of-range values should be handled separately (e.g., by `validateBitfieldValue`).
     *
     * @param field - The `SchemaFieldType` object representing the bit field with `type` and `size` properties.
     * @param value - The value to be processed according to the bit field type.
     * @returns The processed value, sign-extended for signed types or unchanged for unsigned types.
     */

    private processValueForBitfield(field: SchemaFieldType, value: number): number {
        if ((<string> field.type).startsWith('Int')) {
            // For signed values like Int8, use BigInt.asIntN to ensure proper sign extension
            const bitLength = field.size;
            const signedValue = BigInt(value); // Convert the value to BigInt

            return Number(BigInt.asIntN(bitLength, signedValue)); // Ensure sign extension
        }

        // For unsigned types, no further processing needed
        return value;
    }

    /**
     * The `applyBitmask` method applies a bitmask to a byte in order to modify specific bits within the byte.
     * It clears the bits that correspond to the bitfield and sets the bits based on the provided value.
     * This is typically used for updating or setting a bitfield value in a byte at a given position.
     *
     * - **Input**:
     *   - `currentByte`: A `number` representing the current byte to be modified. This byte may have other bits set that need to be cleared.
     *   - `field`: A `SchemaFieldType` object that defines the bitfield's properties, including `size` (the number of bits to modify).
     *   - `value`: A `number` representing the new value to be set in the bitfield. The value will be shifted to fit the bitfield size.
     *   - `bitPosition`: A `number` representing the position within the byte where the bitfield starts (0 is the least significant bit).
     *
     * - **Output**:
     *   - A `number` representing the modified byte with the updated bitfield value applied. The byte is modified by clearing and then setting the specified bits.
     *
     * ## Example:
     * ```ts
     * const currentByte = 0b11010101; // Initial byte (binary)
     * const field = { size: 4 }; // Field size is 4 bits
     * const value = 0b1010; // New value for the bitfield (4 bits)
     * const bitPosition = 4; // Start at bit position 4
     * const modifiedByte = applyBitmask(currentByte, field, value, bitPosition);
     * console.log(modifiedByte.toString(2)); // Expected Output: 11011010
     * ```
     *
     * ## Error Handling:
     * - The method assumes that the `value` fits within the size of the field (i.e., `value` should have at most `field.size` bits).
     * - If the provided `value` is too large for the specified field size, the result may be incorrect.
     *
     * @param currentByte - The byte to be modified.
     * @param field - The `SchemaFieldType` object that defines the bitfield size and other properties.
     * @param value - The value to set in the bitfield.
     * @param bitPosition - The starting position of the bitfield within the byte.
     * @returns A `number` representing the modified byte after applying the bitmask.
     */

    private applyBitmask(currentByte: number, field: SchemaFieldType, value: number, bitPosition: number): number {
        const mask = (1 << field.size) - 1; // Mask for the field size
        const shiftedMask = mask << bitPosition; // Shift mask to the correct position

        currentByte &= ~shiftedMask;
        const valueShifted = (value << bitPosition) & shiftedMask;

        return currentByte | valueShifted;
    }

    /**
     * The `writeBitField` method writes a value to a specific bitfield within a buffer. It validates the value, processes
     * the value based on its signed or unsigned type, and then updates the corresponding byte in the buffer by applying
     * a bitmask to ensure that only the relevant bits are modified.
     *
     * - **Input**:
     *   - `buffer` (Buffer): The buffer where the bitfield value will be written.
     *   - `field` (SchemaFieldType): The bitfield schema that defines the size, type, offset, and position of the bitfield.
     *   - `value` (number): The value to be written to the bitfield, which can be either signed or unsigned.
     *
     * - **Output**:
     *   - This method does not return any value. It modifies the `buffer` directly by writing the processed value into the appropriate byte.
     *
     * ## Example:
     *
     * ```ts
     * const buffer = Buffer.alloc(4);  // Create a 4-byte buffer
     * const field: SchemaFieldType = { type: 'UInt8', size: 8, offset: 0, isBits: true };
     * writeBitField(buffer, field, 255);  // Write the value 255 to the first byte (8 bits)
     * console.log(buffer);  // The first byte of the buffer should now contain 255 (0xFF).
     *
     * const signedField: SchemaFieldType = { type: 'Int8', size: 8, offset: 1, isBits: true };
     * writeBitField(buffer, signedField, -128);  // Write the signed value -128 to the second byte
     * console.log(buffer);  // The second byte of the buffer should contain -128 (0x80).
     * ```
     *
     * ## Error Handling:
     * - The `writeBitField` method validates that the value fits within the range defined by the bitfield size using the
     *   `validateBitfieldValue` method. If the value is out of range, a `RangeError` will be thrown.
     * - The method also handles signed and unsigned values using `processValueForBitfield` to ensure proper conversion
     *   before writing to the buffer.
     *
     * @param buffer - The `Buffer` where the value will be written.
     * @param field - The `SchemaFieldType` object containing information about the bitfield (size, type, offset, etc.).
     * @param value - The value to be written to the bitfield (can be signed or unsigned).
     * @throws {RangeError} If the value is out of range for the specified bitfield.
     */

    private writeBitField(buffer: Buffer, field: SchemaFieldType, value: number): void {
        this.validateBitfieldValue(field, value); // Validate value within the bitfield range

        // Calculate byte offset and bit position
        const byteOffset = field.offset;
        const bitPosition = field.position ?? 0;

        // Process the value according to its type (signed or unsigned)
        const processedValue = this.processValueForBitfield(field, value);

        // Read the current byte at the offset
        let currentByte = buffer[byteOffset];

        // Apply the bitmask to clear the bits for this field and prepare for the new value
        currentByte = this.applyBitmask(currentByte, field, processedValue, bitPosition);

        // Write the updated byte back to the buffer
        buffer[byteOffset] = currentByte;
    }

    /**
     * The `validateFieldType` method validates the type of value based on the specified field's type.
     * This method ensures that the value matches the expected type defined in the field schema, throwing an error
     * if there is a type mismatch.
     * It checks for different field types such as `string`, `BigInt`, and `number`.
     *
     * - **Input**:
     *   - `field`: The schema field that defines the expected type of the value.
     *   - `value`: The value to be validated against the field's type.
     *
     * - **Error Handling**:
     *   - Throws a `TypeError` if the type of the value does not match the expected type for the given field.
     *
     * ## Example:
     * ```ts
     * const field1: SchemaFieldType = { type: 'string', size: 10, offset: 0, isBits: false };
     * validateFieldType(field1, "Hello World"); // No error
     *
     * const field2: SchemaFieldType = { type: 'BigInt64BE', size: 8, offset: 0, isBits: false };
     * validateFieldType(field2, 123n); // No error
     *
     * const field3: SchemaFieldType = { type: 'UInt8', size: 1, offset: 0, isBits: false };
     * validateFieldType(field3, 42); // No error
     *
     * const field4: SchemaFieldType = { type: 'string', size: 10, offset: 0, isBits: false };
     * validateFieldType(field4, 42); // Throws TypeError: Expected a string for field "string", but received number
     * ```
     *
     * ## Notes:
     * - The method checks if the field type is `string`, `BigInt`, or `number`, and ensures that the value matches the expected type.
     * - If the field is of type `BigInt` (i.e., contains "Big"), it ensures that the value is of type `bigint`.
     * - If the field is not of type `BigInt`, it ensures that the value is of type `number`.
     * - If the value does not match the expected type, a `TypeError` is thrown, indicating the mismatch.
     *
     * @param field - The field schema defining the expected type of the value.
     * @param value - The value to be validated.
     * @throws {TypeError} If the value does not match the expected type.
     */

    private validateFieldType(field: SchemaFieldType, value: unknown): void {
        const isBigIntType = (<string> field.type).includes('Big');
        if (isBigIntType && typeof value !== 'bigint') {
            throw new TypeError(`Expected a BigInt for field "${ field.type }", but received ${ typeof value }`);
        }

        if (!isBigIntType && typeof value !== 'number') {
            throw new TypeError(`Expected a number for field "${ field.type }", but received ${ typeof value }`);
        }
    }

    /**
     * The `getBufferWriteMethod` method retrieves the appropriate write method from the buffer based on the field's type.
     * This method dynamically constructs the method name using the field's type and returns the corresponding to write method
     * from the buffer.
     * If the method does not exist, it throws an error.
     *
     * - **Input**:
     *   - `buffer`: The buffer object that contains the write methods for various field types.
     *   - `field`: The schema field that contains the type information to determine the appropriate write method.
     *
     * - **Output**:
     *   - Returns the write method for the specified field type.
     *
     * - **Error Handling**:
     *   - Throws a `TypeError` if no write method is available for the specified field type.
     *
     * ## Example:
     * ```ts
     * const buffer = Buffer.alloc(10);
     * const field: SchemaFieldType = {
     *     type: 'UInt8',
     *     size: 1,
     *     offset: 0,
     *     isBits: false
     * };
     * const method = getBufferWriteMethod(buffer, field);
     * console.log(method); // Returns the write method for the 'UInt8' type, e.g., 'writeUInt8'
     * ```
     *
     * ## Notes:
     * - The method name is dynamically constructed by concatenating `write` with the field's type (e.g., `writeUInt8` for `UInt8`).
     * - Ensure that the buffer supports the appropriate write method for the given field type.
     *
     * @param buffer - The buffer object to retrieve the write method from.
     * @param field - The schema field that defines the field type.
     * @returns The corresponding write method for the given field type.
     * @throws {TypeError} If no write method is available for the field type.
     */

    private getBufferWriteMethod(buffer: Buffer, field: SchemaFieldType): WriteMethodType {
        const method = <WriteMethodType> (
            buffer[<keyof Buffer> ('write' + field.type)]
        );

        if (!method) {
            throw new TypeError(`No write method available for field type "${ field.type }"`);
        }

        return method;
    }

    /**
     * The `writeArrayField` method writes an array of values to the buffer according to the schema field's type.
     * It iterates over the array and writes each element to the buffer.
     * If the array is smaller than the specified size, missing elements are written as `0`.
     * If the array is larger than the specified size, it writes only up to the allowed size.
     *
     * - **Input**:
     *   - `buffer`: The buffer to which the array of field values will be written.
     *   - `field`: The schema field that describes the type, size, and other attributes of the field.
     *   - `value`: The array of values to be written.
     *   Each element in the array is validated and written to the buffer based on the field's specifications.
     *
     * - **Error Handling**:
     *   - Throws a `TypeError` if the provided value is not an array.
     *   - Each element in the array is validated using `validateFieldType`
     *   to ensure it matches the expected type for the field.
     *   - Throws a `TypeError` if the value is not the correct type according to the field's schema.
     *
     * ## Example:
     * ```ts
     * const buffer = Buffer.alloc(10);
     * const field: SchemaFieldType = {
     *     type: 'UInt8',
     *     size: 1,
     *     offset: 0,
     *     isBits: false,
     *     arraySize: 3
     * };
     * const values = [10, 20, 30];
     * writeArrayField(buffer, field, values);
     * console.log(buffer); // The buffer will have the values 10, 20, and 30 written at the specified offsets
     * ```
     *
     * ## Notes:
     * - If the provided array is smaller than the specified `arraySize`, the missing elements will be filled with `0`.
     * - If the provided array is larger than the specified `arraySize`,
     * only the elements up to the `arraySize` will be written.
     *
     * @param buffer - The buffer to write the field values into.
     * @param field - The schema field that defines the type and size of the field to write.
     * @param value - The array of values to write into the buffer.
     * @throws {TypeError} If the value is not an array or if any element does not match the expected type.
     */

    private writeArrayField(buffer: Buffer, field: Required<SchemaFieldType>, value: unknown): void {
        if (!Array.isArray(value)) {
            throw new TypeError(`Expected an array for field "${ field.type }", but received ${ typeof value }`);
        }

        const isBigIntType = (<string> field.type).includes('Big');
        const method = this.getBufferWriteMethod(buffer, field);

        for (let i = 0; i < field.arraySize; i++) {
            const elementValue = (<Array<unknown>> value)[i] || 0; // Use 0 for missing elements
            this.validateFieldType(field, elementValue); // Validate each array element
            const finalValue = isBigIntType
                ? BigInt(<number> elementValue)
                : <number> elementValue;

            method.call(buffer, finalValue, field.offset + (i * field.size)); // Move the offset by field size per element
        }
    }

    /**
     * The `prepareValue` method converts the provided value to the appropriate type based on the field's type.
     * If the field type includes 'Big', the value will be converted to a `BigInt`.
     * Otherwise, it will be treated as a `number`.
     *
     * - **Input**:
     *   - `field`: The schema field that defines the type of the value.
     *   This is used to determine if the value should be converted to `BigInt`.
     *   - `value`: The value to be converted, which can be either a `number` or a value to be interpreted as a `BigInt`.
     *
     * - **Output**: A `bigint` or `number`, depending on the field's type.
     * If the field type includes 'Big' (e.g., `BigInt64LE`), the value is converted to a `BigInt`.
     * Otherwise, it is returned as a `number`.
     *
     * ## Example:
     * ```ts
     * const field: SchemaFieldType = { type: 'BigInt64LE', size: 8, offset: 0, isBits: false };
     * const value = 1234;
     * const preparedValue = prepareValue(field, value);
     * console.log(preparedValue); // Outputs: 1234n (BigInt)
     *
     * const field2: SchemaFieldType = { type: 'UInt32LE', size: 4, offset: 0, isBits: false };
     * const value2 = 5678;
     * const preparedValue2 = prepareValue(field2, value2);
     * console.log(preparedValue2); // Outputs: 5678 (number)
     * ```
     */

    private prepareValue(field: SchemaFieldType, value: unknown): bigint | number {
        return (<string> field.type).includes('Big') ? BigInt(value as number) : value as number;
    }

    /**
     * The `writeField` method writes a value to the buffer according to its field type.
     * It handles different types of values (e.g., strings, numbers, BigInts) and supports arrays.
     * If an array is provided, it validates the array length and writes each element, padding shorter arrays with 0s.
     *
     * - **Input**:
     *   - `buffer`: The buffer to which the field value will be written.
     *   - `field`: The schema field containing information about the field's type, size, offset, and array size.
     *   - `value`: The value to be written into the buffer, which can be a single value or an array of values.
     *
     * - **Error Handling**:
     *   - Throws a `TypeError`
     *   if the value is not a valid type (e.g., string, number, or BigInt) based on the field type.
     *   - If the field is an array, it ensures the value is an array and validates the array size.
     */

    private writeField(buffer: Buffer, field: SchemaFieldType, value: unknown): void {
        if (field.arraySize) {
            this.writeArrayField(buffer, <Required<SchemaFieldType>> field, value);

            return;
        }

        if (field.type === 'string') {
            if (typeof value !== 'string') {
                throw new TypeError(`Expected a string for field "${ field.type }", but received ${ typeof value }`);
            }

            buffer.write(<string> value, field.offset, field.size);

            return;
        }

        this.validateFieldType(field, value);
        const method = this.getBufferWriteMethod(buffer, field);
        const finalValue = this.prepareValue(field, value);

        method.call(buffer, finalValue, field.offset);
    }

    /**
     * The `readBitField` method reads a specific bitfield from a given buffer based on the field's offset and bit position.
     * It extracts the relevant bits from the byte at the specified offset, processes the value according to its signed
     * or unsigned type, and returns the field value.
     *
     * - **Input**:
     *   - `buffer`: A `Buffer` object containing the raw data to read the bitfield from.
     *   - `field`: A `SchemaFieldType` object that defines the bitfield's properties such as `offset`, `size`, and `position`.
     *
     * - **Output**:
     *   - The extracted and processed value from the bitfield as a `number`. This value is signed or unsigned based
     *     on the field's type.
     *
     * ## Example:
     *
     * ```ts
     * const buffer = Buffer.alloc(1);
     * buffer.writeUInt8(0b10101010, 0); // Write an example byte to the buffer
     * const field = { offset: 0, size: 4, position: 4, type: 'UInt8' };
     * const value = readBitField(buffer, field);
     * console.log(value); // Expected Output: 10 (binary: 1010)
     * ```
     *
     * ## Error Handling:
     * - This method assumes that the `field` contains valid offset and position information, and the buffer is large
     *   enough to contain the specified offset.
     *
     * @param buffer - The `Buffer` object from which the bitfield will be read.
     * @param field - The `SchemaFieldType` object describing the bitfield's position, size, and type.
     * @returns The value read from the bitfield, processed according to its type (signed or unsigned).
     */

    private readBitField(buffer: Buffer, field: SchemaFieldType): number {
        const byteOffset = field.offset;
        const bitPosition = field.position ?? 0;

        // Read the byte at the given offset
        const currentByte = buffer[byteOffset];

        // Create a mask to isolate the bits for this field
        const mask = (1 << field.size) - 1;
        const value = (currentByte >> bitPosition) & mask;

        // Process the value according to its signed/unsigned type
        return this.processValueForBitfield(field, value);
    }

    /**
     * The `readField` method reads a field (or array of fields) from the given buffer based on its type and offset.
     * It handles reading different types of fields, including strings, numeric types (`UInt8`, `Int16BE`, etc.),
     * and arrays of these types. The method decodes the field's value from the buffer and returns it.
     *
     * - **Input**:
     *   - `buffer`: A `Buffer` object containing the raw data.
     *   - `field`: A `SchemaFieldType` object that defines the field's properties such as `offset`, `type`, `size`, and `arraySize`.
     *
     * - **Output**:
     *   - The value of the field, which can be a `string`, `number`, `bigint`, or an array of these types, depending on the field's properties.
     *
     * ## Example:
     *
     * ### Reading a Single Field:
     * ```ts
     * const buffer = Buffer.alloc(8);
     * buffer.writeUInt8(123, 0);
     * const field = { offset: 0, type: 'UInt8', size: 1, isBits: false };
     * const value = readField(buffer, field);
     * console.log(value); // Expected Output: 123
     * ```
     *
     * ### Reading a String:
     * ```ts
     * const stringBuffer = Buffer.from('Hello\x00\x00\x00');
     * const stringField = { offset: 0, type: 'string', size: 5, isBits: false };
     * const stringValue = readField(stringBuffer, stringField);
     * console.log(stringValue); // Expected Output: 'Hello'
     * ```
     *
     * ### Reading an Array:
     * ```ts
     * const arrayBuffer = Buffer.alloc(12);
     * arrayBuffer.writeUInt8(1, 0);
     * arrayBuffer.writeUInt8(2, 1);
     * arrayBuffer.writeUInt8(3, 2);
     * const arrayField = { offset: 0, type: 'UInt8', size: 1, arraySize: 3, isBits: false };
     * const arrayValue = readField(arrayBuffer, arrayField);
     * console.log(arrayValue); // Expected Output: [1, 2, 3]
     * ```
     *
     * ## Error Handling:
     * - Assumes the `field` object contains valid `offset`, `size`, `type`, and optionally `arraySize`.
     * - Throws an error if the `buffer` does not have sufficient data for the specified field(s).
     * - Throws an error if an invalid `field.type` is encountered.
     *
     * @param buffer - The `Buffer` object containing the data to be read.
     * @param field - The `SchemaFieldType` object describing the field's `offset`, `type`, `size`, and optionally `arraySize`.
     * @returns The decoded value from the buffer as a `string`, `number`, `bigint`, or array based on the field type.
     */

    private readField(buffer: Buffer, field: SchemaFieldType): number | bigint | string | Array<number | bigint | string> {
        const byteOffset = field.offset;

        // Handle string fields
        if (field.type === 'string') {
            return buffer.toString('utf8', byteOffset, byteOffset + field.size).replace(/\x00+$/, '');
        }

        // Get the Buffer read method for numeric fields
        const method = <(...args: Array<unknown>) => unknown> buffer[<keyof Buffer> ('read' + field.type)];

        if (!method) {
            throw new TypeError(`No read method available for field type "${field.type}"`);
        }

        // Handle array fields
        if (field.arraySize) {
            const values: Array<number | bigint> = [];
            const elementSize = field.size;
            for (let i = 0; i < field.arraySize; i++) {
                const offset = byteOffset + (i * elementSize);

                // Ensure buffer has enough data
                if (offset + elementSize > buffer.length) {
                    throw new RangeError(`Insufficient buffer length to read array element at index ${i}`);
                }

                // Read the value at the current offset
                const value = <number | bigint> method.call(buffer, offset);
                values.push(value);
            }

            return values;
        }

        // Handle single numeric fields
        return <number | bigint> method.call(buffer, byteOffset);
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
     *   - `'BigInt64LE'`, `'BigInt64BE'`, `'BigUInt64LE'`, `'BigUInt64BE'` — 8 bytes
     *
     * - **Output**: A `ParseFieldInterface` object with the corresponding `type`, `size` (in bytes),
     *   `isBits` (set to `false`), and an optional `arraySize` (the number of elements in the array, if applicable).
     *
     * - **Optional `arraySize`**: If provided, the field is considered an array,
     * and `size` represents the size of each element in the array.
     *   - If `arraySize` is not provided, the field is treated as a single element.
     *
     * ## Example:
     *
     * ```ts
     * const field1 = parsePrimitiveField('Int8');
     * console.log(field1); // { type: 'Int8', size: 1, isBits: false }
     *
     * const field2 = parsePrimitiveField('UInt16LE');
     * console.log(field2); // { type: 'UInt16LE', size: 2, isBits: false }
     *
     * const field3 = parsePrimitiveField('Int32BE', 5);
     * console.log(field3); // { type: 'Int32BE', size: 4, isBits: false, arraySize: 5 }
     * ```
     *
     * ## Error Handling:
     * - If the provided type is unsupported, the method throws a `TypeError`.
     *
     * @param type - The type of the field, which can be one of the supported primitive types.
     * @param arraySize - An optional number representing the size of the array (defaults to `undefined` if not provided).
     * @returns A `ParseFieldInterface` object representing the field type and size in bytes, with `isBits` set to `false`.
     * @throws {TypeError} If the input type is unsupported.
     */

    private parsePrimitiveField(type: PrimitiveType, arraySize?: number): ParseFieldInterface {
        const typeSizes: { [key in PrimitiveType]: number } = {
            'Int8': 1, 'UInt8': 1,
            'Int16LE': 2, 'Int16BE': 2, 'UInt16LE': 2, 'UInt16BE': 2,
            'Int32LE': 4, 'Int32BE': 4, 'UInt32LE': 4, 'UInt32BE': 4,
            'BigInt64LE': 8, 'BigInt64BE': 8, 'BigUInt64LE': 8, 'BigUInt64BE': 8
        };

        if (typeSizes[type]) {
            return { type, size: typeSizes[type], isBits: false, arraySize: arraySize };
        }

        throw new TypeError(`Unsupported primitive type: ${ type }`);
    }

    /**
     * The `parseField` method parses a given field, determining whether it's a string type, an object, or a bit field,
     * and returns a `ParseFieldInterface` object. It will call the appropriate parsing function based on
     * whether the field is a primitive type or a bit field.
     *
     * - **Input**: A `FieldInterface`, `string`, or `Struct` that represents the field type.
     *   - If the input is a **string**, it can represent either a primitive type (e.g., `'Int8'`) or a bit field (e.g., `'UInt8:4'`).
     *   - If the input is an **object** of type `Struct`, the method returns the field based on the structure's properties.
     * - **Output**: A `ParseFieldInterface` object with the parsed field details, including:
     *   - `type`: The field type (e.g., `'Int8'`, `'UInt8'`).
     *   - `size`: The size of the field in bytes.
     *   - `isBits`: A boolean indicating if the field is a bit field (`true`) or not (`false`).
     *   - `arraySize`: (Optional) The number of elements in an array if the field type includes an array format (e.g., `'string[10]'`).
     *
     * ## Example:
     *
     * ```ts
     * const fieldObject = parseField('Int8');
     * console.log(fieldObject); // Returns { type: 'Int8', size: 1, isBits: false }
     *
     * const fieldObject2 = parseField('UInt8:4');
     * console.log(fieldObject2); // Returns { type: 'UInt8', size: 4, isBits: true }
     *
     * const fieldObject3 = parseField('string[10]');
     * console.log(fieldObject3); // Returns { type: 'string', size: 10, isBits: false, arraySize: 10 }
     * ```
     *
     * ## Error Handling:
     * - If the provided field format is invalid or unsupported, the method may throw an error (e.g., invalid type or format).
     *
     * @param field - The field to parse, which could be a string or an object. A string can represent a primitive type or a bit field, and an object could be a `Struct`.
     * @returns A `ParseFieldInterface` object representing the parsed field.
     * @throws {Error} If the input format is invalid or unsupported.
     */

    private parseField(field: FieldInterface | string | Struct): ParseFieldInterface {
        if (field instanceof Struct) {
            return { type: field, size: field.size };
        }

        if (typeof field === 'string') {
            if (field.includes(':')) {
                return this.parseBitField(field as BitSizeType);
            }

            const pattern = /^([a-z0-9]+)\[(\d+)\]$/i;
            const match = field.match(pattern);
            if (match) {
                return this.parsePrimitiveField(match[1] as PrimitiveType, parseInt(match[2], 10));
            }

            return this.parsePrimitiveField(field as PrimitiveType);
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

    private processBitfield(name: string, accumulator: {
        bits: number,
        bytes: number
    }, field: ParseFieldInterface): void {
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
                if (fieldObject.arraySize) {
                    this.schema[fieldName].arraySize = fieldObject.arraySize;
                    accumulator.bytes += fieldObject.size * fieldObject.arraySize;
                    continue;
                }

                accumulator.bytes += fieldObject.size;
                continue;
            }

            this.processBitfield(fieldName, accumulator, fieldObject);
        }

        if (accumulator.bits > 0) {
            accumulator.bytes += 1;
        }

        return accumulator.bytes;
    }
}
