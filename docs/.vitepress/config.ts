/**
 * Imports
 */

import { defineVersionedConfig } from '@viteplus/versions';

/**
 * Doc config
 */

export default defineVersionedConfig({
    title: 'xStruct',
    base: '/xStruct/',
    description: 'A binary Serialization Library for TypeScript',
    head: [
        [ 'link', { rel: 'icon', type: 'image/png', href: '/xStruct/logo.png' }],
        [ 'meta', { name: 'theme-color', content: '#ff7e17' }],
        [ 'script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-C30TKES06G' }],
        [
            'script', {},
            'window.dataLayer = window.dataLayer || [];function gtag(){ dataLayer.push(arguments); }gtag(\'js\', new Date());gtag(\'config\', \'G-C30TKES06G\');'
        ]
    ],
    versionsConfig: {
        current: 'v3.0.x',
        versionSwitcher: {
            text: 'Version',
            includeCurrentVersion: true
        }
    },
    themeConfig: {
        logo: '/logo.png',

        search: {
            provider: 'local'
        },

        nav: [
            { text: 'Home', link: '/' },
            { text: 'Guide', link: '/guide' },
            {
                text: 'Types',
                items: [
                    { text: 'Floats', link: '/types/floats' },
                    { text: 'Strings', link: '/types/strings' },
                    { text: 'Integers', link: '/types/integers' },
                    { text: 'Bitfields', link: '/types/bitfields' }
                ]
            },
            { component: 'VersionSwitcher' }
        ],

        sidebar: {
            root: [
                { text: 'Getting Started', link: '/guide' },
                {
                    text: 'Types',
                    collapsed: false,
                    items: [
                        { text: 'Integers', link: '/types/integers' },
                        { text: 'Floats', link: '/types/floats' },
                        { text: 'Strings', link: '/types/strings' },
                        { text: 'Bitfields', link: '/types/bitfields' }
                    ]
                },
                {
                    text: 'Structures',
                    collapsed: false,
                    items: [
                        { text: 'Arrays', link: '/structures/arrays' },
                        { text: 'Nested Structs', link: '/structures/nested-structs' },
                        { text: 'Unions', link: '/structures/unions' }
                    ]
                },
                {
                    text: 'Guides',
                    collapsed: false,
                    items: [
                        { text: 'Heap & Pointers', link: '/guides/heap' },
                        { text: 'Endianness', link: '/guides/endianness' }
                    ]
                }
            ],
            'v2.x.x': [
                { text: 'Getting Started', link: '/guide' },
                {
                    text: 'Types',
                    collapsed: false,
                    items: [
                        { text: 'Integers', link: '/types/integers' },
                        { text: 'Floats', link: '/types/floats' },
                        { text: 'Strings', link: '/types/strings' },
                        { text: 'Bitfields', link: '/types/bitfields' }
                    ]
                },
                {
                    text: 'Structures',
                    collapsed: false,
                    items: [
                        { text: 'Arrays', link: '/structures/arrays' },
                        { text: 'Nested Structs', link: '/structures/nested-structs' },
                        { text: 'Unions', link: '/structures/unions' }
                    ]
                },
                {
                    text: 'Guides',
                    collapsed: false,
                    items: [{ text: 'Endianness', link: '/guides/endianness' }]
                }
            ]
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/remotex-labs/xStruct' },
            { icon: 'npm', link: 'https://www.npmjs.com/package/@remotex-labs/xstruct' }
        ],

        docFooter: {
            prev: true,
            next: true
        },
        footer: {
            message: 'Released under the Mozilla Public License 2.0',
            copyright: `Copyright © ${ new Date().getFullYear() } @remotex-labs/xBuild Contributors`
        }
    }
});
