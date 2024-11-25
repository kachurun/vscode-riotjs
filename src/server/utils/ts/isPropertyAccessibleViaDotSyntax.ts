export default function isPropertyAccessibleViaDotSyntax(name) {
    const identifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

    if (!identifierRegex.test(name)) {
        return false;
    }

    try {
        new Function(`'use strict'; var ${name};`);
        return true;
    } catch {
        return false;
    }
}