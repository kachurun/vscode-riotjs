const extractingRegex = /^\[(\d+),(\d+)\]: ([\s\S]*)$/

namespace parseErrorMessage {
    export type Return = {
        message: string,
        position: null | { line: number, character: number }
    };
}

export default function parseErrorMessage(
    message: string
): parseErrorMessage.Return {
    const match = message.match(extractingRegex);
    if (match == null) {
        return {
            message,
            position: null
        };
    }

    return {
        message: match[3],
        position: {
            line: parseInt(match[1]),
            character: parseInt(match[2])
        }
    };
}