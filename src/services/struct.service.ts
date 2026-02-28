/**
 * Type imports
 */

import type {
    StructDataType,
    StructContextInterface
} from '@components/interfaces/struct-component.interface';
import type {
    BitfieldContextInterface,
    PositionedBitfieldDescriptorType
} from '@components/interfaces/bitfield-component.interface';
import type {
    PrimitiveType,
    PrimitiveDataType,
    PrimitiveContextInterface,
    PositionedDescriptorInterface
} from '@components/interfaces/primitive-component.interface';
import type {
    StringType,
    StringDataType,
    StringContextInterface,
    PositionedStringDescriptorType,
    LengthPrefixedDescriptorInterface
} from '@components/interfaces/string-component.interface';
import type {
    FieldsType,
    StringFieldType,
    ContextInterface,
    DescriptorFieldType,
    AccumulatorInterface,
    StructSchemaInterface,
    PositionedDescriptorFieldType
} from '@services/interfaces/struct-service.interface';

/**
 * Implementation imports
 */

import { readStruct, writeStruct } from '@components/struct.component';
import { parseBitfieldDescriptor, readBitfield, writeBitfield } from '@components/bitfield.component';
import { parseStringDescriptor, readString, STRING_PRIMITIVE_LIST, writeString } from '@components/string.component';
import {
    readPrimitive,
    writePrimitive,
    PRIMITIVE_TYPE_SIZES,
    parsePrimitiveDescriptor
} from '@components/primitive.component';

/**
 * A versatile class for creating and manipulating structured binary data objects
 *
 * @template T - The type of the object structure this class represents
 * @remarks
 * The Struct class provides a type-safe way to define, read, and write structured binary data.
 * It supports various field types including:
 *
 * Numeric types with explicit size and endianness:
 * - `UInt8`, `Int8`, `UInt16LE/BE`, `Int16LE/BE`, `UInt32LE/BE`, `Int32LE/BE`
 * - `BigUInt64LE/BE`, `BigInt64LE/BE`, `FloatLE/BE`, `DoubleLE/BE`
 *
 * Arrays of numeric types:
 * - `UInt8[20]`, `Int32LE[15]`
 *
 * Bitfields:
 * - `UInt16LE:7` (7 bits within a 16-bit field)
 * - `UInt8:4` (4 bits within an 8-bit field)
 * - `UInt16BE:12` (12 bits within a 16-bit big-endian field)
 *
 * String types:
 * - Array of strings: `string[10]`, `ascii[10]`, `utf8[10]`
 *   (array of 10 strings, each preceded by a UInt16LE length prefix)
 * - Null-terminated: `{ type: 'string', nullTerminated: true }`
 *   (variable-length string that reads until the first null character)
 * - Length-prefixed: `{ type: 'string', lengthType: 'UInt32LE' }`
 *   (variable-length string preceded by its length stored as UInt32LE)
 * - Fixed-length string: `{ type: 'string', size: 10, arraySize: 2 }`
 *   (array of 2 fixed-length strings, each 10 characters long)
 *
 * Nested structures:
 * - `Struct` (nested structure)
 * - `{ type: Struct, arraySize: 2 }` (array of structures)
 *
 * @since 2.0.0
 */

export class Struct<T extends object = object> {
    /**
     * The total fixed size of the schema in bytes.
     *
     * @since 2.0.0
     */

    readonly size: number;

    /**
     * Internal map that stores field descriptors with their positions in the binary structure.
     * Maps property names to their corresponding descriptor metadata.
     *
     * @since 2.0.0
     */

    private readonly schema: Map<string, PositionedDescriptorFieldType> = new Map();

    /**
     * Creates a new binary structure schema instance.
     *
     * @param schema - The structure schema definition that describes field types and their layout
     *
     * @throws SchemaValidationError - When the provided schema contains invalid field definitions
     *
     * @since 2.0.0
     */

    constructor(schema: StructSchemaInterface) {
        this.size = this.compileSchema(schema);
    }

    /**
     * Deserializes binary data from a Buffer into a structured object according to the defined schema.
     *
     * @param buffer - The binary buffer containing the serialized data to convert to an object
     * @param getDynamicOffset - Optional callback function that receives the offset of dynamic content that changes the buffer's static size.
     * The offset represents the difference between the original and final buffer positions.
     *
     * @throws Error - When the provided input is not a Buffer instance
     * @throws Error - When the provided buffer size is smaller than the expected schema size
     * @throws DeserializationError - When buffer data doesn't match the expected schema format
     *
     * @since 2.0.0
     */

    toObject(buffer: Buffer, getDynamicOffset?: (offset: number) => void): Required<T> {
        if(!Buffer.isBuffer(buffer))
            throw new Error(`Expected a buffer, but received ${ typeof buffer }`);

        if(buffer.length < this.size)
            throw new Error(`Buffer size is less than expected: ${ buffer.length } < ${ this.size }`);

        const result: Record<string, unknown> = {};
        const context: ContextInterface = {
            buffer,
            offset: 0
        } as ContextInterface;

        for (const [ name, descriptor ] of this.schema) {
            context.descriptor = descriptor;
            result[name] = this.readValue(context, descriptor.kind);
        }

        if (getDynamicOffset && typeof getDynamicOffset === 'function')
            getDynamicOffset(context.offset);

        return result as Required<T>;
    }

    /**
     * Serializes a structured object into a binary buffer according to the defined schema.
     *
     * @param data - The object containing fields to be serialized
     * @returns A buffer containing the binary representation of the data
     *
     * @throws Error - When input is not an object or when field values don't match their type definitions
     *
     * @since 2.0.0
     */

    toBuffer(data: T): Buffer {
        if (!data || typeof data !== 'object')
            throw new Error(`Expected an object of fields, but received ${ typeof data }`);

        const context: ContextInterface = {
            buffer: Buffer.alloc(this.size),
            offset: 0
        } as ContextInterface;

        for (const [ name, descriptor ] of this.schema) {
            context.descriptor = descriptor;
            const value = data[name as keyof T];
            this.writeValue(context, descriptor.kind, value);
        }

        return context.buffer;
    }

    /**
     * Reads a value from the buffer based on its descriptor kind.
     *
     * @param context - The current reading context containing buffer and offset information
     * @param kind - The descriptor kind that determines how to interpret binary data
     * @returns The deserialized value of the appropriate type
     *
     * @see ContextInterface
     * @see PositionedDescriptorInterface
     *
     * @since 2.0.0
     */

    private readValue(context: ContextInterface, kind: PositionedDescriptorInterface['kind']): unknown {
        switch (kind) {
            case 'struct':
                return readStruct.call(context as StructContextInterface);
            case 'bitfield':
                return readBitfield.call(context as BitfieldContextInterface);
            case 'string':
                return readString.call(context as StringContextInterface);
            default:
                return readPrimitive.call(context as PrimitiveContextInterface);
        }
    }

    /**
     * Writes a value to the buffer based on its descriptor kind.
     *
     * @param context - The current writing context containing buffer and offset information
     * @param kind - The descriptor kind that determines how to serialize the data
     * @param value - The value to write into the buffer
     *
     * @throws Error - When the value type doesn't match the expected type for the given descriptor
     *
     * @see ContextInterface
     * @see PositionedDescriptorInterface
     *
     * @since 2.0.0
     */

    private writeValue(context: ContextInterface, kind: PositionedDescriptorInterface['kind'], value: unknown): void {
        switch (kind) {
            case 'struct':
                writeStruct.call(context as StructContextInterface, value as StructDataType);
                break;
            case 'bitfield':
                writeBitfield.call(context as BitfieldContextInterface, value as number);
                break;
            case 'string':
                writeString.call(context as StringContextInterface, value as StringDataType);
                break;
            default:
                writePrimitive.call(context as PrimitiveContextInterface, value as PrimitiveDataType);
        }
    }

    /**
     * Calculates the size and position of a field within the binary structure.
     *
     * @param field - The field descriptor containing type information
     * @param position - The current position in the buffer where this field should be placed
     * @returns A positioned field descriptor with size and position information
     *
     * @throws Error - When an invalid field type is encountered
     *
     * @see DescriptorFieldType
     * @see PositionedDescriptorFieldType
     *
     * @since 2.0.0
     */

    private computeFieldSize(field: DescriptorFieldType, position: number): PositionedDescriptorFieldType {
        if (field.type instanceof Struct)
            return { ...field, position, size: field.type.size, kind: 'struct' };

        if (STRING_PRIMITIVE_LIST.has(field.type as StringType))
            return this.computeStringFieldSize(field, position);

        const size = PRIMITIVE_TYPE_SIZES[field.type as PrimitiveType];
        if (size !== undefined)
            return { ...field, position, size: size / 8, kind: 'primitive' };

        throw new Error(`Invalid field type: ${ field.type }`);
    }

    /**
     * Calculates the size and position information for string fields based on their configuration.
     *
     * @param field - The string field descriptor containing type and encoding information
     * @param position - The current position in the buffer where this field should be placed
     * @returns A positioned string field descriptor with size and position information
     *
     * @see DescriptorFieldType
     * @see PositionedStringDescriptorType
     *
     * @since 2.0.0
     */

    private computeStringFieldSize(field: DescriptorFieldType, position: number): PositionedStringDescriptorType {
        const positionedDescriptor: PositionedStringDescriptorType = {
            ...field,
            position,
            kind: 'string'
        } as PositionedStringDescriptorType;

        if ('lengthType' in field && field.lengthType) {
            const primitiveSize = PRIMITIVE_TYPE_SIZES[field.lengthType as PrimitiveType];
            if (!primitiveSize) {
                throw new Error(`Invalid length type: ${ field.lengthType }`);
            }

            positionedDescriptor.size = primitiveSize / 8;
        } else if ('nullTerminated' in field && field.nullTerminated) {
            positionedDescriptor.size = 0;
        } else if (!('size' in field) || !field.size) {
            (positionedDescriptor as LengthPrefixedDescriptorInterface).lengthType = 'UInt16LE';
            positionedDescriptor.size = PRIMITIVE_TYPE_SIZES['UInt16LE'] / 8;
        }

        return positionedDescriptor;
    }

    /**
     * Parses a string field notation into a properly typed descriptor with position information.
     *
     * @param fieldNotation - The string representation of the field definition
     * @param offset - The current offset in the buffer where this field should be placed
     * @returns A positioned field descriptor with the appropriate type (bitfield, string, or primitive)
     *
     * @see StringFieldType
     * @see PositionedDescriptorFieldType
     *
     * @since 2.0.0
     */

    private parseStringNotation(fieldNotation: StringFieldType, offset: number): PositionedDescriptorFieldType {
        if (fieldNotation.includes(':'))
            return parseBitfieldDescriptor(fieldNotation, offset);

        const stringType = [ ...STRING_PRIMITIVE_LIST ].find(prefix =>
            fieldNotation.startsWith(prefix));

        return stringType
            ? parseStringDescriptor(fieldNotation, offset)
            : parsePrimitiveDescriptor(fieldNotation, offset);
    }

    /**
     * Converts a field definition into a positioned descriptor with size information.
     *
     * @param field - The field to convert, which can be a Struct instance, string notation, or field descriptor
     * @param position - The current position in the buffer where this field should be placed
     * @returns A positioned field descriptor with calculated size and position information
     *
     * @see FieldsType
     * @see PositionedDescriptorFieldType
     *
     * @since 2.0.0
     */

    private convertToSizedField(field: FieldsType, position: number): PositionedDescriptorFieldType {
        if (field instanceof Struct)
            return { type: field, position, size: field.size, kind: 'struct' };

        return typeof field === 'string'
            ? this.parseStringNotation(field, position)
            : this.computeFieldSize(field, position);
    }

    /**
     * Compiles a schema definition into a binary structure with calculated field positions and sizes.
     *
     * @param schema - The structure schema definition containing field definitions
     * @returns The total size of the compiled structure in bytes
     *
     * @throws Error - If any field's array size exceeds Number.MAX_SAFE_INTEGER
     *
     * @remarks
     * This method processes the schema field by field, handling both standard fields and bitfields.
     * For bitfields, it tracks bit positions and packs them appropriately.
     * The final byte count includes any remaining bits from the last bitfield.
     *
     * @see StructSchemaInterface
     * @since 2.0.0
     */

    private compileSchema(schema: StructSchemaInterface): number {
        const accumulator: AccumulatorInterface = {
            bits: 0,
            bytes: 0,
            bitFieldSize: 0,
            bitFieldType: 'UInt8'
        };

        for (const [ fieldName, field ] of Object.entries(schema)) {
            const sizedField = this.convertToSizedField(field, accumulator.bytes);
            if('arraySize' in sizedField && sizedField.arraySize) {
                if(sizedField.arraySize >= Number.MAX_SAFE_INTEGER) {
                    throw new Error(`Array size exceeds maximum safe integer: ${ sizedField.arraySize }`);
                }
            }

            if ('bitSize' in sizedField && sizedField.bitSize > 0) {
                this.processBitfield(accumulator, fieldName, sizedField);
            } else {
                this.processStandardField(accumulator, fieldName, sizedField);
            }
        }

        if (accumulator.bits > 0)
            accumulator.bytes += accumulator.bitFieldSize;

        return accumulator.bytes;
    }

    /**
     * Processes a bitfield descriptor and updates the structure's accumulator.
     *
     * @param accumulator - The current state accumulator for the schema compilation
     * @param name - The field name in the schema
     * @param field - The positioned bitfield descriptor with size and type information

     * @remarks
     * This method handles the placement of bitfields within the structure.
     * It determines whether a new bitfield container needs to be started based on:
     * - If the current bitfield is full
     * - If the requested type differs from the current bitfield type
     * - If the sizes don't match
     *
     * When a new bitfield container is needed, the byte position is advanced
     * and bit counting resets. The field's bit position is tracked for later
     * value extraction/insertion.
     *
     * @see AccumulatorInterface
     * @see PositionedBitfieldDescriptorType
     *
     * @since 2.0.0
     */

    private processBitfield(accumulator: AccumulatorInterface, name: string, field: PositionedBitfieldDescriptorType): void {
        const bitsInField = field.size * 8;
        const requestedBitSize = field.bitSize;

        const needsNewBitfield =
            accumulator.bits + requestedBitSize > bitsInField ||
            accumulator.bitFieldType !== field.type ||
            accumulator.bitFieldSize !== field.size;

        if (needsNewBitfield) {
            accumulator.bytes += accumulator.bitFieldSize;
            accumulator.bits = 0;
            field.position = accumulator.bytes;
        }

        field.bitPosition = accumulator.bits;
        this.schema.set(name, field);

        accumulator.bits += requestedBitSize;
        accumulator.bitFieldType = field.type;
        accumulator.bitFieldSize = field.size;
    }

    /**
     * Processes a standard (non-bitfield) field descriptor and updates the structure's accumulator.
     *
     * @param accumulator - The current state accumulator for the schema compilation
     * @param name - The field name in the schema
     * @param field - The positioned field descriptor with size information
     *
     * @remarks
     * This method handles the placement of standard fields within the structure.
     * If there's an active bitfield being processed (accumulator.bits \> 0), it finalizes
     * that bitfield first by advancing the byte position before placing this new field.
     *
     * For array fields, the total size is calculated as the product of the element size
     * and the array size. The accumulator's byte position is advanced by the total field size.
     *
     * @see AccumulatorInterface
     * @see PositionedDescriptorFieldType
     *
     * @since 2.0.0
     */

    private processStandardField(accumulator: AccumulatorInterface, name: string, field: PositionedDescriptorFieldType): void {
        if (accumulator.bits > 0) {
            accumulator.bytes += accumulator.bitFieldSize;
            accumulator.bits = 0;
            field.position = accumulator.bytes;
        }

        this.schema.set(name, field);
        const arraySize = 'arraySize' in field ? field.arraySize || 0 : 0;
        const totalSize = arraySize > 0 ? field.size * arraySize : field.size;
        accumulator.bytes += totalSize;
    }
}
