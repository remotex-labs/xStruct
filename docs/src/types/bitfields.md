# Bitfields

Pack several sub-byte integers into a shared integer container. Bitfields are useful for flags, protocol headers, and hardware registers.

## Syntax

A bitfield is an integer type followed by a bit width: `type:bits`.

```ts
new Struct({ flags: 'u8:4', mode: 'u8:2', extra: 'u8:2' }); // all share one byte
```

The container is the named integer type. Allowed containers are `u8`/`i8` (8 bits), `u16le`/`u16be`/`i16le`/`i16be`
(16 bits), and `u32le`/`u32be`/`i32le`/`i32be` (32 bits). The bit width may range from 1 up to the container's
width. Use a signed container such as `i8` or `i16le` for signed fields.

::: warning
64-bit containers are not allowed. `'u64le:8'` throws at construction. The container type must be 4 bytes or smaller.
:::

## Packing rules

Consecutive bitfields are packed into the same container until one of the following starts a new one:

1. The running bit count would overflow the container.
2. The next bitfield uses a different type or container size.

A regular, non-bitfield field also closes the active container.

```ts
const reg = new Struct<{ a: number; b: number; c: number }>({
    a: 'u8:3', // bits in byte 0
    b: 'u8:3', // bits in byte 0
    c: 'u8:4'  // 3 + 3 + 4 = 10 > 8, so this starts byte 1
});

reg.size; // 2
```

```ts
const mixed = new Struct({
    flags: 'u8:4',   // byte 0
    value: 'u32le'   // a regular field closes the container, so it starts at byte 1
});

mixed.size; // 5
```

Switching the container type also opens a new one:

```ts
new Struct({ a: 'u8:4', b: 'u16le:4' }).size; // 3: u8 byte + u16le container
```

## Explicit bit offset

The `type:bits` string packs fields sequentially. To place a field at a fixed bit position
instead, use the descriptor-object form and set `bitOffset` (with `kind: 2`, the bitfield
discriminator):

```ts
const reg = new Struct<{ c: number }>({
    c: { type: 'u8', kind: 2, bitSize: 2, bitOffset: 2 } // bits 2..3 of the byte
});

reg.toObject(reg.toBuffer({ c: 3 })); // { c: 3 }  - stored as 0b0000_1100
```

An explicit `bitOffset` and sequential fields coexist: the field lands exactly where you put
it, and the packing cursor advances to `bitOffset + bitSize`, so later auto-packed fields
follow it.

```ts
const layout = new Struct<{ a: number; c: number; d: number }>({
    a: 'u8:2',                                       // auto  → bits 0..1
    c: { type: 'u8', kind: 2, bitSize: 2, bitOffset: 4 }, // fixed → bits 4..5
    d: 'u8:1'                                         // auto  → bit 6 (after c)
});

layout.size; // 1
```

`bitOffset` must fit the container and may not overlap an earlier field: it must be at or
after the running cursor, and `bitOffset + bitSize` may not exceed the container width (e.g. 8
for `u8`). Otherwise construction throws. (You can leave a gap by skipping ahead, but you
cannot place a field back over bits an earlier one already used.)

## Round-trip

```ts
import { Struct } from '@remotex-labs/xstruct';

const status = new Struct<{ ready: number; level: number }>({
    ready: 'u8:1',
    level: 'u8:7'
});

status.toObject(status.toBuffer({ ready: 1, level: 100 }));
// { ready: 1, level: 100 }
```

## Value ranges

An unsigned field of n bits holds 0 to 2^n - 1. A signed field of n bits holds -2^(n-1) to 2^(n-1) - 1.

```ts
const signed = new Struct<{ delta: number }>({ delta: 'i8:4' }); // -8 to 7

signed.toObject(signed.toBuffer({ delta: -2 })).delta; // -2
```

An unsigned value wider than the field is masked to the field width.

## Endianness

The container is read and written using its type's endianness, so `u16be:4` packs into a big-endian 16-bit integer. See [Endianness](/guides/endianness).

## See also

- [Integers](/types/integers)
- [Unions](/structures/unions)
