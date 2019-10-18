# babel-plugin-transform-stringify-jsx
[Stringify-jsx](https://github.com/TargetTaiga/stringify-jsx) plugin for babel. Read more about [babel plugins](https://babeljs.io/docs/en/plugins#docsNav) or use [stringify-jsx](https://github.com/TargetTaiga/stringify-jsx) directly. 

## Quick start
```npm i --save-dev babel-plugin-transform-stringify-jsx```

Inline:
```js
const babel = require('@babel/core');
babel.transform('code', { plugins: [['transform-stringify-jsx', { /* stringify-jsx options */}]], parserOpts: { plugins: ['jsx']} });
```
.babelrc:
```json
{
  "parserOpts": {
    "plugins": ["jsx", "flow"]
  },
  "plugins": [["transform-stringify-jsx", { /* stringify-jsx options */ }]]
}
```
