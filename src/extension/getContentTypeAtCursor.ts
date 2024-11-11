import state from "./state";

export default async function getContentTypeAtCursor(
    uri: string,
    cursorPosition: number
) {
    if (!state.riotClient) {
        return null;
    }

    return await state.riotClient.sendRequest(
        "custom/getContentTypeAtCursor", {
            uri, cursorPosition
        }
    ) as "css" | "javascript" | "expression" | "template" | null;
}