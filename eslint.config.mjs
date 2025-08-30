/**
 * Imports
 */

import tsdoc from 'eslint-plugin-tsdoc';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import perfectionist from 'eslint-plugin-perfectionist';

/**
 * Eslint config
 */

export default defineConfig([
    tseslint.configs.recommended,
    {
        plugins: {
            tsdoc,
            perfectionist
        },
        languageOptions: {
            sourceType: 'module',
            ecmaVersion: 'latest'
        },
        rules: {
            // Tsdoc
            'tsdoc/syntax': 'error',

            // Code quality rules
            'no-var': 'error',
            'no-undef': 'off',
            'guard-for-in': 'off',
            'no-redeclare': 'off',
            'padded-blocks': 'off',
            'no-unused-vars': 'off',
            'no-invalid-this': 'off',
            'no-dupe-class-members': 'off',
            'newline-before-return': 'error',
            '@typescript-eslint/no-redeclare': 'error',
            '@typescript-eslint/no-invalid-this': 'error',
            '@typescript-eslint/no-dupe-class-members': 'error',
            '@typescript-eslint/no-namespace': [ 'error', { allowDeclarations: true }],

            // Formatting rules
            'semi': [ 'error', 'always' ],
            'quotes': [ 'error', 'single' ],
            'max-len': [ 'error', { code: 180 }],
            'comma-dangle': [ 'error', 'never' ],
            'linebreak-style': [ 'error', 'unix' ],

            // Spacing/new line
            'indent': [ 'error', 4, { SwitchCase: 1 }],
            'key-spacing': [ 'error', { beforeColon: false, afterColon: true }],
            'comma-spacing': [ 'error', { before: false, after: true }],
            'space-infix-ops': 'error',
            'space-in-parens': [ 'error', 'never' ],
            'yield-star-spacing': [ 'error', 'after' ],
            'rest-spread-spacing': [ 'error', 'never' ],
            'space-before-blocks': [ 'error', 'always' ],
            'template-curly-spacing': [ 'error', 'always' ],
            'object-property-newline': [ 'error', { allowAllPropertiesOnSameLine: true }],

            'object-curly-spacing': [
                'error', 'always', {
                    'objectsInObjects': true,
                    'arraysInObjects': true
                }
            ],

            'space-before-function-paren': [
                'error', {
                    anonymous: 'always',
                    named: 'never',
                    asyncArrow: 'always'
                }
            ],

            'array-bracket-newline': [
                'error', {
                    multiline: true, minItems: 15
                }
            ],

            'object-curly-newline': [
                'error', {
                    ObjectExpression: { multiline: true, minProperties: 15, consistent: true },
                    ObjectPattern: { multiline: true, minProperties: 15, consistent: true }
                }
            ],

            'array-bracket-spacing': [
                'error', 'always', {
                    'objectsInArrays': false,  // No space between brackets and objects
                    'arraysInArrays': false,   // No space between brackets and nested arrays
                    'singleValue': true        // Enforce spacing for arrays with a single element
                }
            ],

            // other rules
            'perfectionist/sort-imports': [
                'error',
                {
                    type: 'line-length',
                    order: 'asc',
                    newlinesBetween: 'ignore',
                    fallbackSort: { type: 'alphabetical', order: 'asc' },

                    groups: [
                        'type',
                        [
                            'internal', 'parent',
                            'sibling', 'index',
                            'builtin', 'external'
                        ],
                        'object'
                    ]
                }
            ],

            // TypeScript specific rules
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'error',
            '@typescript-eslint/explicit-module-boundary-types': 'warn',
            '@typescript-eslint/consistent-type-imports': [ 'error', { prefer: 'type-imports' }],

            '@typescript-eslint/no-unused-vars': [ 'error', { 'argsIgnorePattern': '^_' }],

            '@typescript-eslint/naming-convention': [
                'error',
                {
                    'selector': 'interface',
                    'format': [ 'PascalCase' ],
                    'suffix': [ 'Interface' ],
                    'filter': {
                        'regex': '^x[A-Z].*$',
                        'match': false
                    }
                },
                {
                    'selector': 'typeAlias',
                    'format': [ 'PascalCase' ],
                    'suffix': [ 'Type' ],
                    'filter': {
                        'regex': '^x[A-Z].*$',
                        'match': false
                    }
                },
                {
                    'selector': 'enum',
                    'format': [ 'PascalCase' ]
                }
            ],

            // Add member-ordering rule
            '@typescript-eslint/member-ordering': [
                'error',
                {
                    'default': {
                        'memberTypes': [
                            // Index signature
                            'signature',

                            // Fields
                            'public-abstract-field',
                            'public-static-field',
                            'public-decorated-field',
                            'public-instance-field',

                            'protected-abstract-field',
                            'protected-static-field',
                            'protected-decorated-field',
                            'protected-instance-field',

                            'private-static-field',
                            'private-decorated-field',
                            'private-instance-field',

                            // Constructors
                            'public-constructor',
                            'protected-constructor',
                            'private-constructor',

                            // Methods
                            'public-abstract-method',
                            'public-static-method',
                            'public-decorated-method',
                            'public-instance-method',

                            'protected-abstract-method',
                            'protected-static-method',
                            'protected-decorated-method',
                            'protected-instance-method',

                            'private-static-method',
                            'private-decorated-method',
                            'private-instance-method'
                        ]
                        // 'order': 'alphabetically'
                    }
                }
            ]
        }
    },
    {
        files: [ '**/*.spec.ts' ],
        rules: {
            'no-undef': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off'
        }
    },
    {
        files: [ '**/*.d.ts' ],
        rules: {
            'no-var': 'off'
        }
    },
    {
        ignores: [
            'dist/*',
            'includes/*',
            'jest.config.cjs',
            'docs/.vitepress/dist/*',
            'docs/.vitepress/cache/*'
        ]
    }
]);
