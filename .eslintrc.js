module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: 'standard-with-typescript',
  // extends: [
  //   'standard-with-typescript',
  //   'plugin:@typescript-eslint/eslint-recommended'
  // ],
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json']
  },
  rules: {
    "class-name": true,
    "comment-format": [
        true,
        "check-space"
    ],
    "indent": [
        true,
        "spaces"
    ],
    "one-line": [
        true,
        "check-open-brace",
        "check-whitespace"
    ],
    "no-var-keyword": true,
    "quotemark": [
        true,
        "double",
        "avoid-escape"
    ],
    "semicolon": [
        true,
        "always",
        "ignore-bound-class-methods"
    ],
    "whitespace": [
        true,
        "check-branch",
        "check-decl",
        "check-operator",
        "check-module",
        "check-separator",
        "check-type"
    ],
    "typedef-whitespace": [
        true,
        {
            "call-signature": "nospace",
            "index-signature": "nospace",
            "parameter": "nospace",
            "property-declaration": "nospace",
            "variable-declaration": "nospace"
        },
        {
            "call-signature": "onespace",
            "index-signature": "onespace",
            "parameter": "onespace",
            "property-declaration": "onespace",
            "variable-declaration": "onespace"
        }
    ],
    "no-internal-module": true,
    "no-trailing-whitespace": true,
    "no-null-keyword": true,
    "prefer-const": true,
    "jsdoc-format": true
  },
  root: true
};
