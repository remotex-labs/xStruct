# Unions

A union places every member at offset 0, so the members overlap and the union's size equals the widest member. Unions are used for type punning and tagged variants.

::: warning Fixed-size members only
A union **does not support dynamic strings.** Length-prefixed, null-terminated, and bare
`'utf8'` / `'ascii'` / `'string'` members are **rejected at construction**, because writing them resizes the
buffer and would corrupt every overlapping member. Use a fixed-size string instead, such as `'utf8(N)'` or
`{ type: 'utf8', size: N }`.
:::

## Basics

```ts
import { Union } from '@remotex-labs/xstruct';

const value = new Union<{ int: number; float: number }>({
    int: 'UInt32LE',
    float: 'FloatLE'
});

value.size; // 4, the widest member
```

`Union` extends `Struct`, so it shares the `size`, `toBuffer`, and `toObject` API and can be nested inside any struct schema.

## Write semantics

Only the first member with a defined value is written; declaration order sets the priority. The rest of the buffer is zero-filled.

```ts
const buffer = value.toBuffer({ float: 5.0 }); // [!code highlight]
```

Provide exactly one member per `toBuffer` call, and list members in priority order so the intended one wins.

## Read semantics

Every member is decoded from the same bytes, which is the type punning a union provides.

```ts
const decoded = value.toObject(buffer);
decoded.float; // 5.0
decoded.int;   // 1084227584, the same bytes read as a UInt32LE
```

## Tagged variants

Pair a union with a discriminator field in an enclosing struct, and read the tag first.

```ts
import { Struct, Union } from '@remotex-labs/xstruct';

const Packet = new Struct<{ kind: number; payload: { int: number; float: number } }>({
    kind: 'UInt8',
    payload: new Union({ int: 'UInt32LE', float: 'FloatLE' }) // [!code focus]
});
```

## Allowed members

| Member                                           | Allowed |
|--------------------------------------------------|---------|
| Primitive, array, bitfield                       | Yes     |
| Nested struct or union                           | Yes     |
| Fixed-size string, `{ size: N }` or `utf8(N)`    | Yes     |
| Length-prefixed, null-terminated, or bare string | No      |

Dynamic strings are rejected when the union is constructed:

```ts
new Union({ name: 'utf8' });                     // [!code error]
new Union({ name: 'utf8(16)' });                 // ok, fixed size
new Union({ name: { type: 'utf8', size: 16 } }); // ok, fixed size
```

::: details Why dynamic strings are not allowed
A length-prefixed or null-terminated string has a size that depends on its content. Writing one would grow the
buffer past the union's fixed `size` and overwrite the bytes shared with every other member. Fixed-size strings
have a constant width, so they overlap safely.
:::

## See also

- [Nested Structs](/structures/nested-structs)
- [Strings](/types/strings)
