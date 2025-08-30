/**
 * Import will remove at compile time
 */

import type { ContextInterface } from '@services/interfaces/struct-service.interface';
import type { PrimitiveType } from '@components/interfaces/primitive-component.interface';
import type { PositionedDescriptorInterface } from '@components/interfaces/primitive-component.interface';

/**
 * Creates a union type of numbers from 0 to N-1
 *
 * @template N - The upper bound (exclusive) of the enumeration
 * @template Acc - Accumulator for the recursive type building (internal use only)
 *
 * @remarks
 * This utility type generates a union of literal number types by recursively building
 * a tuple and then extracting its indices as a union.
 * The resulting type represents all integers starting from 0 up to but not including N.
 *
 * The implementation works through TypeScript's recursive type definitions:
 * 1. It starts with an empty array as accumulator
 * 2. On each recursion step, it adds the current length of the accumulator to itself
 * 3. Once the accumulator's length equals N, it returns the union of all indices in the accumulator
 *
 * @example
 * ```ts
 * // Creates a union type of numbers 0, 1, 2, 3, 4
 * type FiveNumbers = EnumerateType<5>; // 0 | 1 | 2 | 3 | 4
 *
 * // Can be used with mapped types
 * type Positions = { [K in EnumerateType<3>]: string }; // { 0: string; 1: string; 2: string }
 * ```
 *
 * @internal
 * @since 2.0.0
 */

export type EnumerateType<N extends number, Acc extends number[] = []> =
    Acc['length'] extends N ? Acc[number] : EnumerateType<N, [...Acc, Acc['length']]>;

/**
 * Creates a union type of numbers from Start to End (inclusive)
 *
 * @template Start - The lower bound of the range (inclusive)
 * @template End - The upper bound of the range (inclusive)
 *
 * @remarks
 * This utility type generates a union of literal number types representing all integers
 * in the specified range.
 * It works by:
 * 1. Creating a union of numbers from 0 to End-1 using EnumerateType<End>
 * 2. Creating a union of numbers from 0 to Start-1 using EnumerateType<Start>
 * 3. Excluding the second union from the first to get numbers Start to End-1
 * 4. Adding the Start value back with a union to ensure it's included
 *
 * The resulting type represents all integers from Start through End (inclusive at both ends).
 *
 * @example
 * ```ts
 * // Creates a union type of numbers from 1 to 5
 * type SmallNumbers = RangeType<1, 5>; // 1 | 2 | 3 | 4 | 5
 *
 * // Can be used as a constraint for function parameters
 * function setVolume<T extends RangeType<0, 100>>(level: T) {
 *   // Only accepts values between 0 and 100
 * }
 *
 * // Works with any numeric range
 * type ValidDays = RangeType<1, 31>; // 1 | 2 | 3 | ... | 31
 * ```
 *
 * @since 2.0.0
 */

export type RangeType<Start extends number, End extends number> = Exclude<
    EnumerateType<End>,
    EnumerateType<Start>
> | Start;

/**
 * Represents the size of a bitfield for both signed and unsigned integers,
 * allowing precise bit-level control in data structures
 *
 * @remarks
 * The BitFieldType can define signed integer (`Int8/16/32(BE/LE):<size>`)
 * or unsigned integer (`UInt8/16/32(BE/LE):<size>`)
 * bit fields, where the size is specified as a value from 1 to 8, 16, or 32 bits depending on the type.
 * This enables precise control over the number of bits used for each field in a data structure.
 *
 * Valid formats include:
 * - 8-bit fields: `Int8:1` through `Int8:8` or `UInt8:1` through `UInt8:8`
 * - 16-bit fields: `Int16LE:1` through `Int16LE:16` or `UInt16BE:1` through `UInt16BE:16`
 * - 32-bit fields: `Int32LE:1` through `Int32LE:32` or `UInt32BE:1` through `UInt32BE:32`
 *
 * @example
 * ```ts
 * const field1: BitFieldType = 'UInt8LE:4'; // 4-bit unsigned integer
 * const field2: BitFieldType = 'Int8:7'; // 7-bit signed integer
 * const field3: BitFieldType = 'UInt16BE:12'; // 12-bit unsigned integer
 * ```
 *
 * @since 2.0.0
 */

type SignedBitField8Type = `Int8:${ RangeType<1, 8> }`;
type UnsignedBitField8Type = `UInt8:${ RangeType<1, 8> }`;
type SignedBitField16LEType = `Int16LE:${ RangeType<1, 16> }`;
type SignedBitField16BEType = `Int16BE:${ RangeType<1, 16> }`;
type UnsignedBitField16LEType = `UInt16LE:${ RangeType<1, 16> }`;
type UnsignedBitField16BEType = `UInt16BE:${ RangeType<1, 16> }`;

export type BitFieldType =
    | SignedBitField8Type
    | SignedBitField16LEType
    | SignedBitField16BEType
    | UnsignedBitField8Type
    | UnsignedBitField16LEType
    | UnsignedBitField16BEType;

/**
 * Interface representing a bit field descriptor within a binary data structure
 *
 * @param type - The primitive data type of the bit field
 * @param bitSize - The number of bits that this field occupies
 * @param bitPosition - The starting bit position of this field within the containing data structure
 *
 * @remarks
 * This interface defines the properties needed to describe field within a larger binary structure.
 * It specifies the type, size, and position information required to correctly interpret and manipulate
 * bits within primitive data types.
 *
 * @example
 * ```ts
 * // Define a 4-bit field within a byte starting at position 2
 * const statusField: BitfieldDescriptorInterface = {
 *   type: 'UInt8',
 *   bitSize: 4,
 *   bitPosition: 2
 * };
 * ```
 *
 * @since 2.0.0
 */

export interface BitfieldDescriptorInterface {
    type: PrimitiveType;
    bitSize: number;
    bitPosition: number;
    isBigEndian?: boolean;
}

/**
 * A type that combines bitfield information with positioning data
 *
 * @remarks
 * This type combines the BitfieldDescriptorInterface with PositionedDescriptorInterface,
 * creating a comprehensive descriptor that contains both the bitfield information and its position within a buffer.
 * This is essential for serialization and deserialization
 * operations where both the bitfield definition and its location in memory must be known.
 *
 * The size property indicates the total number of bytes required to store the bitfield,
 * while the offset specifies the starting position within the buffer.
 * This is crucial for binary data operations and ensures proper memory addressing.
 *
 * @example
 * ```ts
 * const statusField: PositionedBitfieldDescriptorType = {
 *   type: 'UInt8',
 *   size: 1,
 *   offset: 4,
 *   bitSize: 4,
 *   bitPosition: 2
 * };
 * ```
 *
 * @see BitfieldDescriptorInterface
 * @see PositionedDescriptorInterface
 *
 * @since 2.0.0
 */

export type PositionedBitfieldDescriptorType = BitfieldDescriptorInterface & PositionedDescriptorInterface;

/**
 * Represents a context interface for bitfield operations, extending the base ContextInterface.
 *
 * @remarks
 * This interface provides the specialized descriptor needed for bitfield positioning and manipulation.
 *
 * @see ContextInterface
 * @see PositionedBitfieldDescriptorType
 *
 * @since 2.0.0
 */

export interface BitfieldContextInterface extends ContextInterface {
    descriptor: PositionedBitfieldDescriptorType;
}
