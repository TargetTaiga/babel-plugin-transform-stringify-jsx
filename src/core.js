import TemplatePartial from './template-partial';

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

export default function getVisitor(types) {
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
