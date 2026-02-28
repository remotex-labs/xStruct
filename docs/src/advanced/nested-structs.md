# Nested Structs

Comprehensive guide to composing complex data structures using nested structs in xStruct.

## Overview

Nested structs allow you to build complex hierarchical data structures by composing smaller, reusable struct definitions.
This enables modular design, code reuse, and clear representation of structured binary data.

**Key Benefits:**

- **Modularity**: Break down complex structures into manageable components
- **Reusability**: Define common patterns once and reuse them
- **Type Safety**: Maintain TypeScript type checking across nested structures
- **Clarity**: Mirror real-world data hierarchies in your code
- **Maintainability**: Update nested definitions in one place

## Quick Reference

| Pattern          | Syntax                                      | Use Case                    |
|------------------|---------------------------------------------|-----------------------------|
| Simple nesting   | `{ field: nestedStruct }`                   | Embed one struct in another |
| Array of structs | `{ field: { type: struct, arraySize: N } }` | Fixed-size collection       |
| Dynamic arrays   | Custom implementation                       | Variable-size collection    |
| Deep nesting     | Multiple levels                             | Complex hierarchies         |
| Shared structs   | Reuse definitions                           | Common patterns             |

## Basic Nesting

### Simple Nested Struct

```ts
import { Struct } from '@remotex-labs/xstruct';

// Define a Point2D struct
interface Point2D {
    x: number;
    y: number;
}

const Point2DSchema = new Struct<Point2D>({
    x: 'FloatLE',
    y: 'FloatLE'
});

// Use Point2D in a Rectangle struct
interface Rectangle {
    topLeft: Point2D;
    bottomRight: Point2D;
}

const RectangleSchema = new Struct<Rectangle>({
    topLeft: Point2DSchema,
    bottomRight: Point2DSchema
});

// Serialize
const buffer = RectangleSchema.toBuffer({
    topLeft: { x: 0, y: 0 },
    bottomRight: { x: 100, y: 50 }
});

// Deserialize
const rect = RectangleSchema.toObject(buffer);
console.log(rect.topLeft.x);  // 0
console.log(rect.bottomRight.x);  // 100
```

### Multiple Nested Structs

```ts
interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

const ColorSchema = new Struct<Color>({
    r: 'UInt8',
    g: 'UInt8',
    b: 'UInt8',
    a: 'UInt8'
});

interface Style {
    fillColor: Color;
    strokeColor: Color;
    strokeWidth: number;
}

const StyleSchema = new Struct<Style>({
    fillColor: ColorSchema,
    strokeColor: ColorSchema,
    strokeWidth: 'UInt8'
});

interface Shape {
    position: Point2D;
    style: Style;
}

const ShapeSchema = new Struct<Shape>({
    position: Point2DSchema,
    style: StyleSchema
});

const buffer = ShapeSchema.toBuffer({
    position: { x: 10, y: 20 },
    style: {
        fillColor: { r: 255, g: 0, b: 0, a: 255 },
        strokeColor: { r: 0, g: 0, b: 0, a: 255 },
        strokeWidth: 2
    }
});
```

## Arrays of Structs

### Fixed-Size Array

```ts
interface Vertex {
    x: number;
    y: number;
    z: number;
}

const VertexSchema = new Struct<Vertex>({
    x: 'FloatLE',
    y: 'FloatLE',
    z: 'FloatLE'
});

interface Triangle {
    vertices: Vertex[];
}

const TriangleSchema = new Struct<Triangle>({
    vertices: { type: VertexSchema, arraySize: 3 }
});

const buffer = TriangleSchema.toBuffer({
    vertices: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0.5, y: 1, z: 0 }
    ]
});
```

### Multiple Arrays

```ts
interface Mesh {
    vertices: Vertex[];
    normals: Vertex[];
    colors: Color[];
}

const MeshSchema = new Struct<Mesh>({
    vertices: { type: VertexSchema, arraySize: 100 },
    normals: { type: VertexSchema, arraySize: 100 },
    colors: { type: ColorSchema, arraySize: 100 }
});
```

## Deep Nesting

### Multi-Level Hierarchy

```ts
interface Header {
    version: number;
    flags: number;
}

const HeaderSchema = new Struct<Header>({
    version: 'UInt16LE',
    flags: 'UInt16LE'
});

interface Metadata {
    header: Header;
    timestamp: bigint;
    author: string;
}

const MetadataSchema = new Struct<Metadata>({
    header: HeaderSchema,
    timestamp: 'BigUInt64LE',
    author: 'string(64)'
});

interface Document {
    metadata: Metadata;
    content: string;
}

const DocumentSchema = new Struct<Document>({
    metadata: MetadataSchema,
    content: 'string'
});

const buffer = DocumentSchema.toBuffer({
    metadata: {
        header: { version: 1, flags: 0 },
        timestamp: BigInt(Date.now()),
        author: 'John Doe'
    },
    content: 'Document content here...'
});

// Access nested fields
const doc = DocumentSchema.toObject(buffer);
console.log(doc.metadata.header.version);  // 1
console.log(doc.metadata.author);  // "John Doe"
```

### Complex Nested Arrays

```ts
interface Joint {
    position: Point2D;
    rotation: number;
}

const JointSchema = new Struct<Joint>({
    position: Point2DSchema,
    rotation: 'FloatLE'
});

interface Bone {
    startJoint: Joint;
    endJoint: Joint;
    length: number;
}

const BoneSchema = new Struct<Bone>({
    startJoint: JointSchema,
    endJoint: JointSchema,
    length: 'FloatLE'
});

interface Skeleton {
    bones: Bone[];
    name: string;
}

const SkeletonSchema = new Struct<Skeleton>({
    bones: { type: BoneSchema, arraySize: 20 },
    name: 'string(32)'
});
```

## Real-World Examples

### Network Packet with Nested Headers

```ts
interface EthernetHeader {
    destMac: number[];
    srcMac: number[];
    etherType: number;
}

const EthernetHeaderSchema = new Struct<EthernetHeader>({
    destMac: 'UInt8[6]',
    srcMac: 'UInt8[6]',
    etherType: 'UInt16BE'
});

interface IPv4Header {
    version: number;
    headerLength: number;
    typeOfService: number;
    totalLength: number;
    identification: number;
    flags: number;
    fragmentOffset: number;
    ttl: number;
    protocol: number;
    checksum: number;
    sourceIp: number;
    destIp: number;
}

const IPv4HeaderSchema = new Struct<IPv4Header>({
    version: 'UInt8:4',
    headerLength: 'UInt8:4',
    typeOfService: 'UInt8',
    totalLength: 'UInt16BE',
    identification: 'UInt16BE',
    flags: 'UInt16BE:3',
    fragmentOffset: 'UInt16BE:13',
    ttl: 'UInt8',
    protocol: 'UInt8',
    checksum: 'UInt16BE',
    sourceIp: 'UInt32BE',
    destIp: 'UInt32BE'
});

interface TCPHeader {
    sourcePort: number;
    destPort: number;
    sequence: number;
    acknowledgment: number;
    dataOffset: number;
    flags: number;
    window: number;
    checksum: number;
    urgentPointer: number;
}

const TCPHeaderSchema = new Struct<TCPHeader>({
    sourcePort: 'UInt16BE',
    destPort: 'UInt16BE',
    sequence: 'UInt32BE',
    acknowledgment: 'UInt32BE',
    dataOffset: 'UInt8:4',
    flags: 'UInt8:12',
    window: 'UInt16BE',
    checksum: 'UInt16BE',
    urgentPointer: 'UInt16BE'
});

interface NetworkPacket {
    ethernet: EthernetHeader;
    ipv4: IPv4Header;
    tcp: TCPHeader;
    payload: number[];
}

const NetworkPacketSchema = new Struct<NetworkPacket>({
    ethernet: EthernetHeaderSchema,
    ipv4: IPv4HeaderSchema,
    tcp: TCPHeaderSchema,
    payload: 'UInt8[1024]'
});
```

### File Format with Complex Structure

```ts
interface FileHeader {
    magic: number;
    version: number;
    flags: number;
    fileSize: bigint;
}

const FileHeaderSchema = new Struct<FileHeader>({
    magic: 'UInt32BE',
    version: 'UInt16LE',
    flags: 'UInt16LE',
    fileSize: 'BigUInt64LE'
});

interface ChunkHeader {
    type: string;
    size: number;
    checksum: number;
}

const ChunkHeaderSchema = new Struct<ChunkHeader>({
    type: 'string(4)',
    size: 'UInt32LE',
    checksum: 'UInt32LE'
});

interface DataChunk {
    header: ChunkHeader;
    data: number[];
}

const DataChunkSchema = new Struct<DataChunk>({
    header: ChunkHeaderSchema,
    data: 'UInt8[1024]'
});

interface FileStructure {
    fileHeader: FileHeader;
    chunks: DataChunk[];
}

const FileStructureSchema = new Struct<FileStructure>({
    fileHeader: FileHeaderSchema,
    chunks: { type: DataChunkSchema, arraySize: 10 }
});
```

### Game Entity System

```ts
interface Transform {
    position: Point2D;
    rotation: number;
    scale: Point2D;
}

const TransformSchema = new Struct<Transform>({
    position: Point2DSchema,
    rotation: 'FloatLE',
    scale: Point2DSchema
});

interface Physics {
    velocity: Point2D;
    acceleration: Point2D;
    mass: number;
}

const PhysicsSchema = new Struct<Physics>({
    velocity: Point2DSchema,
    acceleration: Point2DSchema,
    mass: 'FloatLE'
});

interface Health {
    current: number;
    maximum: number;
    regeneration: number;
}

const HealthSchema = new Struct<Health>({
    current: 'UInt16LE',
    maximum: 'UInt16LE',
    regeneration: 'FloatLE'
});

interface Entity {
    id: number;
    transform: Transform;
    physics: Physics;
    health: Health;
    flags: number;
}

const EntitySchema = new Struct<Entity>({
    id: 'UInt32LE',
    transform: TransformSchema,
    physics: PhysicsSchema,
    health: HealthSchema,
    flags: 'UInt16LE'
});

interface GameState {
    entities: Entity[];
    timestamp: bigint;
}

const GameStateSchema = new Struct<GameState>({
    entities: { type: EntitySchema, arraySize: 100 },
    timestamp: 'BigUInt64LE'
});
```

### Database Record Structure

```ts
interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

const AddressSchema = new Struct<Address>({
    street: 'string(128)',
    city: 'string(64)',
    state: 'string(32)',
    zipCode: 'string(16)',
    country: 'string(32)'
});

interface ContactInfo {
    email: string;
    phone: string;
    address: Address;
}

const ContactInfoSchema = new Struct<ContactInfo>({
    email: 'string(128)',
    phone: 'string(32)',
    address: AddressSchema
});

interface UserProfile {
    id: bigint;
    username: string;
    contact: ContactInfo;
    createdAt: bigint;
    updatedAt: bigint;
    isActive: number;
}

const UserProfileSchema = new Struct<UserProfile>({
    id: 'BigUInt64LE',
    username: 'string(64)',
    contact: ContactInfoSchema,
    createdAt: 'BigUInt64LE',
    updatedAt: 'BigUInt64LE',
    isActive: 'UInt8:1'
});
```

### Image Metadata Structure

```ts
interface Resolution {
    width: number;
    height: number;
}

const ResolutionSchema = new Struct<Resolution>({
    width: 'UInt32LE',
    height: 'UInt32LE'
});

interface ColorSpace {
    type: string;
    depth: number;
    channels: number;
}

const ColorSpaceSchema = new Struct<ColorSpace>({
    type: 'string(16)',
    depth: 'UInt8',
    channels: 'UInt8'
});

interface Camera {
    make: string;
    model: string;
    exposureTime: number;
    fNumber: number;
    iso: number;
}

const CameraSchema = new Struct<Camera>({
    make: 'string(32)',
    model: 'string(32)',
    exposureTime: 'FloatLE',
    fNumber: 'FloatLE',
    iso: 'UInt16LE'
});

interface GPS {
    latitude: number;
    longitude: number;
    altitude: number;
    timestamp: bigint;
}

const GPSSchema = new Struct<GPS>({
    latitude: 'DoubleLE',
    longitude: 'DoubleLE',
    altitude: 'FloatLE',
    timestamp: 'BigUInt64LE'
});

interface ImageMetadata {
    resolution: Resolution;
    colorSpace: ColorSpace;
    camera: Camera;
    gps: GPS;
    createdAt: bigint;
}

const ImageMetadataSchema = new Struct<ImageMetadata>({
    resolution: ResolutionSchema,
    colorSpace: ColorSpaceSchema,
    camera: CameraSchema,
    gps: GPSSchema,
    createdAt: 'BigUInt64LE'
});
```

## Design Patterns

### Composition Pattern

```ts
// Build complex structures from simple components

// Base components
const TimestampSchema = new Struct({
    value: 'BigUInt64LE'
});

const VersionSchema = new Struct({
    major: 'UInt8',
    minor: 'UInt8',
    patch: 'UInt16LE'
});

const FlagsSchema = new Struct({
    isCompressed: 'UInt8:1',
    isEncrypted: 'UInt8:1',
    reserved: 'UInt8:6'
});

// Compose into larger structure
interface MessageEnvelope {
    timestamp: { value: bigint };
    version: { major: number; minor: number; patch: number };
    flags: { isCompressed: number; isEncrypted: number; reserved: number };
    payload: string;
}

const MessageEnvelopeSchema = new Struct<MessageEnvelope>({
    timestamp: TimestampSchema,
    version: VersionSchema,
    flags: FlagsSchema,
    payload: 'string'
});
```

### Inheritance Pattern (via Composition)

```ts
// Base "class" - common fields
interface BaseEntity {
    id: number;
    timestamp: bigint;
}

const BaseEntitySchema = new Struct<BaseEntity>({
    id: 'UInt32LE',
    timestamp: 'BigUInt64LE'
});

// "Derived" - includes base + specific fields
interface User {
    base: BaseEntity;
    username: string;
    email: string;
}

const UserSchema = new Struct<User>({
    base: BaseEntitySchema,
    username: 'string(64)',
    email: 'string(128)'
});

interface Product {
    base: BaseEntity;
    name: string;
    price: number;
    sku: string;
}

const ProductSchema = new Struct<Product>({
    base: BaseEntitySchema,
    name: 'string(128)',
    price: 'UInt32LE',
    sku: 'string(32)'
});
```

### Factory Pattern

```ts
class StructFactory {
    private static cache = new Map<string, Struct>();

    static getPointSchema(): Struct<Point2D> {
        if (!this.cache.has('Point2D')) {
            this.cache.set('Point2D', new Struct<Point2D>({
                x: 'FloatLE',
                y: 'FloatLE'
            }));
        }
        return this.cache.get('Point2D') as Struct<Point2D>;
    }

    static getColorSchema(): Struct<Color> {
        if (!this.cache.has('Color')) {
            this.cache.set('Color', new Struct<Color>({
                r: 'UInt8',
                g: 'UInt8',
                b: 'UInt8',
                a: 'UInt8'
            }));
        }
        return this.cache.get('Color') as Struct<Color>;
    }

    static getShapeSchema(): Struct<Shape> {
        return new Struct<Shape>({
            position: this.getPointSchema(),
            style: new Struct({
                fillColor: this.getColorSchema(),
                strokeColor: this.getColorSchema(),
                strokeWidth: 'UInt8'
            })
        });
    }
}

// Usage
const shapeSchema = StructFactory.getShapeSchema();
```

### Builder Pattern

```ts
class MessageBuilder {
    private header?: Struct;
    private body?: Struct;
    private footer?: Struct;

    withHeader(version: number, flags: number): this {
        this.header = new Struct({
            version: 'UInt16LE',
            flags: 'UInt16LE'
        });
        return this;
    }

    withBody(payloadSize: number): this {
        this.body = new Struct({
            timestamp: 'BigUInt64LE',
            payload: `UInt8[${ payloadSize }]`
        });
        return this;
    }

    withFooter(): this {
        this.footer = new Struct({
            checksum: 'UInt32LE'
        });
        return this;
    }

    build(): Struct {
        if (!this.header || !this.body) {
            throw new Error('Header and body are required');
        }

        const schema: any = {
            header: this.header,
            body: this.body
        };

        if (this.footer) {
            schema.footer = this.footer;
        }

        return new Struct(schema);
    }
}

// Usage
const messageSchema = new MessageBuilder()
    .withHeader(1, 0)
    .withBody(1024)
    .withFooter()
    .build();
```

## Performance Optimization

### Reuse Nested Schemas

```ts
// ✅ Good: Define once, reuse everywhere
const Point2DSchema = new Struct<Point2D>({
    x: 'FloatLE',
    y: 'FloatLE'
});

const LineSchema = new Struct({
    start: Point2DSchema,
    end: Point2DSchema
});

const TriangleSchema = new Struct({
    v1: Point2DSchema,
    v2: Point2DSchema,
    v3: Point2DSchema
});

// ❌ Bad: Define inline (creates new schemas)
const LineSchema2 = new Struct({
    start: new Struct({ x: 'FloatLE', y: 'FloatLE' }),
    end: new Struct({ x: 'FloatLE', y: 'FloatLE' })
});
```

### Cache Schema Instances

```ts
// ✅ Good: Cache and reuse
class SchemaRegistry {
    private static instances = new Map<string, Struct>();

    static register<T>(name: string, schema: Struct<T>): void {
        this.instances.set(name, schema);
    }

    static get<T>(name: string): Struct<T> {
        const schema = this.instances.get(name);
        if (!schema) {
            throw new Error(`Schema "${ name }" not found`);
        }
        return schema as Struct<T>;
    }
}

// Register schemas once
SchemaRegistry.register('Point2D', Point2DSchema);
SchemaRegistry.register('Color', ColorSchema);

// Use throughout application
const point = SchemaRegistry.get<Point2D>('Point2D');
```

### Optimize Nested Array Sizes

```ts
// ✅ Good: Appropriate sizes
const EfficientSchema = new Struct({
    header: HeaderSchema,
    items: { type: ItemSchema, arraySize: 10 }  // Reasonable
});

// ❌ Bad: Excessively large arrays
const WastefulSchema = new Struct({
    header: HeaderSchema,
    items: { type: ItemSchema, arraySize: 10000 }  // 10K items!
});
```

## Validation Patterns

### Nested Validation

```ts
function validatePoint(point: Point2D): void {
    if (point.x < -1000 || point.x > 1000) {
        throw new RangeError(`X coordinate out of range: ${ point.x }`);
    }
    if (point.y < -1000 || point.y > 1000) {
        throw new RangeError(`Y coordinate out of range: ${ point.y }`);
    }
}

function validateRectangle(rect: Rectangle): void {
    validatePoint(rect.topLeft);
    validatePoint(rect.bottomRight);

    if (rect.topLeft.x >= rect.bottomRight.x) {
        throw new Error('Invalid rectangle: left >= right');
    }
    if (rect.topLeft.y >= rect.bottomRight.y) {
        throw new Error('Invalid rectangle: top >= bottom');
    }
}

// Usage
const rect = {
    topLeft: { x: 0, y: 0 },
    bottomRight: { x: 100, y: 50 }
};

validateRectangle(rect);
const buffer = RectangleSchema.toBuffer(rect);
```

### Recursive Validation

```ts
function validateEntity(entity: Entity): void {
    // Validate ID
    if (entity.id === 0) {
        throw new Error('Entity ID cannot be zero');
    }

    // Validate nested transform
    validatePoint(entity.transform.position);
    validatePoint(entity.transform.scale);

    // Validate nested physics
    validatePoint(entity.physics.velocity);
    validatePoint(entity.physics.acceleration);

    if (entity.physics.mass <= 0) {
        throw new Error('Mass must be positive');
    }

    // Validate nested health
    if (entity.health.current > entity.health.maximum) {
        throw new Error('Current health exceeds maximum');
    }
}
```

## Best Practices

### ✅ Do

```ts
// Define reusable components
const TimestampSchema = new Struct({ value: 'BigUInt64LE' });
const VersionSchema = new Struct({ major: 'UInt8', minor: 'UInt8' });

// Use TypeScript interfaces
interface Message {
    timestamp: { value: bigint };
    version: { major: number; minor: number };
    payload: string;
}

const MessageSchema = new Struct<Message>({
    timestamp: TimestampSchema,
    version: VersionSchema,
    payload: 'string'
});

// Keep nesting depth reasonable (< 5 levels)
const ReasonableSchema = new Struct({
    level1: new Struct({
        level2: new Struct({
            level3: new Struct({
                value: 'UInt32LE'
            })
        })
    })
});

// Name nested schemas clearly
const UserAddressSchema = new Struct({ /* ... */ });
const UserContactSchema = new Struct({ /* ... */ });
const UserProfileSchema = new Struct({
    address: UserAddressSchema,
    contact: UserContactSchema
});
```

### ❌ Don't

```ts
// Don't create schemas inline repeatedly
for (let i = 0; i < 1000; i++) {
    const schema = new Struct({  // ❌ Creates 1000 schemas!
        point: new Struct({ x: 'FloatLE', y: 'FloatLE' })
    });
}

// Don't nest too deeply (> 5 levels)
const TooDeep = new Struct({
    l1: new Struct({
        l2: new Struct({
            l3: new Struct({
                l4: new Struct({
                    l5: new Struct({
                        l6: new Struct({  // ❌ Too deep!
                            value: 'UInt32LE'
                        })
                    })
                })
            })
        })
    })
});

// Don't skip type definitions
const NoTypes = new Struct({  // ❌ No TypeScript types
    nested: new Struct({
        value: 'UInt32LE'
    })
});

// Don't create circular references
const Circular1 = new Struct({
    nested: undefined as any  // Will cause issues
});
Circular1.schema.nested = Circular1;  // ❌ Circular!
```

## Troubleshooting

### Accessing Nested Fields

```ts
// Problem: Unclear how to access nested data
const data = ComplexSchema.toObject(buffer);
// How to get deeply nested value?

// Solution: Use TypeScript interfaces
interface Complex {
    outer: {
        middle: {
            inner: {
                value: number;
            };
        };
    };
}

const ComplexSchema = new Struct<Complex>({ /* ... */ });
const data = ComplexSchema.toObject(buffer);
console.log(data.outer.middle.inner.value);  // Type-safe access!
```

### Schema Size Calculation

```ts
// Problem: Need to know total size of nested structure
const schema = new Struct({
    header: HeaderSchema,
    body: BodySchema
});

// Solution: Use getSize() or size property
console.log(schema.size);  // Total size in bytes
```

### Memory Usage

```ts
// Problem: Large nested arrays consume too much memory
const HugeSchema = new Struct({
    items: { type: ItemSchema, arraySize: 100000 }  // Too large!
});

// Solution: Use pagination or streaming
const PagedSchema = new Struct({
    pageNumber: 'UInt32LE',
    items: { type: ItemSchema, arraySize: 100 }  // Reasonable page size
});
```

## See Also

- [Arrays Guide](./arrays.md) - Working with struct arrays
- [Best Practices](./best-practices.md) - General optimization tips
- [Integer Types](../primitive/int.md) - Primitive types for fields
- [String Types](../primitive/strings.md) - String handling
