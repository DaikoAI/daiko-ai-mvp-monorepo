import { Tool } from "@langchain/core/tools";
import { getLatestQueryResult } from "../../utils/dune";

const QUERY_ID = 4855627;

export class DuneSearchFarcasterWord extends Tool {
    name = "dune_search_farcaster_word";
    description = `Search for tweets about a specific topic.

    Outputs:
    - status: string, "success" or "error"
    - message: string, a message describing the result
    - casts: array of objects, each representing an asset with the following properties:
        "fid": string, the id of the cast
        "text": string, the text of the cast
        "timestamp": string, the timestamp of the cast
    `;

    protected async _call(): Promise<string> {
        try {
            const casts = await getLatestQueryResult(QUERY_ID);

            return JSON.stringify({
                status: "success",
                message: "Casts retrieved successfully",
                casts,
            });

            // biome-ignore lint/suspicious/noExplicitAny: use any
        } catch (error: any) {
            return JSON.stringify({
                status: "error",
                message: error.message,
                code: error.code || "UNKNOWN_ERROR",
            });
        }
    }
}
