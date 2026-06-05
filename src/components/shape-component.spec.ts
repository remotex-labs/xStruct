/**
 * Imports
 */

import { readIntegerPipe, writeIntegerPipe } from '@pipes/primitive.pipe';
import { compileShape, toItems, readPtr, writePtr, decodeShape, encodeShape } from '@components/shape.component';

/**
 * Tests
 */

describe('compileShape', () => {
    test('should return empty array for empty shape', () => {
        const result = compileShape([], 4, 8);

        expect(result).toEqual([]);
    });

    test('should compile a single dimension', () => {
        const result = compileShape([ 10 ], 4, 8);

        expect(result).toEqual([{ dim: 10, size: 40, stride: 4 }]);
    });

    test('should compile multiple dimensions', () => {
        const result = compileShape([ 2, 3, 4 ], 4, 8);

        expect(result).toEqual([
            { dim: 2, size: 96, stride: 48 },
            { dim: 3, size: 48, stride: 16 },
            { dim: 4, size: 16, stride: 4 }
        ]);
    });

    test('should use pointer size when dimension is zero', () => {
        const result = compileShape([ 0 ], 4, 8);

        expect(result).toEqual([{ dim: 0, size: 8, stride: 4 }]);
    });

    test('should propagate pointer stride through parent levels', () => {
        const result = compileShape([ 3, 0 ], 4, 8);

        expect(result).toEqual([
            { dim: 3, size: 24, stride: 8 },
            { dim: 0, size: 8, stride: 4 }
        ]);
    });

    test('should handle nested pointer dimensions', () => {
        const result = compileShape([ 2, 0, 5 ], 4, 8);

        expect(result).toEqual([
            { dim: 2, size: 16, stride: 8 },
            { dim: 0, size: 8, stride: 20 },
            { dim: 5, size: 20, stride: 4 }
        ]);
    });

    test('should use custom element and pointer sizes', () => {
        const result = compileShape([ 2, 3 ], 16, 4);

        expect(result).toEqual([
            { dim: 2, size: 96, stride: 48 },
            { dim: 3, size: 48, stride: 16 }
        ]);
    });

    test('should correctly handle multiple zero dimensions', () => {
        const result = compileShape([ 0, 0 ], 4, 8);

        expect(result).toEqual([
            { dim: 0, size: 8, stride: 8 },
            { dim: 0, size: 8, stride: 4 }
        ]);
    });

    describe('table', () => {
        const elementSize = 4;
        const pointerSize = 8;

        test.each(
            {
                shape: [],
                expected: []
            },
            {
                shape: [ 10 ],
                expected: [{ dim: 10, size: 40, stride: 4 }]
            },
            {
                shape: [ 0 ],
                expected: [{ dim: 0, size: 8, stride: 4 }]
            },
            {
                shape: [ 3, 0 ],
                expected: [
                    { dim: 3, size: 24, stride: 8 },
                    { dim: 0, size: 8, stride: 4 }
                ]
            }
        )(
            'shape=$shape',
            ({ shape, expected }) => {
                expect(
                    compileShape(shape, elementSize, pointerSize)
                ).toEqual(expected);
            }
        );
    });
});

describe('toItems', () => {
    test('should convert string into array of characters', () => {
        expect(toItems('AAAA', true)).toEqual('AAAA');
    });

    test('should return array as-is when input is array', () => {
        const input = [ 1, 2, 3 ];
        expect(toItems(input)).toBe(input);
    });

    test('should wrap single primitive value into array', () => {
        expect(toItems(123)).toEqual([ 123 ]);
    });

    test('should wrap object into array', () => {
        const obj = { a: 1 };
        expect(toItems(obj)).toEqual([ obj ]);
    });

    test('should wrap null into array', () => {
        expect(toItems(null)).toEqual([ null ]);
    });

    test('should wrap undefined into array', () => {
        expect(toItems(undefined)).toEqual([ undefined ]);
    });

    test('should handle boolean values', () => {
        expect(toItems(true)).toEqual([ true ]);
        expect(toItems(false)).toEqual([ false ]);
    });
});

describe('readPtr', () => {
    const spyU64le = xJet.spyOn(readIntegerPipe, 'u64le');

    afterAll(() => xJet.clearAllMocks());
    beforeEach(() => xJet.resetAllMocks());

    test('should read pointer using Buffer when ptrSize <= 6', () => {
        const buffer = Buffer.alloc(10);
        buffer.writeUIntLE(0x1234, 0, 4);

        const result = readPtr(buffer, 0, 4);

        expect(result).toBe(0x1234);
        expect(readIntegerPipe.u64le).not.toHaveBeenCalled();
    });

    test('should use bigint pipe when ptrSize > 6', () => {
        const buffer = Buffer.alloc(16);

        spyU64le.mockReturnValue(999n);
        const result = readPtr(buffer, 0, 8);

        expect(readIntegerPipe.u64le).toHaveBeenCalledWith(buffer, 0);
        expect(result).toBe(999n);
    });

    test('should propagate error from u64le', () => {
        const buffer = Buffer.alloc(16);

        spyU64le.mockImplementation(() => {
            throw new Error('u64le failed');
        });

        expect(() => readPtr(buffer, 0, 8)).toThrow('u64le failed');
    });

    test('should throw on invalid ptrSize (0)', () => {
        const buffer = Buffer.alloc(10);

        expect(() => readPtr(buffer, 0, 0 as any)).toThrow();
    });

    test('should throw on invalid ptrSize (negative)', () => {
        const buffer = Buffer.alloc(10);

        expect(() => readPtr(buffer, 0, -1 as any)).toThrow();
    });

    test('should throw on out-of-bounds offset', () => {
        const buffer = Buffer.alloc(4);

        expect(() => readPtr(buffer, 100, 4)).toThrow();
    });
});

describe('writePtr', () => {
    const spyU64le = xJet.spyOn(writeIntegerPipe, 'u64le');

    afterAll(() => xJet.restoreAllMocks());
    beforeEach(() => xJet.clearAllMocks());

    test('should write pointer using Buffer when ptrSize <= 6', () => {
        const buffer = Buffer.alloc(10);
        const result = writePtr(buffer, 0, 0x1234, 4);

        expect(buffer.readUIntLE(0, 4)).toBe(0x1234);
        expect(writeIntegerPipe.u64le).not.toHaveBeenCalled();
        expect(typeof result).toBe('number');
    });

    test('should use bigint pipe when ptrSize > 6', () => {
        const buffer = Buffer.alloc(16);
        spyU64le.mockReturnValue(999n as any);

        const result = writePtr(buffer, 0, 123n, 8);

        expect(writeIntegerPipe.u64le).toHaveBeenCalledWith(buffer, 0, 123n);
        expect(result).toBe(999n);
    });

    test('should propagate error from u64le write', () => {
        const buffer = Buffer.alloc(16);
        spyU64le.mockImplementation(() => {
            throw new Error('u64le write failed');
        });

        expect(() => writePtr(buffer, 0, 123n, 8)).toThrow('u64le write failed');
    });

    test('should throw on invalid ptrSize (0)', () => {
        const buffer = Buffer.alloc(10);
        expect(() => writePtr(buffer, 0, 123, 0 as any)).toThrow();
    });

    test('should throw on invalid ptrSize (negative)', () => {
        const buffer = Buffer.alloc(10);

        expect(() => writePtr(buffer, 0, 123, -2 as any)).toThrow();
    });
});

describe('decodeShape', () => {
    const heap = {
        read: xJet.fn()
    };

    const context: any = {
        pointerSize: 4,
        elementSize: 1,
        stringEncoding: undefined,
        levels: [],
        decode: xJet.fn()
    };

    afterAll(() => xJet.restoreAllMocks());
    beforeEach(() => {
        xJet.clearAllMocks();
        heap.read.mockClear();
        context.decode.mockClear();
        context.stringEncoding = undefined;
    });

    test('should call leaf decode at final level', () => {
        context.levels = [{ dim: 1, size: 1, stride: 1 }];
        context.decode.mockReturnValue('X');

        const buffer = Buffer.alloc(10);
        const result = decodeShape.call(context, heap as any, buffer, 0, 1);

        expect(context.decode).toHaveBeenCalledWith(buffer, 0, { heap, length: 1 });
        expect(result).toBe('X');
    });

    test('should decode fixed-size array', () => {
        context.levels = [{ dim: 2, size: 2, stride: 1 }];
        context.decode.mockReturnValue('A');

        const buffer = Buffer.alloc(10);
        const result = decodeShape.call(context, heap as any, buffer, 0, 0);

        expect(result).toEqual([ 'A', 'A' ]);
        expect(context.decode).toHaveBeenCalledTimes(2);
    });

    test('should decode pointer-based array', () => {
        context.levels = [{ dim: 0, size: 4, stride: 1 }];

        const buffer = Buffer.alloc(10);
        writePtr(buffer, 0, 100, 4);
        heap.read.mockReturnValue(Buffer.from([ 1, 2 ]));
        context.decode.mockReturnValue('A');

        const result = decodeShape.call(context, heap as any, buffer, 0, 0);

        expect(heap.read).toHaveBeenCalledWith(100, 4);
        expect(result).toEqual([ 'A', 'A' ]);
    });

    test('should unwrap a single-element pointer level to the element', () => {
        context.levels = [{ dim: 0, size: 4, stride: 1 }];

        const buffer = Buffer.alloc(10);
        writePtr(buffer, 0, 100, 4);
        heap.read.mockReturnValue(Buffer.from([ 7 ])); // 1 byte / stride 1 => one element
        context.decode.mockReturnValue('A');

        const result = decodeShape.call(context, heap as any, buffer, 0, 0);

        expect(result).toBe('A'); // not [ 'A' ]
        expect(context.decode).toHaveBeenCalledTimes(1);
    });

    test('should delegate the whole last string level to decode', () => {
        context.stringEncoding = 'utf8';
        context.levels = [{ dim: 2, size: 2, stride: 1 }];
        context.decode.mockReturnValue('hi');

        const buffer = Buffer.alloc(10);
        const result = decodeShape.call(context, heap as any, buffer, 0, 0);

        expect(context.decode).toHaveBeenCalledTimes(1);
        expect(context.decode).toHaveBeenCalledWith(buffer, 0, { heap, length: 2 });
        expect(result).toBe('hi');
    });

    test('should decode nested shapes correctly', () => {
        context.levels = [
            { dim: 2, size: 4, stride: 2 },
            { dim: 2, size: 2, stride: 1 }
        ];

        context.decode.mockReturnValue('X');
        const buffer = Buffer.alloc(10);
        const result = decodeShape.call(context, heap as any, buffer, 0, 0);

        expect(result).toEqual([
            [ 'X', 'X' ],
            [ 'X', 'X' ]
        ]);
    });

    test('should reset offset when using heap buffer', () => {
        context.levels = [{ dim: 0, size: 4, stride: 1 }];

        const buffer = Buffer.alloc(10);
        writePtr(buffer, 4, 200, 4);
        heap.read.mockReturnValue(Buffer.from([ 1, 2, 3, 4 ]));
        context.decode.mockReturnValue('X');
        decodeShape.call(context, heap as any, buffer, 4, 0);

        expect(heap.read).toHaveBeenCalledWith(200, 4);
        // The heap source is decoded from offset 0, ignoring the incoming offset.
        expect(context.decode).toHaveBeenCalledWith(Buffer.from([ 1, 2, 3, 4 ]), 0, { heap, length: 1 });
    });
});

describe('encodeShape', () => {
    const heap = {
        write: xJet.fn()
    };

    const context: any = {
        pointerSize: 4,
        elementSize: 1,
        stringEncoding: undefined,
        levels: [],
        encode: xJet.fn()
    };

    afterAll(() => xJet.restoreAllMocks());

    beforeEach(() => {
        xJet.clearAllMocks();
        heap.write.mockClear();
        context.encode.mockClear();
        context.stringEncoding = undefined;
    });

    test('should call leaf encode at final level', () => {
        context.levels = [{ dim: 1, size: 1, stride: 1 }];
        context.encode.mockReturnValue(undefined);

        const buffer = Buffer.alloc(10);
        encodeShape.call(context, heap as any, buffer, 0, 'X', 1);

        expect(context.encode).toHaveBeenCalledWith(buffer, 0, 'X', { heap, length: 1 });
    });

    test('should encode fixed-size array', () => {
        context.levels = [{ dim: 2, size: 2, stride: 1 }];
        context.encode.mockImplementation(() => undefined);

        const buffer = Buffer.alloc(10);
        encodeShape.call(context, heap as any, buffer, 0, [ 'A', 'B' ], 0);

        expect(context.encode).toHaveBeenCalledTimes(2);
    });

    test('should encode pointer-based array and write to heap', () => {
        context.levels = [{ dim: 0, size: 4, stride: 1 }];
        context.encode.mockImplementation(() => undefined);

        const buffer = Buffer.alloc(10);
        heap.write.mockReturnValue(999);
        encodeShape.call(context, heap as any, buffer, 0, [ 'A', 'B' ], 0);

        expect(heap.write).toHaveBeenCalled();
        expect(readPtr(buffer, 0, 4)).toBe(999);
    });

    test('should encode nested shapes correctly', () => {
        context.levels = [
            { dim: 2, size: 4, stride: 2 },
            { dim: 2, size: 2, stride: 1 }
        ];

        context.encode.mockImplementation(() => undefined);
        const buffer = Buffer.alloc(10);
        encodeShape.call(context, heap as any, buffer, 0, [[ 'A', 'B' ], [ 'C', 'D' ]], 0);

        expect(context.encode).toHaveBeenCalledTimes(4);
    });

    test('should reset offset when using heap buffer', () => {
        context.levels = [{ dim: 0, size: 4, stride: 1 }];
        context.encode.mockImplementation(() => undefined);

        const buffer = Buffer.alloc(10);
        heap.write.mockReturnValue(123);
        encodeShape.call(context, heap as any, buffer, 4, [ 'A', 'B' ], 0);

        expect(heap.write).toHaveBeenCalled();
        expect(readPtr(buffer, 4, 4)).toBe(123);
    });

    test('should size a pointer string payload by encoded byte length, not code units', () => {
        context.stringEncoding = 'utf16le';
        context.levels = [{ dim: 0, size: 4, stride: 1 }];

        let payloadBytes = -1;
        let encodeLength = -1;
        heap.write.mockImplementation(((buf: Buffer) => {
            payloadBytes = buf.byteLength;

            return 999;
        }) as any);
        context.encode.mockImplementation((_b: Buffer, _o: number, _v: unknown, opts: any) => {
            encodeLength = opts.length;
        });

        const buffer = Buffer.alloc(10);
        encodeShape.call(context, heap as any, buffer, 0, 'ab', 0); // 'ab' is 4 bytes in UTF-16LE, not 2

        expect(payloadBytes).toBe(4);
        expect(encodeLength).toBe(4);
        expect(readPtr(buffer, 0, 4)).toBe(999);
    });
});
