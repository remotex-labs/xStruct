/**
 * Import will remove at compile time
 */

import type { StructSchemaInterface } from '@services/interfaces/struct-service.interface';
import type { CompiledMemberInterface, UnionDescriptorInterface } from '@services/interfaces/union-service.interface';

/**
 * Imports
 */

import { Struct } from '@services/struct.service';

/**
 * Matches fixed-size string shorthands of the form `type(N)`.
 *
 * @remarks
 * Accepted prefixes are `string`, `utf8`, and `ascii` (case-insensitive),
 * followed by a parenthesized positive integer — e.g. `string(10)`, `utf8(4)`.
 * Any shorthand that does **not** match this pattern is treated as dynamic and
 * rejected by {@link Union.validateSchema}.
 *
 * @see DYNAMIC_STRING_BASES
 * @since 2.1.0
 */

const FIXED_STRING_RE = /^(?:string|utf8|ascii)\(\d+\)$/i;

/**
 * The set of string-type prefixes that default to a dynamic (length-prefixed) encoding.
 *
 * @remarks
 * When a schema field is a bare string shorthand whose leading token matches one
 * of these values and it does **not** satisfy {@link FIXED_STRING_RE}, it is
 * considered dynamic. Dynamic members are rejected at {@link Union} construction
 * time because writing them resizes the buffer and would corrupt all sibling members.
 *
 * @see FIXED_STRING_RE
 * @since 2.1.0
 */

const DYNAMIC_STRING_BASES = new Set([ 'string', 'utf8', 'ascii' ]);

/**
 * A brand symbol used to identify {@link UnionDescriptorInterface} values at runtime.
 *
 * @remarks
 * Stamped onto every `UnionDescriptorInterface` object so that
 * {@link Union} can distinguish union descriptors from plain field
 * descriptors without relying on class identity checks.
 *
 * @since 2.1.0
 */

export const UNION_BRAND: unique symbol = Symbol('union');

/**
 * A union — all members occupy the same memory region starting at offset 0.
 *
 * @template T - Shape of the plain object this union reads and writes.
 *
 * @remarks
 * `size` is equal to the size of the widest member. Every member is compiled
 * into an isolated {@link Struct} at construction time so that `toObject` and
 * `toBuffer` never perform runtime shape-detection.
 *
 * Extends {@link Struct} so a `Union` instance can be nested directly inside
 * any `Struct` schema without requiring changes to `struct.service`.
 *
 * **Write semantics** — only the first member whose value is not `undefined`
 * is written. Declaration order determines write priority.
 *
 * **Read semantics** — every member is decoded independently of offset 0.
 *
 * **Allowed member kinds**
 *
 * | Member kind                              | Allowed |
 * |------------------------------------------|---------|
 * | Primitive / array / bitfield             | ✅      |
 * | Nested `Struct` / `Union`                | ✅      |
 * | Fixed-size string (`{ size: N }`)        | ✅      |
 * | Fixed-size string shorthand (`type(N)`)  | ✅      |
 * | Length-prefixed string                   | ❌      |
 * | Null-terminated string                   | ❌      |
 * | Bare `'string'` / `'utf8'` / `'ascii'`   | ❌      |
 *
 * @example
 * ```ts
 * // Pattern 1 — flat primitives
 * const u = new Union({ int: 'UInt32LE', float: 'FloatLE' });
 * u.toBuffer({ float: 5.0 });
 * u.toObject(buf); // { int: 1084227584, float: 5.0 }
 * ```
 *
 * @example
 * ```ts
 * // Pattern 2 — nested Struct members
 * const a = new Struct({ x: 'UInt32LE', y: 'UInt32LE' });
 * const b = new Struct({ x: 'UInt32LE', y: 'UInt32LE', z: 'UInt32LE' });
 * const u = new Union({ a, b });
 * u.toBuffer({ a: { x: 1, y: 2 } });
 * u.toObject(buf); // { a: { x, y }, b: { x, y, z } }
 * ```
 *
 * @example
 * ```ts
 * // Pattern 3 — Union nested inside Struct
 * const u = new Union({ int: 'UInt32LE', float: 'FloatLE' });
 * const s = new Struct({ data: u });
 * s.toBuffer({ data: { float: 5.0 } });
 * s.toObject(buf); // { data: { int: 1084227584, float: 5.0 } }
 * ```
 *
 * @see Struct
 * @since 2.1.0
 */

export class Union<T extends object = object> extends Struct<T> {
    private readonly members: ReadonlyArray<CompiledMemberInterface>;

    /**
     * Compiles a union schema and allocates the backing size from the widest member.
     *
     * @param schema - Field definitions in the same format accepted by `new Struct(schema)`.
     *
     * @throws `Error` - When any member uses a dynamic string type.
     *
     * @remarks
     * Each member is compiled into a single-field {@link Struct} at offset 0.
     * `super()` receives a `UInt8` array of `maxSize` bytes so that {@link Struct}
     * allocates the correct buffer size without any union-specific knowledge.
     *
     * @see validateSchema
     * @since 2.1.0
     */

    constructor(schema: StructSchemaInterface) {
        Union.validateSchema(schema);

        let maxSize = 0;
        const compiledMembers: Array<CompiledMemberInterface> = [];

        for (const [ name, field ] of Object.entries(schema)) {
            const isStructMember = field instanceof Struct;
            const struct = isStructMember
                ? (field as Struct<Record<string, unknown>>)
                : new Struct<Record<string, unknown>>({ [name]: field } as StructSchemaInterface);

            compiledMembers.push({ name, struct, isStructMember });
            if (struct.size > maxSize) maxSize = struct.size;
        }

        super(maxSize > 0 ? { __pad__: { type: 'UInt8', arraySize: maxSize } } : {});
        this.members = compiledMembers;
    }

    /**
     * Decodes every member independently of the same bytes at offset 0.
     *
     * @param buffer - Source buffer; must be at least `this.size` bytes-long.
     * @param getDynamicOffset - Optional callback invoked with `this.size` once all
     * members have been decoded. Matches the signature expected by a parent {@link Struct}
     * when this union is used as a nested field.
     *
     * @returns A fully decoded object containing every member keyed by name.
     *
     * @throws `TypeError` - When `buffer` is not a `Buffer` instance.
     * @throws `RangeError` - When `buffer.length` is less than `this.size`.
     *
     * @remarks
     * Each member's compiled {@link Struct} reads from `buffer.subarray(0, struct.size)`,
     * so all members always start at the same origin regardless of their individual sizes.
     *
     * @since 2.1.0
     */

    override toObject(buffer: Buffer, getDynamicOffset?: (offset: number) => void): Required<T> {
        if (!Buffer.isBuffer(buffer))
            throw new TypeError(`Union.toObject: expected Buffer, got ${ typeof buffer }`);

        if (buffer.length < this.size)
            throw new RangeError(`Union.toObject: buffer too small (${ buffer.length } < ${ this.size })`);

        const result: Record<string, unknown> = {};

        for (const { name, struct, isStructMember } of this.members) {
            const decoded = struct.toObject(buffer.subarray(0, struct.size));
            result[name] = isStructMember ? decoded : decoded[name];
        }

        getDynamicOffset?.(this.size);

        return result as Required<T>;
    }

    /**
     * Writes the first member with a non-`undefined` value into a zeroed buffer.
     *
     * @param data - Partial object; only the first defined field is serialized.
     * @returns A `Buffer` of exactly `this.size` bytes.
     *
     * @throws `TypeError` - When `data` is not a plain object.
     *
     * @remarks
     * Members are iterated in declaration order. The first member whose key is
     * present and not `undefined` in `data` is serialized; all remaining members
     * are skipped. The returned buffer is always exactly `this.size` bytes, with
     * any bytes not written by the chosen member left as `0x00`.
     *
     * @since 2.1.0
     */

    override toBuffer(data: Partial<T>): Buffer {
        if (!data || typeof data !== 'object')
            throw new TypeError(`Union.toBuffer: expected object, got ${ typeof data }`);

        const buffer = Buffer.alloc(this.size);
        const input = data as Record<string, unknown>;

        for (const { name, struct, isStructMember } of this.members) {
            const value = input[name];
            if (value === undefined) continue;

            const payload = isStructMember ? (value as Record<string, unknown>) : { [name]: value };
            struct.toBuffer(payload).copy(buffer);
            break;
        }

        return buffer;
    }

    /**
     * Returns `true` when `value` carries the {@link UNION_BRAND} symbol.
     *
     * @param value - The value to test.
     * @returns A type predicate narrowing `value` to {@link UnionDescriptorInterface}.
     *
     * @since 2.1.0
     */

    private static isUnionDescriptor(value: unknown): value is UnionDescriptorInterface {
        return typeof value === 'object' && value !== null && UNION_BRAND in value;
    }

    /**
     * Validates that no schema member uses a dynamic string type.
     *
     * @param schema - The raw schema passed to the {@link Union} constructor.
     *
     * @throws `Error` - When a member uses bare dynamic string shorthand.
     * @throws `Error` - When a member descriptor has `nullTerminated: true`.
     * @throws `Error` - When a member descriptor has a `lengthType` set.
     *
     * @remarks
     * Dynamic strings resize the buffer on writing and would corrupt every sibling
     * member in the union. Validation runs once at construction time so that
     * `toObject` and `toBuffer` can safely assume a fully static layout.
     *
     * Bare string shorthands (`'string'`, `'utf8'`, `'ascii'`) default to a
     * length-prefixed encoding and are therefore rejected. Fixed-size variants
     * such as `'string(N)'` satisfy {@link FIXED_STRING_RE} and are allowed.
     *
     * @see FIXED_STRING_RE
     * @see DYNAMIC_STRING_BASES
     * @since 2.0.0
     */


    private static validateSchema(schema: StructSchemaInterface): void {
        for (const [ name, field ] of Object.entries(schema)) {
            if (field instanceof Struct || this.isUnionDescriptor(field)) continue;

            if (typeof field === 'string') {
                const base = field.split(/[([:/]/)[0].toLowerCase();
                if (DYNAMIC_STRING_BASES.has(base) && !FIXED_STRING_RE.test(field)) {
                    throw new Error(
                        `Union member "${ name }": dynamic string type "${ field }" is not allowed. ` +
                        `Use a fixed-size string like "{ type: 'string', size: N }" or "${ base }(N)".`
                    );
                }
                continue;
            }

            const f = field as unknown as Record<string, unknown>;
            if (f.nullTerminated) {
                throw new Error(`Union member "${ name }": null-terminated strings are not allowed`);
            }
            if (f.lengthType) {
                throw new Error(`Union member "${ name }": length-prefixed strings are not allowed`);
            }
        }
    }
}
