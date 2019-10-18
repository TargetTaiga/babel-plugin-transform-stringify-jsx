import getVisitor from './core';

export default function ({ types }) {
    return {
        visitor: getVisitor(types)
    };
}