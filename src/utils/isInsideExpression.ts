import { TextDocument } from "vscode-languageserver-textdocument";
import { Position } from "vscode-languageserver";
import ParserResult from "./riot-parser/ParserResult";
import BaseParserNode from "./riot-parser/BaseParserNode";
import ParserNode from "./riot-parser/ParserNode";
import Expression from "./riot-parser/Expression";


function offsetInNode(offset: number, node: BaseParserNode) {
    return (
        offset >= node.start &&
        offset < node.end
    );
}

function findNodeAtOffset(offset: number, node: ParserNode) {
    for (
        let index = 0;
        index < (node.nodes?.length || 0);
        index++
    ) {
        const childNode = node.nodes![index];
        if (!offsetInNode(offset, childNode)) {
            continue;
        }

        return findNodeAtOffset(offset, childNode);
    }

    return node;
}

function findAttributeAtOffset(offset: number, node: ParserNode) {
    if (node.attributes == null || node.attributes.length === 0) {
        return null;
    }

    return node.attributes.find(({ start, end }) => {
        return offset >= start && offset < end;
    }) || null;
}

function findExpressionAtOffset(
    offset: number, expressions: Array<Expression>
) {
    return expressions.find(({ start, end }) => {
        // offset should not be equal to start to ensure it is inside the brackets
        return offset > start && offset < end;
    }) || null;
}

export default function isInsideExpression(
    document: TextDocument,
    position: Position,
    parsedDocument: ParserResult["output"] | null
) {
    const offset = document.offsetAt(position);
    if (parsedDocument == null) {
        const text = document.getText();
        const beforeCursor = text.slice(0, offset);
    
        const expressionMatch = beforeCursor.match(/\{[^}]*$/);
    
        return !!expressionMatch;
    }

    if (!offsetInNode(offset, parsedDocument.template)) {
        return false;
    }

    if (
        parsedDocument.css != null &&
        offsetInNode(offset, parsedDocument.css)
    ) {
        return false;
    }
    if (
        parsedDocument.javascript != null &&
        offsetInNode(offset, parsedDocument.javascript)
    ) {
        return false;
    }

    const node = findNodeAtOffset(offset, parsedDocument.template);

    const attributeAtOffset = findAttributeAtOffset(offset, node);
    if (attributeAtOffset != null) {
        return findExpressionAtOffset(
            offset, attributeAtOffset.expressions || []
        ) != null;
    }

    return findExpressionAtOffset(
        offset, node.expressions || []
    ) != null;
}