# Release Notes

Changes in the v3.0.x line, newest first. Older lines are listed under [Earlier releases](#earlier-releases).

## v3.0.1

A maintenance release: the build and tooling chain moves to xBuild 3, and `toJSON` on the error types stops
dropping falsy fields.

- **Changed**: Built with [xBuild](https://remotex-labs.github.io/xBuild/) 3.0, replacing the 2.5 line. The
  published bundles, the `dist/esm` + `dist/cjs` layout, and the bundled `dist/index.d.ts` are unchanged.
- **Changed**: Test and lint tooling updated - `@remotex-labs/xjet` 1.5.6, ESLint 10.10, `typescript-eslint` 8.70,
  `eslint-plugin-perfectionist` 5.11, and `markdownlint-cli` 0.49.
- **Changed**: Docs tooling updated - VitePress `2.0.0-alpha.20` and `@viteplus/versions` 2.0.9.
- **Fixed**: `toJSON()` on the error types kept only truthy extra properties, so `false`, `0`, `''`, `NaN`, and
  `0n` were silently dropped from a serialized error. It now drops only `null` and `undefined`, which is what the
  filter was meant to do. See [Error handling](/guide#error-handling).

```ts
// A serialized error now keeps falsy context fields
JSON.stringify(error);
// { "offset": 0, "truncated": false, "name": "...", "message": "...", "stack": "..." }
```

## v3.0.0

A full rewrite of the serializer around a **schema + heap** model. Field types are now short expression strings
(`u32le`, `utf8[16]`, `*utf8`) and variable-length data lives in a heap region behind a pointer, so a struct keeps
a fixed stack [`size`](/guide#the-struct-class) no matter how large its payload grows.

```ts
import { Struct } from '@remotex-labs/xstruct';

const header = new Struct<{ magic: number; name: string }>({
    magic: 'u32be', // v2: 'UInt32BE'
    name: '*utf8'   // v2: 'utf8' (length-prefixed, inline)
});
```

- **Added**: A [heap](/guides/heap) for variable-length data. Prefix a field with `*` to store its payload in a
  heap region appended after the struct while the stack holds a single pointer slot.
- **Added**: [`pointerSize`](/guides/heap#pointer-size) - `1`, `2`, `4`, `6`, or `8` bytes, defaulting to `4` -
  as a `Struct` option, bounding the addressable heap.
- **Added**: `inherit` and `heap` options, so a nested struct can adopt its parent's pointer size and heap, or
  write into a heap you supply. See [Sharing a heap](/guides/heap#sharing-a-heap) and
  [A custom heap](/guides/heap#a-custom-heap).
- **Added**: Heap-backed members in a [`Union`](/structures/unions#heap-members). A pointer is a fixed-size slot,
  so variable-length text is now a valid union member.
- **Added**: [Explicit bit offsets](/types/bitfields#explicit-bit-offset) on bitfields, for laying out a field at
  a chosen position in its container rather than packing it in declaration order.
- **Added**: Dedicated error types with structured context - a base error plus expression and range errors - so a
  bad schema or an out-of-range value reports where it failed.
- **Added**: The exported types `PointerType`, `SchemaType`, `StructOptionsInterface`, `HeapRuntimeInterface`, and
  `PointerSizeType`.
- **Changed**: Primitive names are lower-case and compact: `UInt32LE` becomes `u32le`, `Int8` becomes `i8`,
  `FloatBE` becomes `f32be`, and `DoubleLE` becomes `f64le`. See [Integers](/types/integers#naming) and
  [Floats](/types/floats#reference).
- **Changed**: Fixed-size strings use bracket syntax - `utf8(16)` becomes [`utf8[16]`](/types/strings#fixed-size),
  and the size is a byte count rather than a character count.
- **Changed**: Arrays repeat the bracket - `'u8[4]'`, and `'u8[4][2]'` for two dimensions. See
  [Arrays](/structures/arrays).
- **Changed**: `utf16le` joins `utf8`, `ascii`, and `latin1` as a supported
  [encoding](/types/strings#encodings).
- **Changed**: Node.js 22 or later is required, up from 20.
- **Removed**: Descriptor objects (`{ type, size }`, `{ type, arraySize }`, `{ type, lengthType }`,
  `{ type, nullTerminated }`). Every field is now an expression string or a nested `Struct`/`Union`.
- **Removed**: Length-prefixed and null-terminated string layouts, replaced by the heap pointer form `*utf8`.
- **Removed**: The `getDynamicOffset` callback on `toObject`. A struct's stack `size` is now fixed, and the heap
  region is self-describing, so there is no dynamic offset to report.
- **Migration**: Rename primitives to the compact form, change `utf8(N)` to `utf8[N]`, replace every
  length-prefixed or null-terminated string with `*utf8`, and drop `getDynamicOffset`. Descriptor objects have no
  direct replacement - express the field as a string. Start from the [Getting Started](/guide) guide, then
  [Heap & Pointers](/guides/heap) for the parts that are new.

::: warning 🗄️ Binary format
v3 buffers are not compatible with v2 buffers. Field names, primitive widths, and the heap layout all changed, so
data written by one major version cannot be read by the other.
:::

## Earlier releases

- [v2.x.x release notes](v2.x.x/release)

## See also

- [Getting Started](/guide)
- [Heap & Pointers](/guides/heap)
