import { BitfieldStruct } from "./bitfield.struct";
import { FieldMapInterface, FieldValuesInterface } from "./bitfield.interface";

describe('BitfieldStruct', () => {
    let bitField: BitfieldStruct;

    beforeEach(() => {
        bitField = new BitfieldStruct(2);
    });

    describe('setBit', () => {
        test('should set a bit to true', () => {
            bitField.setBit(0, true);

            expect(Array.from(bitField.getData())).toEqual([1, 0]);
        });

        test('should set a bit to false', () => {
            bitField.setBit(1, true);
            bitField.setBit(1, false);

            expect(Array.from(bitField.getData())).toEqual([0, 0]);
        });

        test('should set multiple bits to true', () => {
            bitField.setBit(0, true);
            bitField.setBit(7, true);
            bitField.setBit(8, true);
            bitField.setBit(15, true);

            expect(Array.from(bitField.getData())).toEqual([129, 129]);
        });

        test('should set multiple bits to false', () => {
            bitField.setBit(0, true);
            bitField.setBit(7, false);
            bitField.setBit(8, false);
            bitField.setBit(15, false);

            expect(Array.from(bitField.getData())).toEqual([1, 0]);
        });

        test('should not modify other bits when setting a bit', () => {
            bitField.setBit(5, true);
            bitField.setBit(3, true);

            expect(Array.from(bitField.getData())).toEqual([40, 0]);
        });

        test('setting the same bit multiple times should be idempotent', () => {
            bitField.setBit(2, true);
            bitField.setBit(2, true);

            expect(Array.from(bitField.getData())).toEqual([4, 0]);
        });

        test('setting out-of-bounds position should throw an exception', () => {
            const outOfBoundsSetter = () => bitField.setBit(20, true);

            expect(outOfBoundsSetter).toThrow('Bit position is out of bounds');
            expect(Array.from(bitField.getData())).toEqual([0, 0]);
        });

        test('getting bit at an in-bounds position should return the correct value', () => {
            bitField.setBit(3, true);

            expect(bitField.getBit(3)).toBe(true);
        });
    });

    describe('packValue', () => {
        test('should pack value correctly at a specific position', () => {
            bitField.setData(new Uint8Array([0, 0]));
            bitField.packValue(0, 3, 7);

            expect(bitField.getData()).toEqual(new Uint8Array([7, 0]));
        });

        test('should pack value correctly', () => {
            bitField.setData(new Uint8Array([0, 0]));
            bitField.packValue(0, 4, 5);

            expect(bitField.getData()).toEqual(new Uint8Array([5, 0]));
        });

        test('should pack value correctly at a specific position', () => {
            bitField.setData(new Uint8Array([0, 0]));
            bitField.packValue(0, 3, 7);

            expect(bitField.getData()).toEqual(new Uint8Array([7, 0]));
        });

        test('should throw an error for out-of-bounds position', () => {
            bitField.setData(new Uint8Array([0, 0]));

            expect(() => bitField.packValue(17, 4, 3)).toThrowError('Bit position is out of bounds');
        });

        test('should pack value without modifying other bits', () => {
            bitField.setData(new Uint8Array([40, 0]));
            bitField.packValue(3, 3, 5);

            expect(Array.from(bitField.getData())).toEqual([40, 0]);
        });

        test('should throw an error for an out-of-bounds position during packing', () => {
            expect(() => bitField.packValue(20, 1, 1)).toThrow('Bit position is out of bounds');
        });

        test('should pack value correctly', () => {
            bitField.setData(new Uint8Array([0, 0]));
            bitField.packValue(0, 4, 5);

            expect(bitField.getData()).toEqual(new Uint8Array([0, 5]));
        });
    });

    describe('unpackFieldsWithPosition', () => {
        test('should unpack fields correctly', () => {
            const fieldMap = {
                QR: { position: 0, size: 1 },
                Opcode: { position: 1, size: 4 },
                AA: { position: 5, size: 1 },
                TC: { position: 6, size: 1 },
                RD: { position: 7, size: 1 },
                RA: { position: 8, size: 1 },
                Z: { position: 9, size: 3 },
                RCODE: { position: 12, size: 4 },
            };

            bitField.setData(new Uint8Array([165, 52]));
            const unpackedValues = bitField.unpackFieldsWithPosition(fieldMap);

            expect(unpackedValues).toEqual({
                QR: 1,
                Opcode: 4,
                AA: 1,
                TC: 0,
                RD: 1,
                RA: 0,
                Z: 2,
                RCODE: 12,
            });
        });

        test('should unpack fields with varying sizes correctly', () => {
            const fieldMap = {
                Field1: { position: 0, size: 2 },
                Field2: { position: 2, size: 3 },
                Field3: { position: 5, size: 4 },
            };

            // Set binary data [102, 46] 0b01100110 0b00101110
            bitField.setData(new Uint8Array([102, 46]));

            const unpackedValues = bitField.unpackFieldsWithPosition(fieldMap);

            // Expected result: { Field1: 2, Field2: 5, Field3: 11 }
            expect(unpackedValues).toEqual({
                Field1: 1,
                Field2: 4,
                Field3: 12,
            });
        });

        test('should unpack fields with overlapping positions correctly', () => {
            const fieldMap = {
                Field1: { position: 0, size: 3 },
                Field2: { position: 3, size: 4 },
                Field3: { position: 7, size: 3 },
            };

            // Set binary data [57, 88] 0b11100100 0b10110000
            bitField.setData(new Uint8Array([57, 88]));

            const unpackedValues = bitField.unpackFieldsWithPosition(fieldMap);

            // Expected result: { Field1: 3, Field2: 10, Field3: 5 }
            expect(unpackedValues).toEqual({
                Field1: 7,
                Field2: 12,
                Field3: 5,
            });
        });
    });

    describe('unpackValue', () => {
        test('should unpack value correctly', () => {
            bitField.setData(new Uint8Array([165, 52]));
            const unpackedValue = bitField.unpackValue(0, 4);

            expect(unpackedValue).toBe(10);
        });

        test('should unpack value with size equal to bit field size', () => {
            // Set binary data [255, 255] 0b11111111 0b11111111
            bitField.setData(new Uint8Array([255, 255]));
            const unpackedValue = bitField.unpackValue(0, 16);

            // Expected result: 65535 (binary 1111111111111111)
            expect(unpackedValue).toBe(65535);
        });

        test('should unpack value with correctly', () => {
            // Set binary data [9, 56] 0b0001001 0b00111000
            bitField.setData(new Uint8Array([9, 56]));
            const unpackedValue = bitField.unpackValue(0, 8 * 2);

            // Expected result: 14345 (binary 0b11100000 0b00001001)
            expect(unpackedValue).toBe(14345);
        });

        test('should throw an error for an out-of-bounds position during unpacking', () => {
            // Expect an error to be thrown
            expect(() => bitField.unpackValue(20, 1)).toThrow('Bit position is out of bounds');
        });
    });
});