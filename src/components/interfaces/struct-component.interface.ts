/**
 * Import will remove at compile time
 */

import type { Struct } from '@services/struct.service';
import type { ContextInterface } from '@services/interfaces/struct-service.interface';
import type { PositionedDescriptorInterface } from '@components/interfaces/primitive-component.interface';

/**
 * Interface that defines the structure descriptor for complex data types
 *
 * @remarks
 * The StructDescriptorInterface provides metadata about a structured data type
 * within a binary format. It specifies what kind of structure should be used
 * for parsing/serialization and whether multiple instances of this structure
 * are expected (as an array).
 *
 * Properties:
 * - `type`: Specifies the Struct definition that describes the structure's layout
 * - `arraySize`: Optional property that indicates how many instances of this structure
 *    are present when serialized as an array. When undefined or 0, indicates a single instance.
 *
 * This interface is used in schema definitions to describe complex nested data
 * structures and how they should be interpreted during serialization/deserialization.
 *
 * @example
 * ```ts
 * // Definition for a single structure
 * const personDescriptor: StructDescriptorInterface = {
 *   type: PersonStruct
 * };
 *
 * // Definition for an array of structures
 * const peopleDescriptor: StructDescriptorInterface = {
 *   type: PersonStruct,
 *   arraySize: 10
 * };
 * ```
 *
 * @see Struct
 *
 * @since 2.0.0
 */

export interface StructDescriptorInterface {
    type: Struct;
    arraySize?: number;
}

/**
 * Interface representing the execution context for a structure within binary data
 *
 * @remarks
 * The StructContextInterface extends the base ContextInterface to provide specific
 * context information needed when working with structured data types in binary formats.
 * It includes details about the structure's position and descriptor, which are essential
 * for correctly interpreting and manipulating structured binary data.
 *
 * This interface is typically used internally by serialization/deserialization mechanisms
 * to maintain the context while processing nested structures or arrays of structures.
 *
 * Properties:
 * - All properties inherited from ContextInterface
 * - `descriptor`: Contains the positioned structure descriptor information,
 *   including position, type definition, and optional array size
 *
 * @example
 * ```ts
 * function readStructure(context: StructContextInterface): any {
 *   const { buffer, offset, descriptor } = context;
 *   const { position, type } = descriptor;
 *
 *   // Process the structure at the calculated position
 *   const absolutePosition = offset + position;
 *   // ...
 * }
 * ```
 *
 * @extends ContextInterface
 * @see PositionedStructDescriptorType
 *
 * @since 2.0.0
 */

export interface StructContextInterface extends ContextInterface {
    descriptor: PositionedStructDescriptorType;
}

/**
 * Represents a generic structured data object that can be serialized to and deserialized from binary formats
 *
 * @since 2.0.0
 */

export type StructType = Record<string, unknown>;

/**
 * Represents either a single structure object or an array of structure objects
 *
 * @since 2.0.0
 */

export type StructDataType = StructType | Array<StructType>;

/**
 * Represents a structure descriptor with positioning information
 *
 * @remarks
 * This type combines the structure descriptor properties with positioning information,
 * allowing the system to locate and process structures within a binary buffer.
 * It merges the type definition and optional array size from StructDescriptorInterface
 * with the position information from PositionedDescriptorInterface.
 *
 * @see StructDescriptorInterface
 * @see PositionedDescriptorInterface
 *
 * @since 2.0.0
 */

export type PositionedStructDescriptorType = StructDescriptorInterface & PositionedDescriptorInterface;
