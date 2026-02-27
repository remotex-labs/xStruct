# Best Practices

Comprehensive guide to writing efficient, maintainable, and performant code with xStruct.

## Overview

Following best practices when working with xStruct ensures optimal performance,
maintainability, and reliability in your binary data handling.
This guide covers schema design, performance optimization, error handling, and testing strategies.

**Key Areas:**

- **Schema Design**: Organizing and structuring schemas effectively
- **Performance**: Optimizing memory usage and processing speed
- **Type Safety**: Leveraging TypeScript for compile-time validation
- **Error Handling**: Gracefully managing serialization/deserialization errors
- **Testing**: Validating binary data operations
- **Documentation**: Maintaining clear schema specifications

## Schema Design

### Keep Schemas Simple and Focused

```ts
// ✅ Good: Single responsibility
const UserHeaderSchema = new Struct({
    id: 'UInt32LE',
    timestamp: 'BigUInt64LE',
    flags: 'UInt8'
});

const UserDataSchema = new Struct({
    header: UserHeaderSchema,
    name: 'string',
    email: 'string'
});

// ❌ Bad: Monolithic schema
const EverythingSchema = new Struct({
    userId: 'UInt32LE',
    userTimestamp: 'BigUInt64LE',
    userFlags: 'UInt8',
    userName: 'string',
    userEmail: 'string',
    postId: 'UInt32LE',
    postContent: 'string',
    // ... 50 more fields
});
```

### Use Descriptive Field Names

```ts
// ✅ Good: Clear and descriptive
const PacketSchema = new Struct({
    protocolVersion: 'UInt8',
    messageType: 'UInt8',
    sequenceNumber: 'UInt32BE',
    payloadLength: 'UInt16BE',
    payload: 'UInt8[1024]'
});

// ❌ Bad: Cryptic abbreviations
const PacketSchema = new Struct({
    pv: 'UInt8',
    mt: 'UInt8',
    sn: 'UInt32BE',
    pl: 'UInt16BE',
    p: 'UInt8[1024]'
});
```

### Choose Appropriate Data Types

```ts
// ✅ Good: Right-sized types
const ConfigSchema = new Struct({
    enableLogging: 'UInt8:1',      // Boolean flag (1 bit)
    logLevel: 'UInt8:3',           // 0-7 (3 bits)
    maxConnections: 'UInt16LE',    // 0-65535 (2 bytes)
    serverPort: 'UInt16BE',        // Network port (2 bytes)
    sessionTimeout: 'UInt32LE'     // Seconds (4 bytes)
});

// ❌ Bad: Oversized types
const ConfigSchema = new Struct({
    enableLogging: 'UInt32LE',     // Wastes 31 bits
    logLevel: 'UInt32LE',          // Wastes 29 bits
    maxConnections: 'UInt32LE',    // Wastes 2 bytes
    serverPort: 'UInt32LE',        // Wastes 2 bytes
    sessionTimeout: 'UInt32LE'     // OK
});
```

### Use Bitfields for Flags

```ts
// ✅ Good: Packed flags (1 byte total)
const PermissionSchema = new Struct({
    canRead: 'UInt8:1',
    canWrite: 'UInt8:1',
    canExecute: 'UInt8:1',
    canDelete: 'UInt8:1',
    isAdmin: 'UInt8:1',
    isOwner: 'UInt8:1',
    reserved: 'UInt8:2'
});

// ❌ Bad: Individual bytes (6 bytes total)
const PermissionSchema = new Struct({
    canRead: 'UInt8',
    canWrite: 'UInt8',
    canExecute: 'UInt8',
    canDelete: 'UInt8',
    isAdmin: 'UInt8',
    isOwner: 'UInt8'
});
```

### Align Fields for Better Performance

```ts
// ✅ Good: Aligned fields
const AlignedSchema = new Struct({
    // 8-byte fields first
    timestamp: 'BigUInt64LE',

    // 4-byte fields
    id: 'UInt32LE',
    size: 'UInt32LE',

    // 2-byte fields
    port: 'UInt16LE',
    flags: 'UInt16LE',

    // 1-byte fields
    type: 'UInt8',
    status: 'UInt8'
});

// ⚠️ Acceptable but less optimal: Mixed alignment
const MixedSchema = new Struct({
    type: 'UInt8',           // 1 byte
    timestamp: 'BigUInt64LE', // 8 bytes
    port: 'UInt16LE',        // 2 bytes
    id: 'UInt32LE'           // 4 bytes
});
```

## Type Safety

### Use TypeScript Interfaces

```ts
// ✅ Good: Type-safe schema
interface UserData {
    id: number;
    name: string;
    email: string;
    age: number;
    isActive: number;
}

const UserSchema = new Struct<UserData>({
    id: 'UInt32LE',
    name: 'string',
    email: 'string',
    age: 'UInt8',
    isActive: 'UInt8:1'
});

// Compile-time type checking
const buffer = UserSchema.toBuffer({
    id: 123,
    name: 'Alice',
    email: 'alice@example.com',
    age: 30,
    isActive: 1
    // Missing fields or wrong types will error at compile time
});

// ❌ Bad: No type safety
const UserSchema = new Struct({
    id: 'UInt32LE',
    name: 'string',
    email: 'string',
    age: 'UInt8',
    isActive: 'UInt8:1'
});

// No compile-time validation
const buffer = UserSchema.toBuffer({
    id: '123',  // Wrong type, caught only at runtime
    name: 'Alice'
    // Missing fields, caught only at runtime
});
```

### Create Type Aliases for Complex Schemas

```ts
// ✅ Good: Reusable types
type Point2D = { x: number; y: number };
type Point3D = { x: number; y: number; z: number };

const Point2DSchema = new Struct<Point2D>({
    x: 'FloatLE',
    y: 'FloatLE'
});

const Point3DSchema = new Struct<Point3D>({
    x: 'FloatLE',
    y: 'FloatLE',
    z: 'FloatLE'
});

interface Shape {
    type: number;
    vertices: Point2D[];
}

const ShapeSchema = new Struct<Shape>({
    type: 'UInt8',
    vertices: { type: Point2DSchema, arraySize: 10 }
});
```

### Validate Enums

```ts
// ✅ Good: Enum validation
enum MessageType {
    CONNECT = 0,
    DISCONNECT = 1,
    DATA = 2,
    ACK = 3
}

interface Message {
    type: MessageType;
    sequenceNumber: number;
}

const MessageSchema = new Struct<Message>({
    type: 'UInt8',
    sequenceNumber: 'UInt32LE'
});

function validateMessageType(type: number): MessageType {
    if (!(type in MessageType)) {
        throw new Error(`Invalid message type: ${ type }`);
    }
    return type as MessageType;
}

// Usage
const data = MessageSchema.toObject(buffer);
const messageType = validateMessageType(data.type);
```

## Performance Optimization

### Reuse Buffers

```ts
// ✅ Good: Reuse pre-allocated buffer
const schema = new Struct({
    id: 'UInt32LE',
    timestamp: 'BigUInt64LE',
    value: 'FloatLE'
});

const buffer = Buffer.alloc(schema.size);

for (let i = 0; i < 10000; i++) {
    schema.toBuffer({
        id: i,
        timestamp: BigInt(Date.now()),
        value: Math.random()
    }, buffer);

    processBuffer(buffer);
}

// ❌ Bad: Allocate new buffer each iteration
for (let i = 0; i < 10000; i++) {
    const buffer = schema.toBuffer({
        id: i,
        timestamp: BigInt(Date.now()),
        value: Math.random()
    });

    processBuffer(buffer);  // Creates 10000 buffers!
}
```

### Cache Schema Instances

```ts
// ✅ Good: Singleton schema instances
class SchemaRegistry {
    private static instances = new Map<string, Struct>();

    static getPacketSchema(): Struct {
        if (!this.instances.has('packet')) {
            this.instances.set('packet', new Struct({
                magic: 'UInt32BE',
                type: 'UInt8',
                length: 'UInt16LE',
                data: 'UInt8[1024]'
            }));
        }
        return this.instances.get('packet')!;
    }
}

// Use cached instance
const schema = SchemaRegistry.getPacketSchema();

// ❌ Bad: Create schema repeatedly
function processPacket(data: Buffer) {
    const schema = new Struct({  // Created every call!
        magic: 'UInt32BE',
        type: 'UInt8',
        length: 'UInt16LE',
        data: 'UInt8[1024]'
    });

    return schema.toObject(data);
}
```

### Use Appropriate Array Sizes

```ts
// ✅ Good: Right-sized arrays
const ReasonableSchema = new Struct({
    header: 'UInt32LE',
    data: 'UInt8[1024]',      // 1KB
    checksum: 'UInt32LE'
});

// ❌ Bad: Excessively large arrays
const WastefulSchema = new Struct({
    header: 'UInt32LE',
    data: 'UInt8[10485760]',  // 10MB per instance!
    checksum: 'UInt32LE'
});

// ✅ Better: Use count + max size pattern
const FlexibleSchema = new Struct({
    header: 'UInt32LE',
    count: 'UInt16LE',        // Actual data length
    data: 'UInt8[1024]',      // Maximum capacity
    checksum: 'UInt32LE'
});
```

### Optimize Hot Paths

```ts
// ✅ Good: Optimized for frequent operations
class PacketProcessor {
    private schema: Struct;
    private buffer: Buffer;

    constructor() {
        this.schema = new Struct({
            type: 'UInt8',
            data: 'UInt8[512]'
        });
        this.buffer = Buffer.alloc(this.schema.size);
    }

    processMany(packets: Array<{ type: number; data: number[] }>) {
        // Reuse schema and buffer
        for (const packet of packets) {
            this.schema.toBuffer(packet, this.buffer);
            this.sendToNetwork(this.buffer);
        }
    }

    private sendToNetwork(buffer: Buffer): void {
        // ... network code
    }
}

// ❌ Bad: Allocations in hot path
class PacketProcessor {
    processMany(packets: Array<{ type: number; data: number[] }>) {
        for (const packet of packets) {
            const schema = new Struct({  // ❌ Created each iteration
                type: 'UInt8',
                data: 'UInt8[512]'
            });
            const buffer = schema.toBuffer(packet);  // ❌ New buffer each time
            this.sendToNetwork(buffer);
        }
    }

    private sendToNetwork(buffer: Buffer): void {
        // ... network code
    }
}
```

### Minimize Conversions

```ts
// ✅ Good: Direct buffer operations
function combinePackets(packets: Buffer[]): Buffer {
    const totalSize = packets.reduce((sum, buf) => sum + buf.length, 0);
    const combined = Buffer.allocUnsafe(totalSize);

    let offset = 0;
    for (const packet of packets) {
        packet.copy(combined, offset);
        offset += packet.length;
    }

    return combined;
}

// ❌ Bad: Unnecessary conversions
function combinePackets(packets: Buffer[]): Buffer {
    const schema = new Struct({ /* ... */ });
    const objects = packets.map(buf => schema.toObject(buf));  // ❌

    // ... manipulate objects ...

    const buffers = objects.map(obj => schema.toBuffer(obj));  // ❌
    return Buffer.concat(buffers);
}
```

## Error Handling

### Validate Input Data

```ts
// ✅ Good: Comprehensive validation
interface PacketData {
    type: number;
    sequence: number;
    payload: number[];
}

function validatePacketData(data: PacketData): void {
    if (data.type < 0 || data.type > 255) {
        throw new RangeError(`Invalid packet type: ${ data.type }`);
    }

    if (data.sequence < 0 || data.sequence > 0xFFFFFFFF) {
        throw new RangeError(`Invalid sequence number: ${ data.sequence }`);
    }

    if (data.payload.length !== 1024) {
        throw new Error(`Invalid payload length: ${ data.payload.length }`);
    }

    for (let i = 0; i < data.payload.length; i++) {
        if (data.payload[i] < 0 || data.payload[i] > 255) {
            throw new RangeError(`Invalid byte at index ${ i }: ${ data.payload[i] }`);
        }
    }
}

const PacketSchema = new Struct<PacketData>({
    type: 'UInt8',
    sequence: 'UInt32LE',
    payload: 'UInt8[1024]'
});

// Usage
try {
    validatePacketData(data);
    const buffer = PacketSchema.toBuffer(data);
} catch (error) {
    console.error('Validation failed:', error.message);
}
```

### Handle Buffer Size Errors

```ts
// ✅ Good: Safe buffer handling
function safeDeserialize<T>(schema: Struct<T>, buffer: Buffer): T | null {
    try {
        if (buffer.length < schema.size) {
            console.error(
                `Buffer too small: expected ${ schema.size }, got ${ buffer.length }`
            );
            return null;
        }

        return schema.toObject(buffer);
    } catch (error) {
        console.error('Deserialization failed:', error.message);
        return null;
    }
}

// Usage
const data = safeDeserialize(PacketSchema, buffer);
if (data === null) {
    // Handle error
}
```

### Use Try-Catch for Critical Operations

```ts
// ✅ Good: Error boundaries
class DataProcessor {
    private schema: Struct;

    constructor() {
        this.schema = new Struct({
            id: 'UInt32LE',
            data: 'UInt8[1024]'
        });
    }

    process(buffer: Buffer): ProcessResult {
        try {
            const data = this.schema.toObject(buffer);
            return {
                success: true,
                data
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

type ProcessResult =
    | { success: true; data: any }
    | { success: false; error: string };
```

## Testing

### Unit Test Schemas

```ts
// ✅ Good: Comprehensive schema tests
import { describe, it, expect } from 'vitest';

describe('PacketSchema', () => {
    const PacketSchema = new Struct({
        magic: 'UInt32BE',
        type: 'UInt8',
        length: 'UInt16LE',
        checksum: 'UInt32LE'
    });

    it('should serialize correctly', () => {
        const data = {
            magic: 0x12345678,
            type: 1,
            length: 100,
            checksum: 0xABCDEF00
        };

        const buffer = PacketSchema.toBuffer(data);

        expect(buffer.readUInt32BE(0)).toBe(0x12345678);
        expect(buffer.readUInt8(4)).toBe(1);
        expect(buffer.readUInt16LE(5)).toBe(100);
        expect(buffer.readUInt32LE(7)).toBe(0xABCDEF00);
    });

    it('should deserialize correctly', () => {
        const buffer = Buffer.from([
            0x12, 0x34, 0x56, 0x78,  // magic (BE)
            0x01,                     // type
            0x64, 0x00,               // length (LE)
            0x00, 0xEF, 0xCD, 0xAB   // checksum (LE)
        ]);

        const data = PacketSchema.toObject(buffer);

        expect(data.magic).toBe(0x12345678);
        expect(data.type).toBe(1);
        expect(data.length).toBe(100);
        expect(data.checksum).toBe(0xABCDEF00);
    });

    it('should round-trip correctly', () => {
        const original = {
            magic: 0x12345678,
            type: 1,
            length: 100,
            checksum: 0xABCDEF00
        };

        const buffer = PacketSchema.toBuffer(original);
        const roundTripped = PacketSchema.toObject(buffer);

        expect(roundTripped).toEqual(original);
    });
});
```

### Test Edge Cases

```ts
// ✅ Good: Edge case testing
describe('BitfieldSchema edge cases', () => {
    const BitfieldSchema = new Struct({
        flag: 'UInt8:1',
        value: 'UInt8:3'
    });

    it('should handle minimum values', () => {
        const data = { flag: 0, value: 0 };
        const buffer = BitfieldSchema.toBuffer(data);
        const result = BitfieldSchema.toObject(buffer);

        expect(result).toEqual(data);
    });

    it('should handle maximum values', () => {
        const data = { flag: 1, value: 7 };
        const buffer = BitfieldSchema.toBuffer(data);
        const result = BitfieldSchema.toObject(buffer);

        expect(result).toEqual(data);
    });

    it('should throw on overflow', () => {
        expect(() => {
            BitfieldSchema.toBuffer({ flag: 2, value: 0 });
        }).toThrow();

        expect(() => {
            BitfieldSchema.toBuffer({ flag: 0, value: 8 });
        }).toThrow();
    });
});
```

### Test Binary Compatibility

```ts
// ✅ Good: Binary format compatibility tests
describe('Binary compatibility', () => {
    it('should match reference implementation', () => {
        const schema = new Struct({
            version: 'UInt16LE',
            type: 'UInt8',
            length: 'UInt32LE'
        });

        // Reference buffer from another implementation
        const referenceBuffer = Buffer.from([
            0x01, 0x00,              // version 1 (LE)
            0x02,                    // type 2
            0x64, 0x00, 0x00, 0x00   // length 100 (LE)
        ]);

        const data = schema.toObject(referenceBuffer);

        expect(data.version).toBe(1);
        expect(data.type).toBe(2);
        expect(data.length).toBe(100);

        // Verify we can create identical buffer
        const generatedBuffer = schema.toBuffer(data);
        expect(generatedBuffer.equals(referenceBuffer)).toBe(true);
    });
});
```

## Documentation

### Document Schema Versions

```ts
// ✅ Good: Versioned schemas with documentation
/**
 * User data schema v1.0
 *
 * Binary format:
 * - Bytes 0-3: User ID (UInt32LE)
 * - Bytes 4-11: Timestamp (BigUInt64LE)
 * - Bytes 12+: Name (length-prefixed UTF-8 string)
 *
 * @version 1.0.0
 * @since 2024-01-01
 */
const UserSchemaV1 = new Struct({
    id: 'UInt32LE',
    timestamp: 'BigUInt64LE',
    name: 'string'
});

/**
 * User data schema v2.0
 *
 * Changes from v1.0:
 * - Added email field
 * - Added flags bitfield
 *
 * Binary format:
 * - Bytes 0-3: User ID (UInt32LE)
 * - Bytes 4-11: Timestamp (BigUInt64LE)
 * - Byte 12: Flags (UInt8 bitfield)
 * - Bytes 13+: Name (length-prefixed UTF-8 string)
 * - After name: Email (length-prefixed UTF-8 string)
 *
 * @version 2.0.0
 * @since 2024-06-01
 */
const UserSchemaV2 = new Struct({
    id: 'UInt32LE',
    timestamp: 'BigUInt64LE',
    flags: 'UInt8',
    name: 'string',
    email: 'string'
});
```

### Document Field Constraints

```ts
// ✅ Good: Well-documented constraints
interface ConfigData {
    /** Protocol version. Must be 1. */
    version: number;

    /** Connection timeout in seconds. Range: 1-3600. */
    timeout: number;

    /** Maximum number of retries. Range: 0-10. */
    maxRetries: number;

    /** Enable debug logging. 0=disabled, 1=enabled. */
    debugMode: number;
}

/**
 * Configuration data schema
 *
 * Constraints:
 * - version: Must be 1
 * - timeout: 1-3600 seconds
 * - maxRetries: 0-10 attempts
 * - debugMode: Boolean (0 or 1)
 */
const ConfigSchema = new Struct<ConfigData>({
    version: 'UInt8',
    timeout: 'UInt16LE',
    maxRetries: 'UInt8',
    debugMode: 'UInt8:1'
});
```

### Provide Usage Examples

```ts
// ✅ Good: Clear usage examples
/**
 * Packet schema for network communication
 *
 * @example
 *```textmate
 * // Creating a packet
 * const packet = PacketSchema.toBuffer({
 *     magic: 0x50415354,
 *     type: PacketType.DATA,
 *     sequence: 1234,
 *     payload: new Array(512).fill(0)
 * });
 *
 * // Parsing a packet
 * const data = PacketSchema.toObject(buffer);
 * console.log(`Received packet type: ${data.type}`);
 * ```

*/
const PacketSchema = new Struct({
magic: 'UInt32BE',
type: 'UInt8',
sequence: 'UInt32LE',
payload: 'UInt8[512]'
});

```

## Common Patterns

### Factory Pattern for Schemas

```ts
// ✅ Good: Schema factory
class SchemaFactory {
    static createMessageSchema(version: number): Struct {
        switch (version) {
            case 1:
                return new Struct({
                    type: 'UInt8',
                    length: 'UInt16LE',
                    data: 'UInt8[256]'
                });
            
            case 2:
                return new Struct({
                    type: 'UInt8',
                    flags: 'UInt8',
                    length: 'UInt16LE',
                    data: 'UInt8[512]'
                });
            
            default:
                throw new Error(`Unsupported version: ${version}`);
        }
    }
}

// Usage
const schema = SchemaFactory.createMessageSchema(2);
```

### Builder Pattern for Complex Data

```ts
// ✅ Good: Builder for complex structures
class PacketBuilder {
    private type: number = 0;
    private sequence: number = 0;
    private payload: number[] = new Array(1024).fill(0);

    setType(type: number): this {
        this.type = type;
        return this;
    }

    setSequence(sequence: number): this {
        this.sequence = sequence;
        return this;
    }

    setPayload(payload: number[]): this {
        if (payload.length > 1024) {
            throw new Error('Payload too large');
        }
        this.payload = [ ...payload, ...new Array(1024 - payload.length).fill(0) ];
        return this;
    }

    build(schema: Struct): Buffer {
        return schema.toBuffer({
            type: this.type,
            sequence: this.sequence,
            payload: this.payload
        });
    }
}

// Usage
const packet = new PacketBuilder()
    .setType(1)
    .setSequence(1234)
    .setPayload([ 1, 2, 3, 4, 5 ])
    .build(PacketSchema);
```

### Pool Pattern for Buffer Reuse

```ts
// ✅ Good: Buffer pool
class BufferPool {
    private available: Buffer[] = [];
    private size: number;

    constructor(size: number, count: number = 10) {
        this.size = size;
        for (let i = 0; i < count; i++) {
            this.available.push(Buffer.allocUnsafe(size));
        }
    }

    acquire(): Buffer {
        return this.available.pop() || Buffer.allocUnsafe(this.size);
    }

    release(buffer: Buffer): void {
        if (buffer.length === this.size) {
            this.available.push(buffer);
        }
    }
}

// Usage
const pool = new BufferPool(1024, 50);

function processData(schema: Struct, data: any): void {
    const buffer = pool.acquire();
    try {
        schema.toBuffer(data, buffer);
        sendToNetwork(buffer);
    } finally {
        pool.release(buffer);
    }
}
```

## Anti-Patterns to Avoid

### Don't Mix Concerns

```ts
// ❌ Bad: Mixed responsibilities
class UserManager {
    private schema = new Struct({
        id: 'UInt32LE',
        name: 'string'
    });

    saveUser(user: any) {
        // Mixing serialization with business logic
        const buffer = this.schema.toBuffer(user);
        this.database.save(buffer);
        this.logger.log('User saved');
        this.cache.invalidate(user.id);
    }
}

// ✅ Good: Separated concerns
class UserSerializer {
    private schema = new Struct({
        id: 'UInt32LE',
        name: 'string'
    });

    serialize(user: any): Buffer {
        return this.schema.toBuffer(user);
    }

    deserialize(buffer: Buffer): any {
        return this.schema.toObject(buffer);
    }
}

class UserManager {
    constructor(
        private serializer: UserSerializer,
        private database: Database,
        private logger: Logger,
        private cache: Cache
    ) {
    }

    saveUser(user: any) {
        const buffer = this.serializer.serialize(user);
        this.database.save(buffer);
        this.logger.log('User saved');
        this.cache.invalidate(user.id);
    }
}
```

### Don't Ignore Endianness

```ts
// ❌ Bad: Inconsistent endianness
const BadSchema = new Struct({
    field1: 'UInt32LE',
    field2: 'UInt32BE',  // Why different?
    field3: 'UInt16LE',
    field4: 'UInt16BE'   // Confusing!
});

// ✅ Good: Consistent endianness
const GoodSchema = new Struct({
    field1: 'UInt32LE',
    field2: 'UInt32LE',
    field3: 'UInt16LE',
    field4: 'UInt16LE'
});
```

### Don't Skip Validation

```ts
// ❌ Bad: No validation
function processData(schema: Struct, data: any): void {
    const buffer = schema.toBuffer(data);  // May throw!
    sendToNetwork(buffer);
}

// ✅ Good: Proper validation
function processData(schema: Struct, data: any): boolean {
    try {
        validateData(data);
        const buffer = schema.toBuffer(data);
        sendToNetwork(buffer);
        return true;
    } catch (error) {
        console.error('Processing failed:', error.message);
        return false;
    }
}
```

## See Also

- [Arrays Guide](./arrays.md) - Working with arrays
- [Bitfields Guide](./bitfields.md) - Bitfield usage
- [Endianness Guide](./endianness.md) - Byte ordering
- [Getting Started](../guide.md) - Basic usage guide
