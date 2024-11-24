import { getState } from "./state";

export default function getDocument(uri: string) {
    return getState().documents.get(uri);
}