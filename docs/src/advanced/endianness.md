# Endianness

Comprehensive guide to understanding and working with byte order (endianness) in xStruct.

## Overview

Endianness refers to the order in which bytes are arranged when storing multi-byte values in memory.
Understanding endianness is crucial when working with binary data, especially in cross-platform applications, network protocols, and file formats.

**Key Concepts:**

- **Little-Endian (LE)**: Least significant byte stored first
- **Big-Endian (BE)**: Most significant byte stored first
- **Network Byte Order**: Big-endian (standard for network protocols)
- **Host Byte Order**: Platform-dependent (usually little-endian on modern systems)

## What is Endianness?

### Visual Representation

Consider the 32-bit hexadecimal value `0x12345678` (305,419,896 in decimal):

```text
Little-Endian (LE):
Memory Address:  [0x00] [0x01] [0x02] [0x03]
Byte Values:      0x78   0x56   0x34   0x12
                  ^^^^                  ^^^^
                  LSB                   MSB
Reading Order: ──────────────────────────►

Big-Endian (BE):
Memory Address:  [0x00] [0x01] [0x02] [0x03]
Byte Values:      0x12   0x34   0x56   0x78
                  ^^^^                  ^^^^
                  MSB                   LSB
Reading Order: ──────────────────────────►
```

### Understanding the Difference

```ts
import { Struct } from '@remotex-labs/xstruct';

const value = 0x12345678;  // 305,419,896

// Little-Endian
const leSchema = new Struct({
    value: 'UInt32LE'
});
const leBuffer = leSchema.toBuffer({ value });
console.log(leBuffer);
// <Buffer 78 56 34 12>
// Bytes: LSB → → → MSB

// Big-Endian
const beSchema = new Struct({
    value: 'UInt32BE'
});
const beBuffer = beSchema.toBuffer({ value });
console.log(beBuffer);
// <Buffer 12 34 56 78>
// Bytes: MSB → → → LSB
```

## Supported Types with Endianness

### 16-bit Types

```ts
const schema16 = new Struct({
    // Unsigned 16-bit
    valueLE: 'UInt16LE',  // Little-endian
    valueBE: 'UInt16BE',  // Big-endian

    // Signed 16-bit
    signedLE: 'Int16LE',  // Little-endian
    signedBE: 'Int16BE'   // Big-endian
});

const value = 0x1234;  // 4660

const buffer = schema16.toBuffer({
    valueLE: value,    // Stored as: 34 12
    valueBE: value,    // Stored as: 12 34
    signedLE: -value,  // Stored as: CC ED (two's complement)
    signedBE: -value   // Stored as: ED CC (two's complement)
});
```

### 32-bit Types

```ts
const schema32 = new Struct({
    // Unsigned 32-bit
    valueLE: 'UInt32LE',
    valueBE: 'UInt32BE',

    // Signed 32-bit
    signedLE: 'Int32LE',
    signedBE: 'Int32BE',

    // 32-bit Float
    floatLE: 'FloatLE',
    floatBE: 'FloatBE'
});

const buffer = schema32.toBuffer({
    valueLE: 0x12345678,
    valueBE: 0x12345678,
    signedLE: -1000,
    signedBE: -1000,
    floatLE: 3.14,
    floatBE: 3.14
});
```

### 64-bit Types

```ts
const schema64 = new Struct({
    // Unsigned 64-bit
    bigUIntLE: 'BigUInt64LE',
    bigUIntBE: 'BigUInt64BE',

    // Signed 64-bit
    bigIntLE: 'BigInt64LE',
    bigIntBE: 'BigInt64BE',

    // 64-bit Double
    doubleLE: 'DoubleLE',
    doubleBE: 'DoubleBE'
});

const buffer = schema64.toBuffer({
    bigUIntLE: 0x123456789ABCDEF0n,
    bigUIntBE: 0x123456789ABCDEF0n,
    bigIntLE: -1234567890123456789n,
    bigIntBE: -1234567890123456789n,
    doubleLE: Math.PI,
    doubleBE: Math.PI
});
```

### No Endianness (Single Byte)

8-bit types have no endianness because they occupy only one byte:

```ts
const schema8 = new Struct({
    byte: 'UInt8',    // No endianness needed
    signedByte: 'Int8'  // No endianness needed
});
```

## Platform Differences

### Common Platform Endianness

| Platform/Architecture | Endianness             | Notes                        |
|-----------------------|------------------------|------------------------------|
| **x86**               | Little-endian          | Desktop/Laptop PCs           |
| **x86-64 (AMD64)**    | Little-endian          | Modern 64-bit PCs            |
| **ARM**               | Bi-endian (usually LE) | Mobile devices, Raspberry Pi |
| **ARM64**             | Bi-endian (usually LE) | Modern mobile, Apple Silicon |
| **MIPS**              | Bi-endian              | Routers, embedded systems    |
| **PowerPC**           | Big-endian             | Older Macs, game consoles    |
| **SPARC**             | Big-endian             | Sun/Oracle servers           |
| **Network Protocols** | Big-endian             | TCP/IP, UDP, etc.            |

### Detecting Platform Endianness

```ts
function getPlatformEndianness(): 'LE' | 'BE' {
    const buffer = new ArrayBuffer(2);
    const uint16 = new Uint16Array(buffer);
    const uint8 = new Uint8Array(buffer);

    uint16[0] = 0xAABB;

    if (uint8[0] === 0xBB) {
        return 'LE';  // Little-endian
    } else {
        return 'BE';  // Big-endian
    }
}

console.log(`Platform is ${ getPlatformEndianness() }`);
// Most modern systems: "Platform is LE"
```

## Choosing the Right Endianness

### Network Protocols (Use Big-Endian)

Network protocols typically use big-endian (network byte order):

```ts
// IP Packet Header
const ipHeaderSchema = new Struct({
    version: 'UInt8:4',
    ihl: 'UInt8:4',
    tos: 'UInt8',
    totalLength: 'UInt16BE',      // Network byte order
    identification: 'UInt16BE',    // Network byte order
    flags: 'UInt8:3',
    fragmentOffset: 'UInt16BE:13',
    ttl: 'UInt8',
    protocol: 'UInt8',
    checksum: 'UInt16BE',          // Network byte order
    sourceIP: 'UInt32BE',          // Network byte order
    destIP: 'UInt32BE'             // Network byte order
});

// TCP Header
const tcpHeaderSchema = new Struct({
    sourcePort: 'UInt16BE',
    destPort: 'UInt16BE',
    sequenceNumber: 'UInt32BE',
    ackNumber: 'UInt32BE',
    dataOffset: 'UInt8:4',
    reserved: 'UInt8:3',
    flags: 'UInt8:9',
    windowSize: 'UInt16BE',
    checksum: 'UInt16BE',
    urgentPointer: 'UInt16BE'
});
```

### Local Storage (Use Little-Endian)

For local file formats and data structures, use little-endian (matches most platforms):

```ts
// Local file format
const fileHeaderSchema = new Struct({
    signature: 'UInt32LE',     // 'MYFT' magic number
    version: 'UInt16LE',
    flags: 'UInt16LE',
    fileSize: 'BigUInt64LE',
    timestamp: 'BigUInt64LE',
    dataOffset: 'UInt32LE',
    checksum: 'UInt32LE'
});

// Database record
const recordSchema = new Struct({
    id: 'UInt32LE',
    timestamp: 'BigUInt64LE',
    userId: 'UInt32LE',
    amount: 'Int32LE',
    balance: 'Int64LE'
});
```

### Graphics and Game Data (Usually Little-Endian)

Graphics APIs and game engines typically use little-endian:

```ts
// Vertex data
const vertexSchema = new Struct({
    posX: 'FloatLE',
    posY: 'FloatLE',
    posZ: 'FloatLE',
    normalX: 'FloatLE',
    normalY: 'FloatLE',
    normalZ: 'FloatLE',
    u: 'FloatLE',
    v: 'FloatLE'
});

// Image header (BMP-style)
const imageHeaderSchema = new Struct({
    width: 'UInt32LE',
    height: 'UInt32LE',
    planes: 'UInt16LE',
    bitCount: 'UInt16LE',
    compression: 'UInt32LE',
    imageSize: 'UInt32LE'
});
```

### Cross-Platform Data (Document Your Choice)

For cross-platform data, choose one endianness and document it:

```ts
// ✅ Good: Consistent and documented
/**
 * File format specification:
 * - All multi-byte integers are little-endian
 * - Version: 1.0
 */
const crossPlatformSchema = new Struct({
    magic: 'UInt32LE',        // Always LE
    version: 'UInt16LE',      // Always LE
    dataCount: 'UInt32LE',    // Always LE
    dataOffset: 'UInt32LE'    // Always LE
});

// ❌ Bad: Mixing without reason
const inconsistentSchema = new Struct({
    field1: 'UInt32LE',
    field2: 'UInt32BE',       // Why different?
    field3: 'UInt32LE'
});
```

## Endianness Conversion

### Manual Conversion Functions

```ts
function swap16(value: number): number {
    return ((value & 0xFF) << 8) | ((value >> 8) & 0xFF);
}

function swap32(value: number): number {
    return (
        ((value & 0xFF) << 24) |
        ((value & 0xFF00) << 8) |
        ((value >> 8) & 0xFF00) |
        ((value >> 24) & 0xFF)
    );
}

function swap64(value: bigint): bigint {
    const bytes = [
        (value >> 56n) & 0xFFn,
        (value >> 48n) & 0xFFn,
        (value >> 40n) & 0xFFn,
        (value >> 32n) & 0xFFn,
        (value >> 24n) & 0xFFn,
        (value >> 16n) & 0xFFn,
        (value >> 8n) & 0xFFn,
        value & 0xFFn
    ];

    return (
        (bytes[7] << 56n) |
        (bytes[6] << 48n) |
        (bytes[5] << 40n) |
        (bytes[4] << 32n) |
        (bytes[3] << 24n) |
        (bytes[2] << 16n) |
        (bytes[1] << 8n) |
        bytes[0]
    );
}

// Example usage
const value16 = 0x1234;
console.log(`Original: 0x${ value16.toString(16) }`);     // 0x1234
console.log(`Swapped: 0x${ swap16(value16).toString(16) }`); // 0x3412

const value32 = 0x12345678;
console.log(`Original: 0x${ value32.toString(16) }`);     // 0x12345678
console.log(`Swapped: 0x${ swap32(value32).toString(16) }`); // 0x78563412
```

### Using xStruct for Conversion

```ts
// Convert between endiannesses
function convertEndianness(value: number): { le: Buffer, be: Buffer } {
    const leSchema = new Struct({ value: 'UInt32LE' });
    const beSchema = new Struct({ value: 'UInt32BE' });

    return {
        le: leSchema.toBuffer({ value }),
        be: beSchema.toBuffer({ value })
    };
}

const result = convertEndianness(0x12345678);
console.log('LE:', result.le);  // <Buffer 78 56 34 12>
console.log('BE:', result.be);  // <Buffer 12 34 56 78>
```

## Real-World Examples

### IPv4 Address

```ts
// IP addresses are stored in network byte order (big-endian)
function ipToUInt32(ip: string): number {
    const parts = ip.split('.').map(Number);
    return (
        (parts[0] << 24) |
        (parts[1] << 16) |
        (parts[2] << 8) |
        parts[3]
    );
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
    address: 'UInt32BE'  // Network byte order
});

const ip = '192.168.1.1';
const buffer = ipSchema.toBuffer({
    address: ipToUInt32(ip)
});

const result = ipSchema.toObject(buffer);
console.log(uint32ToIp(result.address));  // '192.168.1.1'
```

### Unix Timestamp

```ts
// Unix timestamps are typically stored in local byte order
const timestampSchema = new Struct({
    // 32-bit timestamp (valid until 2038)
    timestamp32: 'UInt32LE',

    // 64-bit timestamp with milliseconds
    timestamp64: 'BigUInt64LE'
});

const now = Date.now();

const buffer = timestampSchema.toBuffer({
    timestamp32: Math.floor(now / 1000),
    timestamp64: BigInt(now)
});
```

### File Magic Number

```ts
// File signatures often use specific byte order
const fileSignatureSchema = new Struct({
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    pngMagic: 'UInt32BE',  // 0x89504E47

    // JPEG signature: FF D8 FF
    jpegMagic: 'UInt16BE', // 0xFFD8

    // ELF signature: 7F 45 4C 46
    elfMagic: 'UInt32BE'   // 0x7F454C46
});

// Check if buffer is PNG
function isPNG(buffer: Buffer): boolean {
    return buffer.readUInt32BE(0) === 0x89504E47;
}

// Check if buffer is JPEG
function isJPEG(buffer: Buffer): boolean {
    return buffer.readUInt16BE(0) === 0xFFD8;
}
```

### USB Descriptor

```ts
// USB descriptors use little-endian for multi-byte values
const usbDescriptorSchema = new Struct({
    bLength: 'UInt8',
    bDescriptorType: 'UInt8',
    bcdUSB: 'UInt16LE',           // USB version (BCD)
    bDeviceClass: 'UInt8',
    bDeviceSubClass: 'UInt8',
    bDeviceProtocol: 'UInt8',
    bMaxPacketSize0: 'UInt8',
    idVendor: 'UInt16LE',         // Vendor ID
    idProduct: 'UInt16LE',        // Product ID
    bcdDevice: 'UInt16LE',        // Device version (BCD)
    iManufacturer: 'UInt8',
    iProduct: 'UInt8',
    iSerialNumber: 'UInt8',
    bNumConfigurations: 'UInt8'
});
```

### WAV File Header

```ts
// WAV files use little-endian for chunk sizes
const wavHeaderSchema = new Struct({
    // RIFF chunk
    chunkID: 'UInt32BE',          // 'RIFF' (big-endian)
    chunkSize: 'UInt32LE',        // File size - 8
    format: 'UInt32BE',           // 'WAVE' (big-endian)

    // fmt subchunk
    subchunk1ID: 'UInt32BE',      // 'fmt ' (big-endian)
    subchunk1Size: 'UInt32LE',    // 16 for PCM
    audioFormat: 'UInt16LE',      // PCM = 1
    numChannels: 'UInt16LE',      // Mono = 1, Stereo = 2
    sampleRate: 'UInt32LE',       // 44100, 48000, etc.
    byteRate: 'UInt32LE',         // SampleRate * NumChannels * BitsPerSample/8
    blockAlign: 'UInt16LE',       // NumChannels * BitsPerSample/8
    bitsPerSample: 'UInt16LE',    // 8, 16, 24, etc.

    // data subchunk
    subchunk2ID: 'UInt32BE',      // 'data' (big-endian)
    subchunk2Size: 'UInt32LE'     // Data size
});
```

## Bitfields and Endianness

Bitfields inherit the endianness of their base type:

```ts
const bitfieldSchema = new Struct({
    // Little-endian bitfields
    versionLE: 'UInt16LE:4',
    typeLE: 'UInt16LE:4',
    flagsLE: 'UInt16LE:8',

    // Big-endian bitfields
    versionBE: 'UInt16BE:4',
    typeBE: 'UInt16BE:4',
    flagsBE: 'UInt16BE:8'
});

const value = 0x1234;

const buffer = bitfieldSchema.toBuffer({
    versionLE: 1,
    typeLE: 2,
    flagsLE: 0x34,
    versionBE: 1,
    typeBE: 2,
    flagsBE: 0x34
});

// Bitfield packing follows base type endianness
```

## Debugging Endianness Issues

### Inspecting Buffers

```ts
function inspectBuffer(buffer: Buffer, bytesPerLine: number = 16): void {
    for (let i = 0; i < buffer.length; i += bytesPerLine) {
        const line = buffer.slice(i, Math.min(i + bytesPerLine, buffer.length));
        const hex = Array.from(line)
            .map(b => b.toString(16).padStart(2, '0'))
            .join(' ');
        const ascii = Array.from(line)
            .map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.')
            .join('');

        console.log(`${ i.toString(16).padStart(4, '0') }: ${ hex.padEnd(bytesPerLine * 3, ' ') } | ${ ascii }`);
    }
}

const schema = new Struct({
    valueLE: 'UInt32LE',
    valueBE: 'UInt32BE'
});

const buffer = schema.toBuffer({
    valueLE: 0x12345678,
    valueBE: 0x12345678
});

inspectBuffer(buffer);
// 0000: 78 56 34 12 12 34 56 78  | xV4.4Vx
//       ^LE bytes^  ^BE bytes^
```

### Comparing Endianness

```ts
function compareEndianness(value: number): void {
    const leSchema = new Struct({ v: 'UInt32LE' });
    const beSchema = new Struct({ v: 'UInt32BE' });

    const leBuffer = leSchema.toBuffer({ v: value });
    const beBuffer = beSchema.toBuffer({ v: value });

    console.log(`Value: 0x${ value.toString(16).padStart(8, '0') }`);
    console.log(`LE: ${ Array.from(leBuffer).map(b => b.toString(16).padStart(2, '0')).join(' ') }`);
    console.log(`BE: ${ Array.from(beBuffer).map(b => b.toString(16).padStart(2, '0')).join(' ') }`);
}

compareEndianness(0x12345678);
// Value: 0x12345678
// LE: 78 56 34 12
// BE: 12 34 56 78
```

### Validation Helper

```ts
function validateEndianness(
    buffer: Buffer,
    offset: number,
    expectedValue: number,
    type: 'LE' | 'BE'
): boolean {
    const actualValue = type === 'LE'
        ? buffer.readUInt32LE(offset)
        : buffer.readUInt32BE(offset);

    const isValid = actualValue === expectedValue;

    if (!isValid) {
        console.error(
            `Endianness mismatch at offset ${ offset }:\n` +
            `Expected: 0x${ expectedValue.toString(16) }\n` +
            `Got: 0x${ actualValue.toString(16) }\n` +
            `Bytes: ${ Array.from(buffer.slice(offset, offset + 4))
                .map(b => b.toString(16).padStart(2, '0')).join(' ') }`
        );
    }

    return isValid;
}

// Usage
const testBuffer = Buffer.from([ 0x78, 0x56, 0x34, 0x12 ]);
validateEndianness(testBuffer, 0, 0x12345678, 'LE');  // true
validateEndianness(testBuffer, 0, 0x12345678, 'BE');  // false, logs error
```

## Best Practices

### ✅ Do

```ts
// Document your endianness choice
/**
 * Network packet format
 * All multi-byte values are in network byte order (big-endian)
 */
const packetSchema = new Struct({
    magic: 'UInt32BE',
    length: 'UInt16BE',
    checksum: 'UInt32BE'
});

// Be consistent within a schema
const consistentSchema = new Struct({
    field1: 'UInt32LE',
    field2: 'UInt16LE',
    field3: 'UInt32LE'
});

// Use appropriate endianness for the context
const networkSchema = new Struct({
    port: 'UInt16BE'  // Network byte order
});

const localSchema = new Struct({
    fileSize: 'UInt32LE'  // Local file format
});
```

### ❌ Don't

```ts
// Don't mix endianness without good reason
const badSchema = new Struct({
    field1: 'UInt32LE',
    field2: 'UInt32BE',  // ❌ Why different?
    field3: 'UInt32LE'
});

// Don't assume platform endianness
const assumptionSchema = new Struct({
    value: 'UInt32LE'  // ❌ What if platform is BE?
});
// ✅ Better: Document that LE is required

// Don't forget endianness in cross-platform code
const forgotSchema = new Struct({
    // ❌ Missing LE/BE suffix for 16-bit type
    // value: 'UInt16'  // This doesn't exist!
    value: 'UInt16LE'  // ✅ Explicit endianness
});
```

## Performance Considerations

### Native Endianness is Faster

```ts
// On little-endian platforms, LE operations are faster
const platformOptimized = new Struct({
    // If data stays local, use platform endianness (usually LE)
    localData: 'UInt32LE'
});

// Network data requires conversion regardless
const networkRequired = new Struct({
    // Network requires BE, accept the conversion cost
    networkData: 'UInt32BE'
});
```

### Conversion Overhead

```ts
// Minimal conversion (same endianness)
const schema1 = new Struct({
    a: 'UInt32LE',
    b: 'UInt32LE',
    c: 'UInt32LE'
});

// More conversion (mixed endianness)
const schema2 = new Struct({
    a: 'UInt32LE',
    b: 'UInt32BE',  // Requires conversion
    c: 'UInt32LE'
});

// For optimal performance, minimize endianness conversions
```

## Common Pitfalls

### Reading Wrong Endianness

```ts
const schema = new Struct({
    value: 'UInt32LE'
});

const buffer = schema.toBuffer({ value: 0x12345678 });
// Buffer: <Buffer 78 56 34 12>

// ❌ Wrong: Reading as big-endian
console.log(buffer.readUInt32BE(0));  // 0x78563412 (wrong!)

// ✅ Correct: Reading as little-endian
console.log(buffer.readUInt32LE(0));  // 0x12345678 (correct!)

// ✅ Best: Use xStruct to read
console.log(schema.toObject(buffer).value);  // 0x12345678 (correct!)
```

### Magic Number Confusion

```ts
// Magic numbers are often big-endian for readability
const FILE_MAGIC = 0x4D594654;  // 'MYFT' in ASCII

const schema = new Struct({
    magic: 'UInt32BE'  // ✅ Use BE for readable ASCII
});

const buffer = schema.toBuffer({ magic: FILE_MAGIC });
console.log(buffer.toString('ascii', 0, 4));  // 'MYFT'

// ❌ If using LE, ASCII would be reversed
const wrongSchema = new Struct({
    magic: 'UInt32LE'
});
const wrongBuffer = wrongSchema.toBuffer({ magic: FILE_MAGIC });
console.log(wrongBuffer.toString('ascii', 0, 4));  // 'TFYM' (backwards!)
```

## See Also

- [Integer Types (UInt/Int)](../primitive/int.md) - Integer primitive types
- [Float Types](../primitive/float.md) - Floating-point types
- [Bitfields Guide](../primitive/bitfields.md) - Bitfield endianness behavior
- [Best Practices](./best-practices.md) - Optimization tips
- [Arrays Guide](./arrays.md) - Working with arrays
