/**
 * Import will remove at compile time
 */

import type { PrimitiveType } from '@components/interfaces/primitive-component.interface';
import type {
    BitfieldContextInterface,
    BitfieldDescriptorInterface,
    PositionedBitfieldDescriptorType
} from '@components/interfaces/bitfield-component.interface';

/**
 * Imports
 */

import { PRIMITIVE_TYPE_SIZES } from '@components/primitive.component';

/**
 * Cache for bit masks to improve the performance of bitfield operations
 *
 * @remarks
 * This map caches bit masks for different bit sizes to avoid recalculating
 * them repeatedly. The keys represent bit sizes, and the values are pre-calculated
 * masks for those sizes (e.g., 3 bits → 0b111, 4 bits → 0b1111).
 *
 * Using this cache improves performance in applications with heavy bitfield operations,
 * as mask generation is a common operation that can be optimized through caching.
 *
 * @private
 * @since 2.0.0
 */

export const maskCache = new Map<number, number>();

/**
 * Determines if a primitive type is signed
 *
 * @param type - The primitive type name to check
 * @returns `true` if the type is signed, `false` otherwise
 *
 * @remarks
 * This function checks if a given primitive type represents a signed value.
 * Types that start with "Int" (e.g., Int8, Int16, Int32) are considered signed,
 * while other types (e.g., UInt8, Float32) are considered unsigned.
 *
 * @example
 * ```ts
 * isSignedType('Int8'); // Returns true
 * isSignedType('UInt8'); // Returns false
 * ```
 *
 * @since 2.0.0
 */

export function isSignedType(type: string): boolean {
    return type.startsWith('Int');
}

/**
 * Creates a bit mask of a specific size with optimized caching
 *
 * @param size - The number of bits to set in the mask (from the least significant bit)
 * @returns A number with the specified number of the least significant bits set to 1
 *
 * @remarks
 * This function generates a bit mask with the specified number of the least significant bits set to 1.
 * For performance optimization, it uses a cache to store previously calculated masks.
 * For example, for size 3, it returns 0b111 (decimal 7).
 *
 * The function first checks if the requested mask already exists in the cache.
 * If found, it returns the cached value; otherwise, it calculates a new mask,
 * stores it in the cache for future use, and returns it.
 *
 * @example
 * ```ts
 * getBitMask(3); // Returns 7 (binary 0b111)
 * getBitMask(8); // Returns 255 (binary 0b11111111)
 * ```
 *
 * @since 2.0.0
 */

export function getBitMask(size: number): number {
    let mask = maskCache.get(size);
    if (mask === undefined) {
        mask = (1 << size) - 1;
        maskCache.set(size, mask);
    }

    return mask;
}

/**
 * Processes a value according to the bitfield's type specifications
 *
 * @param descriptor - The descriptor defining the bitfield's properties
 * @param value - The numeric value to process
 * @returns The processed value, adjusted for the bitfield's type
 *
 * @remarks
 * This function ensures that a numeric value is properly formatted according to
 * the constraints of a bitfield descriptor. For signed types, it applies the correct
 * sign extension using BigInt operations to handle possible overflow/underflow
 * situations, then converts the result back to a JavaScript number.
 *
 * For unsigned types, the value is returned unchanged as no additional processing
 * is needed.
 *
 * @example
 * ```ts
 * // Process a value for a signed 4-bit field
 * const descriptor: BitfieldDescriptorInterface = {
 *   type: 'Int8',
 *   bitSize: 4,
 *   bitPosition: 0
 * };
 *
 * processValueForBitfield(descriptor, 15); // Returns -1 (sign extension applied)
 * processValueForBitfield(descriptor, 7); // Returns 7 (no sign extension needed)
 * ```
 *
 * @since 2.0.0
 */

export function processValueForBitfield(descriptor: BitfieldDescriptorInterface, value: number): number {
    if (isSignedType(descriptor.type as string)) {
        return Number(BigInt.asIntN(descriptor.bitSize, BigInt(value)));
    }

    return value;
}

/**
 * Validates that a value fits within the bounds of a specified bitfield
 *
 * @param descriptor - The descriptor defining the bitfield's properties
 * @param value - The numeric value to validate
 *
 * @throws RangeError - When the value exceeds the allowable range for the bitfield
 *
 * @remarks
 * This function checks if a given value can be safely stored in a bitfield with
 * the specified characteristics. It calculates the minimum and maximum allowable values
 * based on the bitfield's size and whether it's signed or unsigned.
 *
 * For unsigned bitfields, the range is 0 to (2^bitSize - 1).
 * For signed bitfields, the range is -(2^(bitSize-1)) to (2^(bitSize-1) - 1).
 *
 * If the value falls outside the valid range, a RangeError is thrown with a
 * descriptive message indicating the constraint violation.
 *
 * @example
 * ```ts
 * // Validate a value for a 3-bit unsigned field
 * const unsignedField: BitfieldDescriptorInterface = {
 *   type: 'UInt8',
 *   bitSize: 3,
 *   bitPosition: 0
 * };
 * validateBitFieldBounds(unsignedField, 5); // Valid (0-7 is valid range)
 * validateBitFieldBounds(unsignedField, 8); // Throws RangeError
 *
 * // Validate a value for a 3-bit signed field
 * const signedField: BitfieldDescriptorInterface = {
 *   type: 'Int8',
 *   bitSize: 3,
 *   bitPosition: 0
 * };
 * validateBitFieldBounds(signedField, -4); // Valid (-4 to 3 is valid range)
 * validateBitFieldBounds(signedField, 4);  // Throws RangeError
 * ```
 *
 * @since 2.0.0
 */

export function validateBitFieldBounds(descriptor: BitfieldDescriptorInterface, value: number): void {
    const isSigned = isSignedType(descriptor.type as string);
    const { bitSize, type } = descriptor;

    // Fix operator precedence with parentheses for shift operations
    const maxBitValue = isSigned ? ((1 << (bitSize - 1)) - 1) : ((1 << bitSize) - 1);
    const minBitValue = isSigned ? -(1 << (bitSize - 1)) : 0;

    if (value < minBitValue || value > maxBitValue) {
        throw new RangeError(
            `Value ${ value } does not fit within ${ bitSize } bits for type ${ type }`
        );
    }
}

/**
 * Validates the structural parameters of a bitfield descriptor
 *
 * @param descriptor - The bitfield descriptor to validate
 * @param operation - A string describing the operation context (for error messages)
 *
 * @throws Error - When the descriptor has invalid parameters
 *
 * @remarks
 * This function performs two key validation checks on bitfield descriptors:
 *
 * 1. It verifies that the primitive type size is supported (currently limited to 32 bits or fewer)
 * 2. It ensures that the bitfield's position and size do not exceed the bounds of its containing type
 *
 * These validations help prevent buffer overflows, data corruption, and other
 * potential issues that could occur when working with binary data structures.
 *
 * The operation parameter is used in error messages to provide context about
 * where the validation failure occurred.
 *
 * @example
 * ```ts
 * // Valid bitfield descriptor
 * const validDescriptor: BitfieldDescriptorInterface = {
 *   type: 'UInt8',
 *   bitSize: 3,
 *   bitPosition: 5
 * };
 * validateBitfieldParameters(validDescriptor, 'read'); // No error thrown
 *
 * // Invalid: position + size exceeds type size (8 bits for UInt8)
 * const invalidDescriptor: BitfieldDescriptorInterface = {
 *   type: 'UInt8',
 *   bitSize: 6,
 *   bitPosition: 4
 * };
 * validateBitfieldParameters(invalidDescriptor, 'write'); // Throws Error
 * ```
 *
 * @since 2.0.0
 */

export function validateBitfieldParameters(descriptor: BitfieldDescriptorInterface, operation: string): void {
    if (descriptor.bitSize < 1 || descriptor.bitPosition < 0) {
        throw new Error(`bitSize(${ descriptor.bitSize }) and bitPosition(${ descriptor.bitPosition }) ` +
            `must be greater than bitSize(1) and bitPosition(0) for ${ operation }`);
    }

    if (PRIMITIVE_TYPE_SIZES[descriptor.type] > 32) {
        throw new Error(`${ descriptor.type } is not supported yet`);
    }

    if (descriptor.bitPosition + descriptor.bitSize > PRIMITIVE_TYPE_SIZES[descriptor.type]) {
        throw new Error(
            `bitPosition(${ descriptor.bitPosition }) + bitSize(${ descriptor.bitSize }) ` +
            `exceeds ${ descriptor.type } size for ${ operation }`
        );
    }
}

/**
 * Extracts a bitfield value from a raw numeric value
 *
 * @param rawValue - The source value containing the bitfield
 * @param descriptor - The descriptor defining the bitfield's properties
 * @returns The extracted value from the bitfield
 *
 * @throws Error - When the bitfield parameters are invalid
 *
 * @remarks
 * This function extracts a specific bitfield from a larger numeric value according
 * to the provided descriptor. It first validates the bitfield parameters to ensure
 * they are within allowable bounds. Then it performs the following operations:
 *
 * 1. Creates an appropriate bit mask for the field's size
 * 2. Shifts the raw value right to align the target bits with the least significant position
 * 3. Applies the mask to extract only the relevant bits
 * 4. For signed types, if the most significant bit is set (indicating a negative value),
 *    it extends the sign bit by OR'ing with the complement of the mask
 *
 * This function properly handles both signed and unsigned bitfields of various sizes.
 *
 * @example
 * ```ts
 * // Extracting an unsigned 3-bit field from bit position 2
 * const unsignedField: BitfieldDescriptorInterface = {
 *   type: 'UInt8',
 *   bitSize: 3,
 *   bitPosition: 2
 * };
 *
 * extractBitfieldValue(0b10111100, unsignedField); // Returns 7 (0b111)
 *
 * // Extracting a signed 3-bit field from bit position 2
 * const signedField: BitfieldDescriptorInterface = {
 *   type: 'Int8',
 *   bitSize: 3,
 *   bitPosition: 2
 * };
 *
 * extractBitfieldValue(0b10111100, signedField); // Returns -1 (sign extended from 0b111)
 * extractBitfieldValue(0b00011100, signedField); // Returns 3 (positive value 0b011)
 * ```
 *
 * @since 2.0.0
 */

export function extractBitfieldValue(rawValue: number, descriptor: BitfieldDescriptorInterface): number {
    validateBitfieldParameters(descriptor, 'read operation');

    const { type, bitPosition, bitSize } = descriptor;
    const mask = getBitMask(bitSize);
    const extractedValue = (rawValue >> bitPosition) & mask;

    if (isSignedType(type as string) && (extractedValue & (1 << (bitSize - 1)))) {
        return extractedValue | (~mask);
    }

    return extractedValue;
}

/**
 * Composes a new value by integrating a bitfield into a larger number
 *
 * @param rawValue - The original value containing multiple bitfields
 * @param descriptor - The descriptor defining the target bitfield's properties
 * @param value - The value to integrate into the bitfield
 * @returns A new composite value with the specified bitfield updated
 *
 * @throws Error - When the bitfield parameters are invalid
 * @throws RangeError - When the provided value exceeds the bounds of the bitfield
 *
 * @remarks
 * This function composes a new numeric value by integrating a specific bitfield with an existing value.
 * It precisely targets and modifies only the bits defined
 * by the descriptor while preserving all other bits in the original value.
 * The process involves:
 *
 * 1. Validating the bitfield parameters to ensure they are within allowable bounds
 * 2. Validating that the value to integrate fits within the bitfield's size constraints
 * 3. Processing the value to account for the bitfield's type (signed/unsigned)
 * 4. Creating an appropriate bit mask for the field's size
 * 5. Clearing only the target bits in the original value
 * 6. Inserting the new bits at the appropriate position
 *
 * The original value is not modified; instead, a new composite value is returned.
 *
 * @example
 * ```ts
 * // Composing a value with an unsigned 3-bit field at bit position 2
 * const unsignedField: BitfieldDescriptorInterface = {
 *   type: 'UInt8',
 *   bitSize: 3,
 *   bitPosition: 2
 * };
 *
 * // Original: 0b10000010 (130)
 * // Composed: 0b10011010 (154)
 * composeBitfieldValue(0b10000010, unsignedField, 6); // Returns 154
 *
 * // Composing a value with a signed 3-bit field at bit position 1
 * const signedField: BitfieldDescriptorInterface = {
 *   type: 'Int8',
 *   bitSize: 3,
 *   bitPosition: 1
 * };
 *
 * // Original: 0b11110000 (240)
 * // Composed: 0b11101110 (238) - integrating -1 (0b111 in 3-bit signed form)
 * composeBitfieldValue(0b11110000, signedField, -1); // Returns 238
 * ```
 *
 * @since 2.0.0
 */

export function composeBitfieldValue(rawValue: number, descriptor: BitfieldDescriptorInterface, value: number): number {
    validateBitfieldParameters(descriptor, 'write operation');
    validateBitFieldBounds(descriptor, value);

    const { bitPosition, bitSize } = descriptor;
    const processedValue = processValueForBitfield(descriptor, value);
    const mask = getBitMask(bitSize);
    const shiftedMask = mask << bitPosition;

    // Clear the bits at the target position and then set the new value
    return (rawValue & ~shiftedMask) | ((processedValue << bitPosition) & shiftedMask);
}

/**
 * Parses a string representation of a bitfield and returns a structured positioned descriptor object
 *
 * @param field - String in the format "type:bitSize" where type is a primitive type (e.g., "Int8", "UInt16BE")
 *                and bitSize is the number of bits to allocate (e.g., "Int8:4")
 * @param position - The starting byte position of this element within the buffer
 * @param bitPosition - Starting position of the bitfield within the primitive type (0-based index, defaults to 0)
 * @returns A PositionedBitfieldDescriptorType object containing the parsed type, size, offset, bitSize, and bitPosition
 *
 * @throws Error - When the type is not supported (not found in PRIMITIVE_TYPE_SIZES)
 * @throws Error - When the bitPosition is negative or greater than or equal to the type size
 * @throws Error - When the bitSize is invalid (zero or non-numeric)
 * @throws Error - When the bitSize + bitPosition exceeds the available bits in the type
 *
 * @remarks
 * This function parses a string descriptor for a bitfield and validates that the
 * specified bitfield can fit within the given primitive type.
 * It creates a positioned descriptor that includes both the bitfield definition and its location in memory.
 * It ensures that:
 * - The primitive type is supported
 * - The bit position is within the valid range for the type
 * - The bit size is a valid number greater than zero
 * - The bitfield (of size bitSize starting at bitPosition) fits within the primitive type
 *
 * @example
 * ```ts
 * // Parse an 8-bit signed integer with 3 bits starting at position 0, at offset 0
 * const descriptor = parseBitfieldDescriptor('Int8:3');
 * // Returns: { type: 'Int8', size: 1, offset: 0, bitSize: 3, bitPosition: 0 }
 *
 * // Parse a 16-bit unsigned integer with 5 bits starting at position 2, at offset 4
 * const descriptor = parseBitfieldDescriptor('UInt16:5', 4, 2);
 * // Returns: { type: 'UInt16LE', size: 2, offset: 4, bitSize: 5, bitPosition: 2 }
 * ```
 *
 * @see PRIMITIVE_TYPE_SIZES
 * @see PositionedBitfieldDescriptorType
 *
 * @since 2.0.0
 */

export function parseBitfieldDescriptor(field: string, position: number = 0, bitPosition: number = 0): PositionedBitfieldDescriptorType {
    const [ type, bitSizeStr ] = <[PrimitiveType, string]> field.split(':', 2);
    const bitSize = parseInt(bitSizeStr, 10);
    const typeSize = PRIMITIVE_TYPE_SIZES[type];
    const isBigEndian = type.endsWith('BE');

    if (!typeSize)
        throw new Error(`${ type } is not supported`);

    if (bitPosition < 0 || bitPosition >= typeSize)
        throw new Error(`Bitfield position ${ bitPosition } is out of bounds (must be between 0 and ${ typeSize - 1 })`);

    if (!bitSize)
        throw new Error(`${ field } is not valid`);

    if (bitSize + bitPosition >= typeSize)
        throw new Error(`${ type } size (${ typeSize }) is not enough to hold ${ bitSize } bits starting at position ${ bitPosition }`);

    return {
        kind: 'bitfield',
        type,
        size: typeSize / 8,
        position,
        bitSize,
        bitPosition,
        isBigEndian
    };
}

/**
 * Reads a bitfield value from a buffer at the specified position based on the provided context.
 *
 * @returns The extracted bitfield value after applying masks and shifts
 *
 * @throws Error - If the buffer is too small for the requested read
 *
 * @remarks
 * This function handles both big-endian and little-endian values based on the descriptor's
 * isBigEndian property. The function uses the BitfieldContextInterface as its 'this' context
 * to access buffer, descriptor, and offset properties.
 *
 * @example
 * ```ts
 * const context = {
 *   buffer: Buffer.from([0x12, 0x34, 0x56, 0x78]),
 *   descriptor: {
 *     position: 0,
 *     size: 2,
 *     isBigEndian: true,
 *     bitOffset: 4,
 *     bitLength: 8,
 *     type: 'UInt16'
 *   },
 *   offset: 0
 * };
 * const value = readBitfield.call(context);
 * ```
 *
 * @see extractBitfieldValue
 * @see BitfieldContextInterface
 * @see PositionedBitfieldDescriptorType
 *
 * @since 2.0.0
 */

export function readBitfield(this: BitfieldContextInterface): number {
    const absolutePosition = this.descriptor.position + this.offset;
    const endianMethod = this.descriptor.isBigEndian ? 'BE' : 'LE';
    const rawValue = this.buffer[`readUInt${ endianMethod }`](absolutePosition, this.descriptor.size);

    return extractBitfieldValue(rawValue, this.descriptor);
}

/**
 * Writes a bitfield value to a buffer at the specified position based on the provided context.
 *
 * @param value - The value to write to the bitfield
 * @returns
 *
 * @throws Error - If the buffer is too small for the requested write
 *
 * @remarks
 * This function handles both big-endian and little-endian values based on the descriptor's isBigEndian property.
 * It first reads the current value, modifies the specific bits, and then
 * writes the updated value back to the buffer.
 * The function uses the BitfieldContextInterface as its 'this' context to access buffer, descriptor, and offset.
 *
 * @example
 * ```ts
 * const context = {
 *   buffer: Buffer.alloc(4),
 *   descriptor: {
 *     position: 0,
 *     size: 2,
 *     isBigEndian: true,
 *     bitOffset: 4,
 *     bitLength: 8
 *   },
 *   offset: 0
 * };
 * writeBitfield.call(context, 0xAB);
 * ```
 *
 * @see composeBitfieldValue
 * @see BitfieldContextInterface
 * @see PositionedBitfieldDescriptorType
 *
 * @since 2.0.0
 */

export function writeBitfield(this: BitfieldContextInterface, value: number): void {
    const absolutePosition = this.descriptor.position + this.offset;
    const endianMethod = this.descriptor.isBigEndian ? 'BE' : 'LE';
    const rawValue = this.buffer[`readUInt${ endianMethod }`](absolutePosition, this.descriptor.size);
    const bitFieldValue = composeBitfieldValue(rawValue, this.descriptor, value);

    this.buffer[`writeUInt${ endianMethod }`](bitFieldValue, absolutePosition, this.descriptor.size);
}
