import { getState } from "./state";

export default function onShutdown() {
    getState().tsLanguageService.dispose();
}