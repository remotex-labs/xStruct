/**
 * Import will remove at compile time
 */

import type { xBuildConfig } from '@remotex-labs/xbuild';

/**
 * Imports
 */

import { version } from 'process';
import pkg from './package.json' with { type: 'json' };

/**
 * Config build
 */

export const config: xBuildConfig = {
    common: {
        esbuild: {
            bundle: true,
            minify: true,
            target: [ `node${ version.slice(1) }` ],
            platform: 'node',
            packages: 'external',
            sourcemap: true,
            sourceRoot: `https://github.com/remotex-labs/xStruct/tree/v${ pkg.version }///`,
            entryPoints: {
                'index': 'src/index.ts'
            }
        }
    },
    variants: {
        esm: {
            esbuild: {
                format: 'esm',
                outdir: 'dist/esm'
            }
        },
        cjs: {
            declaration: false,
            esbuild: {
                format: 'cjs',
                outdir: 'dist/cjs'
            }
        }
    }
};

export default config;
