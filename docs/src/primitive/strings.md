# String Types

Comprehensive guide to working with string data in xStruct, including fixed-length and variable-length strings with various encodings.

## Overview

xStruct provides flexible string handling capabilities for binary data serialization. Strings can be stored with automatic length prefixing or as fixed-size buffers, supporting multiple character encodings.

**Key Features:**

- **Variable-length strings**: Automatically prefixed with length (UInt16LE by default)
- **Fixed-length strings**: Specified size with padding
- **Multiple encodings**: UTF-8, UTF-16LE, ASCII, Latin1, and more
- **Null-termination**: Optional C-style null-terminated strings
- **Custom length types**: Choose the size of length prefix

## Quick Reference Table

| Type                                      | Description                 | Length Prefix | Padding    | Use Case            |
|-------------------------------------------|-----------------------------|---------------|------------|---------------------|
| `'string'`                                | Variable-length UTF-8       | UInt16LE      | N/A        | General text data   |
| `'string(N)'`                             | Fixed N bytes length        | None          | Null bytes | Fixed-size fields   |
| `{ type: 'string', encoding: 'utf16le' }` | UTF-16LE variable           | UInt16LE      | N/A        | Unicode text        |
| `{ type: 'string', size: N }`             | Fixed N bytes length        | None          | Null bytes | Binary strings      |
| `'string[N]'`                             | Array of N variable strings | UInt16LE each | N/A        | String arrays       |
| `'string(N)[M]'`                          | Array of M fixed-length     | None          | Null bytes | Fixed string arrays |

## Basic String Usage

### Variable-Length Strings (Default)

```ts
import { Struct } from '@remotex-labs/xstruct';

const schema = new Struct({
    name: 'string',
    email: 'string',
    message: 'string'
});

const buffer = schema.toBuffer({
    name: 'Alice',
    email: 'alice@example.com',
    message: 'Hello, World!'
});

const data = schema.toObject(buffer);
// { name: 'Alice', email: 'alice@example.com', message: 'Hello, World!' }
```

**Binary Structure:**

```text
[2 bytes: length][N bytes: UTF-8 data]
```

The length prefix (UInt16LE by default) stores the byte length of the string, allowing strings up to 65,535 bytes.

### Fixed-Length Strings

```ts
const schema = new Struct({
    code: 'string(4)',      // Exactly 4 bytes
    name: 'string(32)',     // Exactly 32 bytes
    hash: 'string(64)'      // Exactly 64 bytes
});

const buffer = schema.toBuffer({
    code: 'USD',            // Padded with null bytes: "USD\0"
    name: 'John Doe',       // Padded with null bytes
    hash: 'a1b2c3...'       // Padded with null bytes
});

const data = schema.toObject(buffer);
// Null bytes are removed when reading
// { code: 'USD', name: 'John Doe', hash: 'a1b2c3...' }
```

## String Encodings

### UTF-8 (Default)

UTF-8 is the default encoding, supporting all Unicode characters with variable byte length per character.

```ts
const schema = new Struct({
    text: 'string'
});

const buffer = schema.toBuffer({
    text: 'Hello, 世界! 🌍'
});

// UTF-8 uses 1-4 bytes per character
// ASCII: 1 byte, Chinese: 3 bytes, Emoji: 4 bytes
```

### UTF-16LE

UTF-16 Little-Endian encoding uses 2 or 4 bytes per character.

```ts
const schema = new Struct({
    text: { type: 'string', encoding: 'utf16le' }
});

const buffer = schema.toBuffer({
    text: 'Hello, 世界!'
});

// Each character uses 2 bytes (BMP) or 4 bytes (supplementary)
```

### ASCII

7-bit ASCII encoding (characters 0-127).

```ts
const schema = new Struct({
    text: { type: 'string', encoding: 'ascii' }
});

const buffer = schema.toBuffer({
    text: 'HELLO123'
});

// Each character uses exactly 1 byte
// Non-ASCII characters will be lossy converted
```

### Latin1 (ISO-8859-1)

8-bit single-byte encoding (characters 0-255).

```ts
const schema = new Struct({
    text: { type: 'string', encoding: 'latin1' }
});

const buffer = schema.toBuffer({
    text: 'Café'
});

// Each character uses exactly 1 byte
// Supports Western European characters
```

### Base64

Base64 encoding for binary data as text.

```ts
const schema = new Struct({
    data: { type: 'string', encoding: 'base64' }
});

const buffer = schema.toBuffer({
    data: 'SGVsbG8gV29ybGQh'  // "Hello World!" in Base64
});
```

### Hex

Hexadecimal string representation.

```ts
const schema = new Struct({
    hash: { type: 'string', encoding: 'hex' }
});

const buffer = schema.toBuffer({
    hash: 'a1b2c3d4e5f6'
});
```

## Advanced String Options

### Custom Length Prefix

By default, strings use UInt16LE (2 bytes) for length prefix. You can customize this:

```ts
// UInt8 prefix (max 255 bytes)
const smallSchema = new Struct({
    text: { type: 'string', lengthType: 'UInt8' }
});

// UInt32LE prefix (max ~4GB)
const largeSchema = new Struct({
    text: { type: 'string', lengthType: 'UInt32LE' }
});

// BigUInt64LE prefix (extremely large strings)
const hugeSchema = new Struct({
    text: { type: 'string', lengthType: 'BigUInt64LE' }
});
```

### Fixed-Size with Encoding

```ts
const schema = new Struct({
    // Fixed 16 bytes, UTF-16LE encoding
    name: {
        type: 'string',
        size: 16,
        encoding: 'utf16le'
    },

    // Fixed 32 bytes, ASCII encoding
    code: {
        type: 'string',
        size: 32,
        encoding: 'ascii'
    }
});
```

### Null-Terminated Strings

```ts
const schema = new Struct({
    text: {
        type: 'string',
        nullTerminated: true,
        maxLength: 100  // Safety limit
    }
});

const buffer = schema.toBuffer({
    text: 'Hello'
});

// Binary: "Hello\0" (6 bytes including null terminator)
```

## String Arrays

### Variable-Length String Arrays

```ts
const schema = new Struct({
    tags: {
        type: 'string',
        arraySize: 5
    }
});

const buffer = schema.toBuffer({
    tags: [ 'javascript', 'typescript', 'node', 'binary', 'struct' ]
});

// Each string has its own length prefix
```

```ts
const schema = new Struct({
    tags: 'string[5]'  // Array of 5 variable-length strings
});

const buffer = schema.toBuffer({
    tags: [ 'javascript', 'typescript', 'node', 'binary', 'struct' ]
});
```

### Fixed-Length String Arrays

```ts
const schema = new Struct({
    // Array of 10 strings, each exactly 8 bytes
    codes: 'string(8)[10]'
});

const buffer = schema.toBuffer({
    codes: [
        'USD', 'EUR', 'GBP', 'JPY', 'CNY',
        'AUD', 'CAD', 'CHF', 'HKD', 'NZD'
    ]
});
```

## Real-World Examples

### Network Protocol Header

```ts
interface ProtocolHeader {
    magic: string;      // Fixed 4 bytes: "HTTP"
    version: string;    // Fixed 8 bytes: "1.1"
    method: string;     // Variable: "GET", "POST", etc.
    path: string;       // Variable: "/api/users"
}

const headerSchema = new Struct<ProtocolHeader>({
    magic: 'string(4)',
    version: 'string(8)',
    method: { type: 'string', lengthType: 'UInt8' },
    path: 'string'
});

const buffer = headerSchema.toBuffer({
    magic: 'HTTP',
    version: '1.1',
    method: 'GET',
    path: '/api/users/123'
});
```

### User Profile

```ts
interface UserProfile {
    username: string;
    email: string;
    bio: string;
    avatar: string;  // Base64 encoded image
}

const profileSchema = new Struct<UserProfile>({
    username: { type: 'string', lengthType: 'UInt8' },  // Max 255 bytes
    email: { type: 'string', lengthType: 'UInt8' },
    bio: 'string',  // Longer text, up to 65KB
    avatar: { type: 'string', encoding: 'base64' }
});
```

### File Metadata

```ts
interface FileMetadata {
    filename: string;
    extension: string;
    mimeType: string;
    checksum: string;  // Hex-encoded hash
}

const metadataSchema = new Struct<FileMetadata>({
    filename: { type: 'string', lengthType: 'UInt16LE' },
    extension: 'string(8)',  // Fixed: ".txt", ".json"
    mimeType: 'string(64)',  // Fixed: "application/json"
    checksum: { type: 'string', encoding: 'hex', size: 64 }  // SHA-256
});

const buffer = metadataSchema.toBuffer({
    filename: 'document.txt',
    extension: '.txt',
    mimeType: 'text/plain',
    checksum: 'a'.repeat(64)  // 64 hex characters
});
```

### Internationalized Text

```ts
interface I18nMessage {
    locale: string;     // "en-US", "zh-CN", etc.
    message: string;    // UTF-8 text
    fallback: string;   // UTF-8 text
}

const i18nSchema = new Struct<I18nMessage>({
    locale: 'string(8)',  // Fixed locale code
    message: { type: 'string', encoding: 'utf8' },
    fallback: { type: 'string', encoding: 'utf8' }
});

const buffer = i18nSchema.toBuffer({
    locale: 'zh-CN',
    message: '你好，世界！',
    fallback: 'Hello, World!'
});
```

### Database Record

```ts
interface DatabaseRecord {
    id: string;         // Fixed UUID (36 chars)
    name: string;       // Variable
    email: string;      // Variable
    createdAt: string;  // Fixed ISO 8601 date (32 chars)
}

const recordSchema = new Struct<DatabaseRecord>({
    id: 'string(36)',  // UUID: "550e8400-e29b-41d4-a716-446655440000"
    name: { type: 'string', lengthType: 'UInt8' },
    email: { type: 'string', lengthType: 'UInt8' },
    createdAt: 'string(32)'  // ISO 8601: "2024-01-15T10:30:00.000Z"
});
```

### Configuration File

```ts
interface Config {
    appName: string;
    version: string;
    description: string;
    author: string;
    license: string;
}

const configSchema = new Struct<Config>({
    appName: 'string(64)',
    version: 'string(16)',  // "1.0.0"
    description: 'string',  // Variable length
    author: 'string(128)',
    license: 'string(32)'   // "MIT", "Apache-2.0"
});
```

## Performance Considerations

### Choose Appropriate String Types

```ts
// ✅ Good: Fixed-size for known-length data
const efficientSchema = new Struct({
    currencyCode: 'string(3)',     // Always 3 chars: USD, EUR
    countryCode: 'string(2)',      // Always 2 chars: US, GB
    languageCode: 'string(5)',     // Up to 5 chars: en-US
    status: 'string(8)'            // Known values: "active"
});

// ❌ Bad: Variable-length for fixed data (wastes 2 bytes per field)
const wastefulSchema = new Struct({
    currencyCode: 'string',  // 2 byte prefix + 3 bytes = 5 bytes
    countryCode: 'string',   // 2 byte prefix + 2 bytes = 4 bytes
    languageCode: 'string',
    status: 'string'
});
```

### Optimize Length Prefix Size

```ts
// ✅ Good: Appropriate prefix for data size
const optimizedSchema = new Struct({
    // Short strings (< 255 bytes)
    tag: { type: 'string', lengthType: 'UInt8' },

    // Medium strings (< 65KB)
    description: { type: 'string', lengthType: 'UInt16LE' },

    // Large strings (> 65KB)
    content: { type: 'string', lengthType: 'UInt32LE' }
});

// ❌ Bad: Oversized prefix
const wastefulSchema = new Struct({
    tag: { type: 'string', lengthType: 'UInt32LE' }  // Wastes 2 bytes
});
```

### Encoding Selection

```ts
// ✅ Good: Match encoding to content
const efficientSchema = new Struct({
    asciiCode: { type: 'string', encoding: 'ascii' },    // 1 byte/char
    latinName: { type: 'string', encoding: 'latin1' },   // 1 byte/char
    utf8Text: { type: 'string', encoding: 'utf8' },      // 1-4 bytes/char
    utf16Text: { type: 'string', encoding: 'utf16le' }   // 2-4 bytes/char
});

// ❌ Bad: UTF-16 for ASCII data (2x size)
const wastefulSchema = new Struct({
    asciiCode: { type: 'string', encoding: 'utf16le' }  // Wastes space
});
```

## String Validation

### Length Validation

```ts
function validateStringLength(
    value: string,
    maxLength: number,
    fieldName: string
): void {
    if (value.length > maxLength) {
        throw new RangeError(
            `${ fieldName } exceeds maximum length of ${ maxLength } characters`
        );
    }
}

// Usage
const schema = new Struct({
    username: { type: 'string', lengthType: 'UInt8' }
});

const username = 'john_doe';
validateStringLength(username, 255, 'username');
const buffer = schema.toBuffer({ username });
```

### Encoding Validation

```ts
function validateAscii(value: string, fieldName: string): void {
    for (let i = 0; i < value.length; i++) {
        if (value.charCodeAt(i) > 127) {
            throw new Error(
                `${ fieldName } contains non-ASCII character at position ${ i }`
            );
        }
    }
}

function validateUtf8(value: string, fieldName: string): boolean {
    try {
        const buffer = Buffer.from(value, 'utf8');
        return buffer.toString('utf8') === value;
    } catch {
        throw new Error(`${ fieldName } contains invalid UTF-8 sequence`);
    }
}
```

### Content Validation

```ts
function validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
    }
}

function validateUrl(url: string): void {
    try {
        new URL(url);
    } catch {
        throw new Error('Invalid URL format');
    }
}

// Usage
const schema = new Struct({
    email: 'string',
    website: 'string'
});

const data = {
    email: 'user@example.com',
    website: 'https://example.com'
};

validateEmail(data.email);
validateUrl(data.website);
const buffer = schema.toBuffer(data);
```

## Common Patterns

### Versioned String Format

```ts
class VersionedStringSchema {
    static create(version: number): Struct {
        switch (version) {
            case 1:
                return new Struct({
                    text: 'string'
                });

            case 2:
                return new Struct({
                    text: 'string',
                    encoding: 'string[16]',
                    language: 'string[8]'
                });

            default:
                throw new Error(`Unsupported version: ${ version }`);
        }
    }
}
```

### String Pool Pattern

```ts
class StringPool {
    private strings: string[] = [];
    private indices: Map<string, number> = new Map();

    add(value: string): number {
        if (this.indices.has(value)) {
            return this.indices.get(value)!;
        }

        const index = this.strings.length;
        this.strings.push(value);
        this.indices.set(value, index);
        return index;
    }

    get(index: number): string {
        return this.strings[index];
    }
}

// Schema using string pool indices
const pooledSchema = new Struct({
    stringIndex: 'UInt16LE'  // Index into string pool
});
```

### String Compression

```ts
import { gzipSync, gunzipSync } from 'zlib';

const compressedSchema = new Struct({
    compressedText: 'string'
});

function serializeCompressed(text: string): Buffer {
    const compressed = gzipSync(Buffer.from(text, 'utf8'));
    return compressedSchema.toBuffer({
        compressedText: compressed.toString('base64')
    });
}

function deserializeCompressed(buffer: Buffer): string {
    const data = compressedSchema.toObject(buffer);
    const compressed = Buffer.from(data.compressedText, 'base64');
    return gunzipSync(compressed).toString('utf8');
}
```

## Best Practices

### ✅ Do

```ts
// Use fixed-length for known-size data
const goodSchema = new Struct({
    countryCode: 'string(2)',       // ISO 3166-1 alpha-2
    currencyCode: 'string(3)',      // ISO 4217
    languageCode: 'string(5)'       // IETF language tag
});

// Choose appropriate encoding
const encodingSchema = new Struct({
    ascii: { type: 'string', encoding: 'ascii' },     // A-Z, 0-9
    latin1: { type: 'string', encoding: 'latin1' },   // Western Europe
    utf8: { type: 'string', encoding: 'utf8' }        // All languages
});

// Validate before serialization
function safeSerialize(schema: Struct, data: any): Buffer {
    validateData(data);
    return schema.toBuffer(data);
}

// Use TypeScript interfaces
interface Message {
    sender: string;
    recipient: string;
    subject: string;
    body: string;
}

const messageSchema = new Struct<Message>({
    sender: 'string(64)',
    recipient: 'string(64)',
    subject: { type: 'string', lengthType: 'UInt8' },
    body: 'string'
});
```

### ❌ Don't

```ts
// Don't use variable-length for fixed data
const wastefulSchema = new Struct({
    currencyCode: 'string'  // ❌ Always 3 chars, use 'string(3)'
});

// Don't use UTF-16 for ASCII data
const inefficientSchema = new Struct({
    code: { type: 'string', encoding: 'utf16le' }  // ❌ 2x size
});

// Don't skip validation
const riskySchema = new Struct({
    email: 'string'
});
// ❌ No validation
const buffer = riskySchema.toBuffer({ email: 'not-an-email' });

// Don't use oversized length prefix
const oversizedSchema = new Struct({
    tag: { type: 'string', lengthType: 'UInt32LE' }  // ❌ UInt8 enough
});
```

## Troubleshooting

### String Truncation

```ts
// Problem: String gets truncated
const schema = new Struct({
    text: 'string(10)'
});

const buffer = schema.toBuffer({
    text: 'This is a very long string'  // Gets truncated to 10 bytes
});

// Solution: Use variable-length or larger fixed size
const fixedSchema = new Struct({
    text: 'string'  // No truncation
});
```

### Encoding Issues

```ts
// Problem: Wrong encoding causes corruption
const schema = new Struct({
    text: { type: 'string', encoding: 'ascii' }
});

const buffer = schema.toBuffer({
    text: 'Café'  // 'é' is not ASCII, gets corrupted
});

// Solution: Use UTF-8 for international text
const utf8Schema = new Struct({
    text: { type: 'string', encoding: 'utf8' }
});
```

### Length Overflow

```ts
// Problem: String exceeds length prefix capacity
const schema = new Struct({
    text: { type: 'string', lengthType: 'UInt8' }  // Max 255 bytes
});

const longText = 'x'.repeat(300);
// Throws error or truncates

// Solution: Use appropriate length type
const fixedSchema = new Struct({
    text: { type: 'string', lengthType: 'UInt16LE' }  // Max 65535 bytes
});
```

## See Also

- [Integer Types](./int.md) - Integer types for length prefixes
- [Bitfields Guide](./bitfields.md) - Packing flags with strings
- [Arrays Guide](../advanced/arrays.md) - String arrays
- [Best Practices](../advanced/best-practices.md) - General optimization tips
