# Integer Types (UInt & Int)

Comprehensive guide to all unsigned and signed integer types in xStruct, from 8-bit to 64-bit values.

## Overview

xStruct supports a complete range of integer types, providing flexibility for different numeric ranges and memory requirements.
All integer types (except 8-bit) support both little-endian (LE) and big-endian (BE) byte ordering.

**Type Categories:**

- **8-bit**: UInt8, Int8 (byte)
- **16-bit**: UInt16LE/BE, Int16LE/BE (2 bytes)
- **32-bit**: UInt32LE/BE, Int32LE/BE (4 bytes)
- **64-bit**: BigUInt64LE/BE, BigInt64LE/BE (8 bytes, uses JavaScript BigInt)

## Quick Reference Table

| Type               | Size    | Signed | Range                           | JavaScript Type |
|--------------------|---------|--------|---------------------------------|-----------------|
| **UInt8**          | 1 byte  | No     | 0 to 255                        | number          |
| **Int8**           | 1 byte  | Yes    | -128 to 127                     | number          |
| **UInt16LE/BE**    | 2 bytes | No     | 0 to 65,535                     | number          |
| **Int16LE/BE**     | 2 bytes | Yes    | -32,768 to 32,767               | number          |
| **UInt32LE/BE**    | 4 bytes | No     | 0 to 4,294,967,295              | number          |
| **Int32LE/BE**     | 4 bytes | Yes    | -2,147,483,648 to 2,147,483,647 | number          |
| **BigUInt64LE/BE** | 8 bytes | No     | 0 to 2^64-1                     | bigint          |
| **BigInt64LE/BE**  | 8 bytes | Yes    | -2^63 to 2^63-1                 | bigint          |

## 8-bit Integers

### UInt8 - Unsigned 8-bit Integer

**Range**: 0 to 255  
**Size**: byte  
**Endianness**: N/A (single byte)

```ts
import { Struct } from '@remotex-labs/xstruct';

const schema = new Struct({
    age: 'UInt8',
    level: 'UInt8',
    percentage: 'UInt8'
});

const buffer = schema.toBuffer({
    age: 25,
    level: 10,
    percentage: 75
});

// Buffer: <Buffer 19 0a 4b>
const data = schema.toObject(buffer);
// { age: 25, level: 10, percentage: 75 }
```

**Array Example:**

```ts
const arraySchema = new Struct({
    bytes: 'UInt8[16]',  // 16-byte array
    data: { type: 'UInt8', arraySize: 256 }
});

const buffer = arraySchema.toBuffer({
    bytes: [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 ],
    data: new Array(256).fill(0)
});
```

**Bitfield Support:**

```ts
const flagsSchema = new Struct({
    flag1: 'UInt8:1',    // 1 bit (0-1)
    flag2: 'UInt8:1',    // 1 bit (0-1)
    mode: 'UInt8:2',     // 2 bits (0-3)
    level: 'UInt8:4'     // 4 bits (0-15)
});

const buffer = flagsSchema.toBuffer({
    flag1: 1,
    flag2: 0,
    mode: 2,
    level: 5
});
// All packed into 1 byte!
```

### Int8 – Signed 8-bit Integer

**Range**: -128 to 127  
**Size**: byte  
**Endianness**: N/A (single byte)

```ts
const temperatureSchema = new Struct({
  celsius: 'Int8',      // -128 to 127°C
  offset: 'Int8',       // -128 to 127
  delta: 'Int8'         // -128 to 127
});

const buffer = temperatureSchema.toBuffer({
  celsius: -15,
  offset: 5,
  delta: -3
});

const data = temperatureSchema.toObject(buffer);
// { celsius: -15, offset: 5, delta: -3 }
```

**Signed Bitfields:**

```ts
const signedFlagsSchema = new Struct({
    value1: 'Int8:4',    // -8 to 7
    value2: 'Int8:4'     // -8 to 7
});

const buffer = signedFlagsSchema.toBuffer({
    value1: -5,
    value2: 3
});
```

**Array Example:**

```ts
const sensorSchema = new Struct({
    readings: 'Int8[100]'  // 100 signed byte readings
});

const buffer = sensorSchema.toBuffer({
    readings: Array.from({ length: 100 }, (_, i) => i - 50)
});
```

## 16-bit Integers

### UInt16LE/BE - Unsigned 16-bit Integer

**Range**: 0 to 65,535  
**Size**: 2 bytes  
**Endianness**: Little-endian (LE) or Big-endian (BE)

```ts
const networkSchema = new Struct({
    port: 'UInt16BE',        // Network byte order (big-endian)
    localPort: 'UInt16LE',   // Local byte order (little-endian)
    maxConnections: 'UInt16LE',
    packetSize: 'UInt16BE'
});

const buffer = networkSchema.toBuffer({
    port: 8080,
    localPort: 3000,
    maxConnections: 1000,
    packetSize: 1500
});
```

**Endianness Comparison:**

```ts
const value = 0x1234; // 4660 in decimal

// Little-endian: bytes stored as [0x34, 0x12]
const bufferLE = Buffer.alloc(2);
bufferLE.writeUInt16LE(value, 0);
console.log(bufferLE); // <Buffer 34 12>

// Big-endian: bytes stored as [0x12, 0x34]
const bufferBE = Buffer.alloc(2);
bufferBE.writeUInt16BE(value, 0);
console.log(bufferBE); // <Buffer 12 34>
```

**Array Example:**

```ts
const sampleSchema = new Struct({
    audioSamples: 'UInt16LE[1024]',  // 1024 audio samples
    portList: { type: 'UInt16BE', arraySize: 16 }
});
```

**Bitfield Support:**

```ts
const headerSchema = new Struct({
    version: 'UInt16LE:4',     // 4 bits (0-15)
    type: 'UInt16LE:4',        // 4 bits (0-15)
    flags: 'UInt16LE:8'        // 8 bits (0-255)
});

const buffer = headerSchema.toBuffer({
    version: 2,
    type: 5,
    flags: 128
});
```

### Int16LE/BE - Signed 16-bit Integer

**Range**: -32,768 to 32,767  
**Size**: 2 bytes  
**Endianness**: Little-endian (LE) or Big-endian (BE)

```ts
const audioSchema = new Struct({
    leftChannel: 'Int16LE',
    rightChannel: 'Int16LE',
    amplitude: 'Int16LE',
    balance: 'Int16LE'
});

const buffer = audioSchema.toBuffer({
    leftChannel: -12000,
    rightChannel: 15000,
    amplitude: 20000,
    balance: -5000
});
```

**Coordinate System Example:**

```ts
interface Point2D {
    x: number;
    y: number;
}

const pointSchema = new Struct<Point2D>({
    x: 'Int16LE',  // -32,768 to 32,767
    y: 'Int16LE'   // -32,768 to 32,767
});

const mapSchema = new Struct({
    points: { type: pointSchema, arraySize: 100 }
});
```

**Signed Bitfields:**

```ts
const signedHeaderSchema = new Struct({
    offsetX: 'Int16LE:8',    // -128 to 127
    offsetY: 'Int16LE:8'     // -128 to 127
});
```

## 32-bit Integers

### UInt32LE/BE - Unsigned 32-bit Integer

**Range**: 0 to 4,294,967,295  
**Size**: 4 bytes  
**Endianness**: Little-endian (LE) or Big-endian (BE)

```ts
const fileSchema = new Struct({
    fileSize: 'UInt32LE',      // Up to 4GB
    checksum: 'UInt32BE',      // CRC32
    offset: 'UInt32LE',
    timestamp: 'UInt32LE',     // Unix timestamp (until 2106)
    permissions: 'UInt32LE'
});

const buffer = fileSchema.toBuffer({
    fileSize: 1024000,
    checksum: 0x8A3F9B2C,
    offset: 512,
    timestamp: Math.floor(Date.now() / 1000),
    permissions: 0o755
});
```

**IPv4 Address Example:**

```ts
function ipToUInt32(ip: string): number {
    const parts = ip.split('.').map(Number);
    return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

function uint32ToIp(value: number): string {
    return [
        (value >>> 24) & 0xFF,
        (value >>> 16) & 0xFF,
        (value >>> 8) & 0xFF,
        value & 0xFF
    ].join('.');
}

const ipSchema = new Struct({
    sourceIp: 'UInt32BE',
    destIp: 'UInt32BE'
});

const buffer = ipSchema.toBuffer({
    sourceIp: ipToUInt32('192.168.1.100'),
    destIp: ipToUInt32('10.0.0.1')
});

const data = ipSchema.toObject(buffer);
console.log(uint32ToIp(data.sourceIp));  // '192.168.1.100'
```

**RGBA Color Example:**

```ts
const colorSchema = new Struct({
    rgba: 'UInt32LE'  // RGBA packed into 32 bits
});

function rgbaToUInt32(r: number, g: number, b: number, a: number): number {
    return (r << 24) | (g << 16) | (b << 8) | a;
}

const buffer = colorSchema.toBuffer({
    rgba: rgbaToUInt32(255, 128, 64, 255)
});
```

**Array Example:**

```ts
const dataSchema = new Struct({
    samples: 'UInt32LE[1000]',
    hashes: { type: 'UInt32BE', arraySize: 100 }
});
```

### Int32LE/BE - Signed 32-bit Integer

**Range**: -2,147,483,648 to 2,147,483,647  
**Size**: 4 bytes  
**Endianness**: Little-endian (LE) or Big-endian (BE)

```ts
const gpsSchema = new Struct({
    latitude: 'Int32LE',    // Stored as microdegrees
    longitude: 'Int32LE',   // Stored as microdegrees
    altitude: 'Int32LE',    // Stored as millimeters
    accuracy: 'Int32LE'
});

const buffer = gpsSchema.toBuffer({
    latitude: 37774929,     // 37.774929° (San Francisco)
    longitude: -122419416,  // -122.419416°
    altitude: 52000,        // 52 meters
    accuracy: 1000          // 1 meter
});
```

**Geographic Coordinates:**

```ts
interface Location {
    latitude: number;   // Microdegrees
    longitude: number;  // Microdegrees
    elevation: number;  // Millimeters
}

const locationSchema = new Struct<Location>({
    latitude: 'Int32LE',
    longitude: 'Int32LE',
    elevation: 'Int32LE'
});

// Convert degrees to microdegrees
function degreesToMicro(degrees: number): number {
    return Math.round(degrees * 1_000_000);
}

// Convert microdegrees to degrees
function microToDegrees(micro: number): number {
    return micro / 1_000_000;
}

const buffer = locationSchema.toBuffer({
    latitude: degreesToMicro(37.7749),
    longitude: degreesToMicro(-122.4194),
    elevation: 52000  // 52 meters in millimeters
});
```

**Financial Data Example:**

```ts
const transactionSchema = new Struct({
    amount: 'Int32LE',      // Cents (allows negative)
    balance: 'Int32LE',     // Cents
    fee: 'Int32LE'          // Cents
});

const buffer = transactionSchema.toBuffer({
    amount: -5000,    // -$50.00
    balance: 125000,  // $1,250.00
    fee: 50           // $0.50
});
```

## 64-bit Integers (BigInt)

### BigUInt64LE/BE - Unsigned 64-bit Integer

**Range**: 0 to 18,446,744,073,709,551,615 (2^64-1)  
**Size**: 8 bytes  
**JavaScript Type**: bigint  
**Endianness**: Little-endian (LE) or Big-endian (BE)

```ts
const systemSchema = new Struct({
    timestamp: 'BigUInt64LE',      // Microseconds since epoch
    fileSize: 'BigUInt64LE',       // Large file size
    uniqueId: 'BigUInt64BE',       // Globally unique identifier
    counter: 'BigUInt64LE'
});

const buffer = systemSchema.toBuffer({
    timestamp: BigInt(Date.now()) * 1000n,  // Convert ms to µs
    fileSize: 5_000_000_000n,               // 5GB
    uniqueId: 0x123456789ABCDEF0n,
    counter: 9_999_999_999n
});

const data = systemSchema.toObject(buffer);
console.log(data.timestamp);  // bigint value
```

**Working with BigInt:**

```ts
// Creating BigInt values
const a = 123n;                    // Literal notation
const b = BigInt(456);             // Constructor
const c = BigInt('789');           // From string

// Arithmetic operations
const sum = a + b;                 // 579n
const product = a * c;             // 97047n
const power = 2n ** 64n;           // 2^64

// Comparison
console.log(a < b);                // true
console.log(a === 123n);           // true

// Converting to/from Number (be careful of precision loss)
const num = Number(a);             // 123
const big = BigInt(num);           // 123n

// Common patterns
const timestamp = BigInt(Date.now());
const microseconds = timestamp * 1000n;
const nanoseconds = timestamp * 1_000_000n;
```

**High-Precision Timestamp Example:**

```ts
const eventSchema = new Struct({
    id: 'BigUInt64LE',
    timestampNs: 'BigUInt64LE',  // Nanoseconds
    durationNs: 'BigUInt64LE'
});

function getNanoseconds(): bigint {
    const hrTime = process.hrtime.bigint();
    return hrTime;
}

const buffer = eventSchema.toBuffer({
    id: 1234567890n,
    timestampNs: getNanoseconds(),
    durationNs: 1_500_000n  // 1.5 milliseconds
});
```

**Cryptocurrency Example:**

```ts
const cryptoSchema = new Struct({
    balance: 'BigUInt64LE',     // Satoshis (Bitcoin)
    gasPrice: 'BigUInt64LE',    // Wei (Ethereum)
    nonce: 'BigUInt64LE'
});

const SATOSHI = 100_000_000n;  // 1 BTC = 100,000,000 satoshis

const buffer = cryptoSchema.toBuffer({
    balance: 5n * SATOSHI,      // 5 BTC
    gasPrice: 50_000_000_000n,  // 50 Gwei
    nonce: 123n
});
```

**Array Example:**

```ts
const bigDataSchema = new Struct({
    ids: 'BigUInt64LE[100]',
    timestamps: { type: 'BigUInt64BE', arraySize: 50 }
});

const buffer = bigDataSchema.toBuffer({
    ids: Array.from({ length: 100 }, (_, i) => BigInt(i)),
    timestamps: Array.from({ length: 50 }, () => BigInt(Date.now()) * 1000n)
});
```

### BigInt64LE/BE - Signed 64-bit Integer

**Range**: -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807 (-2^63 to 2^63-1)  
**Size**: 8 bytes  
**JavaScript Type**: bigint  
**Endianness**: Little-endian (LE) or Big-endian (BE)

```ts
const scientificSchema = new Struct({
    particleCount: 'BigInt64LE',
    energyLevel: 'BigInt64LE',
    deltaTime: 'BigInt64LE',
    offset: 'BigInt64LE'
});

const buffer = scientificSchema.toBuffer({
    particleCount: 9_000_000_000_000_000n,
    energyLevel: -5_000_000_000n,
    deltaTime: 123456789012345n,
    offset: -999999999n
});
```

**Financial Precision Example:**

```ts
// Using BigInt to avoid floating-point precision issues
const financialSchema = new Struct({
    balanceCents: 'BigInt64LE',    // Cents to avoid float issues
    creditCents: 'BigInt64LE',
    debitCents: 'BigInt64LE'
});

// Store values in cents to avoid decimal issues
const buffer = financialSchema.toBuffer({
    balanceCents: 1_234_567_890n,  // $12,345,678.90
    creditCents: 5_000_000n,       // $50,000.00
    debitCents: -2_500_000n        // -$25,000.00
});

function centsToNormalDollars(cents: bigint): string {
    const dollars = cents / 100n;
    const centsRemainder = cents % 100n;
    return `$${ dollars }.${ String(centsRemainder).padStart(2, '0') }`;
}
```

**Time Delta Example:**

```ts
const timingSchema = new Struct({
    startTimeNs: 'BigInt64LE',
    endTimeNs: 'BigInt64LE',
    deltaNs: 'BigInt64LE'
});

const start = process.hrtime.bigint();
// ... some operation ...
const end = process.hrtime.bigint();
const delta = end - start;

const buffer = timingSchema.toBuffer({
    startTimeNs: start,
    endTimeNs: end,
    deltaNs: delta
});
```

## Endianness Deep Dive

### Understanding Byte Order

Endianness determines the order in which bytes are stored in memory for multibyte values.

**Little-Endian (LE):**

- The least significant byte stored first
- Used by x86, x86-64, ARM (most common architectures)
- Most common for local file formats

**Big-Endian (BE):**

- The most significant byte stored first
- Used in network protocols (network byte order)
- Some older architectures (SPARC, PowerPC)

### Visual Representation

For the value `0x12345678` (305,419,896 in decimal):

```text
Little-Endian (LE):
Address:  0x00  0x01  0x02  0x03
Value:    0x78  0x56  0x34  0x12
          ^^^^  ^^^^  ^^^^  ^^^^
          LSB                MSB

Big-Endian (BE):
Address:  0x00  0x01  0x02  0x03
Value:    0x12  0x34  0x56  0x78
          ^^^^  ^^^^  ^^^^  ^^^^
          MSB                LSB
```

### Practical Examples

```ts
const value = 0x12345678;

// Little-endian
const leSchema = new Struct({
    value: 'UInt32LE'
});
const leBuffer = leSchema.toBuffer({ value });
console.log(leBuffer);
// <Buffer 78 56 34 12>

// Big-endian
const beSchema = new Struct({
    value: 'UInt32BE'
});
const beBuffer = beSchema.toBuffer({ value });
console.log(beBuffer);
// <Buffer 12 34 56 78>
```

### Choosing Endianness

```ts
// Network protocols: Use big-endian (network byte order)
const networkPacket = new Struct({
    magic: 'UInt32BE',
    version: 'UInt16BE',
    length: 'UInt16BE'
});

// Local file formats: Match your platform (usually little-endian)
const fileHeader = new Struct({
    signature: 'UInt32LE',
    fileSize: 'UInt32LE',
    timestamp: 'BigUInt64LE'
});

// Cross-platform: Document your choice and stick with it
const dataFormat = new Struct({
    // Always use LE for consistency across platforms
    id: 'UInt32LE',
    count: 'UInt16LE',
    timestamp: 'BigUInt64LE'
});
```

## Value Range and Overflow Handling

### Overflow Behavior

When values exceed the type's range, they wrap around:

```ts
// UInt8 overflow
const uint8Schema = new Struct({
    value: 'UInt8'
});

// 256 wraps to 0 (256 % 256 = 0)
let buffer = uint8Schema.toBuffer({ value: 256 });
console.log(uint8Schema.toObject(buffer)); // { value: 0 }

// 257 wraps to 1 (257 % 256 = 1)
buffer = uint8Schema.toBuffer({ value: 257 });
console.log(uint8Schema.toObject(buffer)); // { value: 1 }

// Negative numbers wrap from the top
buffer = uint8Schema.toBuffer({ value: -1 });
console.log(uint8Schema.toObject(buffer)); // { value: 255 }
```

```ts
// Int8 overflow
const int8Schema = new Struct({
    value: 'Int8'
});

// 127 + 1 wraps to -128
buffer = int8Schema.toBuffer({ value: 128 });
console.log(int8Schema.toObject(buffer)); // { value: -128 }

// -128 - 1 wraps to 127
buffer = int8Schema.toBuffer({ value: -129 });
console.log(int8Schema.toObject(buffer)); // { value: 127 }
```

### Safe Value Validation

```ts
// Generic validator for integer ranges
function validateIntRange(
    value: number | bigint,
    min: number | bigint,
    max: number | bigint,
    typeName: string
): void {
    if (value < min || value > max) {
        throw new RangeError(
            `Value ${ value } is out of range for ${ typeName } (${ min } to ${ max })`
        );
    }

    if (typeof value === 'number' && !Number.isInteger(value)) {
        throw new TypeError(`Value ${ value } must be an integer for ${ typeName }`);
    }
}

// Type-specific validators
function validateUInt8(value: number): void {
    validateIntRange(value, 0, 255, 'UInt8');
}

function validateInt16(value: number): void {
    validateIntRange(value, -32768, 32767, 'Int16');
}

function validateUInt32(value: number): void {
    validateIntRange(value, 0, 4294967295, 'UInt32');
}

function validateBigUInt64(value: bigint): void {
    validateIntRange(value, 0n, 18446744073709551615n, 'BigUInt64');
}

// Usage
try {
    validateUInt8(300);   // Throws RangeError
    validateInt16(40000); // Throws RangeError
    validateUInt8(100);   // OK
} catch (error) {
    console.error(error.message);
}
```

### Safe Clamping

```ts
// Clamp values to valid range instead of throwing
function clampToUInt8(value: number): number {
    return Math.max(0, Math.min(255, Math.floor(value)));
}

function clampToInt8(value: number): number {
    return Math.max(-128, Math.min(127, Math.floor(value)));
}

function clampToUInt16(value: number): number {
    return Math.max(0, Math.min(65535, Math.floor(value)));
}

// Usage
const schema = new Struct({
    value: 'UInt8'
});

const safeValue = clampToUInt8(300);  // Returns 255
const buffer = schema.toBuffer({ value: safeValue });
```

## Binary Representation

### Bit Patterns

```ts
// Helper function to show binary representation
function toBinaryString(value: number, bits: number): string {
    return value.toString(2).padStart(bits, '0');
}

// 8-bit examples
console.log(toBinaryString(170, 8));  // "10101010"
console.log(toBinaryString(85, 8));   // "01010101"
console.log(toBinaryString(255, 8));  // "11111111"

// 16-bit examples
console.log(toBinaryString(0xAAAA, 16)); // "1010101010101010"
console.log(toBinaryString(0x5555, 16)); // "0101010101010101"

// 32-bit examples
console.log(toBinaryString(0x12345678, 32)); // Full 32-bit pattern
```

### Buffer Inspection

```ts
const inspectSchema = new Struct({
    uint8: 'UInt8',
    uint16le: 'UInt16LE',
    uint16be: 'UInt16BE',
    uint32le: 'UInt32LE'
});

const buffer = inspectSchema.toBuffer({
    uint8: 0xFF,
    uint16le: 0x1234,
    uint16be: 0x5678,
    uint32le: 0xABCDEF00
});

console.log('Full buffer:', buffer.toString('hex'));
// Inspect individual bytes
for (let i = 0; i < buffer.length; i++) {
    console.log(`Byte ${ i }: 0x${ buffer[i].toString(16).padStart(2, '0') }`);
}
```

### Bit Manipulation

```ts
// Common bit operations
const value = 0b10101100; // 172

// Get specific bit
function getBit(value: number, position: number): number {
    return (value >> position) & 1;
}

// Set specific bit
function setBit(value: number, position: number): number {
    return value | (1 << position);
}

// Clear specific bit
function clearBit(value: number, position: number): number {
    return value & ~(1 << position);
}

// Toggle specific bit
function toggleBit(value: number, position: number): number {
    return value ^ (1 << position);
}

// Check if bit is set
function isBitSet(value: number, position: number): boolean {
    return ((value >> position) & 1) === 1;
}

// Examples
console.log(getBit(value, 3));        // 1
console.log(setBit(value, 0));        // 173
console.log(clearBit(value, 7));      // 44
console.log(toggleBit(value, 1));     // 174
console.log(isBitSet(value, 5));      // true
```

## Performance Considerations

### Memory Efficiency

```ts
// Efficient: Using appropriate types
const efficientSchema = new Struct({
    count: 'UInt8',       // 1 byte (0-255)
    status: 'UInt8',      // 1 byte
    id: 'UInt16LE',       // 2 bytes (0-65,535)
    timestamp: 'UInt32LE' // 4 bytes
});
// Total: 8 bytes per record

// Wasteful: Using larger types unnecessarily
const wastefulSchema = new Struct({
    count: 'UInt32LE',    // 4 bytes (wasting 3 bytes)
    status: 'UInt32LE',   // 4 bytes (wasting 3 bytes)
    id: 'UInt32LE',       // 4 bytes (wasting 2 bytes)
    timestamp: 'UInt32LE' // 4 bytes
});
// Total: 16 bytes per record (2x larger!)

// For 1,000,000 records:
// Efficient: 8 MB
// Wasteful: 16 MB
```

### Access Speed

```ts
// Fixed-size records enable fast random access
const recordSchema = new Struct({
    id: 'UInt32LE',
    value: 'Int32LE',
    flags: 'UInt16LE'
});

const recordSize = recordSchema.getSize(); // 10 bytes

// Direct access to record N
function getRecordOffset(recordIndex: number): number {
    return recordIndex * recordSize;
}

// Fast O(1) access to any record
const record500Offset = getRecordOffset(500);
```

### Alignment Considerations

While xStruct handles alignment automatically, understanding it helps optimize structures:

```ts
// Unaligned (7 bytes total, but may be slower to process)
const unalignedSchema = new Struct({
    a: 'UInt8',      // 1 byte
    b: 'UInt32LE',   // 4 bytes
    c: 'UInt16LE'    // 2 bytes
});

// Better aligned (8 bytes, but may be faster)
const alignedSchema = new Struct({
    a: 'UInt32LE',   // 4 bytes
    b: 'UInt16LE',   // 2 bytes
    c: 'UInt8',      // 1 byte
    d: 'UInt8'       // 1 byte (padding/reserved)
});
```

## Comparison Table

### Storage Requirements

| Values to Store   | Recommended Type | Size    | Reason              |
|-------------------|------------------|---------|---------------------|
| 0-255             | UInt8            | 1 byte  | Smallest possible   |
| -128 to 127       | Int8             | 1 byte  | Smallest signed     |
| 0-65,535          | UInt16LE/BE      | 2 bytes | Ports, lengths      |
| -32K to 32K       | Int16LE/BE       | 2 bytes | Audio, coordinates  |
| 0-4B              | UInt32LE/BE      | 4 bytes | File sizes, IPs     |
| -2B to 2B         | Int32LE/BE       | 4 bytes | Large signed values |
| Very large        | BigUInt64LE/BE   | 8 bytes | Timestamps, crypto  |
| Very large signed | BigInt64LE/BE    | 8 bytes | Scientific data     |

### Signed vs Unsigned

| Feature              | Unsigned (UInt)    | Signed (Int)                 |
|----------------------|--------------------|------------------------------|
| **Range**            | 0 to 2^n-1         | -2^(n-1) to 2^(n-1)-1        |
| **Use Cases**        | Counts, sizes, IDs | Offsets, deltas, coordinates |
| **Negative Values**  | No                 | Yes                          |
| **Maximum Positive** | Larger             | Half of unsigned             |
| **Example (8-bit)**  | 0-255              | -128 to 127                  |

### Endianness

| Feature            | Little-Endian (LE)   | Big-Endian (BE)      |
|--------------------|----------------------|----------------------|
| **Byte Order**     | LSB first            | MSB first            |
| **Used By**        | x86, x86-64, ARM     | Network protocols    |
| **File Formats**   | Windows, most local  | Network data         |
| **Performance**    | Faster on LE systems | Faster on BE systems |
| **Recommendation** | Local storage        | Network protocols    |

## Real-World Examples

### HTTP Header

```ts
const httpHeaderSchema = new Struct({
    method: 'UInt8',              // GET=1, POST=2, etc.
    statusCode: 'UInt16BE',       // HTTP status code
    contentLength: 'UInt32BE',    // Content length
    timestamp: 'BigUInt64LE',     // Request timestamp (microseconds)
    keepAlive: 'UInt8:1',         // Boolean flag
    compressed: 'UInt8:1',        // Boolean flag
    encrypted: 'UInt8:1',         // Boolean flag
    reserved: 'UInt8:5'           // Reserved bits
});
```

### Database Record

```ts
interface UserRecord {
    id: bigint;
    createdAt: bigint;
    age: number;
    status: number;
    loginCount: number;
    lastLoginIp: number;
}

const userRecordSchema = new Struct<UserRecord>({
    id: 'BigUInt64LE',           // Unique ID
    createdAt: 'BigUInt64LE',    // Unix timestamp (microseconds)
    age: 'UInt8',                // Age (0-255)
    status: 'UInt8',             // Status code
    loginCount: 'UInt32LE',      // Total logins
    lastLoginIp: 'UInt32BE'      // IPv4 address
});
```

### Game State

```ts
const gameStateSchema = new Struct({
    // Player position
    posX: 'Int32LE',             // World X coordinate
    posY: 'Int32LE',             // World Y coordinate
    posZ: 'Int32LE',             // World Z coordinate

    // Player stats
    health: 'UInt16LE',          // 0-65,535 HP
    mana: 'UInt16LE',            // 0-65,535 MP
    experience: 'UInt32LE',      // Total XP
    level: 'UInt8',              // 0-255

    // Inventory
    gold: 'UInt32LE',            // Currency
    inventorySlots: 'UInt8[20]', // 20 item IDs

    // Flags
    isAlive: 'UInt8:1',
    isInCombat: 'UInt8:1',
    canMove: 'UInt8:1',
    reserved: 'UInt8:5'
});
```

### File Format Header

```ts
const fileFormatSchema = new Struct({
    // Magic number
    magic: 'UInt32BE',           // 'MYFT' = 0x4D594654

    // Version
    majorVersion: 'UInt8',
    minorVersion: 'UInt8',
    patchVersion: 'UInt16LE',

    // File info
    fileSize: 'BigUInt64LE',     // Support > 4GB files
    createdAt: 'BigUInt64LE',    // Unix timestamp (microseconds)
    modifiedAt: 'BigUInt64LE',

    // Checksums
    headerChecksum: 'UInt32LE',  // CRC32
    dataChecksum: 'UInt32LE',

    // Offsets
    dataOffset: 'UInt32LE',
    indexOffset: 'UInt32LE',

    // Flags
    compressed: 'UInt8:1',
    encrypted: 'UInt8:1',
    hasIndex: 'UInt8:1',
    reserved: 'UInt8:5'
});
```

### Network Packet

```ts
const networkPacketSchema = new Struct({
    // Header
    version: 'UInt8:4',          // Protocol version (0-15)
    type: 'UInt8:4',             // Packet type (0-15)
    flags: 'UInt8',              // 8 flag bits
    sequenceNumber: 'UInt32BE',  // Packet sequence
    timestamp: 'BigUInt64BE',    // Network timestamp

    // Addressing
    sourcePort: 'UInt16BE',
    destPort: 'UInt16BE',
    sourceIp: 'UInt32BE',        // IPv4
    destIp: 'UInt32BE',          // IPv4

    // Payload
    payloadLength: 'UInt16BE',   // Max 64KB
    payloadChecksum: 'UInt32BE', // CRC32

    // Data
    payload: 'UInt8[1024]'       // Fixed 1KB payload
});
```

### IoT Sensor Data

```ts
const sensorDataSchema = new Struct({
    sensorId: 'UInt16LE',        // Sensor ID (0-65,535)
    timestamp: 'BigUInt64LE',    // Microsecond precision

    // Temperature (scaled by 100)
    temperature: 'Int16LE',      // -327.68 to 327.67°C
  
    // Humidity (0-100%)
    humidity: 'UInt8',

    // Pressure (Pascals)
    pressure: 'UInt32LE',        // 0-4,294,967,295 Pa

    // Battery level (0-100%)
    battery: 'UInt8',

    // Status flags
    online: 'UInt8:1',
    calibrated: 'UInt8:1',
    alarm: 'UInt8:1',
    reserved: 'UInt8:5'
});
```

## Best Practices

### ✅ Do

```ts
// Use the smallest type that fits your range
const goodSchema = new Struct({
    age: 'UInt8',              // 0-255 is enough
    port: 'UInt16BE',          // Network byte order for ports
    fileSize: 'UInt32LE',      // Up to 4GB
    timestamp: 'BigUInt64LE'   // High precision time
});

// Use appropriate signedness
const signedSchema = new Struct({
    temperature: 'Int16LE',    // Can be negative
    offset: 'Int8',            // Can be negative
    balance: 'Int32LE'         // Can be negative
});

// Use arrays for collections
const arraySchema = new Struct({
    samples: 'UInt16LE[1000]',
    readings: { type: 'Int32LE', arraySize: 100 }
});

// Use bitfields to save space
const packedSchema = new Struct({
    enabled: 'UInt8:1',
    visible: 'UInt8:1',
    mode: 'UInt8:2',
    priority: 'UInt8:4'
});

// Document your choices
interface PacketHeader {
    version: number;   // UInt8: Protocol version (0-255)
    flags: number;     // UInt16LE: Bit flags
    length: number;    // UInt32LE: Payload length in bytes
}
```

### ❌ Don't

```ts
// Don't use types larger than needed
const wastefulSchema = new Struct({
    age: 'UInt32LE',           // ❌ UInt8 is enough
    isEnabled: 'UInt32LE',     // ❌ UInt8:1 is enough
    percentage: 'Int32LE'      // ❌ UInt8 is enough
});

// Don't use unsigned for values that can be negative
const wrongSignSchema = new Struct({
    temperature: 'UInt16LE',   // ❌ Can be negative
    balance: 'UInt32LE',       // ❌ Can be negative
    offset: 'UInt8'            // ❌ Can be negative
});

// Don't mix endianness without reason
const inconsistentSchema = new Struct({
    field1: 'UInt32LE',
    field2: 'UInt32BE',        // ❌ Why different?
    field3: 'UInt32LE'
});

// Don't forget to validate
const riskySchema = new Struct({
    value: 'UInt8'
});

// ❌ No validation
riskySchema.toBuffer({ value: 300 }); // Silently overflows

// ✅ With validation
function safeSerialize(value: number) {
    if (value < 0 || value > 255) {
        throw new RangeError('Value out of range');
    }
    return riskySchema.toBuffer({ value });
}
```

### Validation Patterns

```ts
// Create a validation wrapper
class ValidatedStruct<T> {
    constructor(
        private schema: Struct<T>,
        private validator: (data: T) => void
    ) {
    }
  
    toBuffer(data: T): Buffer {
        this.validator(data);
        return this.schema.toBuffer(data);
    }

    toObject(buffer: Buffer): T {
        const data = this.schema.toObject(buffer);
        this.validator(data);
        return data;
    }
}

// Usage
interface UserData {
    age: number;
    score: number;
}

const userSchema = new Struct<UserData>({
    age: 'UInt8',
    score: 'UInt32LE'
});

const validatedUserSchema = new ValidatedStruct(
    userSchema,
    (data: UserData) => {
        if (data.age < 0 || data.age > 120) {
            throw new RangeError('Invalid age');
        }
        if (data.score < 0) {
            throw new RangeError('Score cannot be negative');
        }
    }
);
```

## See Also

- [Float Types (FloatLE/BE, DoubleLE/BE)](./float.md) - Floating-point numbers
- [Bitfields Guide](./bitfields.md) - Packing multiple values into integers
- [Arrays Guide](../advanced/arrays.md) - Working with integer arrays
- [Endianness Guide](../advanced/endianness.md) - Deep dive into byte ordering
- [Best Practices](../advanced/best-practices.md) - Optimization and patterns
