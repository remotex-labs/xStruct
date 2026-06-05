# Integers

Signed and unsigned integers from 8 to 64 bits, each with an explicit byte order.

## Naming

A type name is built from three lowercase parts:

- `u` or `i` for unsigned or signed.
- A width of `8`, `16`, `32`, or `64` bits.
- An endianness suffix, `le` or `be`. The suffix is omitted for 8-bit types, which occupy a single byte.

## Reference

| Type             | Bytes | JavaScript type | Range                     |
|------------------|-------|-----------------|---------------------------|
| `u8`             | 1     | `number`        | 0 to 255                  |
| `i8`             | 1     | `number`        | -128 to 127               |
| `u16le`, `u16be` | 2     | `number`        | 0 to 65535                |
| `i16le`, `i16be` | 2     | `number`        | -32768 to 32767           |
| `u32le`, `u32be` | 4     | `number`        | 0 to 4294967295           |
| `i32le`, `i32be` | 4     | `number`        | -2147483648 to 2147483647 |
| `u64le`, `u64be` | 8     | `bigint`        | 0 to 2^64 - 1             |
| `i64le`, `i64be` | 8     | `bigint`        | -2^63 to 2^63 - 1         |

## Usage

```ts
import { Struct } from '@remotex-labs/xstruct';

const record = new Struct<{ id: number; flags: number; delta: number }>({
    id: 'u32le',
    flags: 'u8',
    delta: 'i16be'
});

const buffer = record.toBuffer({ id: 1000, flags: 0b1010, delta: -5 });
record.toObject(buffer); // { id: 1000, flags: 10, delta: -5 }
```

## 64-bit integers

The 64-bit types read and write `bigint`, not `number`.

```ts
const counter = new Struct<{ total: bigint }>({ total: 'u64le' });

counter.toObject(counter.toBuffer({ total: 9007199254740993n })).total;
// 9007199254740993n
```

::: warning
Passing a `number` to a 64-bit field throws at encode time. Use a `bigint` literal such as `123n`.
:::

## Arrays

Append `[N]` for a fixed inline array.

```ts
const samples = new Struct<{ values: number[] }>({ values: 'u16le[4]' });

samples.toObject(samples.toBuffer({ values: [ 10, 20, 30, 40 ] })).values;
// [ 10, 20, 30, 40 ]
```

See [Arrays](/structures/arrays).

## Pointers

Prefix with `*` to store the integer on the heap behind a pointer. This is mainly useful inside unions or when the value is optional.

```ts
new Struct<{ count: number }>({ count: '*u32le' }); // one pointer slot on the stack
```

See [Heap & Pointers](/guides/heap).

## Overflow

Values are not clamped. Writing a value outside a type's range throws a `RangeError` from the buffer layer, so validate untrusted input before encoding.

```ts
new Struct<{ b: number }>({ b: 'u8' }).toBuffer({ b: 300 }); // throws
```

## See also

- [Floats](/types/floats)
- [Bitfields](/types/bitfields)
- [Endianness](/guides/endianness)
