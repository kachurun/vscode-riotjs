export default function getUriFromPath(filePath: string) {
    let normalized = filePath.replace(/\\/g, '/');

    if (/^[a-zA-Z]:/.test(normalized)) {
        normalized = normalized[0].toLowerCase() + normalized.substring(1);
    }

    if (!normalized.startsWith('/')) {
        normalized = '/' + normalized;
    }

    return `file://${normalized}`;
}