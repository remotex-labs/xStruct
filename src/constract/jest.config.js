/**
 * Imports tsconfig path libs
 */

const tsconfig = require("./tsconfig.jest");
const moduleNameMapper = require("tsconfig-paths-jest")(tsconfig);

/**
 * set nodejs env as test
 */

process.env.NODE_ENV = 'jest';

/**
 * Export config
 */

module.exports = {
    // A preset that is used as a base for Jest's configuration
    preset: 'ts-jest',

    // The test environment that will be used for testing
    testEnvironment: "node",

    // An array of glob patterns indicating a set of files for which coverage information should be collected
    collectCoverageFrom: [
        "src/**/*.{ts,tsx,js,jsx}",
        '!**/*.d.ts',
    ],

    // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
    // testPathIgnorePatterns: [
    //   "\\\\node_modules\\\\"
    // ],
    testPathIgnorePatterns: [ "/lib/", "/node_modules/", "/dist/" ],
    moduleNameMapper,
};
