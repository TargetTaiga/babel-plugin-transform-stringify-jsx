const babel = require('@babel/core');
babel.transform('code', { plugins: ['transform-stringify-jsx'], parserOpts: { plugins: ['jsx']} });