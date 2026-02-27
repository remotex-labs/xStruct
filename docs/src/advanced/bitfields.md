# Bitfields

Comprehensive guide to using bitfields in xStruct for compact data storage and bit-level manipulation.

## Overview

Bitfields allow you to pack multiple values into a single byte or multi-byte field, enabling efficient storage of flags, small integers, and other compact data.
This is essential for binary protocols, hardware interfaces, and memory-constrained applications.

**Key Benefits:**

- **Space Efficiency**: Pack multiple values into fewer bytes
- **Protocol Compatibility**: Match binary protocol specifications
- **Hardware Interface**: Direct mapping to hardware registers
- **Performance**: Reduced memory footprint improves cache performance

## Bitfield Syntax

Bitfields are defined using the format `Type:BitCount`:

```ts
import { Struct } from '@remotex-labs/xstruct';

const schema = new Struct({
    field1: 'UInt8:4',    // 4 bits from UInt8
    field2: 'UInt8:4',    // 4 bits from UInt8
    flag: 'UInt8:1',      // 1 bit from UInt8
    value: 'UInt16LE:12'  // 12 bits from UInt16LE
});
```

## Supported Bitfield Types

### 8-bit Bitfields

```ts
// Unsigned 8-bit bitfields
// 'UInt8:1' to 'UInt8:8'  // 1 to 8 bits

// Signed 8-bit bitfields
// 'Int8:1' to 'Int8:8'    // 1 to 8 bits

const schema = new Struct({
    flag1: 'UInt8:1',    // 0-1
    flag2: 'UInt8:1',    // 0-1
    mode: 'UInt8:2',     // 0-3
    level: 'UInt8:4'     // 0-15
});
```

### 16-bit Bitfields

```ts
// Unsigned 16-bit bitfields
// 'UInt16LE:1' to 'UInt16LE:16'  // Little-endian
// 'UInt16BE:1' to 'UInt16BE:16'  // Big-endian

// Signed 16-bit bitfields
// 'Int16LE:1' to 'Int16LE:16'    // Little-endian
// 'Int16BE:1' to 'Int16BE:16'    // Big-endian

const schema = new Struct({
    version: 'UInt16LE:4',    // 0-15
    type: 'UInt16LE:4',       // 0-15
    flags: 'UInt16LE:8'       // 0-255
});
```

## Basic Bitfield Usage

### Simple Flags

Pack boolean flags into a single byte:

```ts
const flagsSchema = new Struct({
    enabled: 'UInt8:1',      // 0 or 1
    visible: 'UInt8:1',      // 0 or 1
    locked: 'UInt8:1',       // 0 or 1
    archived: 'UInt8:1',     // 0 or 1
    reserved: 'UInt8:4'      // Reserved bits
});

const buffer = flagsSchema.toBuffer({
    enabled: 1,
    visible: 1,
    locked: 0,
    archived: 0,
    reserved: 0
});

// All 8 bits packed into 1 byte!
console.log(buffer.length);  // 1

const data = flagsSchema.toObject(buffer);
// { enabled: 1, visible: 1, locked: 0, archived: 0, reserved: 0 }
```

### Multi-bit Values

Store small integers efficiently:

```ts
const packetSchema = new Struct({
    version: 'UInt8:4',      // 0-15 (4 bits)
    priority: 'UInt8:2',     // 0-3 (2 bits)
    type: 'UInt8:2'          // 0-3 (2 bits)
});

const buffer = packetSchema.toBuffer({
    version: 2,
    priority: 3,
    type: 1
});

console.log(buffer.length);  // 1 byte for all three fields
```

## Bitfield Packing

### Automatic Packing

Consecutive bitfields of the same base type are automatically packed together:

```ts
const schema = new Struct({
    // These 4 fields pack into 1 byte (UInt8)
    flag1: 'UInt8:1',    // bit 0
    flag2: 'UInt8:1',    // bit 1
    mode: 'UInt8:3',     // bits 2-4
    level: 'UInt8:3'     // bits 5-7
});

// Binary representation: LLLMMMF2F1
// L = level, M = mode, F = flags

const buffer = schema.toBuffer({
    flag1: 1,    // bit 0 = 1
    flag2: 0,    // bit 1 = 0
    mode: 5,     // bits 2-4 = 101
    level: 7     // bits 5-7 = 111
});

console.log(buffer);
// <Buffer fd>  (0b11110101 = 0xFD = 253)
```

### Bit Position Visualization

```ts
const schema = new Struct({
    a: 'UInt8:2',  // bits 0-1
    b: 'UInt8:3',  // bits 2-4
    c: 'UInt8:3'   // bits 5-7
});

// Byte layout:
// [7][6][5][4][3][2][1][0]  Bit positions
// [  c  ][  b  ][  a  ]     Fields

const buffer = schema.toBuffer({
    a: 3,  // 0b11
    b: 5,  // 0b101
    c: 2   // 0b010
});

// Result: 0b01010111 = 0x57 = 87
console.log(buffer[0]);  // 87
```

## Value Ranges

### Unsigned Bitfields

```ts
// Range: 0 to (2^bits - 1)

const schema = new Struct({
  bit1: 'UInt8:1',   // 0 to 1
  bit2: 'UInt8:2',   // 0 to 3
  bit3: 'UInt8:3',   // 0 to 7
  bit4: 'UInt8:4',   // 0 to 15
  bit5: 'UInt8:5',   // 0 to 31
  bit8: 'UInt8:8'    // 0 to 255
});

// Examples
const buffer = schema.toBuffer({
  bit1: 1,    // Valid
  bit2: 3,    // Valid (max)
  bit3: 7,    // Valid (max)
  bit4: 15,   // Valid (max)
  bit5: 31,   // Valid (max)
  bit8: 255   // Valid (max)
});
```

### Signed Bitfields

```ts
// Range: -(2^(bits-1)) to (2^(bits-1) - 1)

const schema = new Struct({
    bit2: 'Int8:2',   // -2 to 1
    bit3: 'Int8:3',   // -4 to 3
    bit4: 'Int8:4',   // -8 to 7
    bit8: 'Int8:8'    // -128 to 127
});

const buffer = schema.toBuffer({
    bit2: -2,   // Min value
    bit3: 3,    // Max value
    bit4: -5,   // Negative value
    bit8: 127   // Max value
});
```

### Range Validation

```ts
const schema = new Struct({
    value: 'UInt8:3'  // 0-7
});

// Valid values
schema.toBuffer({ value: 0 });   // Min
schema.toBuffer({ value: 7 });   // Max

// Invalid values throw RangeError
try {
    schema.toBuffer({ value: 8 });   // Out of range!
} catch (error) {
    console.error(error);
    // RangeError: Value 8 does not fit within 3 bits for type UInt8
}
```

## Common Patterns

### Permission Flags

```ts
const permissionsSchema = new Struct({
    read: 'UInt8:1',      // 0 or 1
    write: 'UInt8:1',     // 0 or 1
    execute: 'UInt8:1',   // 0 or 1
    delete: 'UInt8:1',    // 0 or 1
    admin: 'UInt8:1',     // 0 or 1
    reserved: 'UInt8:3'   // Reserved for future use
});

const buffer = permissionsSchema.toBuffer({
    read: 1,
    write: 1,
    execute: 0,
    delete: 0,
    admin: 1,
    reserved: 0
});

// Only 1 byte for all permissions
console.log(buffer.length);  // 1
```

### Protocol Header

```ts
const headerSchema = new Struct({
    version: 'UInt8:4',      // Protocol version (0-15)
    type: 'UInt8:4',         // Message type (0-15)
    flags: 'UInt8:3',        // Flags (0-7)
    priority: 'UInt8:2',     // Priority (0-3)
    reserved: 'UInt8:3',     // Reserved bits
    sequenceNumber: 'UInt16LE'
});

const buffer = headerSchema.toBuffer({
    version: 2,
    type: 5,
    flags: 3,
    priority: 2,
    reserved: 0,
    sequenceNumber: 12345
});

console.log(buffer.length);  // 4 bytes (2 for bitfields, 2 for sequence)
```

### Network Packet

```ts
const packetSchema = new Struct({
    // IPv4 Header-like structure
    version: 'UInt8:4',           // IP version (4)
    headerLength: 'UInt8:4',      // Header length in 32-bit words
    dscp: 'UInt8:6',              // Differentiated services
    ecn: 'UInt8:2',               // Explicit congestion notification
    totalLength: 'UInt16BE',      // Total packet length
    identification: 'UInt16BE',   // Fragment identification
    flags: 'UInt8:3',             // Fragment flags
    fragmentOffset: 'UInt16BE:13', // Fragment offset
    ttl: 'UInt8',                 // Time to live
    protocol: 'UInt8',            // Protocol (TCP, UDP, etc.)
    checksum: 'UInt16BE'
});
```

### Status Byte

```ts
const statusSchema = new Struct({
    ready: 'UInt8:1',       // Device ready
    error: 'UInt8:1',       // Error flag
    busy: 'UInt8:1',        // Busy flag
    warning: 'UInt8:1',     // Warning flag
    mode: 'UInt8:2',        // Operating mode (0-3)
    reserved: 'UInt8:2'     // Reserved
});

const buffer = statusSchema.toBuffer({
    ready: 1,
    error: 0,
    busy: 0,
    warning: 0,
    mode: 2,
    reserved: 0
});

// Entire status in 1 byte
```

### Configuration Flags

```ts
const configSchema = new Struct({
    enableLogging: 'UInt8:1',
    enableMetrics: 'UInt8:1',
    enableDebug: 'UInt8:1',
    enableCache: 'UInt8:1',
    compressionLevel: 'UInt8:2',  // 0-3
    reserved: 'UInt8:2'
});

const buffer = configSchema.toBuffer({
    enableLogging: 1,
    enableMetrics: 1,
    enableDebug: 0,
    enableCache: 1,
    compressionLevel: 2,
    reserved: 0
});
```

## Mixing Bitfields with Regular Fields

```ts
const mixedSchema = new Struct({
    // Regular fields
    id: 'UInt32LE',
    timestamp: 'BigUInt64LE',

    // Bitfield flags (packed into 1 byte)
    enabled: 'UInt8:1',
    visible: 'UInt8:1',
    locked: 'UInt8:1',
    reserved: 'UInt8:5',

    // More regular fields
    count: 'UInt16LE',
    value: 'FloatLE'
});

const buffer = mixedSchema.toBuffer({
    id: 12345,
    timestamp: BigInt(Date.now()),
    enabled: 1,
    visible: 1,
    locked: 0,
    reserved: 0,
    count: 100,
    value: 3.14
});

// Size: 4 + 8 + 1 + 2 + 4 = 19 bytes
console.log(buffer.length);  // 19
```

## Endianness with Bitfields

### Little-Endian Bitfields

```ts
const leSchema = new Struct({
    field1: 'UInt16LE:4',
    field2: 'UInt16LE:8',
    field3: 'UInt16LE:4'
});

const buffer = leSchema.toBuffer({
    field1: 15,
    field2: 255,
    field3: 15
});

console.log(buffer);
// Little-endian byte order
```

### Big-Endian Bitfields

```ts
const beSchema = new Struct({
    field1: 'UInt16BE:4',
    field2: 'UInt16BE:8',
    field3: 'UInt16BE:4'
});

const buffer = beSchema.toBuffer({
    field1: 15,
    field2: 255,
    field3: 15
});

console.log(buffer);
// Big-endian byte order
```

## Bit Manipulation Helpers

### Reading Specific Bits

```ts
function getBit(value: number, position: number): number {
    return (value >> position) & 1;
}

function setBit(value: number, position: number): number {
    return value | (1 << position);
}

function clearBit(value: number, position: number): number {
    return value & ~(1 << position);
}

function toggleBit(value: number, position: number): number {
    return value ^ (1 << position);
}

// Example usage
const schema = new Struct({
    flags: 'UInt8'
});

let flags = 0;
flags = setBit(flags, 0);     // Set bit 0
flags = setBit(flags, 2);     // Set bit 2
flags = clearBit(flags, 0);   // Clear bit 0
flags = toggleBit(flags, 1);  // Toggle bit 1

const buffer = schema.toBuffer({ flags });
```

### Creating Bit Masks

```ts
function createMask(bitCount: number): number {
    return (1 << bitCount) - 1;
}

function extractBits(value: number, position: number, count: number): number {
    return (value >> position) & createMask(count);
}

function insertBits(
    original: number,
    value: number,
    position: number,
    count: number
): number {
    const mask = createMask(count);
    const clearedOriginal = original & ~(mask << position);
    return clearedOriginal | ((value & mask) << position);
}

// Example: Extract version from packed byte
const packed = 0b11010010;
const version = extractBits(packed, 4, 4);  // Get bits 4-7
console.log(version);  // 13 (0b1101)
```

## Real-World Examples

### USB Descriptor

```ts
const usbDescriptorSchema = new Struct({
    bLength: 'UInt8',
    bDescriptorType: 'UInt8',
    bcdUSB: 'UInt16LE',
    bDeviceClass: 'UInt8',
    bDeviceSubClass: 'UInt8',
    bDeviceProtocol: 'UInt8',
    bMaxPacketSize: 'UInt8',
    idVendor: 'UInt16LE',
    idProduct: 'UInt16LE',
    bcdDevice: 'UInt16LE',
    iManufacturer: 'UInt8',
    iProduct: 'UInt8',
    iSerialNumber: 'UInt8',
    bNumConfigurations: 'UInt8'
});
```

### Graphics Pixel Format

```ts
const pixelFormatSchema = new Struct({
    // RGB565 format
    red: 'UInt16LE:5',      // 5 bits for red (0-31)
    green: 'UInt16LE:6',    // 6 bits for green (0-63)
    blue: 'UInt16LE:5'      // 5 bits for blue (0-31)
});

function rgb888To565(r: number, g: number, b: number) {
    return {
        red: r >> 3,      // 8 bits -> 5 bits
        green: g >> 2,    // 8 bits -> 6 bits
        blue: b >> 3      // 8 bits -> 5 bits
    };
}

const buffer = pixelFormatSchema.toBuffer(rgb888To565(255, 128, 64));
```

### Hardware Register

```ts
const registerSchema = new Struct({
    enabled: 'UInt32LE:1',       // Enable bit
    mode: 'UInt32LE:3',          // Operating mode
    speed: 'UInt32LE:4',         // Speed setting
    channel: 'UInt32LE:8',       // Channel select
    reserved: 'UInt32LE:16'      // Reserved bits
});

const buffer = registerSchema.toBuffer({
    enabled: 1,
    mode: 5,
    speed: 15,
    channel: 42,
    reserved: 0
});
```

### File Attributes

```ts
const fileAttrsSchema = new Struct({
    // MS-DOS file attributes
    readOnly: 'UInt8:1',
    hidden: 'UInt8:1',
    system: 'UInt8:1',
    volumeLabel: 'UInt8:1',
    directory: 'UInt8:1',
    archive: 'UInt8:1',
    reserved: 'UInt8:2'
});

const buffer = fileAttrsSchema.toBuffer({
    readOnly: 0,
    hidden: 0,
    system: 0,
    volumeLabel: 0,
    directory: 1,
    archive: 0,
    reserved: 0
});
```

### Date/Time Packing

```ts
// MS-DOS date format
const dosDateSchema = new Struct({
    day: 'UInt16LE:5',      // 1-31
    month: 'UInt16LE:4',    // 1-12
    year: 'UInt16LE:7'      // 0-127 (offset from 1980)
});

// MS-DOS time format
const dosTimeSchema = new Struct({
    seconds: 'UInt16LE:5',  // 0-29 (2-second intervals)
    minutes: 'UInt16LE:6',  // 0-59
    hours: 'UInt16LE:5'     // 0-23
});

function dateToDos(date: Date) {
    return {
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear() - 1980
    };
}

function timeToDos(date: Date) {
    return {
        seconds: Math.floor(date.getSeconds() / 2),
        minutes: date.getMinutes(),
        hours: date.getHours()
    };
}
```

## Performance Considerations

### Memory Savings

```ts
// Without bitfields: 8 bytes
const unpackedSchema = new Struct({
    flag1: 'UInt8',
    flag2: 'UInt8',
    flag3: 'UInt8',
    flag4: 'UInt8',
    mode: 'UInt8',
    level: 'UInt8',
    priority: 'UInt8',
    status: 'UInt8'
});

// With bitfields: 1 byte (8× smaller!)
const packedSchema = new Struct({
    flag1: 'UInt8:1',
    flag2: 'UInt8:1',
    flag3: 'UInt8:1',
    flag4: 'UInt8:1',
    mode: 'UInt8:2',
    level: 'UInt8:1',
    priority: 'UInt8:1'
});

// For 1,000,000 records:
// Unpacked: 8 MB
// Packed: 1 MB (87.5% savings!)
```

### Access Speed

Bitfield access involves bit shifting and masking operations, which are generally fast but slightly slower than direct byte access:

```ts
// Faster: Direct byte access
const fastSchema = new Struct({
    flags: 'UInt8'
});

// Slightly slower: Bitfield access (but much more space efficient)
const compactSchema = new Struct({
    flag1: 'UInt8:1',
    flag2: 'UInt8:1',
    flag3: 'UInt8:1',
    flag4: 'UInt8:1',
    flag5: 'UInt8:1',
    flag6: 'UInt8:1',
    flag7: 'UInt8:1',
    flag8: 'UInt8:1'
});

// Trade-off: Use bitfields when space is more important than speed
```

## Best Practices

### ✅ Do

```ts
// Use bitfields for boolean flags
const goodFlags = new Struct({
    enabled: 'UInt8:1',
    visible: 'UInt8:1',
    locked: 'UInt8:1'
});

// Use bitfields for small enums
const goodEnum = new Struct({
    mode: 'UInt8:2',     // 0-3 (4 possible modes)
    priority: 'UInt8:2'  // 0-3 (4 priority levels)
});

// Reserve unused bits
const goodReserved = new Struct({
    flags: 'UInt8:4',
    reserved: 'UInt8:4'  // For future use
});

// Document bit meanings
const documented = new Struct({
    read: 'UInt8:1',      // Read permission
    write: 'UInt8:1',     // Write permission
    execute: 'UInt8:1',   // Execute permission
    reserved: 'UInt8:5'   // Reserved for future permissions
});
```

### ❌ Don't

```ts
// Don't use bitfields for values that need full range
const badRange = new Struct({
    counter: 'UInt8:4'  // ❌ Only 0-15, use full UInt8 or UInt16
});

// Don't mix signedness in same byte without reason
const badMix = new Struct({
    unsigned: 'UInt8:4',
    signed: 'Int8:4'     // ❌ Confusing, stick to one signedness
});

// Don't forget validation
const unvalidated = new Struct({
    value: 'UInt8:3'
});

// ❌ This will throw at runtime
// unvalidated.toBuffer({ value: 10 });  // Out of range!

// ✅ Validate before serializing
function validateValue(value: number): void {
    if (value < 0 || value > 7) {
        throw new RangeError('Value must be 0-7');
    }
}
```

## Debugging Bitfields

### Visualizing Bit Patterns

```ts
function toBinary(value: number, bits: number = 8): string {
    return value.toString(2).padStart(bits, '0');
}

const schema = new Struct({
    a: 'UInt8:3',
    b: 'UInt8:2',
    c: 'UInt8:3'
});

const buffer = schema.toBuffer({
    a: 5,  // 0b101
    b: 2,  // 0b10
    c: 7   // 0b111
});

console.log('Buffer byte:', toBinary(buffer[0]));
// "11110101"
// ^^^cc ^^b ^^^a
```

### Inspecting Packed Values

```ts
function inspectBitfield(buffer: Buffer, offset: number = 0): void {
    const value = buffer[offset];
    console.log(`Byte value: ${ value }`);
    console.log(`Binary: ${ toBinary(value) }`);
    console.log(`Hex: 0x${ value.toString(16).padStart(2, '0') }`);

    // Show each bit
    for (let i = 7; i >= 0; i--) {
        const bit = (value >> i) & 1;
        console.log(`Bit ${ i }: ${ bit }`);
    }
}

const schema = new Struct({
    flags: 'UInt8:4',
    mode: 'UInt8:4'
});

const buffer = schema.toBuffer({
    flags: 15,
    mode: 10
});

inspectBitfield(buffer);
```

## Validation

### Range Checking

```ts
function validateBitfieldValue(
    value: number,
    bits: number,
    signed: boolean = false
): void {
    const max = signed ? (1 << (bits - 1)) - 1 : (1 << bits) - 1;
    const min = signed ? -(1 << (bits - 1)) : 0;

    if (value < min || value > max) {
        throw new RangeError(
            `Value ${ value } out of range for ${ bits }-bit ${ signed ? 'signed' : 'unsigned' } field (${ min } to ${ max })`
        );
    }
}

// Usage
try {
    validateBitfieldValue(16, 4, false);  // Throws: max is 15
    validateBitfieldValue(-5, 3, true);   // OK: range is -4 to 3
} catch (error) {
    console.error(error.message);
}
```

### Type Checking

```ts
function validateBitfieldType(value: unknown): asserts value is number {
    if (typeof value !== 'number') {
        throw new TypeError(`Bitfield value must be a number, got ${ typeof value }`);
    }

    if (!Number.isInteger(value)) {
        throw new TypeError(`Bitfield value must be an integer, got ${ value }`);
    }
}

// Usage
try {
    validateBitfieldType(3.14);  // Throws: must be integer
    validateBitfieldType('5');   // Throws: must be number
    validateBitfieldType(5);     // OK
} catch (error) {
    console.error(error.message);
}
```

## Troubleshooting

### Common Issues

```ts
// Issue 1: Value out of range
const schema1 = new Struct({
    value: 'UInt8:3'  // Max 7
});

try {
    schema1.toBuffer({ value: 8 });  // Error!
} catch (error) {
    console.error('Fix: Use larger bitfield or smaller value');
}

// Issue 2: Negative value in unsigned field
const schema2 = new Struct({
    value: 'UInt8:4'  // Unsigned
});

try {
    schema2.toBuffer({ value: -1 });  // Error!
} catch (error) {
    console.error('Fix: Use signed field (Int8:4) for negative values');
}

// Issue 3: Mixing base types in same byte
const schema3 = new Struct({
    field1: 'UInt8:4',
    field2: 'UInt16LE:4'  // Different base type!
});

// These won't pack together - each uses separate storage
```

## See Also

- [Integer Types (UInt/Int)](../primitive/int.md) - Integer primitive types
- [Arrays Guide](./arrays.md) - Working with arrays
- [Best Practices](./best-practices.md) - Optimization tips
- [Endianness Guide](./endianness.md) - Byte ordering
