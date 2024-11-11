export default function isOffsetInNode(
    offset: number,
    node: { start: number, end: number },
    checkForStartEquality: boolean = true
) {
    return (
        (checkForStartEquality ?
            offset >= node.start :
            offset > node.start
        ) &&
        offset < node.end
    );
}