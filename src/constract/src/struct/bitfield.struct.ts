/**
 * Imports that will remove on build time
 */

import type { FieldMapInterface, FieldValuesInterface } from "./bitfield.interface";

/**
 * Represents a bit of field, allowing manipulation of individual bits.
 * @class
 *
 * @example
 * ```typescript
 * const bitField = new BitfieldStruct(2);
 *
 * const fieldMap: FieldMapInterface = {
 *     QR: { position: 0, size: 1 },
 *     Opcode: { position: 1, size: 4 },
 *     AA: { position: 5, size: 1 },
 *     TC: { position: 6, size: 1 },
 *     RD: { position: 7, size: 1 },
 *     RA: { position: 8, size: 1 },
 *     Z: { position: 9, size: 3 },
 *     RCODE: { position: 12, size: 4 },
 * };
 *
 * const values: FieldValuesInterface = {
 *     QR: 1,
 *     Opcode: 2,
 *     AA: 1,
 *     TC: 0,
 *     RD: 1,
 *     RA: 0,
 *     Z: 2,
 *     RCODE: 3,
 * };
 * // or
 * bitField.packFields(fieldMap, values);
 * console.log(bitField.getData());
 *
 * const bitField = new BitfieldStruct(2);
 *
 * const fieldMap: FieldMapInterface = {
 *     QR: { position: 0, size: 15 },
 * };
 *
 * const values: FieldValuesInterface = {
 *     QR: 14345,
 * };
 *
 * bitField.packFields(fieldMap, values);
 * console.log("Packed Data:", bitField.getData());
 *
 * // No need to set data to itself
 * // bitField.setData(bitField.getData());
 *
 * const unpackedValues = bitField.unpackFields(fieldMap);
 * console.log("Unpacked Values:", unpackedValues);
 * ```
 */

export class BitfieldStruct {

    private readonly size: number;
    private readonly data: Uint8Array;

    /**
     * Creates a new BitField with the specified size.
     * @constructor
     * @param {number} size - The size of the bit field in bytes.
     */
    constructor(size: number) {
        this.size = size;
        this.data = new Uint8Array(size);
    }

    /**
     * Sets the value of a specific bit in the bit field.
     * @param {number} position - The position of the bit to set.
     * @param {boolean} value - The value to set (true for 1, false for 0).
     * @throws {Error} Throws an error if the specified bit position is out of bounds.
     */
    setBit(position: number, value: boolean): void {
        if (position < 0 || position >= this.size * 8) {
            throw new Error('Bit position is out of bounds');
        }

        const byteIndex = Math.floor(position / 8);
        const bitOffset = position % 8;

        if (value) {
            this.data[byteIndex] |= (1 << bitOffset);
        } else {
            this.data[byteIndex] &= ~(1 << bitOffset);
        }
    }

    /**
     * Gets the value of a specific bit in the bit field.
     * @param {number} position - The position of the bit to get.
     * @returns {boolean} The value of the specified bit.
     * @throws {Error} Throws an error if the specified bit position is out of bounds.
     */
    getBit(position: number): boolean {
        if (position < 0 || position >= this.size * 8 - 1) {
            throw new Error('Bit position is out of bounds');
        }

        const byteIndex = Math.floor(position / 8);
        const bitOffset = position % 8;

        return (this.data[byteIndex] & (1 << bitOffset)) !== 0;
    }

    /**
     * Sets the entire bit field data at once from a Uint8Array.
     * @param {Uint8Array} data - The data to set for the bit field.
     * @throws {Error} Throws an error if the provided data array's length doesn't match the bit field size.
     */
    setData(data: Uint8Array): void {
        if (data.length !== this.size) {
            throw new Error('Data length does not match bit field size');
        }

        this.data.set(data);
    }

    /**
     * Gets a copy of the entire data array representing the bit field.
     * @returns {Uint8Array} A copy of the data array.
     */
    getData(): Uint8Array {
        return this.data.slice();
    }

    /**
     * Packs the named fields into the bit field based on the provided map with position.
     * @param {Object.<string, { position: number, size: number }>} fieldMap - A map of named fields to their bit positions and sizes.
     * @param {Object.<string, number>} values - An object containing values for each named field.
     * @throws {Error} Throws an error if the specified bit position is out of bounds.
     */

    packFieldsByPosition(fieldMap: FieldMapInterface, values: FieldValuesInterface): void {
        for (const fieldName in fieldMap) {
            const { position, size } = fieldMap[fieldName];
            const value = values[fieldName];

            this.packValue(position, size, value);
        }
    }

    /**
     * Packs the named fields into the bit field based on the provided schema order.
     * @param {Object.<string, number>} schemaOrder - An object with field names as keys and their order as values.
     * @param {Object.<string, number>} values - An object containing values for each named field.
     * @throws {Error} Throws an error if the specified bit position is out of bounds.
     */

    packFieldsByOrder(schemaOrder: { [fieldName: string]: number }, values: FieldValuesInterface): void {
        for (const fieldName in schemaOrder) {
            const order = schemaOrder[fieldName];
            const value = values[fieldName];

            this.packValue(order, 1, value); // Assuming each field has a size of 1 bit
        }
    }

    /**
     * Packs a numeric value into the bit field at the specified position and size.
     * if is more the one byte it's will be `little-endian`
     * @param {number} position - The position in bits to start packing the value.
     * @param {number} size - The size in bits of the field.
     * @param {number} value - The numeric value to pack into the field.
     * @throws {Error} Throws an error if the specified bit position is out of bounds.
     */

    packValue(position: number, size: number, value: number): void {
        for (let i = 0; i < size; i++) {
            const bitPos = position + i;
            this.setBit(bitPos, (value & (1 << i)) !== 0);
        }
    }


    /**
     * Unpacks the values of named fields from the bit field based on the provided map with position.
     * @param {Object.<string, { position: number, size: number }>} fieldMap - A map of named fields to their bit positions and sizes.
     * @returns {Object.<string, number>} An object containing values for each named field.
     * @throws {Error} Throws an error if the specified bit position is out of bounds.
     */

    unpackFieldsByPosition(fieldMap: FieldMapInterface): FieldValuesInterface {
        const unpackedValues: FieldValuesInterface = {};

        for (const fieldName in fieldMap) {
            const { position, size } = fieldMap[fieldName];
            unpackedValues[fieldName] = this.unpackValue(position, size);
        }

        return unpackedValues;
    }

    /**
     * Unpacks the values of named fields from the bit field based on the provided schema order.
     * @param {Object.<string, number>} schemaOrder - An object with field names as keys and their order as values.
     * @returns {Object.<string, number>} An object containing values for each named field.
     * @throws {Error} Throws an error if the specified bit position is out of bounds.
     */

    unpackFieldsByOrder(schemaOrder: { [fieldName: string]: number }): FieldValuesInterface {
        const unpackedValues: FieldValuesInterface = {};

        for (const fieldName in schemaOrder) {
            const order = schemaOrder[fieldName];
            const size = /* specify the actual size for the field */;
            unpackedValues[fieldName] = this.unpackValue(order, size);
        }

        return unpackedValues;
    }

    /**
     * Unpacks a numeric value from the bit field at the specified position and size.
     * If it is more than one byte, it will be little-endian.
     * @param {number} position - The position in bits to start unpacking the value.
     * @param {number} size - The size in bits of the field.
     * @returns {number} The numeric value unpacked from the field.
     * @throws {Error} Throws an error if the specified bit position is out of bounds.
     */

    unpackValue(position: number, size: number): number {
        let unpackedValue = 0;

        for (let i = 0; i < size; i++) {
            const bitPos =  position + i;
            if (this.getBit(bitPos)) {
                unpackedValue |= (1 << i);
            }
        }

        return unpackedValue;
    }
}