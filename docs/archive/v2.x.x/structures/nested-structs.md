# Nested Structs

Compose layouts by using a struct as a field of another. Embed an instance for a single value, or use a descriptor with `arraySize` for an array.

## Embedding a struct

```ts
import { Struct } from '@remotex-labs/xstruct';

const Point = new Struct<{ x: number; y: number }>({ x: 'Int32LE', y: 'Int32LE' });

const Line = new Struct<{ from: { x: number; y: number }; to: { x: number; y: number } }>({
    from: Point,
    to: Point
});

Line.toObject(Line.toBuffer({ from: { x: 0, y: 0 }, to: { x: 10, y: 5 } }));
// { from: { x: 0, y: 0 }, to: { x: 10, y: 5 } }
```

Define each nested struct once and reuse it. The schema is compiled in the constructor, so a shared instance avoids re-parsing.

## Arrays of structs

```ts
const Polygon = new Struct<{ points: { x: number; y: number }[] }>({
    points: { type: Point, arraySize: 3 } // 3 points
});
```

See [Arrays](/structures/arrays).

## Deep nesting

Structs nest to any depth, so you can compose small named pieces into larger ones.

```ts
const Header = new Struct({ magic: 'UInt32BE', version: 'UInt16LE' });
const Body = new Struct({ id: 'UInt32LE', label: 'utf8' });

const Message = new Struct({ header: Header, body: Body });
```

## Dynamic size

A nested struct that contains dynamic strings makes the parent buffer larger than `size`. When reading such a
struct, use the `getDynamicOffset` callback to find where the data ends. See
[Working with Buffers](/guide#working-with-buffers).

## See also

- [Arrays](/structures/arrays)
- [Unions](/structures/unions)
