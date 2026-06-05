/**
 * Type-only imports erased during TypeScript compilation.
 */

import type { HeapRuntimeInterface } from '@interfaces/heap.interface';
import type { HeapContextInterface } from '@services/interfaces/heap-service.interface';

/**
 * Imports
 */

import { Struct } from '@services/struct.service';
import { heapRead, heapWrite } from '@services/heap.service';

/**
 * Builds a standalone heap backed by a fresh context, mirroring what a caller would
 * pass as `options.heap`.
 */

function createHeap(): { heap: HeapRuntimeInterface; ctx: HeapContextInterface } {
    const ctx: HeapContextInterface = { top: 0, buffer: Buffer.allocUnsafe(0) };

    return { ctx, heap: { read: heapRead.bind(ctx), write: heapWrite.bind(ctx) } };
}

/**
 * Tests
 */

describe('Struct', () => {
    describe('validation', () => {
        test('toObject rejects a non-buffer input', () => {
            const struct = new Struct({ a: 'u8' });

            expect(() => struct.toObject('nope' as never)).toThrow();
        });

        test('toObject rejects a buffer smaller than the struct size', () => {
            const struct = new Struct({ a: 'u32le' });

            expect(() => struct.toObject(Buffer.alloc(struct.size - 1))).toThrow();
        });

        test('toBuffer rejects a non-object input', () => {
            const struct = new Struct({ a: 'u8' });

            expect(() => struct.toBuffer(null as never)).toThrow();
            expect(() => struct.toBuffer(5 as never)).toThrow();
        });
    });

    describe('round-trips', () => {
        test('an empty struct', () => {
            const struct = new Struct({});
            const buffer = struct.toBuffer({});

            expect(struct.size).toBe(0);
            expect(buffer.byteLength).toBe(0);
            expect(struct.toObject(buffer)).toEqual({});
        });

        test('multiple primitive fields', () => {
            const struct = new Struct<{ a: number; b: number; c: bigint }>({ a: 'u8', b: 'i32le', c: 'u64le' });
            const data = { a: 7, b: -5, c: 99n };

            expect(struct.toObject(struct.toBuffer(data))).toEqual(data);
        });

        test('a fixed primitive array', () => {
            const struct = new Struct<{ xs: number[] }>({ xs: 'u16le[3]' });
            const data = { xs: [ 1, 2, 3 ] };

            expect(struct.toObject(struct.toBuffer(data))).toEqual(data);
        });

        test('a pointer string', () => {
            const struct = new Struct<{ name: string }>({ name: '*utf8' });

            expect(struct.toObject(struct.toBuffer({ name: 'hello' })).name).toBe('hello');
        });

        test('a multi-byte pointer string is sized by encoded byte length, not code units', () => {
            const utf8 = new Struct<{ t: string }>({ t: '*utf8' });
            const utf16 = new Struct<{ t: string }>({ t: '*utf16le' });

            expect(utf8.toObject(utf8.toBuffer({ t: 'café' })).t).toBe('café');
            expect(utf8.toObject(utf8.toBuffer({ t: 'a😀b' })).t).toBe('a😀b');
            expect(utf16.toObject(utf16.toBuffer({ t: 'héllo' })).t).toBe('héllo');
        });

        test('an array of multi-byte pointer strings round-trips each element', () => {
            const struct = new Struct<{ tags: string[] }>({ tags: '*utf8[3]' });
            const data = { tags: [ 'café', 'αβγ', 'x' ] };

            expect(struct.toObject(struct.toBuffer(data))).toEqual(data);
        });

        test('a pointer to a single primitive returns the scalar, not a one-element array', () => {
            const u8 = new Struct<{ n: number }>({ n: '*u8' }, { pointerSize: 8 });
            const u32 = new Struct<{ n: number }>({ n: '*u32le' });

            expect(u8.toObject(u8.toBuffer({ n: 255 })).n).toBe(255);
            expect(u32.toObject(u32.toBuffer({ n: 42 })).n).toBe(42);
        });

        test('a pointer to multiple primitives still returns an array', () => {
            const struct = new Struct<{ ns: number[] }>({ ns: '*u32le' });
            const data = { ns: [ 1, 2, 3 ] };

            expect(struct.toObject(struct.toBuffer(data))).toEqual(data);
        });

        test('a fixed string filled exactly', () => {
            const struct = new Struct<{ tag: string }>({ tag: 'utf8[4]' });

            expect(struct.toObject(struct.toBuffer({ tag: 'ABCD' })).tag).toBe('ABCD');
        });

        test('a fixed string array', () => {
            const struct = new Struct<{ tags: string[] }>({ tags: 'utf8[4][2]' });
            const data = { tags: [ 'ABCD', 'EFGH' ] };

            expect(struct.toObject(struct.toBuffer(data))).toEqual(data);
        });

        test('packed bitfields', () => {
            const struct = new Struct<{ a: number; b: number }>({ a: 'u8:3', b: 'u8:5' });
            const data = { a: 5, b: 20 };

            expect(struct.size).toBe(1);
            expect(struct.toObject(struct.toBuffer(data))).toEqual(data);
        });

        test('a signed bitfield', () => {
            const struct = new Struct<{ a: number }>({ a: 'i8:4' });

            expect(struct.toObject(struct.toBuffer({ a: -2 })).a).toBe(-2);
        });

        test('a nested struct of the same pointer size', () => {
            const child = new Struct<{ x: number }>({ x: 'u32le' });
            const parent = new Struct<{ id: number; child: { x: number } }>({ id: 'u8', child });
            const data = { id: 7, child: { x: 42 } };

            expect(parent.toObject(parent.toBuffer(data))).toEqual(data);
        });
    });

    describe('partial input', () => {
        test('leaves undefined fields at their zero value', () => {
            const struct = new Struct<{ a: number; b: number }>({ a: 'u8', b: 'u8' });
            const buffer = struct.toBuffer({ a: 5 } as never);

            expect(struct.toObject(buffer)).toEqual({ a: 5, b: 0 });
        });
    });

    describe('pointer size', () => {
        test('exposes the resolved pointer size', () => {
            expect(new Struct({}).pointerSize).toBe(4);
            expect(new Struct({}, { pointerSize: 8 }).pointerSize).toBe(8);
        });

        test('inherits the parent pointer size by default and round-trips', () => {
            const child = new Struct<{ name: string }>({ name: '*utf8' }, { pointerSize: 8 });
            const parent = new Struct<{ child: { name: string } }>({ child }, { pointerSize: 4 });

            const buffer = parent.toBuffer({ child: { name: 'AB' } });

            expect(parent.toObject(buffer)).toEqual({ child: { name: 'AB' } });
        });

        test('inherit:false keeps its own pointer size when nested and round-trips', () => {
            const child = new Struct<{ name: string }>({ name: '*utf8' }, { pointerSize: 4, inherit: false });
            const parent = new Struct<{ id: string; child: { name: string } }>(
                { id: '*utf8', child }, { pointerSize: 8 }
            );

            expect(child.pointerSize).toBe(4);

            const buffer = parent.toBuffer({ id: 'AA', child: { name: 'BBB' } });
            expect(parent.toObject(buffer)).toEqual({ id: 'AA', child: { name: 'BBB' } });
        });
    });

    describe('custom heap', () => {
        test('a root struct writes pointer payloads into a supplied heap', () => {
            const { heap, ctx } = createHeap();
            const struct = new Struct<{ name: string }>({ name: '*utf8' }, { heap, inherit: false });

            const buffer = struct.toBuffer({ name: 'shared' });

            // the custom heap is not appended; the buffer is only the fixed stack
            expect(buffer.byteLength).toBe(struct.size);
            // the payload landed in the supplied heap instead
            expect(ctx.top).toBeGreaterThan(0);
            expect(struct.toObject(buffer).name).toBe('shared');
        });

        test('two structs pool their payloads into one shared heap', () => {
            const { heap } = createHeap();
            const a = new Struct<{ v: string }>({ v: '*utf8' }, { heap, inherit: false });
            const b = new Struct<{ v: string }>({ v: '*ascii' }, { heap, inherit: false });

            const bufA = a.toBuffer({ v: 'alpha' });
            const bufB = b.toBuffer({ v: 'beta' });

            expect(a.toObject(bufA).v).toBe('alpha');
            expect(b.toObject(bufB).v).toBe('beta');
        });

        test('a nested struct with its own heap and inherit:false bypasses the parent heap', () => {
            const { heap, ctx } = createHeap();
            const child = new Struct<{ note: string }>({ note: '*utf8' }, { heap, inherit: false });
            const parent = new Struct<{ id: number; child: { note: string } }>({ id: 'u8', child });

            const buffer = parent.toBuffer({ id: 1, child: { note: 'own-heap' } });

            // parent has no pointer fields of its own, and the child's payload went to
            // the custom heap, so the parent buffer is exactly its fixed size
            expect(buffer.byteLength).toBe(parent.size);
            expect(ctx.top).toBeGreaterThan(0);
            expect(parent.toObject(buffer)).toEqual({ id: 1, child: { note: 'own-heap' } });
        });

        test('a nested struct with a heap but inherit:true shares the parent heap', () => {
            const ownHeap = createHeap();
            const child = new Struct<{ note: string }>({ note: '*utf8' }, { heap: ownHeap.heap });
            const parent = new Struct<{ note: string; child: { note: string } }>({ note: '*utf8', child });

            // payloads exceed the inline pointer capacity so they must land on a heap
            const data = { note: 'parent value', child: { note: 'child value' } };
            const buffer = parent.toBuffer(data);

            // inherit defaults to true, so the child ignored its own heap and shared the
            // parent's; that heap is appended to the parent buffer
            expect(buffer.byteLength).toBeGreaterThan(parent.size);
            expect(ownHeap.ctx.top).toBe(0);
            expect(parent.toObject(buffer)).toEqual(data);
        });
    });
});
