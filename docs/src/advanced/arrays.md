# Arrays

Comprehensive guide to working with arrays in xStruct, from primitive arrays to complex nested struct collections.

## Overview

xStruct provides powerful array support for all data types, enabling you to work with collections of values efficiently.
Arrays have a fixed size defined at schema creation time, providing predictable memory layouts ideal for binary data formats.

**Array Types Supported:**

- **Primitive Arrays**: Collections of integers, floats, or doubles
- **String Arrays**: Collections of text data with various encodings
- **Struct Arrays**: Collections of complex nested structures
- **Mixed Arrays**: Combining different array types in a single struct

## Array Syntax

xStruct provides two syntaxes for defining arrays:

### Short Syntax

```ts
import { Struct } from '@remotex-labs/xstruct';

const schema = new Struct({
    // Type[size] format
    bytes: 'UInt8[16]',
    numbers: 'Int32LE[10]',
    floats: 'FloatLE[8]',
    strings: 'string[5]'
});
```

### Descriptor Syntax

```ts
const schema = new Struct({
    bytes: { type: 'UInt8', arraySize: 16 },
    numbers: { type: 'Int32LE', arraySize: 10 },
    floats: { type: 'FloatLE', arraySize: 8 },
    strings: { type: 'string', arraySize: 5 }
});
```

Both syntaxes are equivalent; choose based on your preference and readability needs.

## Primitive Arrays

### Integer Arrays

Fixed-size arrays of integer values:

```ts
const intArraySchema = new Struct({
    // 8-bit integers
    bytes: 'UInt8[32]',          // 32 bytes
    signedBytes: 'Int8[16]',     // 16 signed bytes

    // 16-bit integers
    ports: 'UInt16BE[8]',        // 8 port numbers
    coordinates: 'Int16LE[100]', // 100 coordinate values

    // 32-bit integers
    ids: 'UInt32LE[1000]',       // 1000 IDs
    offsets: 'Int32LE[50]',      // 50 signed offsets

    // 64-bit integers (BigInt)
    timestamps: 'BigUInt64LE[10]',
    largeValues: 'BigInt64LE[5]'
});

const buffer = intArraySchema.toBuffer({
    bytes: new Array(32).fill(0),
    signedBytes: new Array(16).fill(-1),
    ports: [ 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087 ],
    coordinates: new Array(100).fill(0).map((_, i) => i - 50),
    ids: new Array(1000).fill(0).map((_, i) => i),
    offsets: new Array(50).fill(0),
    timestamps: new Array(10).fill(0n).map((_, i) => BigInt(Date.now()) + BigInt(i)),
    largeValues: [ 1n, 2n, 3n, 4n, 5n ]
});
```

### Float and Double Arrays

Arrays of floating-point values:

```ts
const floatArraySchema = new Struct({
    // 32-bit floats
    vertices: 'FloatLE[9000]',      // 3000 vertices × 3 (x,y,z)
    normals: 'FloatLE[9000]',       // 3000 normals × 3
    uvs: 'FloatLE[6000]',           // 3000 UVs × 2
    colors: 'FloatLE[12000]',       // 3000 colors × 4 (RGBA)

    // 64-bit doubles
    preciseCoords: 'DoubleLE[1000]',
    scientificData: 'DoubleLE[500]'
});

const buffer = floatArraySchema.toBuffer({
    vertices: new Array(9000).fill(0),
    normals: new Array(9000).fill(0),
    uvs: new Array(6000).fill(0),
    colors: new Array(12000).fill(1.0),
    preciseCoords: new Array(1000).fill(0),
    scientificData: new Array(500).fill(0)
});
```

### Working with Primitive Arrays

#### Creating Arrays

```ts
const schema = new Struct({
    data: 'UInt8[10]'
});

// Method 1: Array literal
const buffer1 = schema.toBuffer({
    data: [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]
});

// Method 2: Array.fill()
const buffer2 = schema.toBuffer({
    data: new Array(10).fill(0)
});

// Method 3: Array.from()
const buffer3 = schema.toBuffer({
    data: Array.from({ length: 10 }, (_, i) => i)
});

// Method 4: Spread operator
const buffer4 = schema.toBuffer({
    data: [ ...Array(10).keys() ]
});
```

#### Accessing Array Elements

```ts
const schema = new Struct({
    values: 'Int32LE[5]'
});

const buffer = schema.toBuffer({
    values: [ 10, 20, 30, 40, 50 ]
});

const data = schema.toObject(buffer);
console.log(data.values[0]);  // 10
console.log(data.values[4]);  // 50
console.log(data.values.length);  // 5
```

#### Modifying Array Data

```ts
const schema = new Struct({
    counters: 'UInt32LE[5]'
});

// Initial data
const data = {
    counters: [ 0, 0, 0, 0, 0 ]
};

// Modify the array
data.counters[0] = 100;
data.counters[1] = 200;

// Serialize modified data
const buffer = schema.toBuffer(data);
```

## String Arrays

### Basic String Arrays

Fixed-size arrays of strings with length prefixes:

```ts
const stringArraySchema = new Struct({
    names: 'string[5]',       // 5 UTF-8 strings
    codes: 'ascii[10]',       // 10 ASCII strings
    labels: 'utf8[3]'         // 3 UTF-8 strings
});

const buffer = stringArraySchema.toBuffer({
    names: [ 'Alice', 'Bob', 'Carol', 'Dave', 'Eve' ],
    codes: [ 'A1', 'B2', 'C3', 'D4', 'E5', 'F6', 'G7', 'H8', 'I9', 'J10' ],
    labels: [ 'Red', 'Green', 'Blue' ]
});

const data = stringArraySchema.toObject(buffer);
// {
//   names: ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'],
//   codes: ['A1', 'B2', 'C3', 'D4', 'E5', 'F6', 'G7', 'H8', 'I9', 'J10'],
//   labels: ['Red', 'Green', 'Blue']
// }
```

### Fixed-Size String Arrays

Each string has a fixed buffer size:

```ts
const fixedStringArraySchema = new Struct({
    tags: {
        type: 'ascii',
        size: 16,        // Each string is 16 bytes
        arraySize: 10    // 10 strings
    }
});

// Total size: 16 × 10 = 160 bytes (predictable)
const buffer = fixedStringArraySchema.toBuffer({
    tags: [
        'tag1',    // Padded to 16 bytes
        'tag2',    // Padded to 16 bytes
        'tag3',
        'tag4',
        'tag5',
        'tag6',
        'tag7',
        'tag8',
        'tag9',
        'tag10'
    ]
});
```

### Length-Prefixed String Arrays

Each string has its own length prefix:

```ts
const prefixedStringArraySchema = new Struct({
    // Each string with UInt8 length prefix (max 255 bytes per string)
    shortStrings: {
        type: 'ascii',
        lengthType: 'UInt8',
        arraySize: 5
    },

    // Each string with UInt16LE length prefix (max 65,535 bytes per string)
    mediumStrings: {
        type: 'utf8',
        lengthType: 'UInt16LE',
        arraySize: 3
    }
});

const buffer = prefixedStringArraySchema.toBuffer({
    shortStrings: [ 'hello', 'world', 'foo', 'bar', 'baz' ],
    mediumStrings: [ 'This is a longer string', 'Another long string', 'Third one' ]
});
```

### String Array Storage

```ts
// Buffer structure for string arrays with length prefixes:
// [length1][string1][length2][string2][length3][string3]...

const schema = new Struct({
    items: 'string[3]'  // Each with UInt16LE length prefix (default)
});

const buffer = schema.toBuffer({
    items: [ 'Short', 'A bit longer', 'X' ]
});

// Buffer structure:
// [0-1]: Length of 'Short' (5)
// [2-6]: 'Short'
// [7-8]: Length of 'A bit longer' (12)
// [9-20]: 'A bit longer'
// [21-22]: Length of 'X' (1)
// [23]: 'X'
```

## Nested Struct Arrays

### Basic Struct Arrays

Arrays of complex structures:

```ts
// Define a Point struct
const PointStruct = new Struct({
    x: 'Int32LE',
    y: 'Int32LE'
});

// Use Point array in another struct
const shapeSchema = new Struct({
    type: 'UInt8',
    name: 'string',
    vertices: { type: PointStruct, arraySize: 10 }
});

const buffer = shapeSchema.toBuffer({
    type: 1,
    name: 'Polygon',
    vertices: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 5, y: 15 },
        { x: 0, y: 10 },
        { x: -5, y: 5 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 }
    ]
});
```

### Multi-Level Nested Arrays

Complex hierarchical structures:

```ts
// Define nested structs
const Vector3Struct = new Struct({
    x: 'FloatLE',
    y: 'FloatLE',
    z: 'FloatLE'
});

const VertexStruct = new Struct({
    position: Vector3Struct,
    normal: Vector3Struct,
    uv: { u: 'FloatLE', v: 'FloatLE' }
});

const MeshStruct = new Struct({
    name: { type: 'ascii', size: 32 },
    vertexCount: 'UInt32LE',
    vertices: { type: VertexStruct, arraySize: 1000 }
});

// Usage
const buffer = MeshStruct.toBuffer({
    name: 'Cube',
    vertexCount: 24,
    vertices: Array.from({ length: 1000 }, () => ({
        position: { x: 0, y: 0, z: 0 },
        normal: { x: 0, y: 1, z: 0 },
        uv: { u: 0, v: 0 }
    }))
});
```

### Arrays with Mixed Types

Combining different array types:

```ts
const complexSchema = new Struct({
    // Primitive arrays
    ids: 'UInt32LE[100]',
    flags: 'UInt8[100]',

    // String arrays
    names: 'string[100]',

    // Struct arrays
    positions: { type: PointStruct, arraySize: 100 },

    // Metadata
    count: 'UInt32LE',
    timestamp: 'BigUInt64LE'
});
```

## Array Size Considerations

### Fixed vs Dynamic Sizing

xStruct requires fixed array sizes at compile time:

```ts
// ✅ Good: Fixed size known at schema definition
const fixedSchema = new Struct({
    data: 'UInt8[100]'
});

// ❌ Cannot do: Dynamic array size
// const size = calculateSize();
// const dynamicSchema = new Struct({
//   data: `UInt8[${size}]`  // Won't work - size must be literal
// });

// ✅ Workaround: Define maximum size
const maxSize = 1000;
const flexibleSchema = new Struct({
    count: 'UInt32LE',           // Actual count
    data: `UInt8[${ maxSize }]`    // Maximum capacity
});

const buffer = flexibleSchema.toBuffer({
    count: 50,                    // Only using 50
    data: new Array(maxSize).fill(0)  // But allocate full size
});
```

### Memory Layout

```ts
const schema = new Struct({
    header: 'UInt32LE',
    data: 'UInt8[100]',
    footer: 'UInt32LE'
});

// Memory layout:
// [0-3]:     header (4 bytes)
// [4-103]:   data (100 bytes)
// [104-107]: footer (4 bytes)
// Total: 108 bytes

console.log(schema.getSize());  // 108
```

## Buffer Size Calculation

### Calculating Primitive Array Size

```ts
const schema = new Struct({
    uint8Array: 'UInt8[100]',      // 100 × 1 = 100 bytes
    uint16Array: 'UInt16LE[100]',  // 100 × 2 = 200 bytes
    uint32Array: 'UInt32LE[100]',  // 100 × 4 = 400 bytes
    floatArray: 'FloatLE[100]',    // 100 × 4 = 400 bytes
    doubleArray: 'DoubleLE[100]'   // 100 × 8 = 800 bytes
});

console.log(schema.getSize());   // 1900 bytes
```

### Calculating String Array Size

Fixed-size strings:

```ts
const fixedStringSchema = new Struct({
    tags: {
        type: 'ascii',
        size: 20,        // Each string: 20 bytes
        arraySize: 10    // 10 strings
    }
});

console.log(fixedStringSchema.getSize());  // 200 bytes (20 × 10)
```

Length-prefixed strings (variable):

```ts
const prefixedSchema = new Struct({
    names: 'string[5]'  // Variable size per string
});

// Size depends on actual string lengths
// Minimum: 5 × 2 = 10 bytes (just length prefixes)
// Actual: sum of (2 + string length in bytes) for each string
```

### Calculating Nested Struct Array Size

```ts
const pointSchema = new Struct({
    x: 'Int32LE',  // 4 bytes
    y: 'Int32LE'   // 4 bytes
});
// Total per point: 8 bytes

const lineSchema = new Struct({
    id: 'UInt16LE',                        // 2 bytes
    points: { type: pointSchema, arraySize: 10 }  // 10 × 8 = 80 bytes
});

console.log(lineSchema.getSize());  // 82 bytes
```

## Common Patterns

### Image Data

```ts
interface ImageHeader {
    width: number;
    height: number;
    channels: number;
    pixels: number[];
}

const imageSchema = new Struct<ImageHeader>({
    width: 'UInt16LE',
    height: 'UInt16LE',
    channels: 'UInt8',      // RGB=3, RGBA=4
    pixels: 'UInt8[1024]'   // 256 pixels × 4 channels
});
```

### Audio Buffer

```ts
const audioSchema = new Struct({
    sampleRate: 'FloatLE',
    channels: 'UInt8',
    bitDepth: 'UInt8',
    samples: 'FloatLE[2048]'  // Audio samples (-1.0 to 1.0)
});
```

### Sensor Readings

```ts
const sensorLogSchema = new Struct({
    timestamp: 'BigUInt64LE',
    sensorId: 'UInt16LE',
    temperature: 'FloatLE[100]',    // 100 readings
    humidity: 'FloatLE[100]',       // 100 readings
    pressure: 'DoubleLE[100]'       // 100 readings
});
```

### Game Entity System

```ts
const Vector3 = new Struct({
    x: 'FloatLE',
    y: 'FloatLE',
    z: 'FloatLE'
});

const EntityStruct = new Struct({
    position: Vector3,
    rotation: Vector3,
    scale: Vector3,
    velocity: Vector3
});

const sceneSchema = new Struct({
    entityCount: 'UInt32LE',
    entities: { type: EntityStruct, arraySize: 1000 }
});
```

### Network Packet with Data

```ts
const packetSchema = new Struct({
    // Header
    magic: 'UInt32BE',
    version: 'UInt8',
    packetType: 'UInt8',
    sequenceNumber: 'UInt32BE',

    // Payload
    payloadLength: 'UInt16BE',
    payload: 'UInt8[1024]',

    // Footer
    checksum: 'UInt32BE'
});
```

### Matrix Data

```ts
// 4×4 matrix stored as flat array
const matrixSchema = new Struct({
    matrix4x4: 'FloatLE[16]'  // Row-major or column-major
});

// Helper functions
function setMatrix4x4(data: number[][]): number[] {
    const flat: number[] = [];
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            flat.push(data[row][col]);
        }
    }
    return flat;
}

const buffer = matrixSchema.toBuffer({
    matrix4x4: setMatrix4x4([
        [ 1, 0, 0, 0 ],
        [ 0, 1, 0, 0 ],
        [ 0, 0, 1, 0 ],
        [ 0, 0, 0, 1 ]
    ])
});
```

## Performance Optimization

### Memory Efficiency

```ts
// ✅ Efficient: Use appropriate types
const efficientSchema = new Struct({
    bytes: 'UInt8[1000]',       // 1KB
    flags: 'UInt8[1000]'        // 1KB
});
// Total: 2KB

// ❌ Wasteful: Using larger types than needed
const wastefulSchema = new Struct({
    bytes: 'UInt32LE[1000]',    // 4KB (wasting 3KB)
    flags: 'UInt32LE[1000]'     // 4KB (wasting 3KB)
});
// Total: 8KB (4× larger!)
```

### Cache-Friendly Access

```ts
// Struct of Arrays (SoA) - Better for cache
const soaSchema = new Struct({
    posX: 'FloatLE[1000]',
    posY: 'FloatLE[1000]',
    posZ: 'FloatLE[1000]'
});

// Array of Structs (AoS) - More intuitive but worse for cache
const Vector3 = new Struct({
    x: 'FloatLE',
    y: 'FloatLE',
    z: 'FloatLE'
});

const aosSchema = new Struct({
    positions: { type: Vector3, arraySize: 1000 }
});

// Choose based on access patterns:
// - SoA: Better when processing one component at a time
// - AoS: Better when processing complete vectors together
```

### Pre-allocation

```ts
const schema = new Struct({
    data: 'UInt8[10000]'
});

// ✅ Efficient: Pre-allocate and reuse
const buffer = Buffer.alloc(schema.getSize());

for (let i = 0; i < 1000; i++) {
    const data = { data: generateData() };
    schema.toBuffer(data, buffer);
    processBuffer(buffer);
}

// ❌ Inefficient: Allocate each time
for (let i = 0; i < 1000; i++) {
    const data = { data: generateData() };
    const buffer = schema.toBuffer(data);  // New allocation
    processBuffer(buffer);
}
```

## Validation

### Array Length Validation

```ts
function validateArrayLength<T>(
    array: T[],
    expectedLength: number,
    fieldName: string
): void {
    if (array.length !== expectedLength) {
        throw new Error(
            `${ fieldName } must have exactly ${ expectedLength } elements, got ${ array.length }`
        );
    }
}

// Usage
const schema = new Struct({
    data: 'UInt8[100]'
});

const data = new Array(100).fill(0);
validateArrayLength(data, 100, 'data');

const buffer = schema.toBuffer({ data });
```

### Element Validation

```ts
function validateArrayElements<T>(
    array: T[],
    validator: (value: T, index: number) => void,
    fieldName: string
): void {
    array.forEach((value, index) => {
        try {
            validator(value, index);
        } catch (error) {
            throw new Error(
                `${ fieldName }[${ index }]: ${ error.message }`
            );
        }
    });
}

// Usage
const schema = new Struct({
    percentages: 'UInt8[10]'
});

const data = [ 10, 20, 30, 40, 50, 60, 70, 80, 90, 100 ];

validateArrayElements(
    data,
    (value) => {
        if (value < 0 || value > 100) {
            throw new Error('Value must be between 0 and 100');
        }
    },
    'percentages'
);
```

## Best Practices

### ✅ Do

```ts
// Use appropriate array sizes
const goodSchema = new Struct({
    header: 'UInt32LE',
    data: 'UInt8[1024]',      // Reasonable size
    footer: 'UInt32LE'
});

// Pre-fill arrays with default values
const data = {
    header: 0x12345678,
    data: new Array(1024).fill(0),
    footer: 0x87654321
};

// Use typed interfaces
interface DataPacket {
    header: number;
    data: number[];
    footer: number;
}

const typedSchema = new Struct<DataPacket>({
    header: 'UInt32LE',
    data: 'UInt8[1024]',
    footer: 'UInt32LE'
});

// Document array purposes
const documentedSchema = new Struct({
    rgbPixels: 'UInt8[768]',  // 256 pixels × 3 channels (RGB)
    timestamps: 'BigUInt64LE[100]'  // Last 100 event timestamps
});
```

### ❌ Don't

```ts
// Don't use unnecessarily large arrays
const badSchema = new Struct({
    data: 'UInt8[1000000]'  // ❌ 1MB per record!
});

// Don't forget to fill all array elements
const incomplete = {
    data: [ 1, 2, 3 ]  // ❌ Schema expects 1024 elements!
};

// Don't use arrays when a single value suffices
const wasteSchema = new Struct({
    id: 'UInt32LE[1]'  // ❌ Just use 'UInt32LE'
});

// Don't mix array types without reason
const confusingSchema = new Struct({
    data1: 'UInt8[100]',
    data2: 'UInt16LE[100]',  // ❌ Why different types for similar data?
    data3: 'UInt32LE[100]'
});
```

## Troubleshooting

### Array Length Mismatch

```ts
const schema = new Struct({
    data: 'UInt8[10]'
});

// ❌ Wrong length
try {
    schema.toBuffer({
        data: [ 1, 2, 3 ]  // Only 3 elements, need 10
    });
} catch (error) {
    console.error('Array length mismatch');
}

// ✅ Correct length
const buffer = schema.toBuffer({
    data: [ 1, 2, 3, 0, 0, 0, 0, 0, 0, 0 ]  // 10 elements
});
```

### Buffer Overflow

```ts
// Check buffer size before serialization
const schema = new Struct({
    largeArray: 'UInt8[100000]'
});

const expectedSize = schema.getSize();
console.log(`Buffer needs: ${ expectedSize } bytes`);

// Ensure sufficient memory
const buffer = Buffer.alloc(expectedSize);
schema.toBuffer({ largeArray: new Array(100000).fill(0) }, buffer);
```

### Type Mismatches

```ts
const schema = new Struct({
    bigInts: 'BigUInt64LE[5]'
});

// ❌ Wrong: Regular numbers
const wrongData = {
    bigInts: [ 1, 2, 3, 4, 5 ]  // Should be BigInts!
};

// ✅ Correct: BigInts
const correctData = {
    bigInts: [ 1n, 2n, 3n, 4n, 5n ]
};
```

## Real-World Examples

### Video Frame Buffer

```ts
const videoFrameSchema = new Struct({
    frameNumber: 'UInt32LE',
    timestamp: 'BigUInt64LE',
    width: 'UInt16LE',
    height: 'UInt16LE',
    format: 'UInt8',           // RGB=0, RGBA=1, etc.
    pixels: 'UInt8[921600]'    // 640×480×3 (RGB)
});
```

### Scientific Dataset

```ts
const experimentDataSchema = new Struct({
    experimentId: 'UInt32LE',
    timestamp: 'BigUInt64LE',
    temperature: 'DoubleLE[1000]',
    pressure: 'DoubleLE[1000]',
    concentration: 'DoubleLE[1000]',
    measurements: 'UInt32LE'
});
```

### Game Replay Data

```ts
const GameInput = new Struct({
    timestamp: 'UInt32LE',
    keyCode: 'UInt8',
    pressed: 'UInt8',  // Boolean
    mouseX: 'Int16LE',
    mouseY: 'Int16LE'
});

const replaySchema = new Struct({
    version: 'UInt32LE',
    playerName: { type: 'string', size: 32 },
    duration: 'UInt32LE',
    inputCount: 'UInt32LE',
    inputs: { type: GameInput, arraySize: 10000 }
});
```

## See Also

- [Integer Types (UInt/Int)](../primitive/int.md) - Integer primitive types
- [Float Types](../primitive/float.md) - Floating-point types
- [Strings Guide](./strings.md) - String handling
- [Nested Structs](./nested-structs.md) - Complex structures
- [Best Practices](./best-practices.md) - Optimization tips
