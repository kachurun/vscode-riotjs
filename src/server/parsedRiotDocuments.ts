import { Position } from "vscode-languageserver-textdocument";

import ParserResult from "./utils/riot-parser/ParserResult";

export default new Map<string, {
    result: ParserResult,
    scriptPosition: null | Position
}>();