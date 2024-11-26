// const MyStruct = new Struct({
//     QR: 'uint:1',  // 1-bit unsigned integer
//     Opcode: 'uint:2',  // 2-bit unsigned integer
//     AA: 'uint:1',  // 1-bit unsigned integer
//     TC: 'uint:1',  // 1-bit unsigned integer
//     RD: 'uint:1',  // 1-bit unsigned integer
//     RA: 'uint:1',  // 1-bit unsigned integer
//     Z: { type: 'int', position: 10, size: 2 },  // 2 bits signed integer
//     RCODE: { type: 'int', position: 12, size: 3 },  // 3 bits signed integer
//     id: 'int64LE',  // 8 bytes, little-endian
//     name: { type: 'string', size: 10 },  // Fixed-length string (10 bytes)
//     balance: 'uint64LE',  // 8 bytes, big-endian
//     status: 'int8'  // 1 byte, signed
// });
//
// // Convert to buffer
// const buffer = MyStruct.toBuffer({
//     name: 'Alice',
//     balance: 9007199254740991n, // BigInt for uint64
//     id: 12345,
//     status: -42
// });
//
// // Convert back from buffer
// const object = MyStruct.fromBuffer(buffer);


import type { StructSchemaInterface } from '@services/interfaces/struct.interface';
import { Struct } from '@services/struct.service';

const x: StructSchemaInterface = {
    name: { type: 'string', size: 10 },
    TA: 'uint:3',
    T2: 'uint:5'
};


const u = new Struct(x);
console.log(u.size);
// u.toBuffer({
//
// });
