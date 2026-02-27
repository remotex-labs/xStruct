# Getting Started

Welcome to xStruct! This guide will help you get started with defining, serializing, and deserializing binary data structures in TypeScript.

## Installation

Install xStruct using your preferred package manager:

::: code-group

```bash [npm]
npm install @remotex-labs/xstruct
```

```bash [yarn]
yarn add @remotex-labs/xstruct
```

```bash [pnpm]
pnpm add @remotex-labs/xstruct
```

:::

## Quick Start

Here's a simple example to get you started:

```ts
import { Struct } from '@remotex-labs/xstruct';

// Define a struct schema
const userStruct = new Struct({
    id: 'UInt32LE',
    age: 'UInt8',
    name: 'string'
});

// Serialize data to buffer
const buffer = userStruct.toBuffer({
    id: 12345,
    age: 30,
    name: 'Alice'
});

// Deserialize buffer to object
const user = userStruct.toObject(buffer);
console.log(user); // { id: 12345, age: 30, name: 'Alice' }
```

## Core Concepts

### Struct Schema

A struct schema defines the structure of your binary data. Each field in the schema specifies:

- **Field name**: The property name in your object
- **Field type**: The data type (primitive, string, array, or nested struct)
- **Optional configuration**: Size, endianness, encoding, etc.

```ts
const schema = {
    version: 'UInt8',           // Simple primitive type
    flags: 'UInt16LE',          // Little-endian 16-bit unsigned integer
    name: { type: 'string', size: 20 }  // Fixed-size string
};
```

### Type Safety

xStruct fully supports TypeScript for compile-time type checking:

```ts
interface User {
    id: number;
    age: number;
    name: string;
}

const userStruct = new Struct<User>({
    id: 'UInt32LE',
    age: 'UInt8',
    name: 'string'
});

// TypeScript ensures type safety
const user: User = userStruct.toObject(buffer);
```

## Supported Types

### Primitive Types

xStruct supports a wide range of primitive numeric types:

#### Unsigned Integers

```ts
const schema = {
    byte: 'UInt8',           // 0 to 255
    shortLE: 'UInt16LE',     // 0 to 65,535 (little-endian)
    shortBE: 'UInt16BE',     // 0 to 65,535 (big-endian)
    intLE: 'UInt32LE',       // 0 to 4,294,967,295 (little-endian)
    intBE: 'UInt32BE',       // 0 to 4,294,967,295 (big-endian)
    bigIntLE: 'BigUInt64LE', // 0 to 2^64-1 (little-endian)
    bigIntBE: 'BigUInt64BE'  // 0 to 2^64-1 (big-endian)
};
```

#### Signed Integers

```ts
const schema = {
    byte: 'Int8',           // -128 to 127
    shortLE: 'Int16LE',     // -32,768 to 32,767 (little-endian)
    shortBE: 'Int16BE',     // -32,768 to 32,767 (big-endian)
    intLE: 'Int32LE',       // -2,147,483,648 to 2,147,483,647 (little-endian)
    intBE: 'Int32BE',       // -2,147,483,648 to 2,147,483,647 (big-endian)
    bigIntLE: 'BigInt64LE', // -2^63 to 2^63-1 (little-endian)
    bigIntBE: 'BigInt64BE'  // -2^63 to 2^63-1 (big-endian)
};
```

#### Floating Point

```ts
const schema = {
    floatLE: 'FloatLE',     // 32-bit float (little-endian)
    floatBE: 'FloatBE',     // 32-bit float (big-endian)
    doubleLE: 'DoubleLE',   // 64-bit float (little-endian)
    doubleBE: 'DoubleBE'    // 64-bit float (big-endian)
};
```

### String Types

xStruct provides flexible string handling with multiple encoding options:

#### Basic String Types

```ts
const schema = {
    defaultStr: 'string',   // UTF-8 with length prefix
    asciiStr: 'ascii',      // ASCII encoding
    utf8Str: 'utf8'         // Explicit UTF-8 encoding
};
```

#### Fixed-Size Strings

Define strings with a fixed buffer size (padded or truncated):

```ts
const schema = {
    name: { type: 'ascii', size: 20 },      // 20-byte ASCII string
    description: { type: 'utf8', size: 64 }  // 64-byte UTF-8 string
};

const struct = new Struct(schema);
const buffer = struct.toBuffer({
    name: 'Alice',                           // Padded to 20 bytes
    description: 'A very long description...' // Truncated to 64 bytes
});
```

#### Length-Prefixed Strings

Strings with automatic length prefixes:

```ts
const schema = {
    shortText: { type: 'utf8', lengthType: 'UInt8' },     // Max 255 bytes
    mediumText: { type: 'utf8', lengthType: 'UInt16LE' }, // Max 65,535 bytes
    longText: { type: 'utf8', lengthType: 'UInt32LE' }    // Max 4GB
};
```

#### Null-Terminated Strings

C-style null-terminated strings:

```ts
const schema = {
    cString: { type: 'utf8', nullTerminated: true },
    limitedCString: {
        type: 'ascii',
        nullTerminated: true,
        maxLength: 100
    }
};
```

::: warning
When reading null-terminated strings, if no null terminator is found within `maxLength`, an error will be thrown.
:::

#### String Arrays

Arrays of strings with fixed size:

```ts
const schema = {
    names: 'string[5]',      // Array of 5 strings (default encoding)
    tags: 'ascii[10]',       // Array of 10 ASCII strings
    labels: 'utf8[3]'        // Array of 3 UTF-8 strings
};

const struct = new Struct(schema);
const buffer = struct.toBuffer({
    names: [ 'Alice', 'Bob', 'Carol', 'Dave', 'Eve' ],
    tags: [ 'tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9', 'tag10' ],
    labels: [ 'Label A', 'Label B', 'Label C' ]
});
```

::: tip
Each string in an array is independently serialized with its own length prefix (UInt16LE by default).
:::

### Arrays

Define arrays of any supported type:

#### Primitive Arrays

```ts
const schema = {
    // Short syntax
    bytes: 'UInt8[16]',
    numbers: 'Int32LE[10]',

    // Descriptor syntax
    bigInts: { type: 'BigUInt64BE', arraySize: 5 },
    floats: { type: 'FloatLE', arraySize: 8 }
};

const struct = new Struct(schema);
const buffer = struct.toBuffer({
    bytes: [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ],
    numbers: [ 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000 ],
    bigInts: [ 1n, 2n, 3n, 4n, 5n ],
    floats: [ 1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8 ]
});
```

### Bitfields

Bitfields allow you to pack multiple values into a single byte or multi-byte field:

#### Basic Bitfields

```ts
const packetStruct = new Struct({
    // 4 bits for message type (0-15)
    messageType: 'UInt8:4',
    // 4 bits for priority (0-15)
    priority: 'UInt8:4',
    // 3 bits for flags
    flags: 'UInt8:3',
    // 5 bits for channel
    channel: 'UInt8:5'
});

const buffer = packetStruct.toBuffer({
    messageType: 3,   // Uses 4 bits
    priority: 2,      // Uses 4 bits (packed with messageType in 1 byte)
    flags: 5,         // Uses 3 bits
    channel: 12       // Uses 5 bits (packed with flags in 1 byte)
});
```

#### Supported Bitfield Types

```text
// 8-bit bitfields
'UInt8:1' to 'UInt8:8'
'Int8:1' to 'Int8:8'

// 16-bit bitfields
'UInt16LE:1' to 'UInt16LE:16'
'UInt16BE:1' to 'UInt16BE:16'
'Int16LE:1' to 'Int16LE:16'
'Int16BE:1' to 'Int16BE:16'
```

::: tip
Bitfields are automatically packed into the smallest number of bytes. Multiple consecutive bitfields of the same base type will be packed together.
:::

### Nested Structs

Create complex hierarchical structures by nesting structs:

```ts
// Define a Point struct
const PointStruct = new Struct({
    x: 'Int32LE',
    y: 'Int32LE'
});

// Define a Line struct with nested Point structs
const LineStruct = new Struct({
    id: 'UInt16LE',
    start: PointStruct,    // Single nested struct
    end: PointStruct       // Another nested struct
});

// Use it
const buffer = LineStruct.toBuffer({
    id: 1,
    start: { x: 0, y: 0 },
    end: { x: 100, y: 50 }
});

const line = LineStruct.toObject(buffer);
```

#### Arrays of Nested Structs

```ts
const ShapeStruct = new Struct({
    type: 'UInt8',
    name: 'string',
    // Array of 10 Point structs
    vertices: { type: PointStruct, arraySize: 10 }
});

const buffer = ShapeStruct.toBuffer({
    type: 1,
    name: 'Polygon',
    vertices: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
        // ... 6 more points
    ]
});
```

## Advanced Usage

### Working with Buffers

#### Buffer Size Calculation

xStruct automatically calculates the required buffer size:

```ts
const struct = new Struct({
    id: 'UInt32LE',
    flags: 'UInt16LE',
    data: 'UInt8[32]'
});

const size = struct.getSize();
console.log(size); // 38 bytes (4 + 2 + 32)
```

#### Manual Buffer Creation

```ts
const struct = new Struct({
    version: 'UInt8',
    timestamp: 'BigUInt64LE'
});

// Create buffer manually
const buffer = Buffer.alloc(struct.getSize());

// Write data to existing buffer
struct.toBuffer({ version: 1, timestamp: BigInt(Date.now()) }, buffer);
```

### Dynamic Offset Tracking

Track buffer position during deserialization:

```ts
const struct = new Struct({
    header: 'UInt32LE',
    payload: 'UInt8[16]'
});

let currentOffset = 0;
const data = struct.toObject(buffer, (offset) => {
    currentOffset = offset;
    console.log(`Current offset: ${ offset }`);
});

console.log(`Final offset: ${ currentOffset }`);
```

### Complex Real-World Example

Here's a more complex example combining multiple features:

```ts
// Define a network packet structure
const PacketHeaderStruct = new Struct({
    version: 'UInt8',
    messageType: 'UInt8:4',
    priority: 'UInt8:4',
    sequenceNumber: 'UInt32LE',
    timestamp: 'BigUInt64LE'
});

const PacketStruct = new Struct({
    header: PacketHeaderStruct,
    payloadSize: 'UInt16LE',
    payload: 'UInt8[256]',
    checksum: 'UInt32LE'
});

// Serialize a packet
const packetBuffer = PacketStruct.toBuffer({
    header: {
        version: 1,
        messageType: 5,
        priority: 3,
        sequenceNumber: 12345,
        timestamp: BigInt(Date.now())
    },
    payloadSize: 64,
    payload: new Array(256).fill(0),
    checksum: 0x12345678
});

// Deserialize a packet
const packet = PacketStruct.toObject(packetBuffer);
console.log(packet.header.version);
console.log(packet.header.messageType);
```

## Best Practices

### 1. Use TypeScript Interfaces

Always define TypeScript interfaces for your structs:

```ts
interface PacketHeader {
    version: number;
    flags: number;
    length: number;
}

const headerStruct = new Struct<PacketHeader>({
    version: 'UInt8',
    flags: 'UInt16LE',
    length: 'UInt32LE'
});
```

### 2. Choose Appropriate Endianness

Select endianness based on your target platform:

- **Little-endian (LE)**: x86, x86-64, ARM (common)
- **Big-endian (BE)**: Network protocols (network byte order)

```ts
// For network protocols, use big-endian
const networkStruct = new Struct({
    magic: 'UInt32BE',
    version: 'UInt16BE'
});

// For local storage, match your platform (usually little-endian)
const localStruct = new Struct({
    id: 'UInt32LE',
    timestamp: 'BigUInt64LE'
});
```

### 3. Use Bitfields for Flags

Bitfields are perfect for compact flag storage:

```ts
const flagsStruct = new Struct({
    isEnabled: 'UInt8:1',
    isVisible: 'UInt8:1',
    isLocked: 'UInt8:1',
    priority: 'UInt8:2',
    category: 'UInt8:3'
});
```

### 4. Validate Data Before Serialization

Always validate your data to avoid runtime errors:

```ts
function validateUser(user: any): user is User {
    return (
        typeof user.id === 'number' &&
        typeof user.age === 'number' &&
        user.age >= 0 && user.age <= 255 &&
        typeof user.name === 'string'
    );
}

const userStruct = new Struct<User>({
    id: 'UInt32LE',
    age: 'UInt8',
    name: 'string'
});

if (validateUser(userData)) {
    const buffer = userStruct.toBuffer(userData);
}
```

## Common Patterns

### Protocol Header

```ts
const ProtocolHeader = new Struct({
    magic: 'UInt32BE',        // Protocol identifier
    version: 'UInt8',         // Protocol version
    messageType: 'UInt8',     // Message type
    flags: 'UInt16LE',        // Flags
    payloadLength: 'UInt32LE' // Payload size
});
```

### Configuration File

```ts
const ConfigStruct = new Struct({
    version: 'UInt16LE',
    serverPort: 'UInt16LE',
    maxConnections: 'UInt32LE',
    serverName: { type: 'ascii', size: 64 },
    enableLogging: 'UInt8:1',
    enableMetrics: 'UInt8:1',
    reserved: 'UInt8:6'
});
```

### Data Record

```ts
const RecordStruct = new Struct({
    id: 'UInt32LE',
    timestamp: 'BigUInt64LE',
    status: 'UInt8',
    priority: 'UInt8',
    data: 'UInt8[128]',
    checksum: 'UInt32LE'
});
```

## Error Handling

xStruct throws errors for common issues:

```ts
try {
    const data = struct.toObject(buffer);
} catch (error) {
    if (error.message.includes('Buffer size is less than expected')) {
        console.error('Buffer too small for schema');
    } else if (error.message.includes('Invalid buffer')) {
        console.error('Invalid buffer provided');
    }
}
```

## Performance Tips

1. **Reuse Struct Instances**: Create struct instances once and reuse them
2. **Pre-allocate Buffers**: When serializing many objects, consider buffer pooling
3. **Use Fixed-Size Strings**: Fixed-size strings are faster than length-prefixed ones
4. **Batch Operations**: Process multiple records in batches when possible

## Need Help?

- 💬 [Discord](https://discord.gg/psV9grS9th)
- 🐛 [Issue Tracker](https://github.com/remotex-labs/xStruct/issues)
- 📦 [npm Package](https://www.npmjs.com/package/@remotex-labs/xstruct)
