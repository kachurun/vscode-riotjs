import { OutputChannel } from "vscode";
import {
    LanguageClient
} from "vscode-languageclient/node"

const state: {
    riotClient: LanguageClient | null,
    cssClient: LanguageClient | null,
    outputChannel: OutputChannel | null
} = {
    riotClient: null,
    cssClient: null,
    outputChannel: null
};

export default state;