# Arrays

Repeat a field a fixed number of times with the `[N]` suffix on a type string.

## Primitive arrays

Append `[N]` to any integer or float type for a fixed inline array of `N` elements.

```ts
import { Struct } from '@remotex-labs/xstruct';

const s = new Struct<{ values: number[] }>({ values: 'u16le[4]' });

s.size; // 8, which is 4 elements of 2 bytes
s.toObject(s.toBuffer({ values: [ 1, 2, 3, 4 ] })).values; // [ 1, 2, 3, 4 ]
```

A numeric type takes a single `[N]` dimension. The array passed to `toBuffer` should contain `N` elements.

## String arrays

A fixed string takes two dimensions: `encoding[byteCapacity][count]`. The first bracket is the byte width of each element, the second is how many elements there are.

```ts
const codes = new Struct<{ list: string[] }>({ list: 'ascii[4][2]' });
//                                                      ^^^^ ^^^
//                                            4 bytes each, 2 elements

codes.toObject(codes.toBuffer({ list: [ 'ABCD', 'EFGH' ] })).list;
// [ 'ABCD', 'EFGH' ]
```

See [Strings](/types/strings).

## Pointer arrays

Prefix with `*` for an array of pointers. Each slot addresses its own variable-length payload on the heap, so the elements need not be the same length.

```ts
const tags = new Struct<{ tags: string[] }>({ tags: '*utf8[3]' });

tags.toObject(tags.toBuffer({ tags: [ 'aa', 'bbbb', 'c' ] })).tags;
// [ 'aa', 'bbbb', 'c' ]
```

The same form works for numeric pointers, for example `'*u32le[4]'` for four pointers, each to one heap `u32le`. See [Heap & Pointers](/guides/heap).

## Sizing

A fixed array contributes `N * elementSize` to `size`. A pointer array contributes `N * pointerSize` to `size`;
the payloads it references live in the heap region appended after the struct, so the buffer is larger than `size`.

## See also

- [Strings](/types/strings)
- [Heap & Pointers](/guides/heap)
- [Nested Structs](/structures/nested-structs)
