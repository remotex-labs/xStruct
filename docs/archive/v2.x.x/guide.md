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

xStruct requires Node.js 20 or later and has no runtime dependencies.

## Quick start

```ts
import { Struct } from '@remotex-labs/xstruct';

interface Header {
    magic: number;
    version: number;
    name: string;
}

const header = new Struct<Header>({
    magic: 'UInt32BE',   // unsigned 32-bit, big-endian   // [!code focus]
    version: 'UInt16LE', // unsigned 16-bit, little-endian // [!code focus]
    name: 'utf8'         // length-prefixed UTF-8 string   // [!code focus]
});

const buffer = header.toBuffer({ magic: 0xCAFEBABE, version: 1, name: 'demo' });
const data = header.toObject(buffer);
// { magic: 3405691582, version: 1, name: 'demo' }
```

Pass an interface as the type parameter, as in `new Struct<Header>(...)`. TypeScript then checks the objects you pass to `toBuffer` and the shape returned by `toObject`.

## The schema

A schema maps field names to field definitions. A definition is one of the following.

| Form                   | Example                             | Meaning                                 |
|------------------------|-------------------------------------|-----------------------------------------|
| Type string            | `'UInt32LE'`, `'utf8'`, `'UInt8:4'` | A primitive, string, array, or bitfield |
| Descriptor object      | `{ type: 'string', size: 16 }`      | A field with extra options              |
| Nested struct or union | a `Struct` or `Union` instance      | An embedded structure                   |

Fields are laid out in declaration order.

## API

### `new Struct<T>(schema)`

Compiles the schema once and exposes:

| Member                                   | Description                            |
|------------------------------------------|----------------------------------------|
| `size: number`                           | The fixed size of the layout in bytes. |
| `toBuffer(data: T): Buffer`              | Serializes an object into a buffer.    |
| `toObject(buffer, getDynamicOffset?): T` | Parses a buffer into an object.        |

`getDynamicOffset` is an optional callback. After decoding, it receives the number of bytes consumed, which lets you read consecutive records whose total size depends on dynamic string content.

```ts
let consumed = 0;
header.toObject(buffer, (offset) => { consumed = offset; });
const next = buffer.subarray(consumed);
```

### `new Union<T>(schema)`

A `Union` lays every member at offset 0 and sizes itself to the widest member. `toBuffer` writes the first member with a defined value; `toObject` decodes every member from the same bytes. See [Unions](/structures/unions).

### Field definitions

| Definition                             | Result                                       |
|----------------------------------------|----------------------------------------------|
| `'UInt32LE'`, `'FloatBE'`, `'Int8'`    | A single primitive                           |
| `'UInt8[16]'` or `{ type, arraySize }` | A fixed array                                |
| `'UInt8:4'`                            | A bitfield                                   |
| `'utf8'`                               | A length-prefixed string (`UInt16LE` prefix) |
| `'utf8(16)'` or `{ type, size }`       | A fixed-size string                          |
| `{ type, lengthType }`                 | A string with a custom length prefix         |
| `{ type, nullTerminated, maxLength? }` | A null-terminated string                     |
| a `Struct` instance                    | A single nested struct                       |
| `{ type: Struct, arraySize }`          | An array of nested structs                   |

## Types

- [Integers](/types/integers): `UInt8` through `BigInt64BE`, with 64-bit values as `bigint`.
- [Floats](/types/floats): `FloatLE/BE` and `DoubleLE/BE`.
- [Strings](/types/strings): `string`, `utf8`, and `ascii`, in length-prefixed, fixed, or null-terminated layouts.
- [Bitfields](/types/bitfields): sub-byte integers packed into a shared container.

## Structures

- [Arrays](/structures/arrays): fixed-length sequences of any field.
- [Nested Structs](/structures/nested-structs): compose structs to any depth.
- [Unions](/structures/unions): overlapping members at offset 0.

## Error handling

```ts
const s = new Struct({ id: 'UInt32LE' });

s.toObject(Buffer.alloc(2));  // throws: buffer smaller than the struct size [!code error]
s.toBuffer(null as never);    // throws: data is not an object [!code error]
new Struct({ x: 'UInt9LE' }); // throws at construction: invalid field type [!code error]
```

Invalid schemas throw when the `Struct` is constructed, so mistakes surface before the first serialize.

## Next steps

- [Endianness](/guides/endianness)
