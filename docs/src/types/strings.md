# Strings

Text fields come in three layouts: length-prefixed, fixed-size, and null-terminated.

## Encodings

| Encoding | Notes                     |
|----------|---------------------------|
| `string` | UTF-8, the default        |
| `utf8`   | UTF-8, written explicitly |
| `ascii`  | 7-bit ASCII               |

::: tip
Only these three encodings exist. There is **no** `latin1`, `utf16le`, `base64`, or `hex` string type.
:::

## Length-prefixed

A bare encoding name stores a `UInt16LE` length prefix followed by the bytes. This is the most common form.

```ts
import { Struct } from '@remotex-labs/xstruct';

const user = new Struct<{ name: string }>({ name: 'utf8' });

user.toObject(user.toBuffer({ name: 'Ada Lovelace' })).name; // 'Ada Lovelace'
```

Use a descriptor to change the prefix width:

```ts
new Struct({
    short: { type: 'utf8', lengthType: 'UInt8' },   // up to 255 bytes
    long: { type: 'utf8', lengthType: 'UInt32LE' }  // up to 4 GiB
});
```

::: info Dynamic size
A length-prefixed string makes the buffer larger than `struct.size`. When decoding, pass a callback to
`toObject` to learn how many bytes were consumed. This helps when reading consecutive records from one buffer.
:::

```ts
struct.toObject(buffer, (offset) => { // [!code focus]
    // offset is the number of bytes consumed
}); // [!code focus]
```

## Fixed-size

`encoding(N)` reserves exactly N bytes inline. The descriptor form is `{ type, size: N }`.

```ts
new Struct({
    code: 'ascii(4)',                   // 4 bytes
    title: { type: 'utf8', size: 32 }   // 32 bytes
});
```

::: warning
A value shorter than `N` is zero-padded; a value longer than `N` is **truncated**. Choose a size that fits your longest expected value.
:::

## Null-terminated

A null-terminated string is read until the first `\0` byte. An optional `maxLength` caps the read.

```ts
new Struct({
    cString: { type: 'utf8', nullTerminated: true },
    capped: { type: 'ascii', nullTerminated: true, maxLength: 100 }
});
```

`maxLength` limits the written length only. If no terminator is found within it while reading, an error is thrown.

## String arrays

Append `[N]`. Each element is encoded independently.

```ts
new Struct({
    tags: 'utf8[4]',       // 4 length-prefixed strings
    codes: 'ascii(4)[2]'   // 2 fixed 4-byte strings
});
```

The array passed to `toBuffer` must contain exactly N elements.

## Choosing a layout

| Need                  | Use                              |
|-----------------------|----------------------------------|
| Variable-length text  | `utf8` (length-prefixed)         |
| Constant record width | `utf8(N)` or `{ type, size: N }` |
| C-style string        | `{ type, nullTerminated: true }` |
| Custom prefix width   | `{ type, lengthType }`           |

## See also

- [Arrays](/structures/arrays)
- [Nested Structs](/structures/nested-structs)
- [Unions](/structures/unions) (only fixed-size strings are allowed in unions)
