# xStruct

[![Documentation](https://img.shields.io/badge/Documentation-orange?logo=typescript&logoColor=f5f5f5)](https://remotex-labs.github.io/xStruct/)
[![npm version](https://img.shields.io/npm/v/@remotex-labs/xstruct.svg)](https://www.npmjs.com/package/@remotex-labs/xstruct)
[![downloads](https://img.shields.io/npm/dm/@remotex-labs/xstruct?label=npm%20downloads)](https://www.npmjs.com/package/@remotex-labs/xstruct)
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL_2.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)
[![Test CI](https://github.com/remotex-labs/xStruct/actions/workflows/ci.yml/badge.svg)](https://github.com/remotex-labs/xStruct/actions/workflows/ci.yml)
[![Discord](https://img.shields.io/discord/1364348850696884234?logo=Discord&label=Discord)](https://discord.gg/psV9grS9th)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/remotex-labs/xStruct)

A TypeScript library for defining, serializing, and deserializing binary data structures. Describe a layout once
with a plain object and short field strings such as `u32le`, `f64be`, or `utf8[32]`, then convert between
JavaScript objects and `Buffer` with full type safety.

It is designed for binary file formats, network protocols, and low-level data manipulation, with support for
primitive types, bitfields, fixed and pointer arrays, nested structs, unions, and variable-length data stored on
a heap.

## Key Features

- **Declarative schemas**: describe a layout with a plain object and concise field strings.
- **Type-safe**: parameterize a struct with an interface and let TypeScript check what you encode and decode.
- **Rich numeric types**: 8/16/32/64-bit integers (64-bit as `bigint`) and 32/64-bit floats, each with explicit endianness.
- **Strings and arrays**: fixed-size strings, multi-dimensional arrays, and variable-length text on the heap.
- **Heap pointers**: variable-length fields live behind a pointer, with a configurable 1, 2, 4, 6, or 8-byte pointer size.
- **Bitfields and unions**: pack sub-byte fields into a shared container and overlap members at offset 0.

## Installation

```bash
npm install @remotex-labs/xstruct
# or
pnpm add @remotex-labs/xstruct
# or
yarn add @remotex-labs/xstruct
```

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
    magic: 'u32be',   // unsigned 32-bit, big-endian
    version: 'u16le', // unsigned 16-bit, little-endian
    name: '*utf8'     // pointer to a heap UTF-8 string
});

const buffer = header.toBuffer({ magic: 0xCAFEBABE, version: 1, name: 'demo' });
const data = header.toObject(buffer);
// { magic: 3405691582, version: 1, name: 'demo' }
```

Pass an interface as the type parameter (`new Struct<Header>(...)`) and TypeScript checks the objects you pass to
`toBuffer` and the shape returned by `toObject`.

## Field strings

Every field is described by a short expression string. Fields are laid out in declaration order with no alignment
padding.

| Form          | Example      | Meaning                                |
|---------------|--------------|----------------------------------------|
| Primitive     | `'u32le'`    | A single integer or float              |
| String        | `'utf8[16]'` | A fixed-size string of N bytes         |
| Array         | `'u8[4]'`    | A fixed array, repeats as `'u8[4][2]'` |
| Bitfield      | `'u8:4'`     | A sub-byte field in a container        |
| Pointer       | `'*utf8'`    | A heap pointer to variable-length data |
| Nested struct | a `Struct`   | An embedded struct or union            |

## Core types

### Integers

A name is `u`/`i` (unsigned/signed) + width + endianness (`le`/`be`, omitted for 8-bit).

| Type             | Bytes | JS type  | Range                     |
|------------------|-------|----------|---------------------------|
| `u8` / `i8`      | 1     | `number` | 0..255 / -128..127        |
| `u16le`, `u16be` | 2     | `number` | 0..65535                  |
| `i16le`, `i16be` | 2     | `number` | -32768..32767             |
| `u32le`, `u32be` | 4     | `number` | 0..4294967295             |
| `i32le`, `i32be` | 4     | `number` | -2147483648..2147483647   |
| `u64le`, `u64be` | 8     | `bigint` | 0..2^64-1                 |
| `i64le`, `i64be` | 8     | `bigint` | -2^63..2^63-1             |

64-bit fields read and write `bigint`; passing a `number` throws at encode time. Out-of-range values are not
clamped and throw from the buffer layer.

### Floats

`f32le` / `f32be` (32-bit) and `f64le` / `f64be` (64-bit). All read and write `number`.

### Strings

Encodings: `utf8`, `ascii`, `latin1`, `utf16le`.

```ts
new Struct({
    code: 'ascii[4]', // fixed 4 bytes, inline on the stack (zero-padded / truncated)
    name: '*utf8'     // variable-length, stored on the heap behind a pointer
});
```

A fixed `encoding[N]` size is a number of **bytes**, not characters. Variable-length (`*`) strings have no fixed
size and never truncate; their payload is sized by its encoded byte length, so multi-byte UTF-8/UTF-16 round-trips
intact.

### Bitfields

`type:bits` packs a sub-byte integer into the named container. Allowed containers are `u8`/`i8` (8 bits),
`u16le/be` & `i16le/be` (16 bits), and `u32le/be` & `i32le/be` (32 bits). 64-bit containers are not allowed.

```ts
const reg = new Struct({
    flags: 'u8:4',
    mode: 'u8:2',
    extra: 'u8:2' // all three share one byte
});
```

Consecutive bitfields pack into the same container until the bit count would overflow it, the type/size changes,
or a regular field closes it.

## Arrays

Append `[N]` for a fixed inline array. A fixed string takes two dimensions `encoding[bytes][count]`. Prefix with
`*` for an array of pointers, each addressing its own heap payload.

```ts
new Struct<{ ints: number[]; codes: string[]; tags: string[] }>({
    ints: 'u16le[4]',    // 4 inline u16le values
    codes: 'ascii[4][2]', // 2 strings, 4 bytes each, inline
    tags: '*utf8[3]'     // 3 pointer slots, each to a heap string
});
```

### Grouped pointers

Parentheses group a fixed inner dimension behind a pointer, so `*(T[N])` is **one** pointer to a heap list of
`T[N]` groups. Add an outer `[M]` for `M` such pointers. Pass the values inside an array and read the same array
back; a single-element list reads back as the lone element (the usual pointer collapse).

```ts
const s = new Struct<{ rows: string[]; matrix: number[][][] }>({
    rows: '*(utf8[4])',     // 1 pointer → heap list of 4-byte strings
    matrix: '*(u32le[4])[2]' // 2 pointers, each → heap list of u32le[4] groups
});

s.toObject(s.toBuffer({
    rows: [ 'ABCD', 'EFGH' ],
    matrix: [ [ [ 1, 2, 3, 4 ], [ 5, 6, 7, 8 ] ], [ [ 9, 8, 7, 6 ] ] ]
}));
// rows:   [ 'ABCD', 'EFGH' ]
// matrix: [ [ [ 1, 2, 3, 4 ], [ 5, 6, 7, 8 ] ], [ 9, 8, 7, 6 ] ]  // last slot's 1-element list collapsed
```

## Nested structs

Compose structs to any depth by using a `Struct` as a field value.

```ts
const Point = new Struct<{ x: number; y: number }>({ x: 'i32le', y: 'i32le' });

const Shape = new Struct<{ kind: number; origin: { x: number; y: number } }>({
    kind: 'u8',
    origin: Point // embedded struct, shares the parent's heap
});
```

## Unions

`Union` lays every member at offset 0 and sizes itself to the widest member. It extends `Struct`, shares the same
API, and (unlike fixed-width unions) accepts pointer members because a pointer is a fixed-size slot.

```ts
import { Union } from '@remotex-labs/xstruct';

const value = new Union<{ word: number; text: string }>({
    word: 'u32le',
    text: '*utf8' // a heap pointer is a valid union member
});

value.size; // 4, the widest member
```

## Heap & pointers

A struct has a fixed `size` (the stack). Pointer fields (`*`) reserve one `pointerSize`-byte slot there and write
their payload to a heap region appended after the struct, so a serialized buffer can be larger than `size`.

```ts
const s = new Struct<{ id: number; name: string }>({ id: 'u32le', name: '*utf8' });
s.size; // 8  (4 for id + 4 for the pointer)
const buf = s.toBuffer({ id: 1, name: 'Ada Lovelace' });
buf.byteLength; // > 8: the trailing bytes are the heap
```

A short string such as `'Ada'` may fit entirely in the spare bits of the pointer, in which case no heap bytes are
added and the buffer stays exactly `size` long. The decoded value is identical either way.

### Options

`new Struct<T>(definition, options?)`:

| Option        | Default | Description                                                                      |
|---------------|---------|----------------------------------------------------------------------------------|
| `pointerSize` | `4`     | Pointer width in bytes: `1`, `2`, `4`, `6`, or `8`. Bounds the heap size.        |
| `inherit`     | `true`  | When nested, adopt the parent's pointer size and heap. `false` stays standalone. |
| `heap`        | -       | A heap to write into instead of a per-call one.                                  |

A custom heap is any object with `read`/`write` methods. The package exports `heapRead` / `heapWrite`, which you
bind to a `{ top, buffer }` context:

```ts
import { Struct, heapRead, heapWrite } from '@remotex-labs/xstruct';

const ctx = { top: 0, buffer: Buffer.allocUnsafe(0) };
const heap = { read: heapRead.bind(ctx), write: heapWrite.bind(ctx) };

const a = new Struct<{ v: string }>({ v: '*utf8' }, { heap, inherit: false });
a.toBuffer({ v: 'alpha' }); // 'alpha' written into ctx.buffer
```

## Error handling

Invalid schemas throw when the `Struct` is constructed, so mistakes surface before the first serialize.

```ts
const s = new Struct({ id: 'u32le' });

s.toObject(Buffer.alloc(2)); // throws: buffer smaller than the struct size
s.toBuffer(null as never);   // throws: data is not an object
new Struct({ x: 'u9le' });   // throws at construction: unknown type
```

## Documentation

Full guides and the complete type reference live at
**[remotex-labs.github.io/xStruct](https://remotex-labs.github.io/xStruct/)**.

## Contributing

Contributions are welcome!\
Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Links

[Documentation](https://remotex-labs.github.io/xStruct/), [GitHub Repository](https://github.com/remotex-labs/xStruct), [Issue Tracker](https://github.com/remotex-labs/xStruct/issues), [npm Package](https://www.npmjs.com/package/@remotex-labs/xstruct)

## License

This project is licensed under the Mozilla Public License 2.0 - see the [LICENSE](LICENSE) file for details.
