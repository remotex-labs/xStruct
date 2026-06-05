/**
 * Imports
 */

import { readIntegerPipe, writeIntegerPipe, readFloatPipe, writeFloatPipe, isFloat, isInteger } from './primitive.pipe';

/**
 * Tests
 */

afterEach(() => {
    xJet.restoreAllMocks();
});

describe('readIntegerPipe', () => {
    test('calls correct Buffer.readUInt8', () => {
        const buf = Buffer.alloc(1);
        const spy = xJet.spyOn(buf, 'readUInt8');

        readIntegerPipe.u8(buf, 0);
        expect(spy).toHaveBeenCalledWith(0);
    });

    test('calls correct Buffer.readInt8', () => {
        const buf = Buffer.alloc(1);
        const spy = xJet.spyOn(buf, 'readInt8');

        readIntegerPipe.i8(buf, 0);
        expect(spy).toHaveBeenCalledWith(0);
    });

    test('calls correct Buffer.readUInt16LE', () => {
        const buf = Buffer.alloc(2);
        const spy = xJet.spyOn(buf, 'readUInt16LE');

        readIntegerPipe.u16le(buf, 0);
        expect(spy).toHaveBeenCalledWith(0);
    });

    test('calls correct Buffer.readInt16BE', () => {
        const buf = Buffer.alloc(2);
        const spy = xJet.spyOn(buf, 'readInt16BE');

        readIntegerPipe.i16be(buf, 0);
        expect(spy).toHaveBeenCalledWith(0);
    });

    test('calls correct Buffer.readUInt32LE', () => {
        const buf = Buffer.alloc(4);
        const spy = xJet.spyOn(buf, 'readUInt32LE');

        readIntegerPipe.u32le(buf, 0);
        expect(spy).toHaveBeenCalledWith(0);
    });

    test('calls correct Buffer.readInt32BE', () => {
        const buf = Buffer.alloc(4);
        const spy = xJet.spyOn(buf, 'readInt32BE');

        readIntegerPipe.i32be(buf, 0);
        expect(spy).toHaveBeenCalledWith(0);
    });

    test('calls correct Buffer.readBigUInt64LE', () => {
        const buf = Buffer.alloc(8);
        const spy = xJet.spyOn(buf, 'readBigUInt64LE');

        readIntegerPipe.u64le(buf, 0);
        expect(spy).toHaveBeenCalledWith(0);
    });

    test('calls correct Buffer.readBigInt64BE', () => {
        const buf = Buffer.alloc(8);
        const spy = xJet.spyOn(buf, 'readBigInt64BE');

        readIntegerPipe.i64be(buf, 0);
        expect(spy).toHaveBeenCalledWith(0);
    });
});

describe('readFloatPipe', () => {
    test('calls correct Buffer.readFloatLE', () => {
        const buf = Buffer.alloc(4);
        const spy = xJet.spyOn(buf, 'readFloatLE');

        readFloatPipe.f32le(buf, 0);
        expect(spy).toHaveBeenCalledWith(0);
    });

    test('calls correct Buffer.readFloatBE', () => {
        const buf = Buffer.alloc(4);
        const spy = xJet.spyOn(buf, 'readFloatBE');
        readFloatPipe.f32be(buf, 0);

        expect(spy).toHaveBeenCalledWith(0);
    });

    test('calls correct Buffer.readDoubleLE', () => {
        const buf = Buffer.alloc(8);
        const spy = xJet.spyOn(buf, 'readDoubleLE');

        readFloatPipe.f64le(buf, 0);
        expect(spy).toHaveBeenCalledWith(0);
    });

    test('calls correct Buffer.readDoubleBE', () => {
        const buf = Buffer.alloc(8);
        const spy = xJet.spyOn(buf, 'readDoubleBE');

        readFloatPipe.f64be(buf, 0);
        expect(spy).toHaveBeenCalledWith(0);
    });
});

describe('writeIntegerPipe', () => {
    test('calls correct Buffer.writeUInt8', () => {
        const buf = Buffer.alloc(1);
        const spy = xJet.spyOn(buf, 'writeUInt8');

        writeIntegerPipe.u8(buf, 0, 123);
        expect(spy).toHaveBeenCalledWith(123, 0);
        spy.mockRestore();
    });

    test('calls correct Buffer.writeInt8', () => {
        const buf = Buffer.alloc(1);
        const spy = xJet.spyOn(buf, 'writeInt8');

        writeIntegerPipe.i8(buf, 0, -12);
        expect(spy).toHaveBeenCalledWith(-12, 0);
        spy.mockRestore();
    });

    test('calls correct Buffer.writeUInt16LE', () => {
        const buf = Buffer.alloc(2);
        const spy = xJet.spyOn(buf, 'writeUInt16LE');

        writeIntegerPipe.u16le(buf, 0, 500);
        expect(spy).toHaveBeenCalledWith(500, 0);
    });

    test('calls correct Buffer.writeInt16BE', () => {
        const buf = Buffer.alloc(2);
        const spy = xJet.spyOn(buf, 'writeInt16BE');

        writeIntegerPipe.i16be(buf, 0, -1000);
        expect(spy).toHaveBeenCalledWith(-1000, 0);
    });

    test('calls correct Buffer.writeUInt32LE', () => {
        const buf = Buffer.alloc(6);
        const spy = xJet.spyOn(buf, 'writeUInt32LE');

        writeIntegerPipe.u32le(buf, 2, 999);
        expect(spy).toHaveBeenCalledWith(999, 2);
    });

    test('calls correct Buffer.writeInt32BE', () => {
        const buf = Buffer.alloc(4);
        const spy = xJet.spyOn(buf, 'writeInt32BE');

        writeIntegerPipe.i32be(buf, 0, -888);
        expect(spy).toHaveBeenCalledWith(-888, 0);
    });

    test('calls correct Buffer.writeBigUInt64LE', () => {
        const buf = Buffer.alloc(8);
        const spy = xJet.spyOn(buf, 'writeBigUInt64LE');

        writeIntegerPipe.u64le(buf, 0, 123n);
        expect(spy).toHaveBeenCalledWith(123n, 0);
    });

    test('calls correct Buffer.writeBigInt64BE', () => {
        const buf = Buffer.alloc(8);
        const spy = xJet.spyOn(buf, 'writeBigInt64BE');

        writeIntegerPipe.i64be(buf, 0, -123n);
        expect(spy).toHaveBeenCalledWith(-123n, 0);
    });
});

describe('writeFloatPipe', () => {
    test('calls correct Buffer.writeFloatLE', () => {
        const buf = Buffer.alloc(4);
        const spy = xJet.spyOn(buf, 'writeFloatLE');

        writeFloatPipe.f32le(buf, 0, 1.5);
        expect(spy).toHaveBeenCalledWith(1.5, 0);
    });

    test('calls correct Buffer.writeFloatBE', () => {
        const buf = Buffer.alloc(4);
        const spy = xJet.spyOn(buf, 'writeFloatBE');

        writeFloatPipe.f32be(buf, 0, -1.5);
        expect(spy).toHaveBeenCalledWith(-1.5, 0);
    });

    test('calls correct Buffer.writeDoubleLE', () => {
        const buf = Buffer.alloc(8);
        const spy = xJet.spyOn(buf, 'writeDoubleLE');

        writeFloatPipe.f64le(buf, 0, 3.1415);
        expect(spy).toHaveBeenCalledWith(3.1415, 0);
    });

    test('calls correct Buffer.writeDoubleBE', () => {
        const buf = Buffer.alloc(8);
        const spy = xJet.spyOn(buf, 'writeDoubleBE');

        writeFloatPipe.f64be(buf, 0, 3.1415);
        expect(spy).toHaveBeenCalledWith(3.1415, 0);
    });
});

test('isInteger detects integer pipe', () => {
    expect(isInteger('u32le')).toBe(true);
    expect(isInteger('f32le')).toBe(false);
});

test('isFloat detects float pipe', () => {
    expect(isFloat('f32le')).toBe(true);
    expect(isFloat('u32le')).toBe(false);
});
