export const getLatestQueryResult = async (queryId: number) => {
    if (!process.env.DUNE_API_KEY) {
        throw new Error("DUNE_API_KEY is not set");
    }

    const options = {
        method: "GET",
        headers: { "X-DUNE-API-KEY": process.env.DUNE_API_KEY },
    };

    const response = await fetch(`https://api.dune.com/api/v1/query/${queryId}/results`, options);

    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} - ${response.statusText}`);
    }

    // biome-ignore lint/suspicious/noExplicitAny: use any
    const data = (await response.json()) as { result: { rows: any[] } };

    return data.result.rows;
};
