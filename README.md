# js-sandbox

[![codecov](https://codecov.io/gh/joehecn/js-sandbox/graph/badge.svg?token=ZN5ERD4CUP)](https://codecov.io/gh/joehecn/js-sandbox)

## beginning
```bash
npm init -y
npm i -D typescript
npx tsc --init
npm i -D @types/node @types/jest jest prettier ts-jest tslint tslint-config-prettier

npm i --save-peer acorn acorn-walk fast-xml-parser quickjs-emscripten
```

# First publish your package to NPM
```bash
npm config get registry
npm config delete registry
# npm config set registry https://registry.npmjs.org/
npm publish
npm config set registry https://registry.npmmirror.com/
```

## publish
```bash
npm version patch
```