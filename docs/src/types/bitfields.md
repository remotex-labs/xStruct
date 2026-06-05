# Bitfields

Pack several sub-byte integers into a shared integer container. Bitfields are useful for flags, protocol headers, and hardware registers.

## Syntax

A bitfield is an integer type followed by a bit width: `Type:bits`.

```ts
new Struct({ flags: 'UInt8:4', mode: 'UInt8:2', extra: 'UInt8:2' }); // all share one byte
```

The container is the named integer type, for example `UInt8` (8 bits) or `UInt16LE` (16 bits). The bit width may
range from 1 up to the container's width. Use a signed container such as `Int8` or `Int16LE` for signed fields.

::: tip
Group related flags so they fall in the same container. Common containers are `UInt8` (1 to 8 bits) and `UInt16LE` / `UInt16BE` (1 to 16 bits).
:::

## Packing rules

Consecutive bitfields are packed into the same container until one of the following starts a new one:

1. The running bit count would overflow the container.
2. The next bitfield uses a different type or container size.

A regular, non-bitfield field also closes the active container.

```ts
const reg = new Struct<{ a: number; b: number; c: number }>({
    a: 'UInt8:3', // bits in byte 0
    b: 'UInt8:3', // bits in byte 0
    c: 'UInt8:4'  // 3 + 3 + 4 = 10 > 8, so this starts byte 1
});

reg.size; // 2
```

```ts
const mixed = new Struct({
    flags: 'UInt8:4', // byte 0
    value: 'UInt32LE' // a regular field closes the container, so it starts at byte 1
});

mixed.size; // 5
```

## Round-trip

```ts
import { Struct } from '@remotex-labs/xstruct';

const status = new Struct<{ ready: number; level: number }>({
    ready: 'UInt8:1',
    level: 'UInt8:7'
});

status.toObject(status.toBuffer({ ready: 1, level: 100 }));
// { ready: 1, level: 100 }
```

## Value ranges

An unsigned field of n bits holds 0 to 2^n - 1. A signed field of n bits holds -2^(n-1) to 2^(n-1) - 1.

```ts
const signed = new Struct<{ delta: number }>({ delta: 'Int8:4' }); // -8 to 7

signed.toObject(signed.toBuffer({ delta: -2 })).delta; // -2
```

## Endianness

The container is read and written using its type's endianness, so `UInt16BE:4` packs into a big-endian 16-bit integer. See [Endianness](/guides/endianness).

## See also

- [Integers](/types/integers)
- [Unions](/structures/unions)
