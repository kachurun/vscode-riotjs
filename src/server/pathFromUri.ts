export default function pathFromUri(uri) {
    const url = new URL(uri);
    return decodeURIComponent(url.pathname.startsWith("/") ?
        url.pathname.slice(1) : url.pathname
    );
}