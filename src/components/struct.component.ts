/**
 * Import will remove at compile time
 */

import type {
    StructType,
    StructDataType,
    StructContextInterface
} from '@components/interfaces/struct-component.interface';

/**
 * Imports
 */

import { splitBufferWithGap } from '@components/buffer.component';

/**
 * Reads a single structure from a binary buffer at a specified position
 *
 * @param arrayOffset - Optional offset to apply when reading structures within an array (defaults to 0)
 * @returns The deserialized structure object with its properties populated from binary data
 *
 * @throws Error - If the binary data is malformed or cannot be deserialized into the expected structure
 *
 * @remarks
 * This function calculates the absolute position in the buffer by combining the base offset,
 * the structure's defined position, and any additional array offset. It then uses the structure's
 * type definition to deserialize the binary data at that position into a JavaScript object.
 * The callback provided to toObject updates the context's offset to account for any dynamic-sized data.
 *
 * @example
 * ```ts
 * const context = {
 *   buffer: myBuffer,
 *   offset: 0,
 *   descriptor: {
 *     position: 10,
 *     type: PersonStruct
 *   }
 * };
 *
 * const person = readSingleStruct.call(context);
 * ```
 *
 * @see writeStruct
 * @see readStructArray
 *
 * @since 2.0.0
 */

export function readSingleStruct(this: StructContextInterface, arrayOffset: number = 0): StructType {
    const { position, type } = this.descriptor;
    const absolutePosition = this.offset + position + arrayOffset;

    return <StructType> type.toObject(this.buffer.subarray(absolutePosition), (offset) => {
        this.offset += offset;
    });
}

/**
 * Reads an array of structures from a binary buffer
 *
 * @returns An array of deserialized structure objects
 *
 * @throws Error - If the binary data is malformed or cannot be deserialized into the expected structures
 *
 * @remarks
 * This function extracts multiple structure instances from a binary buffer based on the descriptor's
 * arraySize property. It pre-allocates the result array for performance and calls readSingleStruct
 * for each structure in the array, calculating the appropriate offset based on the structure size.
 * The arraySize in the descriptor determines how many structures will be read from the buffer.
 *
 * @example
 * ```ts
 * const context = {
 *   buffer: myBuffer,
 *   offset: 0,
 *   descriptor: {
 *     position: 10,
 *     type: PersonStruct,
 *     arraySize: 5,
 *     size: 32
 *   }
 * };
 *
 * const people = readStructArray.call(context);
 * // Returns an array of 5 person objects
 * ```
 *
 * @see readSingleStruct
 * @see writeStructArray
 *
 * @since 2.0.0
 */

export function readStructArray(this: StructContextInterface): Array<StructType> {
    const result: Array<StructType> = [];
    const { arraySize = 0, size } = this.descriptor;

    result.length = arraySize;
    for (let i = 0; i < arraySize; i++) {
        result[i] = readSingleStruct.call(this, i * size);
    }

    return result;
}

/**
 * Reads a structure or array of structures from a binary buffer based on the descriptor
 *
 * @returns A single structure object or an array of structure objects depending on the descriptor configuration
 *
 * @throws Error - If the binary data is malformed or cannot be deserialized into the expected structure(s)
 *
 * @remarks
 * This function serves as a dispatcher that determines whether to read a single structure or
 * an array of structures based on the descriptor's configuration. It checks if the descriptor
 * contains an arraySize property with a truthy value, and if so, delegates to readStructArray.
 * Otherwise, it calls readSingleStruct to deserialize a single structure instance.
 *
 * @example
 * ```ts
 * // For a single structure descriptor
 * const singleContext = {
 *   buffer: myBuffer,
 *   offset: 0,
 *   descriptor: {
 *     position: 10,
 *     type: PersonStruct
 *   }
 * };
 * const person = readStruct.call(singleContext);
 *
 * // For an array structure descriptor
 * const arrayContext = {
 *   buffer: myBuffer,
 *   offset: 0,
 *   descriptor: {
 *     position: 10,
 *     type: PersonStruct,
 *     arraySize: 5,
 *     size: 32
 *   }
 * };
 * const people = readStruct.call(arrayContext);
 * ```
 *
 * @see writeStruct
 * @see readStructArray
 * @see readSingleStruct
 *
 * @since 2.0.0
 */

export function readStruct(this: StructContextInterface): StructDataType {
    if(('arraySize' in this.descriptor) && this.descriptor.arraySize)
        return readStructArray.call(this);

    return readSingleStruct.call(this);
}

/**
 * Writes a single structure to a binary buffer at a specified position
 *
 * @param value - The structure object to serialize into binary format
 * @param arrayOffset - Optional offset to apply when writing structures within an array (defaults to 0)
 *
 * @throws Error - If the structure cannot be properly serialized or buffer operations fail
 *
 * @remarks
 * This function serializes a structure object into binary data and writes it to the buffer at
 * the calculated absolute position. It handles null/undefined values by defaulting to an empty object.
 * The function splits the existing buffer at the insertion point with appropriate sizing,
 * then reconstructs the buffer by concatenating the start segment, the serialized structure,
 * and the end segment. If the serialized structure is larger than the expected size, it also
 * adjusts the current offset to account for the dynamic sizing.
 *
 * @example
 * ```ts
 * const context = {
 *   buffer: existingBuffer,
 *   offset: 0,
 *   descriptor: {
 *     position: 10,
 *     type: PersonStruct,
 *     size: 32
 *   }
 * };
 *
 * const person = { name: "John", age: 30 };
 * writeSingleStruct.call(context, person);
 * ```
 *
 * @see readSingleStruct
 * @see writeStructArray
 *
 * @since 2.0.0
 */

export function writeSingleStruct(this: StructContextInterface, value: StructType, arrayOffset: number = 0): void {
    value ??= {};
    const { position, type, size } = this.descriptor;
    const StructBuffer = type.toBuffer(value);
    const absolutePosition = this.offset + position + arrayOffset;
    const [ start, end ] = splitBufferWithGap(this.buffer, absolutePosition, size);

    this.buffer = Buffer.concat([ start, StructBuffer, end ]);
    if (StructBuffer.length > size) {
        this.offset += (StructBuffer.length - size);
    }
}

/**
 * Writes an array of structures to a binary buffer
 *
 * @param values - The array of structure objects to serialize into binary format
 * @returns Nothing
 *
 * @throws Error - If the structures cannot be properly serialized or buffer operations fail
 *
 * @remarks
 * This function writes multiple structure instances to the binary buffer based on the descriptor's
 * arraySize property. It iterates through each position in the array and calls writeSingleStruct
 * for each structure, calculating the appropriate offset based on the structure size.
 * If there are fewer values provided than the arraySize specification, empty objects will be
 * written for the remaining positions to ensure the full array space is properly initialized.
 *
 * @example
 * ```ts
 * const context = {
 *   buffer: existingBuffer,
 *   offset: 0,
 *   descriptor: {
 *     position: 10,
 *     type: PersonStruct,
 *     arraySize: 5,
 *     size: 32
 *   }
 * };
 *
 * const people = [
 *   { name: "John", age: 30 },
 *   { name: "Jane", age: 28 },
 *   { name: "Bob", age: 45 }
 * ];
 *
 * writeStructArray.call(context, people);
 * // Writes the 3 provided people and 2 empty objects to fill the array
 * ```
 *
 * @see readStructArray
 * @see writeSingleStruct
 *
 * @since 2.0.0
 */

export function writeStructArray(this: StructContextInterface, values: Array<StructType>): void {
    const { arraySize = 0, size } = this.descriptor;

    for (let i = 0; i < arraySize; i++) {
        const elementValue = i < values.length ? values[i] : {};
        writeSingleStruct.call(this, elementValue, i * size);
    }
}

/**
 * Writes a structure or array of structures to a binary buffer based on the descriptor
 *
 * @param value - The structure object or array of structure objects to serialize
 *
 * @throws Error - If the structure(s) cannot be properly serialized or buffer operations fail
 *
 * @remarks
 * This function serves as a dispatcher that determines whether to write a single structure or
 * an array of structures based on the descriptor's configuration. It checks if the descriptor
 * contains an arraySize property with a truthy value, and if so, delegates to writeStructArray.
 * Otherwise, it calls writeSingleStruct to serialize a single structure instance.
 *
 * The function handles type mismatches between the provided value and the descriptor configuration:
 * - When descriptor indicates an array but a single object is provided, it wraps the object in an array
 * - When descriptor indicates a single object but an array is provided, it uses the first element of the array
 *
 * @example
 * ```ts
 * // For a single structure descriptor
 * const singleContext = {
 *   buffer: existingBuffer,
 *   offset: 0,
 *   descriptor: {
 *     position: 10,
 *     type: PersonStruct
 *   }
 * };
 * const person = { name: "John", age: 30 };
 * writeStruct.call(singleContext, person);
 *
 * // For an array structure descriptor
 * const arrayContext = {
 *   buffer: existingBuffer,
 *   offset: 0,
 *   descriptor: {
 *     position: 10,
 *     type: PersonStruct,
 *     arraySize: 3,
 *     size: 32
 *   }
 * };
 * const people = [
 *   { name: "John", age: 30 },
 *   { name: "Jane", age: 28 }
 * ];
 * writeStruct.call(arrayContext, people);
 * ```
 *
 * @see readStruct
 * @see writeStructArray
 * @see writeSingleStruct
 *
 * @since 2.0.0
 */

export function writeStruct(this: StructContextInterface, value: StructDataType): void {
    if (('arraySize' in this.descriptor) && this.descriptor.arraySize)
        return writeStructArray.call(this, Array.isArray(value) ? value : [ value ]);

    return writeSingleStruct.call(this, Array.isArray(value) ? (value[0] || {}) : value);
}
