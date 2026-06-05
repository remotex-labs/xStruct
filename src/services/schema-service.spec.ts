/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { DescriptorType } from '@interfaces/descriptor.interface';
import type { HeapRuntimeInterface } from '@interfaces/heap.interface';
import type { ContextInterface } from '@services/interfaces/schema-service.interface';

/**
 * Imports
 */

import { Struct } from '@services/struct.service';
import { schemaParse } from '@services/schema.service';
import { DescriptorKind } from '@constants/descriptor.constant';

/**
 * Helpers
 */

const heap = { read: () => Buffer.alloc(0), write: () => 0 } as unknown as HeapRuntimeInterface;
const context = (buffer: Buffer): ContextInterface => ({ buffer, offset: 0, heap });

/**
 * Tests
 */

describe('schemaParse', () => {
    describe('pointer size', () => {
        test('defaults to 4 when omitted', () => {
            expect(schemaParse({}).pointerSize).toBe(4);
        });

        test('keeps a supported pointer size', () => {
            expect(schemaParse({}, 8).pointerSize).toBe(8);
            expect(schemaParse({}, 1).pointerSize).toBe(1);
        });

        test('falls back to 4 for an unsupported pointer size', () => {
            expect(schemaParse({}, 3 as never).pointerSize).toBe(4);
            expect(schemaParse({}, 0 as never).pointerSize).toBe(4);
        });

        test('returns an empty layout for an empty schema', () => {
            const { size, fields } = schemaParse({});

            expect(size).toBe(0);
            expect(fields.size).toBe(0);
        });
    });

    describe('primitive fields', () => {
        test('lays out a single scalar at offset 0', () => {
            const { size, fields } = schemaParse({ a: 'u8' });
            const item = fields.get('a')!;

            expect(size).toBe(1);
            expect(item.position).toBe(0);

            const buffer = Buffer.alloc(size);
            item.write(context(buffer), 200, item.position);

            expect(item.read(context(buffer), item.position)).toBe(200);
        });

        test('accumulates offsets across multiple fields', () => {
            const { size, fields } = schemaParse({ a: 'u8', b: 'u32le', c: 'u8' });

            expect(size).toBe(6);
            expect(fields.get('a')!.position).toBe(0);
            expect(fields.get('b')!.position).toBe(1);
            expect(fields.get('c')!.position).toBe(5);
        });

        test('round-trips a 64-bit field as bigint', () => {
            const item = schemaParse({ a: 'u64le' }).fields.get('a')!;
            const buffer = Buffer.alloc(8);

            item.write(context(buffer), 0xABCDn, item.position);

            expect(item.read(context(buffer), item.position)).toBe(0xABCDn);
        });

        test('round-trips a float field', () => {
            const item = schemaParse({ a: 'f32le' }).fields.get('a')!;
            const buffer = Buffer.alloc(4);

            item.write(context(buffer), 1.5, item.position);

            expect(item.read(context(buffer), item.position)).toBe(1.5);
        });

        test('round-trips a fixed array', () => {
            const { size, fields } = schemaParse({ a: 'u8[3]' });
            const item = fields.get('a')!;

            expect(size).toBe(3);

            const buffer = Buffer.alloc(size);
            item.write(context(buffer), [ 1, 2, 3 ], item.position);

            expect(item.read(context(buffer), item.position)).toEqual([ 1, 2, 3 ]);
        });

        test('reserves a pointer-sized slot for a pointer primitive', () => {
            expect(schemaParse({ a: '*u32le' }, 8).size).toBe(8);
            expect(schemaParse({ a: '*u32le' }, 4).size).toBe(4);
        });
    });

    describe('string fields', () => {
        test('sizes a fixed string by its byte capacity', () => {
            expect(schemaParse({ s: 'utf8[10]' }).size).toBe(10);
        });

        test('sizes a pointer string as one pointer slot', () => {
            expect(schemaParse({ s: '*utf8' }, 8).size).toBe(8);
        });
    });

    describe('bitfields', () => {
        test('packs adjacent bitfields into one container', () => {
            const { size, fields } = schemaParse({ a: 'u8:3', b: 'u8:5' });

            expect(size).toBe(1);
            expect(fields.get('a')!.position).toBe(0);
            expect(fields.get('b')!.position).toBe(0);

            const buffer = Buffer.alloc(size);
            fields.get('a')!.write(context(buffer), 5, 0);
            fields.get('b')!.write(context(buffer), 20, 0);

            expect(fields.get('a')!.read(context(buffer), 0)).toBe(5);
            expect(fields.get('b')!.read(context(buffer), 0)).toBe(20);
        });

        test('opens a new container when the current one overflows', () => {
            const { size, fields } = schemaParse({ a: 'u8:6', b: 'u8:4' });

            expect(size).toBe(2);
            expect(fields.get('a')!.position).toBe(0);
            expect(fields.get('b')!.position).toBe(1);
        });

        test('opens a new container when the integer type changes', () => {
            const { size, fields } = schemaParse({ a: 'u8:4', b: 'u16le:4' });

            expect(size).toBe(3);
            expect(fields.get('a')!.position).toBe(0);
            expect(fields.get('b')!.position).toBe(1);
        });

        test('flushes the active container before a non-bitfield field', () => {
            const { size, fields } = schemaParse({ a: 'u8:4', b: 'u32le' });

            expect(size).toBe(5);
            expect(fields.get('b')!.position).toBe(1);
        });

        test('sign-extends a signed bitfield', () => {
            const item = schemaParse({ a: 'i8:4' }).fields.get('a')!;
            const buffer = Buffer.alloc(1);

            item.write(context(buffer), -2, 0);

            expect(item.read(context(buffer), 0)).toBe(-2);
        });

        test('masks an unsigned bitfield to its width', () => {
            const item = schemaParse({ a: 'u8:4' }).fields.get('a')!;
            const buffer = Buffer.alloc(1);

            item.write(context(buffer), 0xFF, 0);

            expect(item.read(context(buffer), 0)).toBe(0xF);
        });

        test('throws for a 64-bit bitfield container', () => {
            expect(() => schemaParse({ a: 'u64le:8' })).toThrow();
        });

        test('throws when the bit width exceeds the container', () => {
            expect(() => schemaParse({ a: 'u8:9' })).toThrow();
        });

        test('throws for a non-positive bit width', () => {
            expect(() => schemaParse({ a: { kind: DescriptorKind.Bitfield, type: 'u8', bitSize: 0 } })).toThrow();
        });
    });

    describe('union mode', () => {
        test('overlaps fields at offset 0 and sizes to the widest', () => {
            const { size, fields } = schemaParse({ a: 'u8', b: 'u32le' }, 4, true);

            expect(size).toBe(4);
            expect(fields.get('a')!.position).toBe(0);
            expect(fields.get('b')!.position).toBe(0);
        });
    });

    describe('descriptor inputs', () => {
        test('accepts a raw descriptor object', () => {
            const descriptor: DescriptorType = { kind: DescriptorKind.Primitive, type: 'u16le', shape: [] };
            const { size, fields } = schemaParse({ a: descriptor });

            expect(size).toBe(2);
            expect(fields.has('a')).toBe(true);
        });

        test('wraps a nested struct and sizes it', () => {
            const child = new Struct({ a: 'u8', b: 'u8' });
            const { size, fields } = schemaParse({ child });

            expect(size).toBe(child.size);
            expect(fields.has('child')).toBe(true);
        });

        test('throws for an unknown primitive type', () => {
            const descriptor = { kind: DescriptorKind.Primitive, type: 'nope', shape: [] } as unknown as DescriptorType;

            expect(() => schemaParse({ a: descriptor })).toThrow();
        });
    });
});
