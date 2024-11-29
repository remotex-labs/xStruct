import jsdoc from 'eslint-plugin-jsdoc';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    ...tseslint.configs.recommended,
    jsdoc.configs['flat/recommended'],
    {
        plugins: {
            jsdoc
        },
        rules: {
            'no-undef': 'off',
            'guard-for-in': 'off',
            'no-redeclare': 'warn',
            'padded-blocks': 'off',
            'no-unused-vars': 'off',
            'no-invalid-this': 'warn',
            'no-dupe-class-members': 'off',
            'newline-before-return': 'error',
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/no-explicit-any': 'warn',
            "@typescript-eslint/no-dupe-class-members": "error",
            '@typescript-eslint/consistent-type-imports': ['error', { 'prefer': 'type-imports' }],
            'comma-dangle': ['error', 'never'],

            indent: ['error', 4, {
                SwitchCase: 1
            }],

            'max-len': ['error', {
                code: 180
            }],

            quotes: ['error', 'single'],
            semi: ['error', 'always'],

            'jsdoc/tag-lines': [
                'error',
                'any',
                {
                    startLines: 1
                }
            ],
            'jsdoc/no-types': 'warn',
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/require-param-type': 'off',
            'jsdoc/require-returns-type': 'off',
            'jsdoc/require-property-type': 'off',
            'linebreak-style': ['error', 'unix'],
            'array-bracket-spacing': ['error', 'always', {
                objectsInArrays: false,
                arraysInArrays: true
            }],

            'object-curly-spacing': [2, 'always'],
            '@typescript-eslint/member-ordering': ['error', {
                default: [
                    // Fields
                    'public-static-field',
                    'public-decorated-field',
                    'public-instance-field',
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
                    'public-static-method',
                    'public-decorated-method',
                    'public-instance-method',
                    'protected-static-method',
                    'protected-decorated-method',
                    'protected-instance-method',
                    'private-static-method',
                    'private-decorated-method',
                    'private-instance-method'
                ]
            }]
        }
    },
    {
        files: ["**/*.spec.ts"],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off'
        }
    },
    {
        ignores: [
            'dist/*',
            '**/*.js',
            'includes/*',
            'jest.config.cjs',
            'eslint.config.mjs'
        ]
    }
);
