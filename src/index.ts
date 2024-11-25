import type { StructSchemaInterface } from '@services/interfaces/struct.interface';
import { Struct } from '@services/struct.service';

const x: StructSchemaInterface = {
    T1: 'UInt8:2',
    T2: 'UInt8:4',
    T3: 'UInt8:2',
    T4: 'UInt8',
    T5: 'UInt8:4'
};


const u = new Struct(x);
console.log(u.size);
