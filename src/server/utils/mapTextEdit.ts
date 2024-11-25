import { createConnection } from "vscode-languageserver/node";

namespace mapTextEdit {
    export type Args = {
        textEdit: any,
        scriptOffset: { line: number, character: number },
        connection: ReturnType<typeof createConnection>
    };
}

export default function mapTextEdit(
    {
        textEdit, scriptOffset,
        connection
    }: mapTextEdit.Args
) {
    if (typeof textEdit !== "object" || textEdit === null) {
        return textEdit;
    }

    const { range } = textEdit;
    if (Array.isArray(range) && range.length === 2) {
        connection.console.log(`Mapping textEdit: ${JSON.stringify(textEdit, null, 2)}`);
        const start = {
            line: range[0].line + scriptOffset.line,
            character: range[0].character + (range[0].line === 0 ?
                scriptOffset.character : 0
            )
        };
        const end = {
            line: range[1].line + scriptOffset.line,
            character: range[1].character + (range[1].line === 0 ?
                scriptOffset.character : 0
            )
        };
        textEdit.range = { start, end };
    } else {
        connection.console.log(`Not mapping textEdit: ${JSON.stringify(textEdit, null, 2)}`);
    }
    return textEdit;
}