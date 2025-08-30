/**
 * Import will remove at compile time
 */

import type { UserConfig } from 'vitepress';

/**
 * Imports
 */

import { join } from 'path';
import defineVersionedConfig from 'vitepress-versioning-plugin';

/**
 * Doc config
 */

export default defineVersionedConfig({
    title: 'xStruct',
    base: '/xStruct/',
    srcDir: 'src',
    description: 'A binary Serialization Library for TypeScript',
    head: [
        [ 'link', { rel: 'icon', type: 'image/png', href: '/xStruct/xStruct.png' }],
        [ 'meta', { name: 'theme-color', content: '#ff7e17' }],
        [ 'script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-C30TKES06G' }],
        [
            'script', {},
            'window.dataLayer = window.dataLayer || [];function gtag(){ dataLayer.push(arguments); }gtag(\'js\', new Date());gtag(\'config\', \'G-C30TKES06G\');'
        ]
    ],
    themeConfig: {
        logo: '/xStruct.png',
        versionSwitcher: false,

        search: {
            provider: 'local'
        },

        nav: [
            { text: 'Home', link: '/' },
            { text: 'GitHub', link: 'https://github.com/remotex-labs/xStruct' }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/remotex-labs/xStruct' },
            { icon: 'npm', link: 'https://www.npmjs.com/package/@remotex-labs/xstruct' }
        ],

        docFooter: {
            prev: false,
            next: false
        }
    },
    versioning: {
        latestVersion: 'v2.0.x'
    }
}, join(__dirname, '../src', 'versions')) as UserConfig;
