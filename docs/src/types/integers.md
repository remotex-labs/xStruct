# Integers

Signed and unsigned integers from 8 to 64 bits, each with an explicit byte order.

## Naming

A type name is built from three parts:

- `UInt` or `Int` for unsigned or signed.
- A width of 8, 16, 32, or 64 bits.
- An endianness suffix, `LE` or `BE`. The suffix is omitted for 8-bit types, which occupy a single byte. The 64-bit types are prefixed with `Big`.

## Reference

| Type                         | Bytes | JavaScript type | Range                     |
|------------------------------|-------|-----------------|---------------------------|
| `UInt8`                      | 1     | `number`        | 0 to 255                  |
| `Int8`                       | 1     | `number`        | -128 to 127               |
| `UInt16LE`, `UInt16BE`       | 2     | `number`        | 0 to 65535                |
| `Int16LE`, `Int16BE`         | 2     | `number`        | -32768 to 32767           |
| `UInt32LE`, `UInt32BE`       | 4     | `number`        | 0 to 4294967295           |
| `Int32LE`, `Int32BE`         | 4     | `number`        | -2147483648 to 2147483647 |
| `BigUInt64LE`, `BigUInt64BE` | 8     | `bigint`        | 0 to 2^64 - 1             |
| `BigInt64LE`, `BigInt64BE`   | 8     | `bigint`        | -2^63 to 2^63 - 1         |

## Usage

```ts
import { Struct } from '@remotex-labs/xstruct';

const record = new Struct<{ id: number; flags: number; delta: number }>({
    id: 'UInt32LE',
    flags: 'UInt8',
    delta: 'Int16BE'
});

const buffer = record.toBuffer({ id: 1000, flags: 0b1010, delta: -5 });
record.toObject(buffer); // { id: 1000, flags: 10, delta: -5 }
```

## 64-bit integers

The 64-bit types read and write `bigint`, not `number`.

```ts
const counter = new Struct<{ total: bigint }>({ total: 'BigUInt64LE' });

counter.toObject(counter.toBuffer({ total: 9007199254740993n })).total;
// 9007199254740993n
```

::: warning
Passing a `number` to a 64-bit field throws at encode time. Use a `bigint` literal such as `123n`.
:::

## Arrays

Append `[N]` for a fixed inline array.

```ts
const samples = new Struct<{ values: number[] }>({ values: 'UInt16LE[4]' });

samples.toObject(samples.toBuffer({ values: [ 10, 20, 30, 40 ] })).values;
// [ 10, 20, 30, 40 ]
```

See [Arrays](/structures/arrays).

## Overflow

Values are not clamped. Writing a value outside a type's range throws a `RangeError` from the buffer layer, so validate untrusted input before encoding.

```ts
new Struct<{ b: number }>({ b: 'UInt8' }).toBuffer({ b: 300 }); // throws
```

## See also

- [Floats](/types/floats)
- [Bitfields](/types/bitfields)
- [Endianness](/guides/endianness)
