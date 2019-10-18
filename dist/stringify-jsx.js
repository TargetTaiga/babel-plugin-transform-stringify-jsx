'use strict';

class TemplatePartial {
    constructor() {
        this.quasis = [];
        this.expressions = [];
    }

    addQuasi(quasi) {
        if (this.quasis.length === this.expressions.length + 1) {
            const lastQuasi = this.quasis[this.quasis.length - 1];
            this.quasis[this.quasis.length - 1] = lastQuasi.concat(quasi);
        } else {
            this.quasis.push(quasi);
        }
        return this;
    }

    addExpression(expression) {
        if (this.expressions.length === this.quasis.length) {
            this.quasis.push('');
        }
        this.expressions.push(expression);
        return this;
    }

    concat(templatePartial) {
        if (templatePartial.quasis.length < templatePartial.expressions.length) {
            throw new Error('Trying to concat invalid template: ' + JSON.stringify(templatePartial));
        }
        for (let i = 0; i < templatePartial.quasis.length; ++i) {
            this.addQuasi(templatePartial.quasis[i]);
            if (templatePartial.expressions[i]) {
                this.addExpression(templatePartial.expressions[i]);
            }
        }
        return this;
    }

    toTemplate(types) {
        if (this.quasis.length === this.expressions.length) {
            this.quasis.push('');
        }
        const lastIndex = this.quasis.length - 1;
        const elements = this.quasis.map((quasi, i) =>
            types.templateElement({raw: quasi}, i === lastIndex));
        return types.templateLiteral(elements, this.expressions);
    }
}

const JSX_ATTRIBUTE_REPLACEMENTS = {
    'className': 'class',
    'htmlFor': 'for'
};

const DEFAULT_OPTIONS = {
    preserveWhitespace: false,
    customAttributeReplacements: {},
    customAttributeReplacementFn: void 0
};

function mergeOptions(options) {
    return Object.assign({}, DEFAULT_OPTIONS, options);
}

function transformJSXElement(jsxElementPath, state, types) {
    return transformJSXOpeningElement(jsxElementPath.get('openingElement'), state, types)
        .concat(transformJSXChildren(jsxElementPath.get('children'), state, types))
        .concat(transformJSXClosingElement(jsxElementPath.get('closingElement')));
}

function transformJSXOpeningElement(jsxOpeningElementPath, state, types) {
    const partial = new TemplatePartial();
    partial.addQuasi('<' + jsxOpeningElementPath.node.name.name);
    jsxOpeningElementPath.get('attributes').forEach((attributePath) => {
        const name = getAttributeName(attributePath.get('name'), state);
        const valuePath = attributePath.get('value');
        if (valuePath.isJSXExpressionContainer()) {
            valuePath.traverse(getVisitor(types), state);
            partial.addQuasi(' ' + name + '="');
            partial.addExpression(
                types.identifier(valuePath.get('expression').toString()));
            partial.addQuasi('"');
        } else {
            partial.addQuasi(' ' + name + '=' + valuePath.toString());
        }
    });
    let closing = jsxOpeningElementPath.node.selfClosing ? '/>' : '>';
    partial.addQuasi(closing);
    return partial;
}

function transformJSXClosingElement(jsxClosingElementPath) {
    const partial = new TemplatePartial();
    if (jsxClosingElementPath.node) {
        partial.addQuasi(jsxClosingElementPath.toString());
    }
    return partial;
}

function trimText(text, state) {
    if (state.opts.preserveWhitespace) {
        return text;
    } else {
        // If text consists not only of whitespace we do not touch it to preserve formatting
        if (text.trim()) {
            return text;
        }
    }
    return '';
}

function transformJSXChildren(jsxChildPaths, state, types) {
    const partial = new TemplatePartial();
    jsxChildPaths.forEach((childPath) => {
        if (childPath.isJSXElement()) {
            partial.concat(transformJSXElement(childPath, state, types));
        }
        if (childPath.isJSXText()) {
            partial.addQuasi(trimText(childPath.node.value, state));
        }
        if (childPath.isJSXExpressionContainer()) {
            childPath.traverse(getVisitor(types), state);
            partial.addExpression(types.identifier(childPath.get('expression').toString()));
        }
    });
    return partial;
}

function getAttributeName(jsxIdentifierPath, state) {
    const name = jsxIdentifierPath.node.name;
    const defaultReplacement = JSX_ATTRIBUTE_REPLACEMENTS[name];
    if (state.opts.customAttributeReplacementFn) {
        return state.opts.customAttributeReplacementFn(jsxIdentifierPath, defaultReplacement);
    }
    return state.opts.customAttributeReplacements[name] || defaultReplacement || name;
}

function transformCallToTaggedExpression(callExpressionPath, templateLiteral, types) {
    const identifier = types.identifier(callExpressionPath.get('callee').toString());
    return types.taggedTemplateExpression(identifier, templateLiteral);
}

function getVisitor(types) {
    return {
        JSXElement(path, state) {
            state.opts = mergeOptions(state.opts);
            const templateLiteral = transformJSXElement(path, state, types).toTemplate(types);
            const parentPath = path.parentPath;
            if (parentPath.isCallExpression()) {
                parentPath.replaceWith(transformCallToTaggedExpression(parentPath, templateLiteral, types));
            } else {
                path.replaceWith(templateLiteral);
            }
        }
    };
}

function index ({ types }) {
    return {
        visitor: getVisitor(types)
    };
}

module.exports = index;
