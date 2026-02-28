# Union

Comprehensive guide to using unions for shared-memory layouts in xStruct.

## Overview

A `Union` represents a memory region where multiple members occupy the same space, starting at offset 0.
This mirrors C-style unions and is useful for type punning, variant data, and memory-efficient storage when only one member is active at a time.

**Key Characteristics:**

- **Shared Memory**: All members occupy the same bytes
- **Size**: Equal to the largest member
- **Write-Once**: Only the first defined field is written
- **Read-All**: Every member is decoded independently
- **Type Safety**: Full TypeScript type checking

## Quick Reference

| Operation           | Behavior                                        |
|---------------------|-------------------------------------------------|
| **Size**            | Size of the widest member                       |
| **Writing**         | First non-`undefined` field (declaration order) |
| **Reading**         | All members decoded from offset 0               |
| **Nesting**         | Can be nested in `Struct` schemas               |
| **Member Priority** | Declaration order determines write priority     |

## Allowed Member Types

| Member Kind                        | Allowed | Notes                          |
|------------------------------------|---------|--------------------------------|
| Primitives (UInt, Int, Float)      | yes     | Any primitive type             |
| Arrays                             | yes     | Fixed-size arrays              |
| Bitfields                          | yes     | Packed bit structures          |
| Nested `Struct` / `Union`          | yes     | Fully supported                |
| Fixed-size strings (`{ size: N }`) | yes     | Must specify exact size        |
| Fixed-size shorthand (`string(N)`) | yes     | Shorthand notation             |
| Length-prefixed strings            | no      | Dynamic size not allowed       |
| Null-terminated strings            | no      | Dynamic size not allowed       |
| Bare string types                  | no      | Use fixed-size strings instead |

## Basic Usage

### Simple Primitive Union

```ts
import { Union } from '@remotex-labs/xstruct';

// Define a union with numeric types
interface NumericUnion {
    int: number;
    float: number;
}

const numUnion = new Union<NumericUnion>({
    int: 'UInt32LE',
    float: 'FloatLE'
});

// Write as float
const buffer = numUnion.toBuffer({ float: 5.0 });

// Read both representations
const result = numUnion.toObject(buffer);
console.log(result.float);  // 5.0
console.log(result.int);    // 1084227584 (binary representation)
```

### Type Punning Example

```ts
// Reinterpret bytes as different types
interface ByteView {
    bytes: number[];
    uint32: number;
    int32: number;
    float: number;
}

const byteView = new Union<ByteView>({
    bytes: { type: 'UInt8', arraySize: 4 },
    uint32: 'UInt32LE',
    int32: 'Int32LE',
    float: 'FloatLE'
});

// Write as bytes
const buf = byteView.toBuffer({
    bytes: [ 0x00, 0x00, 0xA0, 0x40 ]
});

// Read as different types
const view = byteView.toObject(buf);
console.log(view.bytes);   // [0, 0, 160, 64]
console.log(view.float);   // 5.0
console.log(view.uint32);  // 1084227584
```

## Write Semantics

Only the **first field** with a non-`undefined` value is written. Declaration order determines priority.

### Write Priority Example

```ts
interface Priority {
    a: number;
    b: number;
    c: number;
}

const priorityUnion = new Union<Priority>({
    a: 'UInt32LE',
    b: 'UInt32LE',
    c: 'UInt32LE'
});

// Only 'a' is written (first defined)
priorityUnion.toBuffer({ a: 1, b: 2, c: 3 });

// Only 'b' is written ('a' is undefined)
priorityUnion.toBuffer({ b: 2, c: 3 });

// Only 'c' is written (first two undefined)
priorityUnion.toBuffer({ c: 3 });
```

### Partial Data

```ts
// You can provide partial data
const buf1 = numUnion.toBuffer({ float: 3.14 });
const buf2 = numUnion.toBuffer({ int: 42 });

// Undefined fields are skipped
const buf3 = numUnion.toBuffer({});  // Creates zero-filled buffer
```

## Read Semantics

**All members** are decoded independently of offset 0, regardless of which one was written.

```ts
const numUnion = new Union({
    int: 'UInt32LE',
    float: 'FloatLE'
});

// Write as integer
const buffer = numUnion.toBuffer({ int: 1065353216 });

// Both fields are read
const result = numUnion.toObject(buffer);
console.log(result.int);    // 1065353216
console.log(result.float);  // 1.0 (IEEE-754 representation)
```

## Nested Struct Members

Union members can be full `Struct` instances for complex layouts.

### Basic Struct Members

```ts
import { Struct, Union } from '@remotex-labs/xstruct';

// Define two different struct layouts
interface Point2D {
    x: number;
    y: number;
}

interface Point3D {
    x: number;
    y: number;
    z: number;
}

const Point2DSchema = new Struct<Point2D>({
    x: 'FloatLE',
    y: 'FloatLE'
});

const Point3DSchema = new Struct<Point3D>({
    x: 'FloatLE',
    y: 'FloatLE',
    z: 'FloatLE'
});

// Union of structs
interface PointUnion {
    point2D: Point2D;
    point3D: Point3D;
}

const pointUnion = new Union<PointUnion>({
    point2D: Point2DSchema,
    point3D: Point3DSchema
});

// Write 2D point
const buf = pointUnion.toBuffer({
    point2D: { x: 10, y: 20 }
});

// Read both interpretations
const result = pointUnion.toObject(buf);
console.log(result.point2D);  // { x: 10, y: 20 }
console.log(result.point3D);  // { x: 10, y: 20, z: 0 }
```

### Variant Data Pattern

```ts
// Network packet with different payload types
interface HeaderPacket {
    type: number;
    length: number;
}

interface DataPacket {
    payload: number[];
}

const HeaderSchema = new Struct<HeaderPacket>({
    type: 'UInt16LE',
    length: 'UInt16LE'
});

const DataSchema = new Struct<DataPacket>({
    payload: { type: 'UInt8', arraySize: 4 }
});

interface PacketUnion {
    header: HeaderPacket;
    data: DataPacket;
}

const packetUnion = new Union<PacketUnion>({
    header: HeaderSchema,
    data: DataSchema
});

// Write header
const headerBuf = packetUnion.toBuffer({
    header: { type: 1, length: 128 }
});

// Write data
const dataBuf = packetUnion.toBuffer({
    data: { payload: [ 0xAA, 0xBB, 0xCC, 0xDD ] }
});
```

## Union Nested in Struct

A `Union` can be used as a field in a `Struct` schema.

### Basic Nesting

```ts
interface DataField {
    int: number;
    float: number;
}

const dataUnion = new Union<DataField>({
    int: 'UInt32LE',
    float: 'FloatLE'
});

interface Message {
    id: number;
    data: DataField;
}

const messageStruct = new Struct<Message>({
    id: 'UInt16LE',
    data: dataUnion
});

// Serialize
const buffer = messageStruct.toBuffer({
    id: 42,
    data: { float: 3.14 }
});

// Deserialize - both union members are decoded
const msg = messageStruct.toObject(buffer);
console.log(msg.id);          // 42
console.log(msg.data.float);  // 3.14
console.log(msg.data.int);    // 1078523331 (bit representation)
```

### Complex Nesting

```ts
// Multiple unions in a struct
interface ColorRGBA {
    r: number;
    g: number;
    b: number;
    a: number;
}

interface ColorValue {
    rgba: ColorRGBA;
    uint32: number;
}

const colorRGBA = new Struct<ColorRGBA>({
    r: 'UInt8',
    g: 'UInt8',
    b: 'UInt8',
    a: 'UInt8'
});

const colorUnion = new Union<ColorValue>({
    rgba: colorRGBA,
    uint32: 'UInt32LE'
});

interface Pixel {
    x: number;
    y: number;
    color: ColorValue;
}

const pixelStruct = new Struct<Pixel>({
    x: 'UInt16LE',
    y: 'UInt16LE',
    color: colorUnion
});

// Write with RGBA
const buf = pixelStruct.toBuffer({
    x: 100,
    y: 200,
    color: { rgba: { r: 255, g: 128, b: 64, a: 255 } }
});

// Read both color representations
const pixel = pixelStruct.toObject(buf);
console.log(pixel.color.rgba);   // { r: 255, g: 128, b: 64, a: 255 }
console.log(pixel.color.uint32); // 4282384639
```

## String Members

Only **fixed-size** strings are allowed in unions.

### Fixed-Size Strings

```ts
interface StringUnion {
    ascii: string;
    hex: string;
}

const strUnion = new Union<StringUnion>({
    // Using size descriptor
    ascii: { type: 'ascii', size: 16 },
    // Using shorthand
    hex: 'string(16)'
});

const buf = strUnion.toBuffer({
    ascii: 'Hello'
});

const result = strUnion.toObject(buf);
console.log(result.ascii);  // 'Hello' (padded to 16 bytes)
console.log(result.hex);    // Same bytes as hex string
```

### Invalid String Types

```ts
// ❌ These will throw errors at construction

// Bare dynamic string
new Union({
    text: 'string'  // Error: dynamic string type not allowed
});

// Length-prefixed
new Union({
    text: { type: 'string', lengthType: 'UInt16LE' }  // Error
});

// Null-terminated
new Union({
    text: { type: 'string', nullTerminated: true }  // Error
});

// ✅ Correct: fixed-size
new Union({
    text: { type: 'string', size: 32 }  // OK
});
```

## Bitfields in Unions

Bitfields can be members of unions for flag interpretations.

```ts
interface FlagsUnion {
    flags: {
        a: number;
        b: number;
        c: number;
        d: number;
    };
    raw: number;
}

const flagsUnion = new Union<FlagsUnion>({
    flags: {
        a: 'UInt8:2',
        b: 'UInt8:2',
        c: 'UInt8:2',
        d: 'UInt8:2'
    },
    raw: 'UInt8'
});

// Write as raw byte
const buf = flagsUnion.toBuffer({ raw: 0b11100100 });

// Read as bitfields
const result = flagsUnion.toObject(buf);
console.log(result.flags.a);  // 0
console.log(result.flags.b);  // 1
console.log(result.flags.c);  // 2
console.log(result.flags.d);  // 3
```

## Size Calculation

The union's size equals the size of its **widest member**.

```ts
const u = new Union({
    small: 'UInt8',       // 1 byte
    medium: 'UInt32LE',   // 4 bytes
    large: { type: 'UInt8', arraySize: 10 }  // 10 bytes
});

console.log(u.size);  // 10 (size of largest member)
```

### Mixed-Size Members

```ts
const mixedUnion = new Union({
    byte: 'UInt8',                           // 1 byte
    word: 'UInt16LE',                        // 2 bytes
    dword: 'UInt32LE',                       // 4 bytes
    point: new Struct({                      // 8 bytes
        x: 'FloatLE',
        y: 'FloatLE'
    }),
    buffer: { type: 'UInt8', arraySize: 12 } // 12 bytes
});

console.log(mixedUnion.size);  // 12
```

## Practical Examples

### Protocol Message Union

```ts
// Different message types sharing a buffer
interface PingMessage {
    type: number;
    timestamp: number;
}

interface DataMessage {
    type: number;
    payload: number[];
}

const pingStruct = new Struct<PingMessage>({
    type: 'UInt8',
    timestamp: 'UInt32LE'
});

const dataStruct = new Struct<DataMessage>({
    type: 'UInt8',
    payload: { type: 'UInt8', arraySize: 4 }
});

interface Message {
    ping: PingMessage;
    data: DataMessage;
}

const messageUnion = new Union<Message>({
    ping: pingStruct,
    data: dataStruct
});

// Send ping
const pingBuf = messageUnion.toBuffer({
    ping: { type: 1, timestamp: Date.now() }
});

// Send data
const dataBuf = messageUnion.toBuffer({
    data: { type: 2, payload: [ 1, 2, 3, 4 ] }
});
```

### Endianness Conversion

```ts
// View the same data in different endianness
interface EndianView {
    le: number;
    be: number;
}

const endianUnion = new Union<EndianView>({
    le: 'UInt32LE',
    be: 'UInt32BE'
});

const buf = endianUnion.toBuffer({ le: 0x12345678 });

const view = endianUnion.toObject(buf);
console.log(view.le.toString(16));  // 12345678
console.log(view.be.toString(16));  // 78563412
```

### Color Representation

```ts
// Access color as RGBA or single integer
interface Color {
    channels: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    value: number;
}

const colorStruct = new Struct({
    r: 'UInt8',
    g: 'UInt8',
    b: 'UInt8',
    a: 'UInt8'
});

const colorUnion = new Union<Color>({
    channels: colorStruct,
    value: 'UInt32LE'
});

// Write as integer
const buf = colorUnion.toBuffer({ value: 0xFF8040FF });

// Read as channels
const color = colorUnion.toObject(buf);
console.log(color.channels);  // { r: 255, g: 64, b: 128, a: 255 }
console.log(color.value);     // 4286545151
```

## Error Handling

### Construction Errors

```ts
// Dynamic string type
try {
    new Union({
        text: 'string'  // No size specified
    });
} catch (error) {
    console.error(error.message);
    // "Union member "text": dynamic string type "string" is not allowed..."
}

// Length-prefixed string
try {
    new Union({
        text: { type: 'string', lengthType: 'UInt16LE' }
    });
} catch (error) {
    console.error(error.message);
    // "Union member "text": length-prefixed strings are not allowed"
}

// Null-terminated string
try {
    new Union({
        text: { type: 'string', nullTerminated: true }
    });
} catch (error) {
    console.error(error.message);
    // "Union member "text": null-terminated strings are not allowed"
}
```

### Runtime Errors

```ts
const u = new Union({ value: 'UInt32LE' });

// Invalid buffer type
try {
    u.toObject('not a buffer' as any);
} catch (error) {
    console.error(error.message);
    // "Union.toObject: expected Buffer, got string"
}

// Buffer too small
try {
    const smallBuf = Buffer.alloc(2);
    u.toObject(smallBuf);  // Union needs 4 bytes
} catch (error) {
    console.error(error.message);
    // "Union.toObject: buffer too small (2 < 4)"
}

// Invalid data type
try {
    u.toBuffer(null as any);
} catch (error) {
    console.error(error.message);
    // "Union.toBuffer: expected object, got object"
}
```

## Best Practices

### 1. Document Member Purpose

```ts
/**
 * Network packet union representing different message types.
 * Write only one variant at a time based on packet type.
 */
interface PacketData {
    /** Control message with header info */
    control: ControlMessage;
    /** Data transfer payload */
    data: DataMessage;
    /** Error information */
    error: ErrorMessage;
}
```

### 2. Use TypeScript Interfaces

```ts
// Define clear interfaces for each member
interface IntView {
    value: number;
}

interface FloatView {
    value: number;
}

interface ByteView {
    bytes: number[];
}

// Use in union with type safety
const numUnion = new Union<{
    int: number;
    float: number;
    bytes: number[];
}>({
    int: 'UInt32LE',
    float: 'FloatLE',
    bytes: { type: 'UInt8', arraySize: 4 }
});
```

### 3. Validate Before Writing

```ts
function writeNumeric(value: number, asFloat: boolean) {
    // Validate input
    if (typeof value !== 'number' || !isFinite(value)) {
        throw new TypeError('Invalid numeric value');
    }

    return numUnion.toBuffer(
        asFloat ? { float: value } : { int: value }
    );
}
```

### 4. Use Declaration Order Strategically

```ts
// Most common type first for write priority
const variantUnion = new Union({
    common: commonStruct,      // Written most often
    alternate: alternateStruct, // Fallback
    rare: rareStruct           // Rarely used
});
```

### 5. Fixed-Size Only

```ts
// ✅ Good: all members have fixed size
const goodUnion = new Union({
    fixed: { type: 'string', size: 32 },
    array: { type: 'UInt8', arraySize: 32 },
    struct: new Struct({ a: 'UInt32LE', b: 'UInt32LE' })
});

// ❌ Bad: dynamic sizes
const badUnion = new Union({
    dynamic: 'string',  // Error!
    variable: { type: 'string', lengthType: 'UInt16LE' }  // Error!
});
```

## Performance Considerations

- **Construction Time**: Members are compiled once during `new Union()`
- **Write Performance**: O(n) scan to find the first defined field
- **Read Performance**: O(n) decode of all members
- **Memory**: Allocated size equals the largest member
- **No Runtime Shape Detection**: Member types are known at construction

```ts
// Efficient: reuse union instance
const union = new Union({ a: 'UInt32LE', b: 'FloatLE' });

for (let i = 0; i < 1000; i++) {
    const buf = union.toBuffer({ a: i });
    const obj = union.toObject(buf);
}

// ❌ Inefficient: don't create unions in loops
for (let i = 0; i < 1000; i++) {
    const u = new Union({ a: 'UInt32LE' });  // Wasteful!
    const buf = u.toBuffer({ a: i });
}
```

## Comparison with Struct

| Feature            | Union                     | Struct                   |
|--------------------|---------------------------|--------------------------|
| **Memory Layout**  | Overlapping (offset 0)    | Sequential (incremental) |
| **Size**           | Max member size           | Sum of all members       |
| **Write Behavior** | First defined field only  | All fields               |
| **Read Behavior**  | All members from offset 0 | All fields sequentially  |
| **Use Case**       | Type punning, variants    | Data records, messages   |

## See Also

- [Nested Structs](./nested-structs.md) - Composing complex structures
- [Bitfields](../primitive/bitfields.md) - Packed bit-level data
- [Best Practices](./best-practices.md) - Performance and design patterns
- [Arrays](./arrays.md) - Working with array members

---

**Next Steps:**

- Explore [Arrays](./arrays.md) for collection handling
- Learn [Best Practices](./best-practices.md) for efficient usage
- Review [Nested Structs](./nested-structs.md) for complex layouts
