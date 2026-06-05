/**
 * Imports
 */


import type { SchemaType } from './interfaces/schema-service.interface';
import type { StructOptionsInterface } from './interfaces/struct-service.interface';
import { Struct } from './struct.service';

/**
 * A {@link Struct} whose fields all overlap at offset 0.
 *
 * @template T - Shape of the object this union represents.
 *
 * @remarks
 * Every field starts at offset 0, so the layout size equals the widest field rather
 * than the sum of all fields. Writing one field overwrites the bytes shared with the
 * others; reading decodes each field from the same overlapping region.
 *
 * @example
 * ```ts
 * const u = new Union<{ byte: number; word: number }>({ byte: 'u8', word: 'u32le' });
 * u.size; // 4
 * ```
 *
 * @see Struct
 * @since 3.0.0
 */

export class Union<T extends object = object> extends Struct<T> {
    /**
     * Creates a union from a field schema.
     *
     * @param schema - Field definitions keyed by name.
     * @param options - Heap, pointer-size, and inheritance options.
     *
     * @see Struct
     * @see StructOptionsInterface
     *
     * @since 3.0.0
     */

    constructor(schema: SchemaType, options: StructOptionsInterface = {}) {
        super(schema, options);
    }

    /**
     * Marks this layout as a union so fields overlap at offset 0.
     *
     * @returns Always `true`.
     *
     * @since 3.0.0
     */

    protected override get union(): boolean {
        return true;
    }
}
