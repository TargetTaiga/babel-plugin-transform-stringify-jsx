const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const plugin = require('../..');

it('should replace default JSX attributes', () => {
    const { code } = babel.transform(fs.readFileSync(path.join(__dirname, 'input.js')).toString(),
        { plugins: [plugin], parserOpts: { plugins: ['jsx']} });
    expect(code).toMatchSnapshot();
});