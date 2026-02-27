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
        [ 'link', { rel: 'icon', type: 'image/png', href: '/xStruct/xStruct.png' }],
        [ 'meta', { name: 'theme-color', content: '#ff7e17' }],
        [ 'script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-C30TKES06G' }],
        [
            'script', {},
            'window.dataLayer = window.dataLayer || [];function gtag(){ dataLayer.push(arguments); }gtag(\'js\', new Date());gtag(\'config\', \'G-C30TKES06G\');'
        ]
    ],
    versionsConfig: {
        current: 'v2.x.x',
        versionSwitcher: false
    },
    themeConfig: {
        logo: '/logo.png',

        search: {
            provider: 'local'
        },

        nav: [
            { text: 'Home', link: '/' },
            { text: 'Guide', link: '/guide' },
            { component: 'VersionSwitcher' }
        ],

        sidebar: {
            root: [
                { text: 'Guide', link: '/guide' },
                {
                    text: 'Primitive',
                    collapsed: false,
                    items: [
                        { text: 'Float', link: '/primitive/float' },
                        { text: 'Uint/Int', link: '/primitive/int' }
                    ]
                },
                {
                    text: 'Advanced',
                    collapsed: false,
                    items: [
                        { text: 'Arrays', link: '/advanced/arrays' },
                        { text: 'Bitfields', link: '/advanced/bitfields' },
                        { text: 'Endianness', link: '/advanced/endianness' },
                        { text: 'Best practices', link: '/advanced/best-practices' }
                    ]
                }
            ]
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/remotex-labs/xStruct' },
            { icon: 'npm', link: 'https://www.npmjs.com/package/@remotex-labs/xstruct' }
        ],

        docFooter: {
            prev: false,
            next: false
        },
        footer: {
            message: 'Released under the Mozilla Public License 2.0',
            copyright: `Copyright © ${ new Date().getFullYear() } @remotex-labs/xBuild Contributors`
        }
    }
});
