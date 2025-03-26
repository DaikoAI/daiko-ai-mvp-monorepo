import { Tool } from "@langchain/core/tools";
import { getLatestQueryResult } from "../../utils/dune";

const QUERY_ID = 3595951;

export class Dune7dCryptoNarrativeGrowth extends Tool {
    name = "dune_7d_crypto_narrative_growth";
    description = `Get the latest 7d crypto narrative growth.

    Outputs:
    - status: string, "success" or "error"
    - message: string, a message describing the result
    - url: reference to the Dune query
    - data: array of objects, each representing an asset with the following properties:
        "narrative": "L1",
        "optimized_relative_strength": -0.9045896750609982,
        "price_growth": -4.23982944065593,
        "relative_strategy": -1.5983222918200692,
        "relative_strength": -0.21085705830192708,
        "signal": "Lagging"
    `;

    protected async _call(): Promise<string> {
        try {
            const data = await getLatestQueryResult(QUERY_ID);

            return JSON.stringify({
                status: "success",
                message: "7d crypto narrative growth retrieved successfully",
                url: `https://dune.com/queries/${QUERY_ID}`,
                data,
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
