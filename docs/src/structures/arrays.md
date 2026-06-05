# Arrays

Repeat any field a fixed number of times, either with the `[N]` suffix on a type string or with the `arraySize` option on a descriptor.

## Syntax

```ts
import { Struct } from '@remotex-labs/xstruct';

new Struct({
    a: 'Int32LE[8]',                          // suffix form
    b: { type: 'BigUInt64BE', arraySize: 4 }  // descriptor form
});
```

The array passed to `toBuffer` must contain exactly N elements.

## Primitive arrays

```ts
const s = new Struct<{ values: number[] }>({ values: 'UInt16LE[4]' });

s.size; // 8, which is 4 elements of 2 bytes
s.toObject(s.toBuffer({ values: [ 1, 2, 3, 4 ] })).values; // [ 1, 2, 3, 4 ]
```

## String arrays

Each element is encoded independently. Dynamic strings keep their own length prefix.

```ts
new Struct({
    tags: 'utf8[3]',      // 3 length-prefixed strings
    codes: 'ascii(4)[2]'  // 2 fixed 4-byte strings
});
```

See [Strings](/types/strings).

## Struct arrays

Repeat a nested struct with the `arraySize` option.

```ts
const Point = new Struct<{ x: number; y: number }>({ x: 'Int32LE', y: 'Int32LE' });

const Path = new Struct<{ points: { x: number; y: number }[] }>({
    points: { type: Point, arraySize: 3 } // 3 points
});
```

Embed a struct instance directly for a single value, and use `{ type, arraySize }` for an array. See [Nested Structs](/structures/nested-structs).

## Sizing

A fixed array contributes `N * elementSize` to `size`. Arrays of dynamic strings extend the buffer beyond `size`; use the `getDynamicOffset` callback when reading them. See [Working with Buffers](/guide#working-with-buffers).

## See also

- [Nested Structs](/structures/nested-structs)
- [Strings](/types/strings)
