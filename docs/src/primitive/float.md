# Floating-Point Types (Float & Double)

Comprehensive guide to floating-point number types in xStruct, covering 32-bit (Float) and 64-bit (Double) precision values.

## Overview

xStruct supports IEEE 754 floating-point types for representing real numbers with decimal points.
These types are essential for scientific calculations, graphics, physics simulations, and any application requiring fractional values.

**Type Categories:**

- **Float (32-bit)**: Single-precision floating-point (4 bytes)
- **Double (64-bit)**: Double-precision floating-point (8 bytes)

Both types support little-endian (LE) and big-endian (BE) byte ordering for cross-platform compatibility.

## Quick Reference Table

| Type            | Size    | Precision     | Range                      | JavaScript Type | Use Case                               |
|-----------------|---------|---------------|----------------------------|-----------------|----------------------------------------|
| **FloatLE/BE**  | 4 bytes | ~7 digits     | ±1.18×10⁻³⁸ to ±3.4×10³⁸   | number          | Graphics, audio, game physics          |
| **DoubleLE/BE** | 8 bytes | ~15-17 digits | ±2.23×10⁻³⁰⁸ to ±1.8×10³⁰⁸ | number          | Scientific, financial, GPS coordinates |

## Float Types (32-bit)

### FloatLE/BE - Single-Precision Float

**Size**: 4 bytes (32 bits)  
**Precision**: ~7 decimal digits  
**Range**: ±1.175494351×10⁻³⁸ to ±3.402823466×10³⁸  
**Special Values**: NaN, Infinity, -Infinity, +0, -0

```ts
import { Struct } from '@remotex-labs/xstruct';

const physicsSchema = new Struct({
    velocityX: 'FloatLE',
    velocityY: 'FloatLE',
    velocityZ: 'FloatLE',
    mass: 'FloatLE',
    friction: 'FloatLE'
});

const buffer = physicsSchema.toBuffer({
    velocityX: 15.75,
    velocityY: -8.25,
    velocityZ: 0.0,
    mass: 10.5,
    friction: 0.95
});

const data = physicsSchema.toObject(buffer);
// {
//   velocityX: 15.75,
//   velocityY: -8.25,
//   velocityZ: 0,
//   mass: 10.5,
//   friction: 0.9500000476837158
// }
```

### IEEE 754 Single-Precision Format

The 32-bit float consists of:

- **Sign bit** (1 bit): 0 for positive, 1 for negative
- **Exponent** (8 bits): Biased by 127
- **Mantissa/Significand** (23 bits): Fractional part

```text
Bit Layout:
[31] [30-23] [22-0]
Sign Exponent Mantissa
```

### Precision Characteristics

```ts
const precisionSchema = new Struct({
    value: 'FloatLE'
});

// Float can represent integers exactly up to 2^24 (16,777,216)
let buffer = precisionSchema.toBuffer({ value: 16777216 });
console.log(precisionSchema.toObject(buffer).value); // 16777216 (exact)

// Beyond 2^24, precision is lost
buffer = precisionSchema.toBuffer({ value: 16777217 });
console.log(precisionSchema.toObject(buffer).value); // 16777216 (loses precision)

// Decimal precision example
buffer = precisionSchema.toBuffer({ value: 0.1 + 0.2 });
console.log(precisionSchema.toObject(buffer).value); // Approximately 0.30000001192092896
```

### Common Use Cases

#### 3D Graphics and Game Development

```ts
interface Vector3 {
    x: number;
    y: number;
    z: number;
}

const vector3Schema = new Struct<Vector3>({
    x: 'FloatLE',
    y: 'FloatLE',
    z: 'FloatLE'
});

// Vertex data
const vertexSchema = new Struct({
    position: vector3Schema,
    normal: vector3Schema,
    color: vector3Schema,    // RGB as 0.0-1.0
    texCoord: { x: 'FloatLE', y: 'FloatLE' }
});

const buffer = vertexSchema.toBuffer({
    position: { x: 1.5, y: 2.3, z: -0.8 },
    normal: { x: 0.0, y: 1.0, z: 0.0 },
    color: { x: 1.0, y: 0.5, z: 0.0 },
    texCoord: { x: 0.5, y: 0.5 }
});
```

#### Audio Processing

```ts
const audioSchema = new Struct({
    sampleRate: 'FloatLE',     // 44100.0, 48000.0, etc.
    volume: 'FloatLE',         // 0.0 to 1.0
    pitch: 'FloatLE',          // Pitch multiplier
    pan: 'FloatLE',            // -1.0 (left) to 1.0 (right)
    duration: 'FloatLE'        // Seconds
});

const buffer = audioSchema.toBuffer({
    sampleRate: 44100.0,
    volume: 0.85,
    pitch: 1.2,
    pan: -0.3,
    duration: 3.5
});
```

#### Physics Simulations

```ts
const particleSchema = new Struct({
    // Position
    posX: 'FloatLE',
    posY: 'FloatLE',
    posZ: 'FloatLE',

    // Velocity
    velX: 'FloatLE',
    velY: 'FloatLE',
    velZ: 'FloatLE',

    // Forces
    mass: 'FloatLE',
    gravity: 'FloatLE',
    friction: 'FloatLE',
    elasticity: 'FloatLE'
});

const buffer = particleSchema.toBuffer({
    posX: 0.0,
    posY: 10.0,
    posZ: 0.0,
    velX: 5.5,
    velY: 0.0,
    velZ: -2.3,
    mass: 1.0,
    gravity: 9.81,
    friction: 0.02,
    elasticity: 0.8
});
```

#### Color Representation

```ts
// RGB float colors (0.0 to 1.0)
const colorSchema = new Struct({
    red: 'FloatLE',
    green: 'FloatLE',
    blue: 'FloatLE',
    alpha: 'FloatLE'
});

function rgbToFloat(r: number, g: number, b: number, a: number = 255) {
    return {
        red: r / 255,
        green: g / 255,
        blue: b / 255,
        alpha: a / 255
    };
}

const buffer = colorSchema.toBuffer(rgbToFloat(255, 128, 64, 255));
// { red: 1.0, green: 0.5019607843137255, blue: 0.25098039215686274, alpha: 1.0 }
```

### Arrays of Floats

```ts
const floatArraySchema = new Struct({
    // Short syntax
    samples: 'FloatLE[1024]',

    // Descriptor syntax
    vertices: { type: 'FloatLE', arraySize: 3000 },
    weights: { type: 'FloatBE', arraySize: 100 }
});

const buffer = floatArraySchema.toBuffer({
    samples: new Array(1024).fill(0).map((_, i) => Math.sin(i * 0.1)),
    vertices: new Array(3000).fill(0),
    weights: new Array(100).fill(1.0)
});
```

### Special Float Values

```ts
const specialValuesSchema = new Struct({
    positiveInfinity: 'FloatLE',
    negativeInfinity: 'FloatLE',
    notANumber: 'FloatLE',
    positiveZero: 'FloatLE',
    negativeZero: 'FloatLE'
});

const buffer = specialValuesSchema.toBuffer({
    positiveInfinity: Infinity,
    negativeInfinity: -Infinity,
    notANumber: NaN,
    positiveZero: 0,
    negativeZero: -0
});

const data = specialValuesSchema.toObject(buffer);
console.log(data.positiveInfinity);  // Infinity
console.log(data.negativeInfinity);  // -Infinity
console.log(data.notANumber);        // NaN
console.log(Object.is(data.positiveZero, 0));   // true
console.log(Object.is(data.negativeZero, -0));  // true
```

## Double Types (64-bit)

### DoubleLE/BE - Double-Precision Float

**Size**: 8 bytes (64 bits)  
**Precision**: ~15-17 decimal digits  
**Range**: ±2.2250738585072014×10⁻³⁰⁸ to ±1.7976931348623157×10³⁰⁸  
**Special Values**: NaN, Infinity, -Infinity, +0, -0

```ts
const scientificSchema = new Struct({
    temperature: 'DoubleLE',
    pressure: 'DoubleLE',
    longitude: 'DoubleLE',
    latitude: 'DoubleLE',
    altitude: 'DoubleLE'
});

const buffer = scientificSchema.toBuffer({
    temperature: 273.15,
    pressure: 101325.0,
    longitude: -122.4194155,
    latitude: 37.7749295,
    altitude: 52.0
});

const data = scientificSchema.toObject(buffer);
// Values are preserved with high precision
```

### IEEE 754 Double-Precision Format

The 64-bit double consists of:

- **Sign bit** (1 bit): 0 for positive, 1 for negative
- **Exponent** (11 bits): Biased by 1023
- **Mantissa/Significand** (52 bits): Fractional part

```text
Bit Layout:
[63] [62-52] [51-0]
Sign Exponent Mantissa
```

### Double Precision Characteristics

```ts
const doublePrecisionSchema = new Struct({
    value: 'DoubleLE'
});

// Double can represent integers exactly up to 2^53 (9,007,199,254,740,992)
let buffer = doublePrecisionSchema.toBuffer({
    value: Number.MAX_SAFE_INTEGER
});
console.log(doublePrecisionSchema.toObject(buffer).value);
// 9007199254740991 (exact)

// Much better decimal precision than float
buffer = doublePrecisionSchema.toBuffer({ value: Math.PI });
console.log(doublePrecisionSchema.toObject(buffer).value);
// 3.141592653589793 (very close to actual π)

// More precise decimal arithmetic
buffer = doublePrecisionSchema.toBuffer({ value: 0.1 + 0.2 });
console.log(doublePrecisionSchema.toObject(buffer).value);
// 0.30000000000000004 (still has floating-point error, but much better than float)
```

### Double Common Use Cases

#### Geographic Coordinates

```ts
interface GeoLocation {
    latitude: number;   // -90 to 90
    longitude: number;  // -180 to 180
    altitude: number;   // Meters above sea level
    accuracy: number;   // Meters
}

const geoLocationSchema = new Struct<GeoLocation>({
    latitude: 'DoubleLE',
    longitude: 'DoubleLE',
    altitude: 'DoubleLE',
    accuracy: 'DoubleLE'
});

const buffer = geoLocationSchema.toBuffer({
    latitude: 37.7749295,    // San Francisco
    longitude: -122.4194155,
    altitude: 52.0,
    accuracy: 10.0
});

// Precision is crucial for GPS coordinates
// Double provides accuracy to ~1cm at the equator
```

#### Scientific Calculations

```ts
const scientificDataSchema = new Struct({
    avogadroNumber: 'DoubleLE',      // 6.02214076×10²³
    planckConstant: 'DoubleLE',      // 6.62607015×10⁻³⁴
    speedOfLight: 'DoubleLE',        // 299,792,458 m/s
    gravitationalConstant: 'DoubleLE' // 6.674×10⁻¹¹
});

const buffer = scientificDataSchema.toBuffer({
    avogadroNumber: 6.02214076e23,
    planckConstant: 6.62607015e-34,
    speedOfLight: 299792458,
    gravitationalConstant: 6.674e-11
});
```

#### Financial Calculations

```ts
// Note: For money, consider using integers (cents) instead
// This is for calculations that need decimal precision

const financialSchema = new Struct({
    interestRate: 'DoubleLE',     // Percentage
    exchangeRate: 'DoubleLE',     // Currency conversion
    stockPrice: 'DoubleLE',       // Per share
    volatility: 'DoubleLE',       // Standard deviation
    beta: 'DoubleLE'              // Market correlation
});

const buffer = financialSchema.toBuffer({
    interestRate: 4.25,
    exchangeRate: 1.18,
    stockPrice: 342.67,
    volatility: 0.23,
    beta: 1.15
});
```

#### Statistical Data

```ts
const statsSchema = new Struct({
    mean: 'DoubleLE',
    median: 'DoubleLE',
    standardDeviation: 'DoubleLE',
    variance: 'DoubleLE',
    skewness: 'DoubleLE',
    kurtosis: 'DoubleLE',
    min: 'DoubleLE',
    max: 'DoubleLE'
});

const buffer = statsSchema.toBuffer({
    mean: 42.5,
    median: 41.0,
    standardDeviation: 8.3,
    variance: 68.89,
    skewness: 0.15,
    kurtosis: -0.45,
    min: 12.0,
    max: 89.0
});
```

#### Time Measurements

```ts
const timingSchema = new Struct({
    startTime: 'DoubleLE',      // Unix timestamp with milliseconds
    endTime: 'DoubleLE',
    duration: 'DoubleLE',       // Seconds with high precision
    framerate: 'DoubleLE'       // Frames per second
});

const buffer = timingSchema.toBuffer({
    startTime: Date.now() / 1000,
    endTime: (Date.now() + 5000) / 1000,
    duration: 5.234,
    framerate: 59.94
});
```

### Arrays of Doubles

```ts
const doubleArraySchema = new Struct({
    // Short syntax
    measurements: 'DoubleLE[100]',

    // Descriptor syntax
    coordinates: { type: 'DoubleLE', arraySize: 1000 },
    coefficients: { type: 'DoubleBE', arraySize: 50 }
});

const buffer = doubleArraySchema.toBuffer({
    measurements: new Array(100).fill(0).map(() => Math.random() * 100),
    coordinates: new Array(1000).fill(0),
    coefficients: new Array(50).fill(1.0)
});
```

## Endianness

### Understanding Float Endianness

Like integers, floating-point numbers are affected by byte ordering:

```ts
const value = 3.14159;

// Little-endian (most common)
const leSchema = new Struct({
    value: 'FloatLE'
});
const leBuffer = leSchema.toBuffer({ value });
console.log(leBuffer);
// <Buffer 40 49 0f db>

// Big-endian (network byte order)
const beSchema = new Struct({
    value: 'FloatBE'
});
const beBuffer = beSchema.toBuffer({ value });
console.log(beBuffer);
// <Buffer db 0f 49 40>
```

### When to Use Each Endianness

```ts
// Local storage and computation: Use LE (matches most platforms)
const localDataSchema = new Struct({
    x: 'FloatLE',
    y: 'FloatLE',
    z: 'FloatLE'
});

// Network protocols: Use BE (network byte order)
const networkDataSchema = new Struct({
    latitude: 'DoubleBE',
    longitude: 'DoubleBE'
});

// Graphics APIs: Usually LE
const vertexSchema = new Struct({
    posX: 'FloatLE',
    posY: 'FloatLE',
    posZ: 'FloatLE',
    normalX: 'FloatLE',
    normalY: 'FloatLE',
    normalZ: 'FloatLE'
});
```

## Float vs Double Comparison

### Memory and Performance

```ts
// Float: More memory efficient
const floatSchema = new Struct({
    vertices: 'FloatLE[3000]'  // 12KB
});

// Double: More precise but larger
const doubleSchema = new Struct({
    vertices: 'DoubleLE[3000]'  // 24KB (2x larger)
});
```

### Precision Comparison

```ts
const comparisonSchema = new Struct({
    asFloat: 'FloatLE',
    asDouble: 'DoubleLE'
});

// Pi
const pi = Math.PI;
let buffer = comparisonSchema.toBuffer({
    asFloat: pi,
    asDouble: pi
});
let result = comparisonSchema.toObject(buffer);

console.log('Original:', pi);                    // 3.141592653589793
console.log('As Float:', result.asFloat);        // 3.1415927410125732
console.log('As Double:', result.asDouble);      // 3.141592653589793

// Small number precision
const small = 0.0000001;
buffer = comparisonSchema.toBuffer({
    asFloat: small,
    asDouble: small
});
result = comparisonSchema.toObject(buffer);

console.log('Original:', small);                 // 0.0000001
console.log('As Float:', result.asFloat);        // 9.999999717180685e-8
console.log('As Double:', result.asDouble);      // 1e-7
```

## Floating-Point Gotchas

### 1. Comparison Issues

```ts
// ❌ Don't compare floats directly
const schema = new Struct({
    value: 'FloatLE'
});

const buffer = schema.toBuffer({ value: 0.1 + 0.2 });
const result = schema.toObject(buffer);

console.log(result.value === 0.3);  // false (floating-point error)

// ✅ Use epsilon comparison
function floatEqual(a: number, b: number, epsilon: number = 0.000001): boolean {
    return Math.abs(a - b) < epsilon;
}

console.log(floatEqual(result.value, 0.3));  // true
```

### 2. Loss of Precision

```ts
// ❌ Float precision loss
const floatSchema = new Struct({
    value: 'FloatLE'
});

// Large integer
let buffer = floatSchema.toBuffer({ value: 16777217 });
console.log(floatSchema.toObject(buffer).value);  // 16777216 (lost precision)

// ✅ Use Double for large integers
const doubleSchema = new Struct({
    value: 'DoubleLE'
});

buffer = doubleSchema.toBuffer({ value: 16777217 });
console.log(doubleSchema.toObject(buffer).value);  // 16777217 (preserved)
```

### 3. Accumulation Errors

```ts
// ❌ Accumulation error with Float
const floatSum = new Struct({
    sum: 'FloatLE'
});

let sum = 0;
for (let i = 0; i < 1000000; i++) {
    sum += 0.1;
}

let buffer = floatSum.toBuffer({ sum });
console.log(floatSum.toObject(buffer).sum);  // Large error accumulated

// ✅ Use Double for accumulation
const doubleSum = new Struct({
    sum: 'DoubleLE'
});

sum = 0;
for (let i = 0; i < 1000000; i++) {
    sum += 0.1;
}

buffer = doubleSum.toBuffer({ sum });
console.log(doubleSum.toObject(buffer).sum);  // Better (but still has some error)

// ✅✅ Best: Use integers when possible
const intSum = new Struct({
    sum: 'UInt32LE'
});

let intSumValue = 0;
for (let i = 0; i < 1000000; i++) {
    intSumValue += 1;  // Store cents, not dollars
}

buffer = intSum.toBuffer({ sum: intSumValue });
console.log(intSum.toObject(buffer).sum / 10);  // Perfect accuracy
```

### 4. NaN Handling

```ts
const nanSchema = new Struct({
    value: 'FloatLE'
});

const buffer = nanSchema.toBuffer({ value: NaN });
const result = nanSchema.toObject(buffer);

// ❌ NaN is never equal to itself
console.log(result.value === NaN);  // false

// ✅ Use Number.isNaN()
console.log(Number.isNaN(result.value));  // true

// ✅ Or Object.is()
console.log(Object.is(result.value, NaN));  // true
```

### 5. Infinity Handling

```ts
const infinitySchema = new Struct({
    positive: 'DoubleLE',
    negative: 'DoubleLE'
});

const buffer = infinitySchema.toBuffer({
    positive: Infinity,
    negative: -Infinity
});

const result = infinitySchema.toObject(buffer);

console.log(result.positive === Infinity);   // true
console.log(result.negative === -Infinity);  // true
console.log(Number.isFinite(result.positive));  // false
```

## Validation and Safety

### Range Validation

```ts
function validateFloat(value: number): void {
    if (!Number.isFinite(value)) {
        if (Number.isNaN(value)) {
            throw new TypeError('Value is NaN');
        }
        throw new RangeError('Value is Infinity');
    }

    // Check if within Float32 range
    const MAX_FLOAT = 3.4028234663852886e+38;
    const MIN_FLOAT = -3.4028234663852886e+38;

    if (value > MAX_FLOAT || value < MIN_FLOAT) {
        throw new RangeError(`Value ${ value } exceeds Float range`);
    }
}

// Usage
try {
    validateFloat(3.5e38);  // OK
    validateFloat(3.5e39);  // Throws RangeError
    validateFloat(NaN);     // Throws TypeError
} catch (error) {
    console.error(error.message);
}
```

### Precision Validation

```ts
function validatePrecision(value: number, maxDecimals: number): void {
    const decimals = (value.toString().split('.')[1] || '').length;
    if (decimals > maxDecimals) {
        console.warn(`Value ${ value } has ${ decimals } decimals, may lose precision`);
    }
}

// Usage
validatePrecision(3.141592653589793, 7);  // Warning for Float
validatePrecision(3.141592653589793, 15); // OK for Double
```

## Real-World Examples

### Game Entity System

```ts
interface GameEntity {
    // Transform
    posX: number;
    posY: number;
    posZ: number;
    rotX: number;
    rotY: number;
    rotZ: number;
    scaleX: number;
    scaleY: number;
    scaleZ: number;

    // Physics
    velocityX: number;
    velocityY: number;
    velocityZ: number;
    mass: number;

    // Rendering
    opacity: number;
}

const gameEntitySchema = new Struct<GameEntity>({
    // Transform
    posX: 'FloatLE',
    posY: 'FloatLE',
    posZ: 'FloatLE',
    rotX: 'FloatLE',
    rotY: 'FloatLE',
    rotZ: 'FloatLE',
    scaleX: 'FloatLE',
    scaleY: 'FloatLE',
    scaleZ: 'FloatLE',

    // Physics
    velocityX: 'FloatLE',
    velocityY: 'FloatLE',
    velocityZ: 'FloatLE',
    mass: 'FloatLE',

    // Rendering
    opacity: 'FloatLE'
});
```

### Weather Station Data

```ts
const weatherDataSchema = new Struct({
    timestamp: 'DoubleLE',          // Unix timestamp with milliseconds
    temperature: 'FloatLE',         // Celsius
    humidity: 'FloatLE',            // Percentage
    pressure: 'DoubleLE',           // Pascals (needs precision)
    windSpeed: 'FloatLE',           // m/s
    windDirection: 'FloatLE',       // Degrees (0-360)
    rainfall: 'FloatLE',            // mm
    latitude: 'DoubleLE',           // GPS coordinate
    longitude: 'DoubleLE',          // GPS coordinate
    altitude: 'DoubleLE'            // Meters
});

const buffer = weatherDataSchema.toBuffer({
    timestamp: Date.now() / 1000,
    temperature: 22.5,
    humidity: 65.3,
    pressure: 101325.0,
    windSpeed: 5.2,
    windDirection: 180.0,
    rainfall: 0.0,
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: 16.0
});
```

### Audio Sample Data

```ts
const audioFileSchema = new Struct({
    // Header
    sampleRate: 'FloatLE',          // 44100.0, 48000.0, etc.
    duration: 'DoubleLE',           // Total duration in seconds
    channels: 'UInt8',              // Mono=1, Stereo=2
    bitDepth: 'UInt8',              // 16, 24, 32
  
    // Metadata
    peakAmplitude: 'FloatLE',       // Maximum amplitude
    rmsLevel: 'FloatLE',            // RMS level

    // Sample data (normalized -1.0 to 1.0)
    samples: 'FloatLE[1024]'
});
```

### 3D Model Vertex Data

```ts
const vertexBufferSchema = new Struct({
    // Position (3 floats)
    posX: 'FloatLE',
    posY: 'FloatLE',
    posZ: 'FloatLE',

    // Normal (3 floats)
    normalX: 'FloatLE',
    normalY: 'FloatLE',
    normalZ: 'FloatLE',

    // Texture coordinates (2 floats)
    texU: 'FloatLE',
    texV: 'FloatLE',

    // Color (4 floats, RGBA 0.0-1.0)
    colorR: 'FloatLE',
    colorG: 'FloatLE',
    colorB: 'FloatLE',
    colorA: 'FloatLE',

    // Tangent (3 floats)
    tangentX: 'FloatLE',
    tangentY: 'FloatLE',
    tangentZ: 'FloatLE'
});
```

### Financial Trading Data

```ts
const tradeDataSchema = new Struct({
    timestamp: 'DoubleLE',          // High-precision timestamp
    price: 'DoubleLE',              // Trade price
    volume: 'DoubleLE',             // Trade volume
    bid: 'DoubleLE',                // Best bid price
    ask: 'DoubleLE',                // Best ask price
    open: 'DoubleLE',               // Opening price
    high: 'DoubleLE',               // High price
    low: 'DoubleLE',                // Low price
    close: 'DoubleLE',              // Closing price
    vwap: 'DoubleLE'                // Volume-weighted average price
});
```

## Best Practices

### ✅ Do

```ts
// Use Float for graphics and game data
const graphicsSchema = new Struct({
    vertices: 'FloatLE[9000]',
    normals: 'FloatLE[9000]',
    uvs: 'FloatLE[6000]'
});

// Use Double for precise measurements
const scienceSchema = new Struct({
    latitude: 'DoubleLE',
    longitude: 'DoubleLE',
    altitude: 'DoubleLE'
});

// Normalize values to appropriate ranges
const normalizedSchema = new Struct({
    color: 'FloatLE',        // 0.0 to 1.0
    volume: 'FloatLE',       // 0.0 to 1.0
    progress: 'FloatLE'      // 0.0 to 1.0
});

// Use epsilon comparison
function compare(a: number, b: number, epsilon: number = 1e-6): boolean {
    return Math.abs(a - b) < epsilon;
}
```

### ❌ Don't

```ts
// Don't use Float for money
const badFinancialSchema = new Struct({
    balance: 'FloatLE'      // ❌ Use Int32LE (cents) instead
});

// Don't compare floats directly
const value = 0.1 + 0.2;
if (value === 0.3) {      // ❌ Will be false
    // ...
}

// Don't use Float for large integers
const badIntegerSchema = new Struct({
    id: 'FloatLE'           // ❌ Use UInt32LE or BigUInt64LE
});

// Don't accumulate many small floats
let sum = 0;
for (let i = 0; i < 1000000; i++) {
    sum += 0.001;           // ❌ Error accumulates
}
```

### Type Selection Guide

```ts
// ✅ Float is good for:
// - 3D positions and rotations
// - Colors (0-1 range)
// - Audio samples
// - Physics velocities
// - Percentages

// ✅ Double is good for:
// - GPS coordinates
// - Scientific measurements
// - Statistical calculations
// - Time with high precision
// - Large value ranges

// ❌ Neither is good for:
// - Money (use integers for cents)
// - Unique IDs (use integers)
// - Counters (use integers)
// - Exact decimal values
```

## Performance Considerations

### Memory Usage

```ts
// 1000 entities with Float: 52KB
const floatEntitySchema = new Struct({
    position: 'FloatLE[3]',    // 12 bytes
    rotation: 'FloatLE[3]',    // 12 bytes
    velocity: 'FloatLE[3]'     // 12 bytes
    // Total: 36 bytes × 1000 = 36KB
});

// 1000 entities with Double: 72KB  
const doubleEntitySchema = new Struct({
    position: 'DoubleLE[3]',   // 24 bytes
    rotation: 'DoubleLE[3]',   // 24 bytes
    velocity: 'DoubleLE[3]'    // 24 bytes
    // Total: 72 bytes × 1000 = 72KB (2x larger)
});
```

### Processing Speed

Float operations are generally faster than Double on many processors, especially in:

- SIMD operations (SSE, AVX, NEON)
- GPU computations
- Large array operations
- Cache-sensitive code

## See Also

- [Integer Types (UInt/Int)](./int.md) - Integer primitive types
- [Bitfields Guide](../advanced/bitfields.md) - Bit-level data manipulation
- [Arrays Guide](../advanced/arrays.md) - Working with arrays of floats
- [Best Practices](../advanced/best-practices.md) - Optimization and patterns
