import { TextDocument } from 'vscode-languageserver-textdocument';
import TypeScriptLanguageService from '../TypeScriptLanguageService';
import { Range, Position } from "vscode-languageserver";
import { createConnection } from 'vscode-languageserver/node';
import updateRiotDocument from './updateRiotDocument';

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
    const { filePath, scriptOffset } = updateRiotDocument(
        document, tsLanguageService
    );

    if (scriptOffset < 0) {
        connection.console.log("No script content found");
        return [];
    }

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