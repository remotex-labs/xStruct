# xStruct

[![Documentation](https://img.shields.io/badge/Documentation-orange?logo=typescript&logoColor=f5f5f5)](https://remotex-labs.github.io/xStruct/)
[![npm version](https://img.shields.io/npm/v/@remotex-labs/xstruct.svg)](https://www.npmjs.com/package/@remotex-labs/xstruct)
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL_2.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)
[![Node.js CI](https://github.com/remotex-labs/xStruct/actions/workflows/test.yml/badge.svg)](https://github.com/remotex-labs/xStruct/actions/workflows/test.yml)
[![Discord](https://img.shields.io/discord/1364348850696884234?logo=Discord&label=Discord)](https://discord.gg/psV9grS9th)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/remotex-labs/xStruct)

A TypeScript library for defining, serializing, and deserializing binary data structures with support for primitive types, bitfields, arrays, and nested structures.

This library provides a simple way to define and serialize data structures (structs) with support for both regular fields and bitfields.  
The library supports nested structs, allowing complex data structures to be serialized and deserialized easily.  
It is designed to work with binary buffers for use in scenarios like network protocols, binary file formats, or low-level data manipulation.

## Key Features

- **Powerful**: Handle complex binary structures with minimal code
- **Type-safe**: Full TypeScript support with interface validation
- **Flexible**: Support for primitive types, strings, arrays, and nested structures

## Core Types

### Integer Types

| Type             | Description                         | Range                           |
|------------------|-------------------------------------|---------------------------------|
| **Unsigned**     |                                     |                                 |
| `UInt8`          | 8-bit unsigned                      | 0 to 255                        |
| `UInt16LE/BE`    | 16-bit unsigned (little/big endian) | 0 to 65,535                     |
| `UInt32LE/BE`    | 32-bit unsigned (little/big endian) | 0 to 4,294,967,295              |
| `BigUInt64LE/BE` | 64-bit unsigned (little/big endian) | 0 to 2^64-1                     |
| **Signed**       |                                     |                                 |
| `Int8`           | 8-bit signed                        | -128 to 127                     |
| `Int16LE/BE`     | 16-bit signed (little/big endian)   | -32,768 to 32,767               |
| `Int32LE/BE`     | 32-bit signed (little/big endian)   | -2,147,483,648 to 2,147,483,647 |
| `BigInt64LE/BE`  | 64-bit signed (little/big endian)   | -2^63 to 2^63-1                 |

### Floating Point Types

- `FloatLE/BE`: 32-bit floating point (little/big endian)
- `DoubleLE/BE`: 64-bit floating point (little/big endian)

### String Types

- `string`: Default UTF-8 with length prefix
- `ascii`: ASCII encoding
- `utf8`: Explicit UTF-8 encoding

### Bitfields

Defined as `Type:BitCount` (e.g., `UInt8:3` for 3 bits from an 8-bit unsigned integer).

Supported formats:

- 8-bit: `UInt8:1` to `UInt8:8`, `Int8:1` to `Int8:8`
- 16-bit: `UInt16LE/BE:1` to `UInt16LE/BE:16`, `Int16LE/BE:1` to `Int16LE/BE:16`

## Installation

```bash
npm install @remotex-labs/xstruct
# or
yarn add @remotex-labs/xstruct
```

## Usage

### Basic Struct Definition

```ts
import { Struct } from '@remotex-labs/xstruct';

const headerStruct = new Struct({
  version: 'UInt8',
  flags: 'UInt16LE',
  messageType: 'UInt8:4',  // 4-bit field
  priority: 'UInt8:4'      // 4-bit field
});

// Serialize data
const buffer = headerStruct.toBuffer({
  version: 1,
  flags: 0x0203,
  messageType: 3,
  priority: 2
});

// Deserialize data
const data = headerStruct.toObject(buffer);
```

### String Configuration Options

- `string`: Default string encoding UTF-8
- `ascii`: ASCII-encoded strings
- `utf8`: UTF-8 encoded strings

#### String and string arrays can be defined by appending the array size in square brackets:

```ts
new Struct({
    a: 'string',     // Single string with default encoding
    b: 'ascii',      // Single ASCII-encoded string
    c: 'utf8',       // Single UTF-8 encoded string
    d: 'string[2]',  // Array of 2 strings with default encoding
    e: 'ascii[5]',   // Array of 5 ASCII-encoded strings
    f: 'utf8[8]'     // Array of 8 UTF-8 encoded strings
});
```

> **Note**: When using string arrays, the data you provide must match the array length specified in the schema.
> Each element in the array is independently serialized with its own length prefix (UInt16LE).

#### Fixed-Size Strings

```ts
const fixedStruct = new Struct({
  name: { type: 'ascii', size: 10 },  // 10 bytes, padded or truncated
  description: { type: 'utf8', size: 32 }  // 32 bytes, padded or truncated
});
```

#### Length-Prefixed Strings

- `UInt8`: 1-byte prefix (strings up to 255 bytes)
- `UInt16LE`/`UInt16BE`: 2-byte prefix (strings up to 65,535 bytes)
- `UInt32LE`/`UInt32BE`: 4-byte prefix (strings up to 4GB)

```ts
const prefixedStruct = new Struct({
  shortText: { type: 'utf8', lengthType: 'UInt8' },       // Max 255 bytes
  mediumText: { type: 'utf8', lengthType: 'UInt16LE' }    // Max 65,535 bytes
});
```

#### Null-Terminated Strings

```ts
const nullTermStruct = new Struct({
  cString: { type: 'utf8', nullTerminated: true },
  limitedString: { type: 'ascii', nullTerminated: true, maxLength: 100 }
});
```

> **Note**: When writing strings, use the `nullTerminated` option with `maxLength` to limit string length during serialization only.
> This doesn't affect the buffer size calculation or reading.
> If a null terminator is not found within the specified `maxLength` when reading, an error will be thrown.

### Arrays

```ts
const arrayStruct = new Struct({
  // Array of 8 Int32LE values
  intValues: 'Int32LE[8]',
  
  // Alternative syntax
  bigIntValues: { type: 'BigUInt64BE', arraySize: 12 }
});
```

### Nested Structs

```ts
// Define a Point struct
const PointStruct = new Struct({
  x: 'Int32LE',
  y: 'Int32LE'
});

// Create a struct with nested struct array
const shapeStruct = new Struct({
  type: 'UInt8',
  name: 'string',
  points: { type: PointStruct, arraySize: 10 },  // Array of 10 Points
  points: PointStruct  // single element
});
```

## Type-Safe Usage with TypeScript

```ts
interface Point {
  x: number;
  y: number;
}

interface Shape {
  type: number;
  name: string;
  points: Point[];
}

const shapeStruct = new Struct<Shape>({
  type: 'UInt8',
  name: 'string',
  points: { type: PointStruct, arraySize: 10 }
});

// TypeScript now enforces correct property types
const shape: Shape = {
  type: 1,
  name: "Triangle",
  points: [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 5, y: 8 },
    // ... padded to 10 points
  ]
};
```

## Documentation

For complete API documentation, examples, and guides, visit: [xStruct Documentation](https://remotex-labs.github.io/xStruct/)

## Compatibility

- Node.js 20+
- All modern browsers (via bundlers)
- TypeScript 4.5+

## Contributing

Contributions are welcome!\
Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the Mozilla Public License 2.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with TypeScript

## Links

- [Documentation](https://remotex-labs.github.io/xStruct/)
- [GitHub Repository](https://github.com/remotex-labs/xStruct)
- [Issue Tracker](https://github.com/remotex-labs/xStruct/issues)
- [npm Package](https://www.npmjs.com/package/@remotex-labs/xstruct)
