import ts from "typescript";

import { MarkupKind } from "vscode-languageserver";

import touchRiotDocument from "../../core/riot-documents/touch";

import { getState } from "../../core/state";

namespace getHoverInfo {
    export type Args = {
        filePath: string,
        getText: () => string,
        offset: number
    };
}

export default function getHoverInfo(
    {
        filePath,
        getText,
        offset
    }: getHoverInfo.Args
) {
    const {
        connection,
        tsLanguageService
    } = getState();

    if (tsLanguageService == null) {
        connection.console.log("No Language Service");
        return null;
    }
    const riotDocument = touchRiotDocument(filePath, getText);
    if (riotDocument == null) {
        connection.console.error("No script content found");
        return null;
    }

    const parserResult = riotDocument.getParserResult();
    if (
        parserResult.output.javascript == null ||
        parserResult.output.javascript.text == null
    ) {
        connection.console.error("No script content found");
        return null;
    }

    const adjustedRequestedOffset = (
        offset - parserResult.output.javascript.text.start
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