/**
 * Import will remove at compile time
 */

import type {
    PrimitiveType,
    PrimitiveDataType,
    FloatPrimitiveType,
    PrimitiveContextInterface,
    PositionedPrimitiveDescriptorType
} from '@components/interfaces/primitive-component.interface';

/**
 * Imports
 */

import { readMethod, writeMethod } from '@components/buffer.component';

/**
 * Maps primitive data types to their size in bits
 *
 * @returns A record mapping each primitive type to its size in bits
 *
 * @remarks
 * This constant provides a mapping between all supported primitive types and their
 * corresponding bit sizes. The sizes are expressed in bits, not bytes.
 * - 8-bit types: Int8, UInt8
 * - 16-bit types: Int16LE, Int16BE, UInt16LE, UInt16BE
 * - 32-bit types: Int32LE, Int32BE, UInt32LE, UInt32BE, FloatLE, FloatBE
 * - 64-bit types: BigInt64LE, BigInt64BE, BigUInt64LE, BigUInt64BE, DoubleLE, DoubleBE
 *
 * The 'LE' and 'BE' suffixes indicate Little Endian and Big Endian byte order respectively.
 *
 * @example
 * ```ts
 * // Get the size of a UInt32LE
 * const bitSize = PRIMITIVE_TYPE_SIZES['UInt32LE']; // 32
 *
 * // Calculate byte size
 * const byteSize = PRIMITIVE_TYPE_SIZES['BigInt64BE'] / 8; // 8 bytes
 * ```
 *
 * @since 2.0.0
 */

export const PRIMITIVE_TYPE_SIZES: Record<PrimitiveType | FloatPrimitiveType, number> = {
    'Int8': 8,
    'UInt8': 8,
    'Int16LE': 16,
    'Int16BE': 16,
    'UInt16LE': 16,
    'UInt16BE': 16,
    'FloatLE': 32,
    'FloatBE': 32,
    'Int32LE': 32,
    'Int32BE': 32,
    'UInt32LE': 32,
    'UInt32BE': 32,
    'DoubleLE': 64,
    'DoubleBE': 64,
    'BigInt64LE': 64,
    'BigInt64BE': 64,
    'BigUInt64LE': 64,
    'BigUInt64BE': 64
};

/**
 * Parses a string representation of a primitive type descriptor into a structured positioned object
 *
 * @param field - String representation of the primitive descriptor in format "type" or "type[size]"
 * @param position - The starting byte position of this element within the buffer
 * @returns A structured PositionedPrimitiveDescriptorType object
 *
 * @throws Error - When the descriptor format is invalid
 * @throws Error - When the primitive type is not supported
 *
 * @remarks
 * This function converts a string-based primitive type specification into a structured descriptor object with positioning information.
 * The input string can be in one of two formats:
 * - A simple type name (e.g., "UInt8", "Int16LE")
 * - An array type with size (e.g., "UInt8[10]", "Float32[4]")
 *
 * The function validates that:
 * 1. The input string matches the expected pattern for a valid primitive descriptor
 * 2. The specified type is supported by checking against the PRIMITIVE_TYPE_SIZES registry
 *
 * If the descriptor includes an array size specification, it is parsed as an integer.
 * For non-array types, the arraySize field will be undefined.
 *
 * @example
 * ```ts
 * // Parse a simple primitive type at offset 0
 * const descriptor1 = parsePrimitiveDescriptor('UInt8');
 * // Returns: { type: 'UInt8', size: 1, offset: 0, arraySize: undefined }
 *
 * // Parse an array primitive type at offset 4
 * const descriptor2 = parsePrimitiveDescriptor('Int16LE[5]', 4);
 * // Returns: { type: 'Int16LE', size: 2, offset: 4, arraySize: 5 }
 *
 * // The following would throw errors:
 * // Invalid format: parsePrimitiveDescriptor('UInt8[]');
 * // Invalid format: parsePrimitiveDescriptor('8UInt');
 * // Invalid type: parsePrimitiveDescriptor('Unknown[5]');
 * ```
 *
 * @see PRIMITIVE_TYPE_SIZES
 * @see PositionedPrimitiveDescriptorType
 *
 * @since 2.0.0
 */

export function parsePrimitiveDescriptor(field: string, position: number = 0): PositionedPrimitiveDescriptorType {
    const pattern = /^([A-Za-z][A-Za-z0-9]*)(?:\[(\d+)\])?$/i;
    const match = <[string, PrimitiveType, string]> field.match(pattern);

    if (!match)
        throw new Error(`Invalid primitive descriptor: ${ field }`);

    const size = PRIMITIVE_TYPE_SIZES[match[1]];
    if (!size)
        throw new Error(`Invalid primitive type: ${ match[1] }`);

    const type = match[1];
    const arraySize = match[2] ? parseInt(match[2]) : undefined;

    return { type, position, size: size / 8, arraySize, kind: 'primitive' };
}

/**
 * Reads a single primitive value from the buffer at the specified position
 *
 * @param arrayOffset - Optional offset within an array structure, defaults to 0
 *
 * @returns The primitive value (number or bigint) read from the buffer
 *
 * @remarks
 * Uses the descriptor's position and type information to determine where and how to read from the buffer.
 * The absolute position is calculated by adding the context offset, descriptor position, and any array offset.
 *
 * The function supports all primitive types defined in the PrimitiveType interface, including both
 * signed and unsigned integers of various sizes with their respective endianness formats.
 *
 * @example
 * ```ts
 * const context: PrimitiveContextInterface = {
 *   buffer: Buffer.alloc(16),
 *   offset: 4,
 *   descriptor: {
 *     position: 2,
 *     type: 'UInt32LE'
 *   }
 * };
 *
 * const value = readSinglePrimitive.call(context);
 * ```
 *
 * @see readMethod
 * @see PrimitiveContextInterface
 *
 * @since 2.0.0
 */

export function readSinglePrimitive(this: PrimitiveContextInterface, arrayOffset: number = 0): number | bigint {
    const { position, type } = this.descriptor;
    const absolutePosition = this.offset + position + arrayOffset;

    return readMethod<number | bigint>(this.buffer, type)(absolutePosition);
}

/**
 * Reads an array of primitive values from the buffer based on descriptor information
 *
 * @returns An array of primitive values (numbers or bigint's) read from the buffer
 *
 * @throws Error - If the arraySize is not defined in the descriptor
 *
 * @remarks
 * Uses the descriptor's arraySize and size properties to determine how many values to read
 * and the stride between array elements. The array is pre-allocated to avoid resizing
 * during population.
 *
 * This function is used internally when processing primitive array types as defined in the
 * PrimitiveArrayType.
 *
 * @example
 * ```ts
 * const context: PrimitiveContextInterface = {
 *   buffer: Buffer.alloc(32),
 *   offset: 0,
 *   descriptor: {
 *     position: 0,
 *     type: 'UInt16BE',
 *     arraySize: 8,
 *     size: 2
 *   }
 * };
 *
 * const values = readPrimitiveArray.call(context);
 * ```
 *
 * @see readSinglePrimitive
 *
 * @since 2.0.0
 */

export function readPrimitiveArray(this: PrimitiveContextInterface): Array<bigint | number> {
    const result: Array<number | bigint> = [];
    const { arraySize = 0, size } = this.descriptor;

    // Preallocate the array to avoid resizing
    result.length = arraySize;
    for (let i = 0; i < arraySize; i++) {
        result[i] = readSinglePrimitive.call(this, i * size);
    }

    return result;
}

/**
 * Reads primitive data from the buffer based on the context's descriptor
 *
 * @returns A primitive value or array of primitive values (number|bigint or Array\<number | bigint\>)
 *
 * @remarks
 * This function acts as a smart dispatcher that determines whether to read a single primitive value
 * or an array of primitive values based on the descriptor's configuration.
 *
 * If the descriptor contains an 'arraySize' property with a truthy value, the function will call
 * readPrimitiveArray to read multiple values. Otherwise, it calls readSinglePrimitive to read
 * a single value.
 *
 * This is the main entry point for reading primitive data from a buffer and should be used
 * in preference to calling readSinglePrimitive or readPrimitiveArray directly.
 *
 * @example
 * ```ts
 * // Reading a single value
 * const singleContext: PrimitiveContextInterface = {
 *   buffer: buffer,
 *   offset: 0,
 *   descriptor: { position: 4, type: 'UInt8' }
 * };
 * const singleValue = readPrimitive.call(singleContext);
 *
 * // Reading an array
 * const arrayContext: PrimitiveContextInterface = {
 *   buffer: buffer,
 *   offset: 0,
 *   descriptor: { position: 0, type: 'Int32LE', arraySize: 5, size: 4 }
 * };
 * const arrayValues = readPrimitive.call(arrayContext);
 * ```
 *
 * @see readPrimitiveArray
 * @see readSinglePrimitive
 *
 * @since 2.0.0
 */

export function readPrimitive(this: PrimitiveContextInterface): PrimitiveDataType {
    if(('arraySize' in this.descriptor) && this.descriptor.arraySize)
        return readPrimitiveArray.call(this);

    return readSinglePrimitive.call(this);
}

/**
 * Writes a single primitive value to the buffer at the specified position
 *
 * @param value - The primitive value (number or bigint) to write to the buffer
 * @param arrayOffset - Optional offset within an array structure, defaults to 0
 *
 * @throws TypeError - If the provided value type doesn't match the expected type for the field
 *   (e.g., providing a number for a BigInt field or a BigInt for a number field)
 *
 * @remarks
 * Uses the descriptor's position and type information to determine where and how to write to the buffer.
 * The absolute position is calculated by adding the context offset, descriptor position, and any array offset.
 *
 * The function automatically validates that the value type matches the expected type based on the field descriptor:
 * - BigInt types (fields whose names include 'Big') require bigint values
 * - Non-BigInt types require number values
 *
 * @example
 * ```ts
 * const context: PrimitiveContextInterface = {
 *   buffer: Buffer.alloc(16),
 *   offset: 4,
 *   descriptor: {
 *     position: 2,
 *     type: 'UInt32LE'
 *   }
 * };
 *
 * // Write a 32-bit unsigned integer
 * writeSinglePrimitive.call(context, 42);
 *
 * // For BigInt types
 * const bigIntContext: PrimitiveContextInterface = {
 *   buffer: Buffer.alloc(16),
 *   offset: 0,
 *   descriptor: {
 *     position: 0,
 *     type: 'BigInt64LE'
 *   }
 * };
 *
 * // Write a 64-bit signed integer
 * writeSinglePrimitive.call(bigIntContext, BigInt(9007199254740991));
 * ```
 *
 * @since 2.0.0
 */

export function writeSinglePrimitive(this: PrimitiveContextInterface, value: number | bigint, arrayOffset: number = 0): void {
    value ??= 0;
    const { position, type } = this.descriptor;
    const isBigIntType = type.includes('Big');

    if(isBigIntType && value === 0)
        value = BigInt(0);

    if (isBigIntType && typeof value !== 'bigint')
        throw new TypeError(`Expected a BigInt for field "${ type }", but received ${ value }`);

    if (!isBigIntType && typeof value !== 'number')
        throw new TypeError(`Expected a number for field "${ type }", but received ${ value }`);


    const absolutePosition = this.offset + position + arrayOffset;
    writeMethod<number | bigint>(this.buffer, type)(value, absolutePosition);
}

/**
 * Writes an array of primitive values to the buffer based on descriptor information
 *
 * @param values - Array of primitive values (numbers or bigint's) to write to the buffer
 *
 * @remarks
 * Uses the descriptor's arraySize and size properties to determine how many values to write
 * and the stride between array elements. If the provided values array is shorter than the
 * arraySize specified in the descriptor, the remaining elements will be filled with zeros.
 *
 * Each element is written using the writeSinglePrimitive function, which enforces type checking
 * based on the field descriptor.
 *
 * @example
 * ```ts
 * const context: PrimitiveContextInterface = {
 *   buffer: Buffer.alloc(32),
 *   offset: 0,
 *   descriptor: {
 *     position: 0,
 *     type: 'UInt16BE',
 *     arraySize: 8,
 *     size: 2
 *   }
 * };
 *
 * // Write an array of 16-bit unsigned integers
 * writePrimitiveArray.call(context, [1, 2, 3, 4, 5, 6, 7, 8]);
 *
 * // If fewer values are provided, remaining slots are filled with zeros
 * writePrimitiveArray.call(context, [100, 200, 300]); // Writes [100, 200, 300, 0, 0, 0, 0, 0]
 * ```
 *
 * @see writeSinglePrimitive
 *
 * @since 2.0.0
 */

export function writePrimitiveArray(this: PrimitiveContextInterface, values: Array<number | bigint>): void {
    const { arraySize = 0, size } = this.descriptor;

    for (let i = 0; i < arraySize; i++) {
        const elementValue = i < values.length ? values[i] : 0;
        writeSinglePrimitive.call(this, elementValue, i * size);
    }
}

/**
 * Writes primitive data to the buffer based on the context's descriptor
 *
 * @param value - A primitive value or array of primitive values (number|bigint or (number|bigint)[])
 *
 * @remarks
 * This function acts as a smart dispatcher that determines whether to write a single primitive value
 * or an array of primitive values based on the descriptor's configuration.
 *
 * If the descriptor contains an 'arraySize' property with a truthy value, the function will call
 * writePrimitiveArray to write multiple values. Otherwise, it calls writeSinglePrimitive to write
 * a single value.
 *
 * The function handles type conversion intelligently:
 * - When writing to an array field, a single value will be converted to a single-element array
 * - When writing to a single field, an array input will use only the first element (or 0 if empty)
 *
 * This is the main entry point for writing primitive data to a buffer and should be used
 * in preference to calling writeSinglePrimitive or writePrimitiveArray directly.
 *
 * @example
 * ```ts
 * // Writing a single value
 * const singleContext: PrimitiveContextInterface = {
 *   buffer: buffer,
 *   offset: 0,
 *   descriptor: { position: 4, type: 'UInt8' }
 * };
 * writePrimitive.call(singleContext, 42);
 *
 * // Writing an array
 * const arrayContext: PrimitiveContextInterface = {
 *   buffer: buffer,
 *   offset: 0,
 *   descriptor: { position: 0, type: 'Int32LE', arraySize: 5, size: 4 }
 * };
 * writePrimitive.call(arrayContext, [10, 20, 30, 40, 50]);
 * ```
 *
 * @see writePrimitiveArray
 * @see writeSinglePrimitive
 *
 * @since 2.0.0
 */

export function writePrimitive(this: PrimitiveContextInterface, value: PrimitiveDataType): void {
    if(('arraySize' in this.descriptor) && this.descriptor.arraySize)
        return writePrimitiveArray.call(this, Array.isArray(value) ? value : [ value ]);

    writeSinglePrimitive.call(this, Array.isArray(value) ? (value[0] || 0) : value);
}
