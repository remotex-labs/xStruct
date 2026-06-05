# Floats

IEEE 754 single- and double-precision floating-point numbers, each with an explicit byte order.

## Reference

| Type                   | Bytes | Precision                         | Approximate range |
|------------------------|-------|-----------------------------------|-------------------|
| `FloatLE`, `FloatBE`   | 4     | about 7 significant digits        | +/- 3.4e38        |
| `DoubleLE`, `DoubleBE` | 8     | about 15 to 16 significant digits | +/- 1.8e308       |

Both decode to a JavaScript `number`, which is itself an IEEE 754 double.

## Usage

```ts
import { Struct } from '@remotex-labs/xstruct';

const vector = new Struct<{ x: number; y: number; z: number }>({
    x: 'FloatLE',
    y: 'FloatLE',
    z: 'FloatLE'
});

vector.toObject(vector.toBuffer({ x: 1.5, y: -2.25, z: 0 }));
// { x: 1.5, y: -2.25, z: 0 }
```

## Choosing a precision

Use `Float` for compactness when about 7 significant digits are enough, such as graphics or sensor samples. Use `Double` when you need full precision, such as scientific data or accumulated sums.

::: warning
A value is rounded to the nearest single-precision value when written as a `Float`, so the decoded number can differ slightly from the input.

```ts
const f = new Struct<{ v: number }>({ v: 'FloatLE' });
f.toObject(f.toBuffer({ v: 0.1 })).v; // 0.10000000149011612
```

:::

## Arrays

```ts
const transform = new Struct<{ matrix: number[] }>({ matrix: 'FloatLE[16]' }); // a 4x4 matrix
```

See [Arrays](/structures/arrays).

## Special values

`NaN`, `Infinity`, and `-Infinity` round-trip correctly. Never compare a decoded float to a literal with `===`; compare within a tolerance instead, for example `Math.abs(a - b) < 1e-6`.

## See also

- [Integers](/types/integers)
- [Endianness](/guides/endianness)
