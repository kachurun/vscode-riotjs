import ts from "typescript";

import { MarkupKind, Position } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { createConnection } from "vscode-languageserver/node";

import TypeScriptLanguageService from "../TypeScriptLanguageService";

import touchRiotDocument from "./touchRiotDocument";
import parsedRiotDocuments from "./parsedRiotDocuments";

namespace getHoverInfo {
    export type Args = {
        document: TextDocument,
        position: Position,
        tsLanguageService: TypeScriptLanguageService | null,
        connection: ReturnType<typeof createConnection>
    };
}

export default function getHoverInfo(
    {
        document, position,
        tsLanguageService,
        connection
    }: getHoverInfo.Args
) {
    if (tsLanguageService == null) {
        connection.console.log("No Language Service");
        return null;
    }
    const filePath = touchRiotDocument(document);
    const parsedDocument = parsedRiotDocuments.get(filePath);

    if (
        parsedDocument == null ||
        parsedDocument.output.javascript == null ||
        parsedDocument.output.javascript.text == null
    ) {
        connection.console.log("No script content found");
        return null;
    }

    const adjustedRequestedOffset = (
        document.offsetAt(position) -
        parsedDocument.output.javascript.text.start
    );

    try {
        const quickInfo = tsLanguageService.getQuickInfoAtPosition(filePath, adjustedRequestedOffset);

        if (!quickInfo) {
            return null;
        }

        const displayText = (
            '```typescript\n' +
            ts.displayPartsToString(quickInfo.displayParts || []) +
            '\n```'
        );

        // Format documentation as regular markdown
        const documentation = (quickInfo.documentation ?
            ts.displayPartsToString(
                quickInfo.documentation
            ).split('\n').map(line => line.trim()).join('\n\n') :
            ''
        );

        // Handle tags if present
        const tags = quickInfo.tags?.map(tag => {
            const tagText = ts.displayPartsToString(tag.text);
            switch (tag.name) {
                case 'param':
                    return `*@param* \`${tag.text}\``;
                case 'returns':
                    return `*@returns* ${tagText}`;
                case 'example':
                    return `*Example:*\n\`\`\`typescript\n${tagText}\n\`\`\``;
                default:
                    return `*@${tag.name}* ${tagText}`;
            }
        }).join('\n\n');

        let contents = displayText;
        if (documentation) {
            contents += '\n\n---\n\n' + documentation;
        }
        if (tags) {
            contents += '\n\n---\n\n' + tags;
        }
    
        return {
            contents: {
                kind: MarkupKind.Markdown,
                value: contents
            }
        };
    } catch (error) {
        connection.console.error(`Error retrieving quick info: ${error}`);
        connection.console.error(`Error stack: ${error.stack}`);
        return null;
    }
}