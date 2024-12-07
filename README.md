# Struct Serialization Library

This library provides a simple way to define and serialize data structures (structs) with support for both regular fields and bitfields.  
The library supports nested structs, allowing complex data structures to be serialized and deserialized easily.  
It is designed to work with binary buffers for use in scenarios like network protocols, binary file formats, or low-level data manipulation.

## Features

- **Bitfield support**: Serialize and deserialize fields with specific bit lengths (e.g., `UInt8:3` for 3-bits of an 8-bit unsigned integer).
- **Nested Structs**: Support for nested structs allows creating complex hierarchical data structures.
- **Array Support**: Support for fixed-size arrays (e.g., `Int16LE[8]`, `BigUInt64BE[12]`).
- **Type Safety**: TypeScript is used to ensure type safety and correct usage of the data structures.

## Installation

To install the library, you can use `npm` or `yarn`:

```bash
npm install @remotex-labs/xstruct
# or
yarn add @remotex-labs/xstruct
```

# Usage

## Defining a Struct

A `Struct` is defined by providing a schema in the form of an object, where the keys are field names and the values define the type and size of each field.

- Basic types like `UInt8`, `Int16`, etc., can be specified, optionally with a bit-length.
- Arrays can be defined using the syntax <Type>[<size>] (e.g., `Int16LE[8]` for an array of 8-Int16LE values).
- Nested structs are specified by passing another `Struct` instance as a value.

**Example**

```typescript
import { Struct } from '@remotex-labs/xstruct';

// Define a basic struct with bitfields and arrays
const s1 = new Struct({
    AAAA: 'UInt8:3',  // 3 bits from a UInt8
    BBBB: 'UInt8:2',   // 2 bits from a UInt8
    data: { type: 'string', size: 10 }, // String data max-size 10 bytes
    intArray: 'Int16LE[8]' // Array of 8 Int16LE values
});

// Define a struct with a nested struct and arrays
const s2 = new Struct({
    field1: 'UInt8:4',  // 4 bits from a UInt8
    field2: s1          // Nested struct s1
});

// Define the top-level struct with another nested struct
const s = new Struct({
    T1: 'UInt8',  // Regular 8-bit unsigned integer
    T2: 'UInt8',  // Another UInt8
    T3: s2        // Nested struct s2
});
```

### Serializing Data to a Buffer

You can use the `toBuffer` method to serialize an object into a binary `Buffer` based on the defined `Struct` schema.

**Example**

```typescript
// Data object to be serialized
const data = {
    T1: 15,
    T2: 20,
    T3: {
        field1: 1,
        field2: {
            AAAA: 2,
            BBBB: 2,
            data: 'test',
            intArray: [ 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48 ]
        }
    }
};

// Serialize the data
const buffer = s.toBuffer(data);

// Output the serialized buffer
console.log(buffer);
```

### Deserializing Data from a Buffer

Arrays can be defined as a field by appending the desired size in square brackets, for example:

```typescript
const arrayStruct = new Struct({
    intArray: 'Int32LE[8]',  // Array of 8 Int16LE values
    bigUIntArray: 'BigUInt64BE[12]' // Array of 12 BigUInt64BE values
});
```

In the above example, `intArray` will be serialized as a sequence of 16-bit signed integers in Little Endian format,
and `bigUIntArray` as a sequence of 64-bit unsigned integers in Big Endian format.

### Handling Arrays during Serialization

When serializing or deserializing an object that contains arrays, the library ensures that the array length is correctly respected.
If the data does not fit the array size defined in the schema, an error will be thrown.

**Example with Array Serialization and Deserialization**

```typescript
const data = {
    intArray: [ 0x1234, 0x5678, 0x9ABC, 0xDEF0, 0x1111, 0x2222, 0x3333, 0x4444 ],
    bigUIntArray: [ 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, 11n, 12n ]
};

// Serialize the data
const buffer = arrayStruct.toBuffer(data);
console.log(buffer);

// Deserialize the buffer back into an object
const deserializedData = arrayStruct.toObject(buffer);
console.log(deserializedData);
```

### Deserializing Data from a Buffer

You can use the `toObject` method to deserialize a binary `Buffer` back into an object that matches the schema of the `Struct`.
**Example**

```typescript
// Deserialize the buffer back into an object
const deserializedData = s.toObject(buffer);

// Output the deserialized object
console.log(deserializedData);
```

### Example Use Case

```typescript
// Define a basic struct with bitfields and arrays
const s1 = new Struct({
    AAAA: 'UInt8:3',  // 3 bits from a UInt8
    BBBB: 'UInt8:2',   // 2 bits from a UInt8
    data: { type: 'string', size: 10 }, // String data max-size 10 bytes
    intArray: 'Int16LE[8]' // Array of 8 Int16LE values
});

// Define a struct with a nested struct and arrays
const s2 = new Struct({
    field1: 'UInt8:4',  // 4 bits from a UInt8
    field2: s1          // Nested struct s1
});

// Define the top-level struct with another nested struct
const s = new Struct({
    T1: 'UInt8',  // Regular 8-bit unsigned integer
    T2: 'UInt8',  // Another UInt8
    T3: s2        // Nested struct s2
});

// Data object to be serialized
const data = {
    T1: 15,
    T2: 20,
    T3: {
        field1: 1,
        field2: {
            AAAA: 2,
            BBBB: 2,
            data: 'test',
            intArray: [ 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48 ]
        }
    }
};

// Serialize the data
const buffer = s.toBuffer(data);

// Output the serialized buffer
console.log(buffer);

// Deserialize the buffer back into an object
const deserializedData = s.toObject(buffer);

// Output the deserialized object
console.log(deserializedData);
```

### Defining a Simple Struct

You can define a simple struct with basic field types. For example, a network packet with an ID and a status field.

```typescript
// Define a struct for a packet with a header
const packet = new Struct({
    packetId: 'UInt16BE',  // 16-bit unsigned integer for packet ID 
    status: 'UInt8'      // 8-bit unsigned integer for packet status
});
```

### Example 1: Serialize and Deserialize a Simple Struct

Let's say we want to serialize and deserialize a packet with an ID of `1234` and a status of `1`.

```typescript
const data = {
    packetId: 1234,
    status: 1
};

// Serialize to a buffer
const buffer = packet.toBuffer(data);
console.log('Serialized Buffer:', buffer);

// Deserialize the buffer back into an object
const deserializedData = packet.toObject(buffer);
console.log('Deserialized Data:', deserializedData);
```

#### Output:

```textmate
Serialized Buffer: <Buffer 04 d2 01>
Deserialized Data: { packetId: 1234, status: 1 }
```

### Example 2: Working with Bitfields

In many low-level protocols, data is packed into a small number of bits. For instance, you might need to store flags in just a few bits of an integer.

#### Define a struct with bitfields:

```typescript
const flagsStruct = new Struct({
    flagA: 'UInt8:3',  // 3 bits for flag A
    flagB: 'UInt8:2'   // 2 bits for flag B
});
```

#### Serialize and deserialize a bitfield:

Here, we can define the flags as `flagA = 5` (binary `101`) and `flagB = 2` (binary `10`).

```typescript
const flagsData = {
    flagA: 5,  // binary 101
    flagB: 2   // binary 10
};

// Serialize to a buffer
const flagsBuffer = flagsStruct.toBuffer(flagsData);
console.log('Serialized Bitfield Buffer:', flagsBuffer);

// Deserialize the buffer back into an object
const flagsDeserialized = flagsStruct.toObject(flagsBuffer);
console.log('Deserialized Bitfield Data:', flagsDeserialized);
```

#### Output

```textmate
Serialized Bitfield Buffer: <Buffer 15>
Deserialized Bitfield Data: { flagA: 5, flagB: 2 }
```

### Example 3: Nested Structs

You can define more complex data structures by nesting structs within one another. For example, consider a `Person` struct containing an address and contact information.

```typescript
// Define the Address struct
const address = new Struct({
    street: 'UInt8:7',   // 6 bits for the street number
    city: 'UInt8:8'      // 8 bits for the city code
});

// Define the Person struct with nested Address
const person = new Struct({
    name: { type: 'string', size: 3 },    // 3 bytes for the person's name
    age: 'UInt8',       // 8 bits for the person's age
    address: address    // Nested Address struct
});
```

#### Serialize and deserialize a nested struct:

```typescript

const personData = {
    name: 'Hi!',
    age: 30,
    address: {
        street: 123,
        city: 45
    }
};

// Serialize the data to a buffer
const personBuffer = person.toBuffer(personData);
console.log('Serialized Nested Struct Buffer:', personBuffer);

// Deserialize the buffer back into an object
const personDeserialized = person.toObject(personBuffer);
console.log('Deserialized Nested Struct Data:', personDeserialized);
```

### Output:

```textmate
Serialized Nested Struct Buffer: <Buffer 48 69 21 1e 7b 2d>
Deserialized Nested Struct Data: { name: 'Hi!', age: 30, address: { street: 123, city: 45 } }
```

### Example 4: Complex Network Protocol

A real-world example might involve a network packet with headers, flags, and an embedded struct for connection information.

#### Define the Network Packet Struct

```typescript
// Define a Struct for Connection Info
const connectionInfo = new Struct({
    ip: 'UInt8:4',     // 4 bits for the IP address
    port: 'UInt8:4'    // 4 bits for the port number
});

// Define the main Network Packet struct with bitfields and nested struct
const networkPacket = new Struct({
    header: 'UInt8:8',         // 8 bits for the packet header
    flags: 'UInt8:2',          // 2 bits for flags
    connection: connectionInfo // Nested Connection Info struct
});
```

#### Serialize and Deserialize the Network Packet

```typescript
const networkData = {
    header: 255,        // 11111111 in binary
    flags: 3,           // 11 in binary
    connection: {
        ip: 8,          // binary 1000 for the IP
        port: 7         // binary 0111 for the port
    }
};

// Serialize to a buffer
const networkBuffer = networkPacket.toBuffer(networkData);
console.log('Serialized Network Packet Buffer:', networkBuffer);

// Deserialize the buffer back into an object
const networkDeserialized = networkPacket.toObject(networkBuffer);
console.log('Deserialized Network Packet Data:', networkDeserialized);
```

#### Output:

```textmate
Serialized Network Packet Buffer: <Buffer ff 03 78>
Deserialized Network Packet Data: { header: 255, flags: 3, connection: { ip: 8, port: 7 } }
```

### Supported Field Types

- **Unsigned and Signed Integer Types**:
    - `UInt8`, `Int8`: 8-bit unsigned and signed integers.
    - `UInt16`, `Int16`: 16-bit unsigned and signed integers.
        - Supports both **Little Endian (LE)** and **Big Endian (BE)** byte order:
            - `UInt16LE`, `Int16LE`: 16-bit unsigned/signed integers, Little Endian byte order.
            - `UInt16BE`, `Int16BE`: 16-bit unsigned/signed integers, Big Endian byte order.
    - `UInt32`, `Int32`: 32-bit unsigned and signed integers.
        - Supports both **Little Endian (LE)** and **Big Endian (BE)** byte order:
            - `UInt32LE`, `Int32LE`: 32-bit unsigned/signed integers, Little Endian byte order.
            - `UInt32BE`, `Int32BE`: 32-bit unsigned/signed integers, Big Endian byte order.
    - `BigUInt64`, `BigInt64`: 64-bit unsigned and signed integers.
        - Supports both **Little Endian (LE)** and **Big Endian (BE)** byte order:
            - `BigUInt64LE`, `BigInt64LE`: 64-bit unsigned/signed integers, Little Endian byte order.
            - `BigUInt64BE`, `BigInt64BE`: 64-bit unsigned/signed integers, Big Endian byte order.

- **Bitfield Types**:
    - Bitfield types are supported using the `n` bit-length format.
        - For example, `UInt8:3` defines a 3-bit section within an 8-bit unsigned integer.

These field types provide precise control over the size and byte order of data when defining the schema for your structs, enabling you to correctly handle binary serialization, networking protocols, or low-level data manipulation.

### Methods

- `toObject<T extends object>(buffer: Buffer): T`: Deserializes a buffer into an object of type `T` based on the struct schema.
- `toBuffer<T extends object>(data: T): Buffer`: Serializes an object of type `T` into a buffer based on the struct schema.
