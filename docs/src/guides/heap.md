# Heap & Pointers

A struct has a fixed `size`: the bytes every field occupies on the *stack*, laid out in declaration order.
Variable-length data does not fit there. xStruct stores it on a *heap* instead, and the stack holds only a small
*pointer* to it.

## The stack and the heap

- The **stack** is the fixed-size region described by `size`. Primitives, fixed arrays, fixed strings, and bitfields live here.
- The **heap** is a variable-size region that holds the payloads of pointer fields.
- A **pointer** field (`*`) reserves one `pointerSize`-byte slot on the stack and writes its real data to the heap.

When a top-level struct serializes, it appends the heap region directly after the stack:

```text
toBuffer() output
┌───────────────────────────┬──────────────────────────────┐
│  stack  (struct.size B)   │  heap  (variable length)      │
└───────────────────────────┴──────────────────────────────┘
        fixed fields                pointer payloads
```

So a buffer can be larger than `size`, and the extra bytes are the heap. `toObject` reads the stack first, then resolves each pointer against the trailing heap.

```ts
import { Struct } from '@remotex-labs/xstruct';

const s = new Struct<{ id: number; name: string }>({
    id: 'u32le',  // 4 stack bytes
    name: '*utf8' // 1 pointer slot on the stack, text on the heap
});

s.size; // 8  (4 for id + 4 for the pointer)

const buf = s.toBuffer({ id: 1, name: 'Ada Lovelace' });
buf.byteLength; // > 8: the trailing bytes are the heap

s.toObject(buf); // { id: 1, name: 'Ada Lovelace' }
```

A short value such as `'Ada'` can fit inline in the pointer's spare bits, adding no heap bytes; the buffer then
stays exactly `size` long. See [How payloads are encoded](#how-payloads-are-encoded).

## Declaring a pointer

Prefix any field expression with `*` to make it heap-backed. This works for every primitive - integers, floats
(`*f32le`), and strings alike.

| Expression      | Stack         | Heap                                         |
|-----------------|---------------|----------------------------------------------|
| `'utf8[16]'`    | 16 bytes      | none - fixed inline string                   |
| `'*utf8'`       | one pointer   | the string bytes, any length                 |
| `'*u32le'`      | one pointer   | a single `u32le`                             |
| `'*f32le'`      | one pointer   | a single `f32le`                             |
| `'*u32le[4]'`   | four pointers | each points at one heap `u32le`              |
| `'**utf8'`      | one pointer   | a heap list of strings                       |
| `'*(u32le[3])'` | one pointer   | a heap list of `u32le[3]` groups             |
| `'*(i8[5])[4]'` | four pointers | each points at a heap list of `i8[5]` groups |

Each `*` adds one level of indirection. A `[N]` after a pointer expression repeats the *pointer* on the stack,
so `'*u32le[4]'` is four pointer slots, each addressing its own heap value, not one pointer to four values.
See [Strings](/types/strings) and [Arrays](/structures/arrays) for worked examples.

### Lists behind a pointer

When a pointer addresses more than a single scalar - a double pointer (`**T`) or a grouped pointer (`*(T[N])`) -
its heap payload is a **variable-length list**, so you pass the values inside an array and read the same array
back.

```ts
const rows = new Struct<{ data: number[][] }>({ data: '*(u32le[3])' }); // pointer to a list of u32le[3] rows
rows.toObject(rows.toBuffer({ data: [ [ 1, 2, 3 ], [ 4, 5, 6 ] ] })).data;
// [ [ 1, 2, 3 ], [ 4, 5, 6 ] ]

const words = new Struct<{ list: string[] }>({ list: '**utf8' }); // pointer to a list of strings
words.toObject(words.toBuffer({ list: [ 'hello', 'world' ] })).list;
// [ 'hello', 'world' ]
```

`*(T[N])` groups a fixed inner dimension `N` behind the pointer; `*(T[N])[M]` puts `M` such pointers on the stack,
each addressing its own heap list.

::: warning Single-element lists collapse
A pointer whose list holds exactly one element reads back as that element, not a one-element array - the same
collapse all pointer levels apply. So `'*(u32le[3])'` written with `[ [ 1, 2, 3 ] ]` decodes to `[ 1, 2, 3 ]`,
and `'**utf8'` written with `[ 'hello' ]` decodes to `'hello'`. Pass two or more elements when you need the outer
array preserved on read.
:::

## Pointer size

`pointerSize` is the width of every pointer slot, in bytes. It defaults to `4` and may be `1`, `2`, `4`, `6`, or `8`. An unsupported value falls back to `4`.

```ts
const wide = new Struct<{ name: string }>({ name: '*utf8' }, { pointerSize: 8 });
wide.pointerSize; // 8
wide.size;        // 8: one 8-byte pointer
```

The pointer size bounds how much data the heap can address. Pick the smallest size that fits your largest
expected payload:

| `pointerSize` | Pointer slot | Max heap offset (approx.) |
|---------------|--------------|---------------------------|
| `1`           | 1 byte       | 63 bytes                  |
| `2`           | 2 bytes      | 16 KiB                    |
| `4` (default) | 4 bytes      | 1 GiB                     |
| `6`           | 6 bytes      | 64 TiB                    |
| `8`           | 8 bytes      | effectively unbounded     |

Writing a payload whose heap offset exceeds the addressable range for the chosen pointer size throws a range
error. If you hit that, use a wider `pointerSize`.

## How payloads are encoded

Each pointer value is self-describing. xStruct picks one of three encodings automatically based on the payload size and its position in the heap; you never choose one by hand.

| Encoding   | When                                              | Cost                                  |
|------------|---------------------------------------------------|---------------------------------------|
| **Inline** | Payload fits in the spare bits of the pointer     | No heap bytes at all                  |
| **Packed** | Payload ≤ 255 bytes and heap offset ≤ 16 MiB      | Payload only, no length header        |
| **Far**    | Anything larger                                   | A short varint length header + payload|

Inline capacity grows with the pointer size, because a wider pointer has more spare bits:

| `pointerSize` | Inline capacity |
|---------------|-----------------|
| `1`           | 0 bytes         |
| `2`           | 1 byte          |
| `4`           | 3 bytes         |
| `6`           | 5 bytes         |
| `8`           | 7 bytes         |

A short string such as `'Ada'` may be stored entirely inside the pointer, costing zero heap bytes. This is an
internal optimization; the decoded value is identical regardless of encoding.

## Sharing a heap

When a struct is nested inside another, the child does not start its own heap. It writes into the parent's heap so
that all pointer payloads land in one contiguous region. xStruct threads the parent heap through automatically;
the `parentHeap` parameter on `toBuffer` / `toObject` exists for this and is not normally passed by hand.

```ts
const inner = new Struct<{ note: string }>({ note: '*utf8' });
const outer = new Struct<{ id: number; inner: { note: string } }>({
    id: 'u32le',
    inner   // shares the outer heap
});

const buf = outer.toBuffer({ id: 1, inner: { note: 'shared heap' } });
outer.toObject(buf); // { id: 1, inner: { note: 'shared heap' } }
```

By default a nested struct **inherits** its parent's context: it recompiles to the parent's pointer size and
writes into the parent's heap. This is controlled by the `inherit` option, which defaults to `true`.

```ts
const child = new Struct<{ name: string }>({ name: '*utf8' }, { pointerSize: 8 });
const parent = new Struct<{ child: { name: string } }>({ child }, { pointerSize: 4 });
// inherit is true by default, so the child writes 4-byte pointers into the parent's heap
```

Set `inherit: false` to keep the struct standalone when nested: it retains its own `pointerSize` and does not
adopt the parent's heap.

```ts
const child = new Struct<{ name: string }>({ name: '*utf8' }, { pointerSize: 4, inherit: false });
const parent = new Struct<{ id: string; child: { name: string } }>(
    { id: '*utf8', child }, { pointerSize: 8 }
);
// the child keeps 4-byte pointers even though the parent uses 8-byte pointers
```

## A custom heap

Pass a `heap` in the options to write pointer payloads into a heap you control instead of the per-call one
xStruct creates. A custom heap takes effect when `inherit` is `false`, so the struct uses it even when nested.
This lets several structs pool their variable-length data into one region.

A heap is any object with `read` and `write` methods (the `HeapRuntimeInterface`). The library exposes
`heapRead` / `heapWrite`, which you bind to a heap context - a `{ top, buffer }` pair holding the current write
offset and the backing buffer.

```ts
import { Struct } from '@remotex-labs/xstruct';
import { heapRead, heapWrite } from '@remotex-labs/xstruct';

const ctx = { top: 0, buffer: Buffer.allocUnsafe(0) };
const heap = { read: heapRead.bind(ctx), write: heapWrite.bind(ctx) };

const a = new Struct<{ v: string }>({ v: '*utf8' }, { heap, inherit: false });
const b = new Struct<{ v: string }>({ v: '*ascii' }, { heap, inherit: false });

const bufA = a.toBuffer({ v: 'alpha' }); // 'alpha' written into ctx.buffer
const bufB = b.toBuffer({ v: 'beta' });  // 'beta' appended to the same ctx.buffer

a.toObject(bufA).v; // 'alpha'
b.toObject(bufB).v; // 'beta'
```

When a struct uses a custom heap, `toBuffer` returns **only the fixed stack** - the heap is not appended, because
you own it. Keep the same heap (the same `ctx`) for the matching `toObject`, and persist `ctx.buffer` alongside
the stack buffers so the pointers can be resolved later.

If `inherit` is left at its default `true`, a nested struct ignores its own `heap` and shares the parent's
instead; the custom heap only wins when inheritance is off.

## Pointers in unions

Because a pointer is a fixed-size slot, it overlaps cleanly with other union members. Unions therefore accept
pointer members, and the variable-length payload lives on the shared heap rather than in the overlapping stack
bytes. See [Unions](/structures/unions).

## See also

- [Strings](/types/strings)
- [Arrays](/structures/arrays)
- [Nested Structs](/structures/nested-structs)
- [Unions](/structures/unions)
