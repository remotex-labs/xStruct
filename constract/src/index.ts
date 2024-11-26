import { BitfieldStruct } from "./struct/bitfield.struct";
import { FieldMapInterface, FieldValuesInterface } from "./struct/bitfield.interface";

const bitField = new BitfieldStruct(2);

const fieldMap: FieldMapInterface = {
    QR: { position: 0, size: 15 },
};

const values: FieldValuesInterface = {
    QR: 14345,
};

bitField.packFields(fieldMap, values);
console.log("Packed Data:", bitField.getData());

// No need to set data to itself
// bitField.setData(bitField.getData());

const unpackedValues = bitField.unpackFields(fieldMap);
console.log("Unpacked Values:", unpackedValues);
