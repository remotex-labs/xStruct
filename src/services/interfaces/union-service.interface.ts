/**
 * Import will remove at compile time
 */

import type { Struct } from '@services/struct.service';
import type { UNION_BRAND } from '@services/union.service';
import type { StructSchemaInterface } from '@services/interfaces/struct-service.interface';

/**
 * Compiled metadata for a single {@link Union} member.
 *
 * @remarks
 * Produced once at construction time for every field in the union schema.
 * Captures whether the original field was a {@link Struct} instance (`isStructMember`)
 * so that `toObject` and `toBuffer` can dispatch correctly without inspecting
 * the field shape at runtime.
 *
 * @see Union
 * @since 2.1.0
 */

export interface CompiledMemberInterface {
    /**
     * Field name as declared in the union schema.
     *
     * @since 2.1.0
     */

    readonly name: string;

    /**
     * Single-field {@link Struct} used to encode and decode this member.
     *
     * @remarks
     * When `isStructMember` is `true` this is the original {@link Struct} instance
     * passed in the schema. When `false` it is a wrapper `Struct` created around
     * the primitive or descriptor field, keyed by {@link name}.
     *
     * @since 2.1.0
     */

    readonly struct: Struct<Record<string, unknown>>;

    /**
     * Whether the original schema field was a {@link Struct} or {@link Union} instance.
     *
     * @remarks
     * When `true`, `toObject` returns the decoded object directly and `toBuffer`
     * passes the value straight through to {@link struct}.
     * When `false`, `toObject` extracts `decoded[name]` and `toBuffer` wraps the
     * value as `{ [name]: value }` before delegating to {@link struct}.
     *
     * @since 2.1.0
     */

    readonly isStructMember: boolean;
}

/**
 * Marks an object as a union descriptor inside a {@link Struct} schema.
 *
 * @remarks
 * The presence of the {@link UNION_BRAND} symbol key is the sole runtime signal
 * that distinguishes a union descriptor from any other field descriptor.
 * Checked by `Union.isUnionDescriptor` during schema validation so that nested
 * union fields are allowed through without triggering the dynamic-string guard.
 *
 * @see Union
 * @see UNION_BRAND
 * @since 2.1.0
 */

export interface UnionDescriptorInterface {
    /**
     * Brand key that identifies this object as a union descriptor at runtime.
     *
     * @remarks
     * Always `true`. Its presence — not its value — is what `UNION_BRAND in value`
     * tests for in `Union.isUnionDescriptor`.
     *
     * @since 2.1.0
     */

    readonly [UNION_BRAND]: true;

    /**
     * Schema definition forwarded to the {@link Union} constructor.
     *
     * @since 2.1.0
     */

    readonly schema: StructSchemaInterface;
}
