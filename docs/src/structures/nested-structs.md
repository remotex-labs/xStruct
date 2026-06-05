# Nested Structs

Compose layouts by using a `Struct` as a field of another. Embed an instance directly and the field decodes to the nested object.

## Embedding a struct

```ts
import { Struct } from '@remotex-labs/xstruct';

const Point = new Struct<{ x: number; y: number }>({ x: 'i32le', y: 'i32le' });

const Line = new Struct<{ from: { x: number; y: number }; to: { x: number; y: number } }>({
    from: Point,
    to: Point
});

Line.toObject(Line.toBuffer({ from: { x: 0, y: 0 }, to: { x: 10, y: 5 } }));
// { from: { x: 0, y: 0 }, to: { x: 10, y: 5 } }
```

Define each nested struct once and reuse it. The schema is compiled in the constructor, so a shared instance avoids re-parsing.

## Arrays and pointers of structs

A bare `Struct` value embeds a single struct. To repeat it as an array or place it behind a heap pointer, use the
**descriptor object** form instead of a bare instance: `{ kind: 0, type, shape }`. The `shape` array follows the
same right-to-left rules as every other field - a positive `N` is a fixed array dimension and a `0` is a pointer
indirection.

The `kind` field is the descriptor's type tag. Pass the number directly:

| `kind` | Descriptor |
|--------|------------|
| `0`    | Struct     |
| `1`    | String     |
| `2`    | Bitfield   |
| `3`    | Primitive  |

For a nested struct the tag is always `0`. (String, bitfield, and primitive fields are normally written as
expression strings such as `'utf8[16]'` or `'u8:4'`, so you rarely build those descriptor objects by hand.)

```ts
import { Struct } from '@remotex-labs/xstruct';

const Point = new Struct<{ x: number; y: number }>({ x: 'i32le', y: 'i32le' });
```

### A fixed array of structs

`shape: [N]` lays `N` copies inline on the stack, contributing `N * Point.size` bytes.

```ts
const Triangle = new Struct<{ points: { x: number; y: number }[] }>({
    points: { kind: 0, type: Point, shape: [ 3 ] } // 3 inline Points // [!code focus]
});

Triangle.size; // 24 (3 × 8)
Triangle.toObject(Triangle.toBuffer({ points: [ { x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 } ] })).points;
// [ { x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 } ]
```

### A pointer to a struct

`shape: [0]` stores one pointer on the stack and writes the struct to the heap, so the fixed `size` stays one
pointer wide regardless of the nested struct's size.

```ts
const Node = new Struct<{ value: { x: number; y: number } }>({
    value: { kind: 0, type: Point, shape: [ 0 ] } // pointer to a heap Point // [!code focus]
});

Node.size; // 4 (one pointer)
Node.toObject(Node.toBuffer({ value: { x: 7, y: 8 } })).value; // { x: 7, y: 8 }
```

A pointer can address a **list** of structs - pass an array and read it back. As with any pointer level, a
single-element list reads back as the lone element rather than a one-element array:

```ts
const Group = new Struct<{ members: { x: number; y: number }[] }>({
    members: { kind: 0, type: Point, shape: [ 0 ] } // pointer to a heap list of Points
});

Group.toObject(Group.toBuffer({ members: [ { x: 1, y: 2 }, { x: 3, y: 4 } ] })).members;
// [ { x: 1, y: 2 }, { x: 3, y: 4 } ]
```

### An array of pointers

`shape: [N, 0]` is `N` pointer slots, each addressing its own heap struct - useful when the elements vary in size
or are optional.

```ts
const Scene = new Struct<{ nodes: { x: number; y: number }[] }>({
    nodes: { kind: 0, type: Point, shape: [ 3, 0 ] } // 3 pointers, each to a Point // [!code focus]
});

Scene.size; // 12 (3 pointers)
```

See [Heap & Pointers](/guides/heap#lists-behind-a-pointer) for the list and single-element-collapse rules.

## Deep nesting

Structs nest to any depth, so you can compose small named pieces into larger ones.

```ts
const Header = new Struct({ magic: 'u32be', version: 'u16le' });
const Body = new Struct({ id: 'u32le', label: '*utf8' });

const Message = new Struct({ header: Header, body: Body });
```

## A shared heap

A nested struct does not start its own heap. Its pointer fields write into the enclosing struct's heap, so all variable-length data ends up in one contiguous region after the outer stack.

```ts
const Inner = new Struct<{ note: string }>({ note: '*utf8' });
const Outer = new Struct<{ id: number; inner: { note: string } }>({
    id: 'u32le',
    inner: Inner
});

const buf = Outer.toBuffer({ id: 1, inner: { note: 'on the shared heap' } });
Outer.toObject(buf); // { id: 1, inner: { note: 'on the shared heap' } }
```

## Pointer size when nested

By default a nested struct **inherits** its parent's context: it recompiles to the parent's pointer size and
writes into the parent's heap. This is the `inherit` option, which defaults to `true`.

```ts
const child = new Struct<{ name: string }>({ name: '*utf8' }, { pointerSize: 8 });
const host = new Struct<{ child: { name: string } }>({ child }, { pointerSize: 4 });
// when embedded in host, the child writes 4-byte pointers into host's heap
```

Set `inherit: false` on the child to keep it standalone: it retains its own `pointerSize` and still round-trips,
because each level decodes its own pointers.

```ts
const child = new Struct<{ name: string }>({ name: '*utf8' }, { pointerSize: 4, inherit: false });
const parent = new Struct<{ id: string; child: { name: string } }>(
    { id: '*utf8', child }, { pointerSize: 8 }
);

child.pointerSize; // 4, kept even when nested in an 8-byte-pointer parent
```

See [Heap & Pointers](/guides/heap#sharing-a-heap) and [A custom heap](/guides/heap#a-custom-heap).

## See also

- [Heap & Pointers](/guides/heap)
- [Unions](/structures/unions)
