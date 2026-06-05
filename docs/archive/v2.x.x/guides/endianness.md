# Endianness

Endianness is the byte order of multi-byte numbers. xStruct makes it explicit in every type name, so a schema reads the same on any platform.

## Little-endian and big-endian

For the 32-bit value `0x01020304`:

| Order                | Bytes from low to high address |
|----------------------|--------------------------------|
| Big-endian (`BE`)    | `01 02 03 04`                  |
| Little-endian (`LE`) | `04 03 02 01`                  |

Big-endian stores the most significant byte first, which is the order used by most network protocols. Little-endian stores the least significant byte first, which is the order used by most CPUs.

## Declaring it

Every multi-byte type carries the suffix. There is no implicit platform default.

```text
'UInt16LE'    'UInt16BE'
'Int32LE'     'Int32BE'
'BigUInt64LE' 'BigUInt64BE'
'FloatLE'     'FloatBE'
'DoubleLE'    'DoubleBE'
```

`UInt8` and `Int8` are a single byte and take no suffix.

```ts
import { Struct } from '@remotex-labs/xstruct';

const s = new Struct<{ n: number }>({ n: 'UInt32BE' });
s.toBuffer({ n: 0x01020304 }); // <Buffer 01 02 03 04>
```

## Choosing an order

| Context                                | Convention                                      |
|----------------------------------------|-------------------------------------------------|
| Network protocols such as IP, TCP, DNS | Big-endian, also called network byte order      |
| Most file formats and CPUs             | Little-endian                                   |
| A format you define yourself           | Either one, but document it and stay consistent |

## Mixed endianness

A single struct can mix orders, which is useful when a format wraps a big-endian header around a little-endian payload.

```ts
new Struct<{ magic: number; length: number }>({
    magic: 'UInt32BE',  // big-endian marker
    length: 'UInt32LE'  // little-endian payload length
});
```

## A common pitfall

Decoding big-endian data as little-endian, or the reverse, produces a byte-swapped number rather than an
error. If a value looks reordered, for example `0x04030201` instead of `0x01020304`, check the suffix.

## See also

- [Integers](/types/integers)
- [Floats](/types/floats)
- [Bitfields](/types/bitfields)
