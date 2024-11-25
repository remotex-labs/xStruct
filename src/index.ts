/**
 * const { Struct } = require('buffer-struct');
 *
 * // Define a schema
 * const MyStruct = new Struct({
 *   id: ['uint32', 'LE'],   // 4 bytes, little-endian
 *   name: ['string', 10],   // Fixed-length string (10 bytes)
 *   balance: ['uint64', 'BE'], // 8 bytes, big-endian
 *   status: 'int8',         // 1 byte, signed
 * });
 *
 * // Serialize an object into a buffer
 * const buffer = MyStruct.toBuffer({
 *   id: 12345,
 *   name: 'Alice',
 *   balance: 9007199254740991n, // BigInt for uint64
 *   status: -42,
 * });
 *
 * // Deserialize the buffer back into an object
 * const object = MyStruct.fromBuffer(buffer);
 * console.log(object);
 * // Output: { id: 12345, name: 'Alice', balance: 9007199254740991n, status: -42 }
 */
