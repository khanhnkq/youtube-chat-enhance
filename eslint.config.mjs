const rules = {
  'no-unused-vars': ['error', { caughtErrors: 'none' }],
  // A catch that is ignored on purpose needs a comment saying why.
  'no-empty': 'error'
};

export default [
  { ignores: ['dist/', 'node_modules/', 'perf-results/', 'web-ext-artifacts/'] },
  {
    files: ['content/**/*.js', 'popup/**/*.js', 'scripts/**/*.js', 'icons/**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'script' },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules
  },
  {
    files: ['**/*.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules
  }
];
