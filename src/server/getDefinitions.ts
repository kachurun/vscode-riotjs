import { Range } from 'vscode-languageserver/node';

import touchRiotDocument from './touchRiotDocument';

import { getState } from './state';

namespace getDefinitions {
    export type DefinitionResult = {
        path: string;
        range: Range;
        originSelectionRange?: Range;
        targetSelectionRange?: Range;
    }

    export type Args = {
        filePath: string,
        getText: () => string,
        offset: number
    };
}


export default function getDefinitions(
    {
        filePath,
        getText,
        offset
    }: getDefinitions.Args
): getDefinitions.DefinitionResult[] {
    const {
        connection,
        tsLanguageService
    } = getState();

    if (tsLanguageService == null) {
        connection.console.error("No Language Service");
        return [];
    }
    const riotDocument = touchRiotDocument(filePath, getText);
    if (riotDocument == null) {
        connection.console.error("No script content found");
        return [];
    }
    
    const parserResult = riotDocument.getParserResult();
    const scriptPosition = riotDocument.getScriptPosition();
    if (
        scriptPosition == null ||
        parserResult.output.javascript == null ||
        parserResult.output.javascript.text == null
    ) {
        connection.console.error("No script content found");
        return [];
    }

    const scriptOffset = parserResult.output.javascript.text.start;
    const adjustedRequestedOffset = (
        offset - scriptOffset
    );

    let definitions = tsLanguageService.getDefinitionAtPosition(
        filePath, adjustedRequestedOffset
    );

    if (!definitions || definitions.length === 0) {
        definitions = tsLanguageService.getTypeDefinitionAtPosition(
            filePath, adjustedRequestedOffset
        );
    }

    if (!definitions || definitions.length === 0) {
        return [];
    }

    const program = tsLanguageService.getProgram()!;

    return definitions.map(definition => {
        const sourceFile = program.getSourceFile(definition.fileName);
        if (sourceFile == null) {
            return null;
        }

        const rangeStart = sourceFile.getLineAndCharacterOfPosition(
            definition.textSpan.start
        );
        const rangeEnd = sourceFile.getLineAndCharacterOfPosition(
            definition.textSpan.start + definition.textSpan.length
        );

        let range: Range;
        if (definition.fileName === filePath) {
            range = Range.create(
                {
                    line: rangeStart.line + scriptPosition.line,
                    character: (
                        rangeStart.character +
                        scriptPosition.character
                    )
                },
                {
                    line: rangeEnd.line + scriptPosition.line,
                    character: (
                        rangeEnd.character +
                        scriptPosition.character
                    )
                }
            );
        } else {
            range = Range.create(
                rangeStart, rangeEnd
            );
        }

        return {
            path: definition.fileName,
            range,
            targetSelectionRange: range
        } as getDefinitions.DefinitionResult;
    }).filter((def): def is getDefinitions.DefinitionResult => {
        return def !== null
    });
}