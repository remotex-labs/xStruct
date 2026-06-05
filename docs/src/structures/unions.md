# Unions

A union places every member at offset 0, so the members overlap and the union's size equals the widest member. Unions are used for type punning and tagged variants.

## Basics

```ts
import { Union } from '@remotex-labs/xstruct';

const value = new Union<{ int: number; float: number }>({
    int: 'u32le',
    float: 'f32le'
});

value.size; // 4, the widest member
```

`Union` extends `Struct`, so it shares the `size`, `pointerSize`, `toBuffer`, and `toObject` API and can be
nested inside any struct schema.

## Write semantics

Only the members you provide are written, in declaration order, into the same overlapping bytes. Provide exactly
one member per `toBuffer` call so the result is unambiguous; the rest of the buffer is zero-filled.

```ts
const buffer = value.toBuffer({ float: 5.0 }); // [!code highlight]
```

## Read semantics

Every member is decoded from the same bytes, which is the type punning a union provides.

```ts
const decoded = value.toObject(buffer);
decoded.float; // 5.0
decoded.int;   // 1084227584, the same bytes read as a u32le
```

## Heap members

A pointer is a fixed-size slot, so it overlaps cleanly with the other members. Unions therefore accept pointer
(heap-backed) members such as `'*utf8'`. The pointer occupies the overlapping stack bytes, and its variable-length
payload lives on the heap, outside the union's fixed `size`.

```ts
const cell = new Union<{ word?: number; text?: string }>({
    word: 'u32le',
    text: '*utf8'   // a heap pointer member // [!code focus]
});

cell.size; // 4: one u32le or one pointer, whichever is wider

const buf = cell.toBuffer({ text: 'a variable-length heap string' });
cell.toObject(buf).text; // 'a variable-length heap string'
```

Read back the member you wrote. Reading a *different* member reinterprets the same overlapping bytes - meaningful for fixed numeric punning, but not across members of different kinds.

::: tip
This is new in v3. Earlier versions rejected variable-length strings in a union because they grew the buffer
inline. Now that variable-length data lives on the heap behind a fixed-size pointer, it overlaps safely.
:::

## Tagged variants

Pair a union with a discriminator field in an enclosing struct, and read the tag first to know which member is valid.

```ts
import { Struct, Union } from '@remotex-labs/xstruct';

const payload = new Union<{ raw?: number; text?: string }>({
    raw: 'u32le',
    text: '*utf8'
});

const Packet = new Struct<{ kind: number; payload: { raw?: number; text?: string } }>({
    kind: 'u8',
    payload   // [!code focus]
});

const buf = Packet.toBuffer({ kind: 1, payload: { text: 'variable-length' } });
Packet.toObject(buf); // { kind: 1, payload: { ... } }
```

A union nested in a struct shares the struct's heap, so the pointer payloads of its members are appended to the same region as the rest of the struct's heap data. See [Heap & Pointers](/guides/heap).

## Allowed members

| Member                                | Allowed |
|---------------------------------------|---------|
| Primitive, array, bitfield            | Yes     |
| Fixed-size string (`utf8[N]`)         | Yes     |
| Pointer / heap-backed (`*utf8`, ...)  | Yes     |
| Nested struct or union                | Yes     |

## See also

- [Heap & Pointers](/guides/heap)
- [Nested Structs](/structures/nested-structs)
- [Strings](/types/strings)
