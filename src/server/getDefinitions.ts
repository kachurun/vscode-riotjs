import { TextDocument } from 'vscode-languageserver-textdocument';
import {
    Range, Position,
    createConnection
} from 'vscode-languageserver/node';

import TypeScriptLanguageService from '../TypeScriptLanguageService';

import touchRiotDocument from './touchRiotDocument';
import parsedRiotDocuments from './parsedRiotDocuments';

interface DefinitionResult {
    path: string;
    range: Range;
    originSelectionRange?: Range;
    targetSelectionRange?: Range;
}

export default function getDefinitions(
    {
        document, position,
        tsLanguageService,
        connection
    }:{
        document: TextDocument,
        position: Position,
        tsLanguageService: TypeScriptLanguageService,
        connection: ReturnType<typeof createConnection>
    }
): DefinitionResult[] {
    if (tsLanguageService == null) {
        connection.console.log("No Language Service");
        return [];
    }
    const filePath = touchRiotDocument(document);
    const parsedDocument = parsedRiotDocuments.get(filePath);

    if (
        parsedDocument == null ||
        parsedDocument.output.javascript == null ||
        parsedDocument.output.javascript.text == null
    ) {
        connection.console.log("No script content found");
        return [];
    }

    const scriptOffset = parsedDocument.output.javascript.text.start;
    const adjustedRequestedOffset = (
        document.offsetAt(position) - scriptOffset
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
        if (!sourceFile) {
            return null;
        }

        const range = (definition.fileName === filePath ?
            Range.create(
                document.positionAt(
                    scriptOffset +
                    definition.textSpan.start
                ),
                document.positionAt(
                    scriptOffset +
                    definition.textSpan.start +
                    definition.textSpan.length
                )
            ) :
            Range.create(
                sourceFile.getLineAndCharacterOfPosition(definition.textSpan.start),
                sourceFile.getLineAndCharacterOfPosition(
                    definition.textSpan.start + definition.textSpan.length
                )
            )
        );

        return {
            path: definition.fileName,
            range,
            targetSelectionRange: range
        } as DefinitionResult;
    }).filter((def): def is DefinitionResult => def !== null);
}