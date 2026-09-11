# Release Notes

::: warning 🗄️ Archived version
These are the notes for an archived version. See the [current release notes](/release) for the supported line.
:::

Changes in the v2.x.x line, newest first.

## v2.1.3

- **Changed**: Dependencies updated, including esbuild 0.28 in the build chain.
- **Changed**: `exports` in `package.json` simplified and the publish scripts reordered.
- **Changed**: Test compilation restricted to `*.spec.ts` files, and the compiler path mappings tidied.

## v2.1.2

- **Fixed**: An incorrect `sourceRoot` URL path in the xBuild config, which pointed published source maps at the
  wrong location.
- **Changed**: Dependencies and ESLint updated.

## v2.1.1

- **Fixed**: `Union` was added in v2.1.0 but never exported from the package entry point. It is now importable as
  `import { Union } from '@remotex-labs/xstruct'`. See [Unions](structures/unions).

## v2.1.0

- **Added**: The [`Union`](structures/unions) class. Every member is laid at offset 0 and the union sizes itself to
  its widest member. `toBuffer` writes the first member with a defined value, and `toObject` decodes every member
  from the same bytes.
- **Added**: Fixed-length string syntax `utf8(N)` alongside the length-prefixed form, plus
  [string arrays](types/strings#string-arrays).
- **Changed**: Toolchain moved to pnpm, [xBuild](https://remotex-labs.github.io/xBuild/), and
  [xJet](https://remotex-labs.github.io/xJet/) for testing, replacing npm and Jest.
- **Changed**: Documentation moved to versioned VitePress via `@viteplus/versions`, adding the version switcher.

## v2.0.0

The serializer was rebuilt on a component model - separate primitive, string, bitfield, buffer, and struct
components behind the same [`Struct`](guide#api) API - which is what made variable-length strings and bitfields
possible.

- **Added**: Dynamic strings. A `'utf8'` field is length-prefixed (`UInt16LE` by default) and sizes itself to the
  value, with `{ type, lengthType }` for a custom prefix and `{ type, nullTerminated, maxLength? }` for a
  null-terminated layout. See [Strings](types/strings).
- **Added**: [Bitfields](types/bitfields) - sub-byte integers such as `'UInt8:4'` packed into a shared container,
  read and written using the container type's endianness.
- **Added**: The `getDynamicOffset` callback on `toObject`, reporting how many bytes a record consumed so
  consecutive dynamic records can be read from one buffer. See [the `Struct` API](guide#api).
- **Changed**: A field is a type string, a descriptor object, or a nested `Struct`. See
  [The schema](guide#the-schema).

## Supported API

The v2.x.x line exports `Struct` and `Union`, plus the schema and descriptor types from
`struct-service.interface`.

| Export   | Description                                                       |
|----------|-------------------------------------------------------------------|
| `Struct` | Compiles a schema and converts between objects and `Buffer`.      |
| `Union`  | A `Struct` whose members all start at offset 0.                   |

Field forms: primitives (`'UInt32LE'`, `'FloatBE'`, `'Int8'`), fixed arrays (`'UInt8[16]'`), bitfields
(`'UInt8:4'`), strings (`'utf8'`, `'utf8(16)'`, and the descriptor-object layouts), and nested structs.

Node.js 20 or later is required.

## See also

- [Getting Started](guide)
- [Unions](structures/unions)
