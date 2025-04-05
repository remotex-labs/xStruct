/**
 * Imports
 */

import {
    readSingleStruct,
    readStruct,
    readStructArray,
    writeSingleStruct, writeStruct,
    writeStructArray
} from '@components/struct.component';
import { Struct } from '@services/struct.service';

/**
 * Tests
 */

describe('readSingleStruct', () => {
    // Mock for StructType and required interfaces
    const mockStructType = {
        toObject: jest.fn()
    };

    // Mock buffer and subarray function
    const mockBuffer = {
        subarray: jest.fn()
    };

    // Setup test context
    let context: any;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup a fresh context for each test
        context = {
            buffer: mockBuffer,
            offset: 10,
            descriptor: {
                position: 5,
                type: mockStructType
            }
        };

        // Setup default mock implementations
        mockBuffer.subarray.mockReturnValue(new Uint8Array([ 1, 2, 3 ]));
        mockStructType.toObject.mockImplementation((buffer, callback) => {
            callback(3); // Simulate offset update

            return { mockProperty: 'test-value' };
        });
    });

    test('should calculate absolute position correctly', () => {
        // Execute function
        readSingleStruct.call(context);

        // Check if subarray was called with correct position
        expect(mockBuffer.subarray).toHaveBeenCalledWith(15); // 10 (offset) + 5 (position) + 0 (default arrayOffset)
    });

    test('should accept and apply array offset parameter', () => {
        // Execute with specific array offset
        readSingleStruct.call(context, 20);

        // Check if subarray was called with correct position including array offset
        expect(mockBuffer.subarray).toHaveBeenCalledWith(35); // 10 (offset) + 5 (position) + 20 (arrayOffset)
    });

    test('should return the object from type.toObject', () => {
        // Execute function
        const result = readSingleStruct.call(context);

        // Check result
        expect(result).toEqual({ mockProperty: 'test-value' });
    });

    test('should update context offset via callback', () => {
        // Execute function
        readSingleStruct.call(context);

        // Check if offset was updated
        expect(context.offset).toBe(13); // 10 (initial offset) + 3 (from callback)
    });

    test('should pass buffer subarray to toObject method', () => {
        // Setup specific mock return
        const mockSubarray = new Uint8Array([ 5, 6, 7 ]);
        mockBuffer.subarray.mockReturnValue(mockSubarray);

        // Execute function
        readSingleStruct.call(context);

        // Check if toObject received the buffer subarray
        expect(mockStructType.toObject).toHaveBeenCalledWith(
            mockSubarray,
            expect.any(Function)
        );
    });
});

describe('readStructArray', () => {
    // Setup test data
    const mockStructObj1 = { id: 1, name: 'Item 1' };
    const mockStructObj2 = { id: 2, name: 'Item 2' };
    const mockStructObj3 = { id: 3, name: 'Item 3' };

    // Track calls to toObject to verify behavior
    let toObjectCalls: Array<unknown> = [];

    // Create a fake type.toObject implementation
    function fakeToObject(buffer: Buffer) {
        // Get the offset from the subarray which indicates where we are reading from
        const offset = buffer.byteOffset;
        toObjectCalls.push(offset);

        // Return different data based on offset
        if (offset === 10) return mockStructObj1;      // First struct (0 + 10 + 0)
        if (offset === 26) return mockStructObj2;      // Second struct (0 + 10 + 16)
        if (offset === 42) return mockStructObj3;      // Third struct (0 + 10 + 32)

        return null;
    }

    beforeEach(() => {
        // Reset tracking between tests
        toObjectCalls = [];
    });

    test('should update context offset when dynamic offsets are provided', () => {
        // Setup test context with tracking for dynamic offset calls
        const context: any = {
            buffer: Buffer.alloc(100),
            offset: 0,
            descriptor: {
                position: 10,
                type: {
                    toObject: (buffer: Buffer, getDynamicOffset: (offset: number) => void) => {
                        // Simulate a dynamic offset update
                        if (getDynamicOffset) {
                            getDynamicOffset(5);
                        }

                        return { dynamic: true };
                    }
                },
                arraySize: 2,
                size: 16
            }
        };

        readStructArray.call(context);

        // Verify that the offset has been updated correctly (2 calls × 5 offset each)
        expect(context.offset).toBe(10);
    });

    test('should handle empty array (arraySize = 0)', () => {
        const context: any = {
            buffer: new Uint8Array(100),
            offset: 0,
            descriptor: {
                position: 10,
                type: {},
                arraySize: 0,
                size: 16
            }
        };

        const result = readStructArray.call(context);
        expect(result).toEqual([]);
    });

    test('should use array size default value of 0 when not provided', () => {
        const context: any = {
            buffer: new Uint8Array(100),
            offset: 0,
            descriptor: {
                position: 10,
                type: {},
                size: 16
            }
        };

        const result = readStructArray.call(context);

        expect(result).toEqual([]);
    });
    test('should pre-allocate array with correct size even if fewer items are available', () => {
        const context: any = {
            buffer: Buffer.alloc(100),
            offset: 0,
            descriptor: {
                position: 10,
                type: {
                    toObject: fakeToObject
                },
                arraySize: 5,  // Requesting 5 items
                size: 16
            }
        };

        const result = readStructArray.call(context);

        // The array should have the correct pre-allocated length
        expect(result.length).toBe(5);

        // First three items should have our mock values
        expect(result[0]).toEqual(mockStructObj1);
        expect(result[1]).toEqual(mockStructObj2);
        expect(result[2]).toEqual(mockStructObj3);

        // The last two items should be null since our toObject returns null for those offsets
        expect(result[3]).toEqual(null);
        expect(result[4]).toEqual(null);

        // Verify all the expected absolute buffer positions were passed to toObject
        expect(toObjectCalls).toEqual([ 10, 26, 42, 58, 74 ]);
    });

});

describe('readStruct', () => {
    // Define test structures using proper primitive types from interface
    const PersonStruct = new Struct({
        id: 'UInt32LE',
        name: { type: 'string', size: 20 }
    });

    const AddressStruct = new Struct({
        street: { type: 'string', size: 30 },
        zipCode: 'UInt16LE'
    });

    // Test buffer with encoded data
    let buffer: Buffer;

    beforeEach(() => {
        // Create a test buffer - using Uint8Array as that's what the interface uses
        buffer = Buffer.alloc(256);

        // Simulate encoded data being present in the buffer
        // For the test, we'll assume the encoding has been correctly done
        // In a real app, this would be done using the Struct's encoding methods

        // Pretend we have valid binary data for our structures at these offsets
        // The actual values will be read by the readStruct functions
    });

    test('should read a single structure when arraySize is not present', () => {
        // Context for reading a single structure
        const context: any = {
            buffer,
            offset: 0,
            descriptor: {
                position: 10,
                type: PersonStruct
            }
        };

        // Mock the readSingleStruct behavior for this test case
        PersonStruct.toObject = jest.fn().mockReturnValue({
            id: 42,
            name: 'John Doe'
        });

        const result = readStruct.call(context);

        // It should return a single struct object
        expect(result).toEqual({
            id: 42,
            name: 'John Doe'
        });

        // Verify the correct type's toObject was called
        expect(PersonStruct.toObject).toHaveBeenCalled();
    });

    test('should read an array of structures when arraySize is present', () => {
        // Context for reading an array of structures
        const context: any = {
            buffer,
            offset: 0,
            descriptor: {
                position: 50,
                type: PersonStruct,
                arraySize: 3,
                size: 28 // Assuming id (4 bytes) + name (20 bytes) + padding/alignment
            }
        };

        // Setup the mock to return different values for each array element
        let callCount = 0;
        PersonStruct.toObject = jest.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) return { id: 101, name: 'Alice' };
            if (callCount === 2) return { id: 102, name: 'Bob' };
            if (callCount === 3) return { id: 103, name: 'Charlie' };

            return {};
        });

        const result = <Array<unknown>> readStruct.call(context);

        // It should return an array of struct objects
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(3);

        // The array should contain the expected objects
        expect(result[0]).toEqual({ id: 101, name: 'Alice' });
        expect(result[1]).toEqual({ id: 102, name: 'Bob' });
        expect(result[2]).toEqual({ id: 103, name: 'Charlie' });

        // Verify toObject was called 3 times
        expect(PersonStruct.toObject).toHaveBeenCalledTimes(3);
    });

    test('should handle zero arraySize properly', () => {
        const context: any = {
            buffer,
            offset: 0,
            descriptor: {
                position: 50,
                type: PersonStruct,
                arraySize: 0, // Zero array size
                size: 28
            }
        };

        const result = readStruct.call(context);

        // It should return an empty array
        expect(Array.isArray(result)).toBe(false);
        expect(result).toEqual({});
    });

    test('should handle nested structures', () => {
        // Create a more complex structure with nested objects
        const UserStruct = new Struct({
            id: 'UInt32LE',
            name: { type: 'string', size: 20 },
            address: { type: AddressStruct }
        });

        // Mock the nested structure behavior
        UserStruct.toObject = jest.fn().mockReturnValue({
            id: 123,
            name: 'Jane Smith',
            address: {
                street: '123 Main St',
                zipCode: 12345
            }
        });

        // Context for reading the nested structure
        const context: any = {
            buffer,
            offset: 0,
            descriptor: {
                position: 100,
                type: UserStruct
            }
        };

        const result = readStruct.call(context);

        // The structure should be properly deserialized with nested objects
        expect(result).toEqual({
            id: 123,
            name: 'Jane Smith',
            address: {
                street: '123 Main St',
                zipCode: 12345
            }
        });

        // Verify the correct struct's toObject was called
        expect(UserStruct.toObject).toHaveBeenCalled();
    });
});

describe('writeSingleStruct', () => {
    // Mock Struct constructor
    class MockStruct {
        size: number;
        definition: any;

        constructor(definition: any, size: number) {
            this.definition = definition;
            this.size = size;
        }

        toBuffer(): Buffer {
            // Creates a buffer of the size needed for the structure
            // For testing, we'll create buffers of specific sizes to test different scenarios
            return Buffer.alloc(this.size).fill(0x55); // Fill with a recognizable pattern
        }
    }

    test('should write structure with exact expected size', () => {
        // Create a struct that produces exactly the expected size buffer
        const personStruct = new MockStruct({
            id: 'UInt32LE',
            name: { type: 'string', size: 16 }
        }, 20); // 20 byte struct

        // Initial buffer with some content
        const initialBuffer = Buffer.alloc(50).fill(0x44);

        // Setup context
        const context: any = {
            buffer: initialBuffer,
            offset: 0,
            descriptor: {
                position: 10,
                type: personStruct,
                size: 20 // Expected size matches the struct's actual size
            }
        };

        // Object to write
        const person = { id: 42, name: 'Alice' };

        // Call the function
        writeSingleStruct.call(context, person);

        // Verify the buffer has the expected length (unchanged since exact fit)
        expect(context.buffer.length).toBe(50);

        // Verify offset is unchanged (no adjustment needed)
        expect(context.offset).toBe(0);

        // Verify structure was written at the correct position
        // First 10 bytes should be original pattern
        expect(context.buffer.subarray(0, 10).every((byte: number) => byte === 0x44)).toBe(true);

        // Next 20 bytes should be our struct pattern
        expect(context.buffer.subarray(10, 30).every((byte: number) => byte === 0x55)).toBe(true);

        // Rest should be original pattern
        expect(context.buffer.subarray(30).every((byte: number) => byte === 0x44)).toBe(true);
    });

    test('should adjust offset when writing structure larger than expected size', () => {
        // Create a struct that produces a buffer larger than expected
        const flexStruct = new MockStruct({
            id: 'UInt32LE',
            name: { type: 'string', size: 'dynamic' } // Imagine this is a dynamic size field
        }, 30); // 30 byte struct (10 bytes larger than expected)

        // Initial buffer with some content
        const initialBuffer = Buffer.alloc(50).fill(0x44);

        // Setup context
        const context: any = {
            buffer: initialBuffer,
            offset: 0,
            descriptor: {
                position: 10,
                type: flexStruct,
                size: 20 // Expected size is smaller than the struct's actual size (30)
            }
        };

        // Object to write that will exceed the expected size
        const data = { id: 123, name: 'This is a long name that needs more space' };

        // Call the function
        writeSingleStruct.call(context, data);

        // Verify the buffer has expanded to accommodate the larger structure
        expect(context.buffer.length).toBe(60); // 50 + (30-20) = 60

        // Verify offset was adjusted by the difference in size
        expect(context.offset).toBe(10); // 30 - 20 = 10

        // Verify structure was written at the correct position
        // First 10 bytes should be original pattern
        expect(context.buffer.slice(0, 10).every((byte: number) => byte === 0x44)).toBe(true);

        // Next 30 bytes should be our struct pattern
        expect(context.buffer.slice(10, 40).every((byte: number) => byte === 0x55)).toBe(true);

        // Rest should be original pattern
        expect(context.buffer.slice(40).every((byte: number) => byte === 0x44)).toBe(true);
    });

    test('should handle null or undefined input values', () => {
        // Create a struct
        const personStruct = new MockStruct({
            id: 'UInt32LE',
            name: { type: 'string', size: 16 }
        }, 20);

        // Initial buffer
        const initialBuffer = Buffer.alloc(50).fill(0x44);

        // Setup context
        const context: any = {
            buffer: initialBuffer,
            offset: 0,
            descriptor: {
                position: 10,
                type: personStruct,
                size: 20
            }
        };

        // Call with undefined value
        writeSingleStruct.call(context, <any> undefined);

        // Verify it used an empty object instead of crashing
        expect(context.buffer.length).toBe(50);
        expect(context.buffer.slice(10, 30).every((byte: number) => byte === 0x55)).toBe(true);

        // Reset for null test
        context.buffer = Buffer.alloc(50).fill(0x44);

        // Call with null value
        writeSingleStruct.call(context, <any> null);

        // Verify it used an empty object instead of crashing
        expect(context.buffer.length).toBe(50);
        expect(context.buffer.slice(10, 30).every((byte: number) => byte === 0x55)).toBe(true);
    });

    test('should write to correct position with arrayOffset parameter', () => {
        // Create a struct
        const itemStruct = new MockStruct({
            value: 'UInt32LE'
        }, 4);

        // Initial buffer
        const initialBuffer = Buffer.alloc(50).fill(0x44);

        // Setup context
        const context: any = {
            buffer: initialBuffer,
            offset: 0,
            descriptor: {
                position: 10,
                type: itemStruct,
                size: 4
            }
        };

        // Write first item at base position
        writeSingleStruct.call(context, { value: 1 }, 0);

        // Write second item at offset 4
        writeSingleStruct.call(context, { value: 2 }, 4);

        // Write third item at offset 8
        writeSingleStruct.call(context, { value: 3 }, 8);

        // Verify the buffer contains all three items at their correct positions
        // First 10 bytes should be original pattern
        expect(context.buffer.slice(0, 10).every((byte: number) => byte === 0x44)).toBe(true);

        // Next 12 bytes should contain our three structs
        expect(context.buffer.slice(10, 14).every((byte: number) => byte === 0x55)).toBe(true); // First item
        expect(context.buffer.slice(14, 18).every((byte: number) => byte === 0x55)).toBe(true); // Second item
        expect(context.buffer.slice(18, 22).every((byte: number) => byte === 0x55)).toBe(true); // Third item

        // Rest should be original pattern
        expect(context.buffer.slice(22).every((byte: number) => byte === 0x44)).toBe(true);
    });
});

describe('writeStructArray', () => {
    test('should write multiple structures to the buffer at proper offsets', () => {
        // Create a simple struct type with a toBuffer method
        class TestStruct {
            static toBuffer(value: any): Buffer {
                // Create a simple buffer containing a number value
                const buffer = Buffer.alloc(4);
                buffer.writeInt32LE(value.value || 0, 0);

                return buffer;
            }
        }

        // Create the context object
        const context: any = {
            buffer: Buffer.alloc(20).fill(0), // Initialize with zeros
            offset: 0,
            descriptor: {
                position: 4, // Start position in buffer
                type: TestStruct,
                arraySize: 3,
                size: 4 // Each struct is 4 bytes
            }
        };

        // Create test data - array of structures
        const structArray = [
            { value: 101 },
            { value: 202 },
            { value: 303 }
        ];

        // Call the function being tested
        writeStructArray.call(context, structArray);

        // Verify that values were written at the correct positions
        // Position = base position (4) + (index * size)
        expect(context.buffer.readInt32LE(4)).toBe(101); // First struct at position 4
        expect(context.buffer.readInt32LE(8)).toBe(202); // Second struct at position 8
        expect(context.buffer.readInt32LE(12)).toBe(303); // Third struct at position 12
    });

    test('should handle arrays with fewer elements than arraySize', () => {
        // Create a simple struct type with a toBuffer method
        class TestStruct {
            static toBuffer(value: any): Buffer {
                // Create a simple buffer containing a number value
                const buffer = Buffer.alloc(4);
                buffer.writeInt32LE(value.value || 0, 0);

                return buffer;
            }
        }

        // Create the context object
        const context: any = {
            buffer: Buffer.alloc(20).fill(0), // Initialize with zeros
            offset: 0,
            descriptor: {
                position: 0,
                type: TestStruct,
                arraySize: 4,
                size: 4
            }
        };

        // Create test data with fewer elements than arraySize
        const structArray = [
            { value: 111 },
            { value: 222 }
        ];

        // Call the function being tested
        writeStructArray.call(context, structArray);

        // Verify that provided values were written correctly
        expect(context.buffer.readInt32LE(0)).toBe(111);
        expect(context.buffer.readInt32LE(4)).toBe(222);

        // Verify that missing values were handled as empty objects (resulting in 0)
        expect(context.buffer.readInt32LE(8)).toBe(0);
        expect(context.buffer.readInt32LE(12)).toBe(0);
    });

    test('should handle empty input array', () => {
        // Create a simple struct type with a toBuffer method
        class TestStruct {
            static toBuffer(value: any): Buffer {
                const buffer = Buffer.alloc(4);
                buffer.writeInt32LE(value.value || 0, 0);

                return buffer;
            }
        }

        // Create the context object
        const context: any = {
            buffer: Buffer.alloc(16).fill(0xFF), // Initialize with 0xFF
            offset: 0,
            descriptor: {
                position: 0,
                type: TestStruct,
                arraySize: 3,
                size: 4
            }
        };

        // Call with empty array
        writeStructArray.call(context, []);

        // All positions should be written with empty objects (resulting in 0)
        expect(context.buffer.readInt32LE(0)).toBe(0);
        expect(context.buffer.readInt32LE(4)).toBe(0);
        expect(context.buffer.readInt32LE(8)).toBe(0);
    });
});

describe('writeStruct', () => {
    test('should call writeStructArray when descriptor has arraySize', () => {
        const context: any = {
            buffer: Buffer.alloc(20),
            offset: 0,
            descriptor: {
                position: 0,
                type: {
                    toBuffer(value: any): Buffer {
                        const buffer = Buffer.alloc(4);
                        buffer.writeInt32LE(value.value || 0, 0);

                        return buffer;
                    }
                },
                arraySize: 3,
                size: 4
            }
        };

        // Test data
        const structData = [
            { value: 101 },
            { value: 202 },
            { value: 303 }
        ];

        // Call the function
        writeStruct.call(context, structData);

        // Verify data was written correctly (as if writeStructArray was called)
        expect(context.buffer.readInt32LE(0)).toBe(101);
        expect(context.buffer.readInt32LE(4)).toBe(202);
        expect(context.buffer.readInt32LE(8)).toBe(303);
    });

    test('should wrap non-array value in array when descriptor has arraySize', () => {
        const context: any = {
            buffer: Buffer.alloc(20),
            offset: 0,
            descriptor: {
                position: 0,
                type: {
                    toBuffer(value: any): Buffer {
                        const buffer = Buffer.alloc(4);
                        buffer.writeInt32LE(value.value || 0, 0);

                        return buffer;
                    }
                },
                arraySize: 3,
                size: 4
            }
        };

        // Test with single object (not an array)
        const singleStruct = { value: 505 };

        // Call the function
        writeStruct.call(context, singleStruct);

        // Verify first element was written, rest are empty
        expect(context.buffer.readInt32LE(0)).toBe(505);
        expect(context.buffer.readInt32LE(4)).toBe(0);
        expect(context.buffer.readInt32LE(8)).toBe(0);
    });

    test('should call writeSingleStruct when descriptor has no arraySize', () => {
        const context: any = {
            buffer: Buffer.alloc(12),
            offset: 0,
            descriptor: {
                position: 4,
                type: {
                    toBuffer(value: any): Buffer {
                        const buffer = Buffer.alloc(4);
                        buffer.writeInt32LE(value.value || 0, 0);

                        return buffer;
                    }
                },
                size: 4
            }
        };

        // Test data (single object)
        const singleStruct = { value: 777 };

        // Call the function
        writeStruct.call(context, singleStruct);

        // Verify data was written at the right position (as if writeSingleStruct was called)
        expect(context.buffer.readInt32LE(4)).toBe(777);
    });

    test('should use first array element when descriptor has no arraySize but value is array', () => {
        const context: any = {
            buffer:  Buffer.alloc(12),
            offset: 0,
            descriptor: {
                position: 4,
                type: {
                    toBuffer(value: any): Buffer {
                        const buffer = Buffer.alloc(4);
                        buffer.writeInt32LE(value.value || 0, 0);

                        return buffer;
                    }
                },
                size: 4
            }
        };

        // Test with array (should use first element)
        const structArray = [
            { value: 111 },
            { value: 222 }
        ];

        // Call the function
        writeStruct.call(context, structArray);
        expect(context.buffer.readInt32LE(4)).toBe(111);
    });

    test('should handle empty array with no arraySize by using empty string', () => {
        const context: any = {
            buffer: Buffer.alloc(12).fill(0xFF),
            offset: 0,
            descriptor: {
                position: 4,
                type: {
                    toBuffer(value: any): Buffer {
                        // Return empty buffer for empty string
                        if (value === '') {
                            return Buffer.alloc(4);
                        }

                        const buffer = Buffer.alloc(4);
                        buffer.writeInt32LE(value.value || 0, 0);

                        return buffer;
                    }
                },
                size: 4
            }
        };

        writeStruct.call(context, []);
        expect(context.buffer.readInt32LE(4)).toBe(0);
    });
});
