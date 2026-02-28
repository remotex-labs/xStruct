/**
 * Import will remove at compile time
 */

import type {
    StringType,
    StringContextInterface,
    PositionedStringDescriptorType, StringDataType
} from '@components/interfaces/string-component.interface';

/**
 * Imports
 */

import { readMethod, splitBufferWithGap, writeMethod } from '@components/buffer.component';

/**
 * A set containing all valid string primitive type identifiers
 *
 * @remarks
 * This constant provides a convenient way
 * to validate or check if a given string represents a valid string primitive type.
 * The set contains all supported string
 * encoding formats that can be used in data structures:
 * - 'utf8': UTF-8 encoding supporting the full Unicode character set
 * - 'ascii': ASCII encoding limited to 7-bit ASCII characters
 * - 'string': Default string representation based on the system's encoding
 *
 * This collection is useful for validation functions, type checking, or when
 * determining if a string identifier refers to a string primitive type.
 *
 * @example
 * ```ts
 * function isStringPrimitive(type: string): boolean {
 *   return STRING_PRIMITIVE_LIST.has(type.toLowerCase());
 * }
 * ```
 *
 * @see StringType
 *
 * @since 2.0.0
 */

export const STRING_PRIMITIVE_LIST: Set<string> = new Set([ 'utf8', 'ascii', 'string' ]);

/**
 * Regular expression pattern for parsing string type descriptors in schema definitions
 *
 * @remarks
 * This regex matches and captures string type declarations in various formats, enabling flexible
 * string field definitions in binary structure schemas. The pattern supports:
 *
 * **Pattern Structure:**
 * - **Capture Group 1**: String type identifier (`utf8`, `ascii`, or `string`)
 * - **Capture Group 2**: Optional fixed length in parentheses `(length)` - specifies exact byte size
 * - **Capture Group 3**: Optional array size in brackets `[size]` - specifies number of elements
 *
 * **Supported Formats:**
 * 1. Simple type: `utf8`, `ascii`, `string`
 *    - Creates a dynamic length-prefixed string with UInt16LE prefix
 * 2. Fixed-length: `utf8(20)`, `ascii(50)`
 *    - Creates a string that occupies exactly the specified number of bytes
 * 3. Dynamic array: `utf8[10]`, `ascii[5]`
 *    - Creates an array of dynamic strings, each with its own length prefix
 * 4. Fixed-length array: `utf8(20)[10]`, `ascii(50)[5]`
 *    - Creates an array where each string occupies exactly the specified number of bytes
 *
 * The regex is case-insensitive (`i` flag), allowing variations like `UTF8`, `Ascii`, or `STRING`.
 *
 * @example
 * ```ts
 * // Matching various string type patterns
 * const pattern = /^(utf8|ascii|string)(?:\((\d+)\))?(?:\[(\d+)\])?$/i;
 *
 * // Simple type
 * const match1 = 'utf8'.match(pattern);
 * // match1[1] = 'utf8', match1[2] = undefined, match1[3] = undefined
 *
 * // Fixed-length string
 * const match2 = 'ascii(50)'.match(pattern);
 * // match2[1] = 'ascii', match2[2] = '50', match2[3] = undefined
 *
 * // Dynamic array
 * const match3 = 'utf8[10]'.match(pattern);
 * // match3[1] = 'utf8', match3[2] = undefined, match3[3] = '10'
 *
 * // Fixed-length array
 * const match4 = 'string(20)[5]'.match(pattern);
 * // match4[1] = 'string', match4[2] = '20', match4[3] = '5'
 * ```
 *
 * @see StringType
 * @see StringFixedType
 * @see StringArrayType
 * @see StringFixedArrayType
 * @see parseStringDescriptor
 *
 * @since 2.1.0
 */

const STRING_REGEX = /^(utf8|ascii|string)(?:\((\d+)\))?(?:\[(\d+)\])?$/i;

/**
 * Parses a string representation of a string type descriptor into a structured object with positioning information
 *
 * @param field - String representation of the string descriptor in format "type", "type(length)", "type[size]", or "type(length)[size]"
 * @param position - The starting position of this string within the buffer (defaults to 0)
 * @returns A structured PositionedStringDescriptor object with type, size, and offset information
 *
 * @throws Error - When the descriptor format doesn't match the expected pattern
 *
 * @remarks
 * This function converts a string-based string type specification into a structured descriptor object.
 * The input string can be in one of four formats:
 * - A simple string type name (e.g., "utf8", "ascii", "string") - creates a dynamic length-prefixed string
 * - A fixed-length string type (e.g., "utf8(20)", "ascii(50)") - creates a string with exactly the specified byte length
 * - A string type with array size specification (e.g., "utf8[10]", "ascii[25]") - creates an array of dynamic strings
 * - A fixed-length string array (e.g., "utf8(20)[10]", "ascii(50)[5]") - creates an array of fixed-length strings
 *
 * When an array size is specified without a fixed length (e.g., "utf8[10]"),
 * it represents an array of 10 dynamic strings, each with its own length prefix (UInt16LE by default).
 * Each string is stored sequentially in the buffer, one after another.
 *
 * When a fixed length is specified (e.g., "utf8(20)"), the string will occupy exactly that number of bytes
 * in the buffer, regardless of the actual string content. Shorter strings will be padded, and longer strings
 * will be truncated.
 *
 * When both fixed length and array size are specified (e.g., "utf8(20)[10]"), it creates an array of
 * 10 strings, each occupying exactly 20 bytes.
 *
 * The function validates that the input string matches the expected pattern for a valid string descriptor.
 * By default (when no fixed length is specified), the function sets lengthType to 'UInt16LE', which means
 * each string will be encoded with a 2-byte length prefix, and size is initialized to 2 to account for
 * the length prefix.
 *
 * @example
 * ```ts
 * // Parse a simple dynamic string type with offset
 * const descriptor1 = parseStringDescriptor('utf8', 0);
 * // Returns: { type: 'utf8', lengthType: 'UInt16LE', arraySize: undefined, position: 0, size: 2, kind: 'string' }
 *
 * // Parse a fixed-length string (exactly 20 bytes)
 * const descriptor2 = parseStringDescriptor('utf8(20)', 0);
 * // Returns: { type: 'utf8', arraySize: undefined, position: 0, size: 20, kind: 'string' }
 *
 * // Parse a string type as an array of 15 dynamic strings with offset
 * const descriptor3 = parseStringDescriptor('ascii[15]', 24);
 * // Returns: { type: 'ascii', lengthType: 'UInt16LE', arraySize: 15, position: 24, size: 2, kind: 'string' }
 *
 * // Parse an array of 10 fixed-length strings, each 50 bytes
 * const descriptor4 = parseStringDescriptor('utf8(50)[10]', 100);
 * // Returns: { type: 'utf8', arraySize: 10, position: 100, size: 50, kind: 'string' }
 * ```
 *
 * @see StringType
 * @see UnsignedPrimitiveType
 * @see PositionedStringDescriptorType
 *
 * @since 2.0.0
 */

export function parseStringDescriptor(field: string, position: number = 0): PositionedStringDescriptorType {
    const match = <[string, StringType, string, string]> field.match(STRING_REGEX);

    if (!match)
        throw new Error(`Invalid string descriptor: ${ field }`);

    const type      = match[1].toLowerCase() as StringType;
    const fixedLen  = match[2] ? parseInt(match[2]) : undefined;
    const arraySize = match[3] ? parseInt(match[3]) : undefined;

    if (fixedLen !== undefined) {
        return { type, arraySize, position, size: fixedLen, kind: 'string' };
    }

    return { type, arraySize, position, size: 2, lengthType: 'UInt16LE', kind: 'string' };
}

/**
 * Reads a single string from a buffer at the specified position based on the provided context.
 *
 * @param arrayOffset - Optional offset for reading strings within an array, defaults to 0
 * @returns The string value read from the buffer
 *
 * @throws Error - If null string exceeds the specified maxLength constraint
 * @throws Error - If BigInt is used in lengthType (e.g., 'BigInt64' or 'BigUint64')
 * @throws Error - If the buffer is too small for the requested read or if the encoding is invalid
 * @throws Error - If the string's length prefix indicates a size that would exceed the buffer's bounds
 *
 * @remarks
 * This function supports three different string formats:
 * 1. Length-prefixed strings - Where a length value precedes the string data (using lengthType)
 * 2. Null-terminated strings - Where the string ends with a null byte (0x00)
 * 3. Fixed-size strings - Where the string has a predetermined size
 *
 * The function uses the StringContextInterface as its 'this' context to access buffer,
 * descriptor, and offset properties. The encoding is determined by the descriptor's type property.
 *
 * @example
 * ```ts
 * // Reading a null-terminated string
 * const context = {
 *   buffer: Buffer.from("Hello\0World"),
 *   descriptor: {
 *     position: 0,
 *     type: 'utf8',
 *     size: 6,
 *     nullTerminated: true
 *   },
 *   offset: 0
 * };
 * const str = readSingleString.call(context);
 * // Returns: "Hello"
 * ```
 *
 * @see readMethod
 * @see StringContextInterface
 * @see PositionedStringDescriptorType
 *
 * @since 2.0.0
 */

export function readSingleString(this: StringContextInterface, arrayOffset: number = 0): string {
    const { position, type, size } = this.descriptor;
    const absolutePosition = this.offset + position + arrayOffset;
    const encoding = type === 'string' ? 'utf8' : type;

    if ('lengthType' in this.descriptor && this.descriptor.lengthType) {
        if(this.descriptor.lengthType.includes('Big'))
            throw new Error('BigInt are not supported');

        const lengthType = this.descriptor.lengthType as string;
        const stringLength = Number(readMethod<bigint | number>(this.buffer, lengthType)(absolutePosition));
        const dataOffset = absolutePosition + size;
        this.offset += stringLength;

        if((dataOffset + stringLength) > this.buffer.length)
            throw new Error(
                `String prefix length exceeds buffer position: ${ dataOffset } size: ${ stringLength } > ${ this.buffer.length }`
            );

        return this.buffer.subarray(dataOffset, dataOffset + stringLength).toString(encoding);
    }

    if ('nullTerminated' in this.descriptor) {
        let endPos = absolutePosition;
        const maxLength = 'maxLength' in this.descriptor ? this.descriptor.maxLength : 0;
        while (endPos < this.buffer.length && this.buffer[endPos] !== 0) {
            if(maxLength && endPos > maxLength)
                throw new Error(`NullTerminated String exceeds maximum length of ${ maxLength }`);

            endPos++;
        }

        const stringLength = endPos - absolutePosition;
        this.offset += stringLength + 1;

        return this.buffer.subarray(absolutePosition, endPos).toString(encoding);
    }

    return this.buffer.subarray(absolutePosition, absolutePosition + size).toString(encoding);
}

/**
 * Reads an array of strings from a buffer based on the provided context.
 *
 * @returns An array of strings read from the buffer
 *
 * @throws Error - If the buffer is too small for the requested read or if the encoding is invalid
 *
 * @remarks
 * This function reads multiple strings from a buffer by iteratively calling readSingleString
 * for each element in the array. The number of strings to read is determined by the descriptor's
 * arraySize property. For performance optimization, the result array is pre-allocated to the
 * exact size needed.
 *
 * The function uses the StringContextInterface as its 'this' context to access buffer,
 * descriptor, and offset properties. Each string in the array is positioned at intervals
 * determined by the descriptor's size property.
 *
 * @example
 * ```ts
 * // Reading an array of two fixed-length strings
 * const context = {
 *   buffer: Buffer.from("HelloWorld"),
 *   descriptor: {
 *     position: 0,
 *     type: 'utf8',
 *     size: 5,
 *     arraySize: 2
 *   },
 *   offset: 0
 * };
 * const strArray = readStringArray.call(context);
 * // Returns: ["Hello", "World"]
 * ```
 *
 * @see readSingleString
 * @see StringContextInterface
 * @see PositionedStringDescriptorType
 *
 * @since 2.0.0
 */

export function readStringArray(this: StringContextInterface): Array<string> {
    const result: Array<string> = [];
    const { arraySize = 0, size } = this.descriptor;

    // Preallocate the array to avoid resizing
    result.length = arraySize;
    for (let i = 0; i < arraySize; i++) {
        result[i] = readSingleString.call(this, i * size);
    }

    return result;
}

/**
 * Reads a string or array of strings from a buffer based on the provided context.
 *
 * @returns A string value or array of strings depending on the descriptor configuration
 *
 * @throws Error - If the buffer is too small for the requested read or if the encoding is invalid
 *
 * @remarks
 * This function acts as a dispatcher that determines whether to read a single string
 * or an array of strings based on the descriptor's arraySize property. It uses the
 * StringContextInterface as its 'this' context to access buffer, descriptor, and offset properties.
 *
 * @example
 * ```ts
 * // Reading a single string
 * const singleStringContext = {
 *   buffer: Buffer.from("Hello\0World"),
 *   descriptor: {
 *     position: 0,
 *     type: 'utf8',
 *     size: 6,
 *     nullTerminated: true
 *   },
 *   offset: 0
 * };
 * const str = readString.call(singleStringContext);
 * // Returns: "Hello"
 *
 * // Reading an array of strings
 * const arrayStringContext = {
 *   buffer: Buffer.from("HelloWorld"),
 *   descriptor: {
 *     position: 0,
 *     type: 'utf8',
 *     size: 5,
 *     arraySize: 2
 *   },
 *   offset: 0
 * };
 * const strArray = readString.call(arrayStringContext);
 * // Returns: ["Hello", "World"]
 * ```
 *
 * @see readStringArray
 * @see readSingleString
 * @see StringContextInterface
 * @see PositionedStringDescriptorType
 *
 * @since 2.0.0
 */

export function readString(this: StringContextInterface): StringDataType {
    if(('arraySize' in this.descriptor) && this.descriptor.arraySize)
        return readStringArray.call(this);

    return readSingleString.call(this);
}

/**
 * Writes a single string to a buffer at the specified position based on the provided context.
 *
 * @param value - The string value to write to the buffer
 * @param arrayOffset - Optional offset for writing strings within an array, defaults to 0
 * @returns void
 *
 * @throws Error - If the buffer is too small or if the encoding is invalid
 * @throws Error - If BigInt is used in lengthType (e.g., 'BigInt64' or 'BigUint64')
 *
 * @remarks
 * This function supports three different string formats:
 * 1. Length-prefixed strings - Where a length value precedes the string data (using lengthType)
 * 2. Null-terminated strings - Where the string ends with a null byte (0x00)
 * 3. Fixed-size strings - Where the string has a predetermined size
 *
 * The function uses the StringContextInterface as its 'this' context to access buffer,
 * descriptor, and offset properties. The encoding is determined by the descriptor's type property.
 *
 * For length-prefixed and null-terminated strings, the buffer may be resized to accommodate
 * the string data using the splitBufferWithGap utility.
 *
 * @example
 * ```ts
 * // Writing a null-terminated string
 * const context = {
 *   buffer: Buffer.alloc(10),
 *   descriptor: {
 *     position: 0,
 *     type: 'utf8',
 *     size: 6,
 *     nullTerminated: true
 *   },
 *   offset: 0
 * };
 * writeSingleString.call(context, "Hello");
 * // Result: Buffer contains "Hello\0"
 * ```
 *
 * @see writeMethod
 * @see splitBufferWithGap
 * @see StringContextInterface
 * @see PositionedStringDescriptorType
 *
 * @since 2.0.0
 */

export function writeSingleString(this: StringContextInterface, value: string, arrayOffset: number = 0): void {
    value ??= '';
    const { position, type, size } = this.descriptor;
    const absolutePosition = this.offset + position + arrayOffset;
    const encoding = type === 'string' ? 'utf8' : type;

    if ('lengthType' in this.descriptor && this.descriptor.lengthType) {
        if(this.descriptor.lengthType.includes('Big'))
            throw new Error('BigInt are not supported');

        const stringBuffer = Buffer.from(value, encoding);
        writeMethod<bigint | number>(
            this.buffer,
            this.descriptor.lengthType as string
        )(stringBuffer.length, absolutePosition);

        const [ start, end ] = splitBufferWithGap(this.buffer, absolutePosition + size);
        this.buffer = Buffer.concat([ start, stringBuffer, end ]);
        this.offset += stringBuffer.length;

        return;
    }

    if ('nullTerminated' in this.descriptor) {
        if('maxLength' in this.descriptor && this.descriptor.maxLength)
            value = value.length > this.descriptor.maxLength ? value.slice(0, this.descriptor.maxLength) : value;

        const nullTerminatedString = value.endsWith('\0') ? value : `${ value }\0`;
        const stringBuffer = Buffer.from(nullTerminatedString, encoding);
        const [ start, end ] = splitBufferWithGap(this.buffer, absolutePosition, size);

        this.buffer = Buffer.concat([ start, stringBuffer, end ]);
        this.offset += stringBuffer.length;

        return;
    }

    this.buffer.write(value, absolutePosition, size, encoding);
}

/**
 * Writes an array of strings to a buffer based on the provided context.
 *
 * @param values - The array of string values to write to the buffer
 * @returns void
 *
 * @throws Error - If the buffer is too small or if the encoding is invalid
 *
 * @remarks
 * This function writes multiple strings to a buffer by iteratively calling writeSingleString
 * for each element in the input array. The number of strings to write is determined by
 * the descriptor's arraySize property.
 *
 * If the input array contains fewer elements than arraySize, empty strings will be written
 * for the remaining positions. Each string in the array is positioned at intervals
 * determined by the descriptor's size property.
 *
 * The function uses the StringContextInterface as its 'this' context to access buffer,
 * descriptor, and offset properties.
 *
 * @example
 * ```ts
 * // Writing an array of two fixed-length strings
 * const context = {
 *   buffer: Buffer.alloc(10),
 *   descriptor: {
 *     position: 0,
 *     type: 'utf8',
 *     size: 5,
 *     arraySize: 2
 *   },
 *   offset: 0
 * };
 * writeStringArray.call(context, ["Hello", "World"]);
 * // Result: Buffer contains "HelloWorld"
 * ```
 *
 * @see writeSingleString
 * @see StringContextInterface
 * @see PositionedStringDescriptorType
 *
 * @since 2.0.0
 */

export function writeStringArray(this: StringContextInterface, values: Array<string>): void {
    const { arraySize = 0, size } = this.descriptor;

    for (let i = 0; i < arraySize; i++) {
        const elementValue = i < values.length ? values[i] : '';
        writeSingleString.call(this, elementValue, i * size);
    }
}

/**
 * Writes a string or array of strings to a buffer based on the provided context.
 *
 * @param value - The string value or array of strings to write to the buffer
 * @returns void
 *
 * @throws Error - If the buffer is too small for the write operation or if the encoding is invalid
 *
 * @remarks
 * This function acts as a dispatcher that determines whether to write a single string
 * or an array of strings based on the descriptor's arraySize property. It handles
 * type conversion to ensure compatibility between the provided value and the expected format.
 *
 * - If the descriptor specifies an array (arraySize property exists), any single string
 *   will be wrapped in an array before being processed.
 * - If the descriptor does not specify an array but an array is provided, only the first
 *   element (or an empty string if the array is empty) will be used.
 *
 * The function uses the StringContextInterface as its 'this' context to access buffer,
 * descriptor, and offset properties.
 *
 * @example
 * ```ts
 * // Writing a single string
 * const singleStringContext = {
 *   buffer: Buffer.alloc(10),
 *   descriptor: {
 *     position: 0,
 *     type: 'utf8',
 *     size: 6,
 *     nullTerminated: true
 *   },
 *   offset: 0
 * };
 * writeString.call(singleStringContext, "Hello");
 * // Result: Buffer contains "Hello\0"
 *
 * // Writing an array of strings
 * const arrayStringContext = {
 *   buffer: Buffer.alloc(10),
 *   descriptor: {
 *     position: 0,
 *     type: 'utf8',
 *     size: 5,
 *     arraySize: 2
 *   },
 *   offset: 0
 * };
 * writeString.call(arrayStringContext, ["Hello", "World"]);
 * // Result: Buffer contains "HelloWorld"
 * ```
 *
 * @see writeSingleString
 * @see writeStringArray
 * @see StringContextInterface
 * @see PositionedStringDescriptorType
 *
 * @since 2.0.0
 */

export function writeString(this: StringContextInterface, value: StringDataType): void {
    if(('arraySize' in this.descriptor) && this.descriptor.arraySize)
        return writeStringArray.call(this, Array.isArray(value) ? value : [ value ]);

    return writeSingleString.call(this, Array.isArray(value) ? (value[0] || '') : value);
}
