import state from "./state";

export default async function deactivate() {
    const promises: Array<Promise<void>> = [];

    if (state.riotClient) {
        promises.push(
            state.riotClient.stop().then(() => {
                state.riotClient = null;
            })
        );
    }
    if (state.cssClient) {
        promises.push(
            state.cssClient.stop().then(() => {
                state.cssClient = null;
            })
        );
    }

    await Promise.all(promises);
}
