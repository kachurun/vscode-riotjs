import Expression from "../riot-parser/Expression";

import isPropertyAccessibleViaDotSyntax from "../ts/isPropertyAccessibleViaDotSyntax";

export default function constructExpressionScopeFunction(
    expressionNode: Expression,
    properties: Record<string, string>
) {
    const contentBeforeExpression = [
        `(function (`,
        `    this: {`,
        Object.values(properties).map((propSignature) => {
            return `        ${propSignature}`;
        }).join(",\n"),
        `    }`,
        `) {`,
        `    const {`,
        Object.keys(properties).filter((propName) => {
            return isPropertyAccessibleViaDotSyntax(propName);
        }).map((propName) => {
            return `        ${propName}`;
        }).join(",\n"),
        `    } = this;`,
        `    `
    ].join("\n");
    const index = contentBeforeExpression.length;
    return {
        constructedFunction: (
            `${contentBeforeExpression}${expressionNode.text}\n});`
        ),
        expressionIndex: index
    };
}