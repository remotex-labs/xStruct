/**
 * Import will remove at compile time
 */

import type { VNode } from '@vue/runtime-core';
import type { Awaitable, Theme } from 'vitepress';

/**
 * Styles
 */

import './style.css';

/**
 * Imports
 */

import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';
import VersionSwitcher from './components/version-switcher.vue';

export default {
    extends: DefaultTheme,
    Layout: (): VNode => {
        return h(DefaultTheme.Layout, null, {
        });
    },
    enhanceApp({ app }): Awaitable<void> {
        app.component('VersionSwitcher', VersionSwitcher);
    }
} satisfies Theme;
