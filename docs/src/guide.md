# Getting Started

xStruct turns a schema, a plain object that describes a binary layout, into a reusable `Struct`. You then convert between JavaScript objects and `Buffer` with `toBuffer` and `toObject`.

## Installation

::: code-group

```bash [npm]
npm install @remotex-labs/xstruct
```

```bash [pnpm]
pnpm add @remotex-labs/xstruct
```

```bash [yarn]
yarn add @remotex-labs/xstruct
```

:::

xStruct requires Node.js 22 or later and has no runtime dependencies.

## Quick start

```ts
import { Struct } from '@remotex-labs/xstruct';

interface Header {
    magic: number;
    version: number;
    name: string;
}

const header = new Struct<Header>({
    magic: 'u32be',   // unsigned 32-bit, big-endian      // [!code focus]
    version: 'u16le', // unsigned 16-bit, little-endian   // [!code focus]
    name: '*utf8'     // pointer to a heap UTF-8 string    // [!code focus]
});

const buffer = header.toBuffer({ magic: 0xCAFEBABE, version: 1, name: 'demo' });
const data = header.toObject(buffer);
// { magic: 3405691582, version: 1, name: 'demo' }
```

Pass an interface as the type parameter, as in `new Struct<Header>(...)`. TypeScript then checks the objects you pass to `toBuffer` and the shape returned by `toObject`.

## Field strings

Every field is described by a short expression string. The grammar is the same for every type.

| Form          | Example      | Meaning                                |
|---------------|--------------|----------------------------------------|
| Primitive     | `'u32le'`    | A single integer or float              |
| String        | `'utf8[16]'` | A fixed-size string of N bytes         |
| Array         | `'u8[4]'`    | A fixed array, repeats as `'u8[4][2]'` |
| Bitfield      | `'u8:4'`     | A sub-byte field in a container        |
| Pointer       | `'*utf8'`    | A heap pointer to variable-length data |
| Nested struct | a `Struct`   | An embedded struct or union            |

`*` introduces a pointer: the field stores only a small address on the stack and its payload is written to a heap
region appended after the struct. This is how a single struct can hold variable-length data while keeping a fixed
`size`. See [Heap & Pointers](/guides/heap).

Fields are laid out in declaration order with no alignment padding.

## The `Struct` class

### `new Struct<T>(definition, options?)`

Compiles the schema once and exposes:

| Member                                       | Description                                              |
|----------------------------------------------|----------------------------------------------------------|
| `size: number`                               | Fixed (stack) size of the layout in bytes.               |
| `pointerSize: number`                        | Pointer width used for heap-backed fields.               |
| `toBuffer(data: T, parentHeap?): Buffer`     | Serializes an object into a buffer.                      |
| `toObject(buffer, parentHeap?): Required<T>` | Parses a buffer into an object.                          |

`size` counts only the fixed part of the layout. Pointer fields contribute one `pointerSize`-byte slot to `size`;
the bytes they reference live in the heap region that `toBuffer` appends after the struct.

```ts
const point = new Struct<{ x: number; y: number }>({ x: 'i32le', y: 'i32le' });
point.size; // 8

const buf = point.toBuffer({ x: 1, y: 2 });
point.toObject(buf); // { x: 1, y: 2 }
```

`parentHeap` is used internally when a struct is nested inside another; you rarely pass it yourself.
See [Heap & Pointers](/guides/heap#sharing-a-heap).

### `new Struct<T>(definition, options)`

| Option        | Default | Description                                                                                    |
|---------------|---------|------------------------------------------------------------------------------------------------|
| `pointerSize` | `4`     | Pointer width in bytes: `1`, `2`, `4`, `6`, or `8`. Bounds the heap size.                      |
| `inherit`     | `true`  | When nested, adopt the parent's pointer size and heap. `false` stays standalone.               |
| `heap`        | -       | A heap to write into instead of a per-call one. See [custom heap](/guides/heap#a-custom-heap). |

```ts
const wide = new Struct<{ name: string }>({ name: '*utf8' }, { pointerSize: 8 });
wide.pointerSize; // 8
```

## The `Union` class

A `Union` lays every member at offset 0 and sizes itself to the widest member. It extends `Struct`, so it shares
the same API and can be nested in any schema. Unions support pointer (heap-backed) members, because a pointer is a
fixed-size slot. See [Unions](/structures/unions).

```ts
import { Union } from '@remotex-labs/xstruct';

const value = new Union<{ word: number; text: string }>({
    word: 'u32le',
    text: '*utf8'   // a heap pointer is a valid union member // [!code focus]
});

value.size; // 4, the widest member
```

## Types and structures

- [Integers](/types/integers): `u8` through `i64be`, with 64-bit values as `bigint`.
- [Floats](/types/floats): `f32le/be` and `f64le/be`.
- [Strings](/types/strings): `utf8`, `ascii`, `latin1`, `utf16le`, fixed-size or heap-backed.
- [Bitfields](/types/bitfields): sub-byte integers packed into a shared container.
- [Arrays](/structures/arrays): fixed-length sequences of any field.
- [Nested Structs](/structures/nested-structs): compose structs to any depth.
- [Unions](/structures/unions): overlapping members at offset 0.

## Guides

- [Heap & Pointers](/guides/heap): how variable-length data is stored and addressed.
- [Endianness](/guides/endianness): byte order, declared in every type name.

## Error handling

```ts
const s = new Struct({ id: 'u32le' });

s.toObject(Buffer.alloc(2));  // throws: buffer smaller than the struct size [!code error]
s.toBuffer(null as never);    // throws: data is not an object [!code error]
new Struct({ x: 'u9le' });    // throws at construction: unknown type [!code error]
```

Invalid schemas throw when the `Struct` is constructed, so mistakes surface before the first serialize.
