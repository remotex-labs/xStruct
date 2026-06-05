# Floats

IEEE 754 single- and double-precision floating-point numbers, each with an explicit byte order.

## Reference

| Type             | Bytes | Precision                         | Approximate range |
|------------------|-------|-----------------------------------|-------------------|
| `f32le`, `f32be` | 4     | about 7 significant digits        | +/- 3.4e38        |
| `f64le`, `f64be` | 8     | about 15 to 16 significant digits | +/- 1.8e308       |

Both decode to a JavaScript `number`, which is itself an IEEE 754 double.

## Usage

```ts
import { Struct } from '@remotex-labs/xstruct';

const vector = new Struct<{ x: number; y: number; z: number }>({
    x: 'f32le',
    y: 'f32le',
    z: 'f32le'
});

vector.toObject(vector.toBuffer({ x: 1.5, y: -2.25, z: 0 }));
// { x: 1.5, y: -2.25, z: 0 }
```

## Choosing a precision

Use `f32` for compactness when about 7 significant digits are enough, such as graphics or sensor samples. Use `f64` when you need full precision, such as scientific data or accumulated sums.

::: warning
A value is rounded to the nearest single-precision value when written as an `f32`, so the decoded number can differ slightly from the input.

```ts
const f = new Struct<{ v: number }>({ v: 'f32le' });
f.toObject(f.toBuffer({ v: 0.1 })).v; // 0.10000000149011612
```

:::

## Arrays

```ts
const transform = new Struct<{ matrix: number[] }>({ matrix: 'f32le[16]' }); // a 4x4 matrix
```

See [Arrays](/structures/arrays).

## Pointers

Like every primitive, a float can be stored on the heap behind a pointer. Prefix the type with `*`. This is mainly
useful inside unions or when the value is optional.

```ts
const sample = new Struct<{ value: number }>({ value: '*f32le' }); // one pointer slot on the stack

sample.toObject(sample.toBuffer({ value: 1.5 })).value; // 1.5
```

A pointer array stores one pointer per element, each addressing its own heap float:

```ts
const series = new Struct<{ points: number[] }>({ points: '*f32be[2]' });

series.toObject(series.toBuffer({ points: [ 1.5, 2.5 ] })).points; // [ 1.5, 2.5 ]
```

See [Heap & Pointers](/guides/heap).

## Special values

`NaN`, `Infinity`, and `-Infinity` round-trip correctly. Never compare a decoded float to a literal with `===`; compare within a tolerance instead, for example `Math.abs(a - b) < 1e-6`.

## See also

- [Integers](/types/integers)
- [Endianness](/guides/endianness)
