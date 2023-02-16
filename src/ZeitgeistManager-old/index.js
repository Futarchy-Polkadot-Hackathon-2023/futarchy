import SDK, { util, models } from "@zeitgeistpm/sdk";
import * as dotenv from 'dotenv';
dotenv.config()


const websocketEndpoint = ["wss://bsr.zeitgeist.pm", // default sdk url
    "wss://bsr.zeitgeist.pm",
    "wss://roc.zeitgeist.pm",  //Rococo testnet
    "wss://zeitgeist.api.onfinality.io/public-ws",
    "wss://bp-rpc.zeitgeist.pm",
][0]



class ZeitgeistManager {
    constructor(endpoint=websocketEndpoint) {
        this._endpoint = endpoint;
        this._opts = {
            logEndpointInitTime: true,
            ipfsClientUrl: "http://localhost:8080",
            initialConnectionTries: 5,
        }
    }

    async getSdk(endpoint=this._endpoint) {
        return await SDK.default.initialize(endpoint, this._opts);
    }

    async jsonify (promise) {
        return (await promise).toJSONString();
    }

    async getMarketCount() {
        const sdk = await this.getSdk();
        return sdk.models.getMarketCount();
    }

    async getAllMarketIds() {
        const sdk = await this.getSdk();
        return sdk.models.getAllMarketIds();
    }

    async queryMarket(marketId) {
        const sdk = await this.getSdk();
        return this.jsonify(sdk.models.queryMarket(marketId))
    }


    async createCategoricalMarket() {
        const sdk = await this.getSdk();

        // Generate signer based on seed
        const seed = process.env.seed;
        const signer = util.signerFromSeed(seed);
        console.log("Sending transaction from", signer.address);

        // Construct Market metadata
        const description = "description for test";
        const slug = "test";
        const question = "Will this test work?";
        const categoriesMeta = [
            { name: "Yes", ticker: "YES" },
            { name: "No", ticker: "NO" },
        ];

        const metadata = {
            description,
            slug,
            question,
            categories: categoriesMeta,
        };

        const oracle = "5CS2Q1XbRR1eYnxeXUm8fqq6PfK3WLfwUvCpNvGsYAjKtsUC";
        const period = "1000000";
        const marketPeriod = {
            block: period.split(" ").map((x) => +x),
        };
        const mdm = { authorized: "1" };
        const creationType = "Advised";
        const scoringRule = "CPMM";
        const marketType = { Categorical: categoriesMeta.length };

        const params = {
            signer: signer,
            oracle: oracle,
            period: marketPeriod,
            metadata: metadata,
            creationType: creationType,
            marketType: marketType,
            disputeMechanism: mdm,
            scoringRule: scoringRule,
            callbackOrPaymentInfo: false,
        };

        const marketId = await sdk.models.createMarket(params);
        console.log(`Categorical market created! Market Id: ${marketId}`);
    }

}

// const ztgManager = new ZeitgeistManager(websocketEndpoint);

// // ztgManager.getAllMarketIds()
// //     .then(console.log)
// //     .catch(console.error)
// //     .finally(() => process.exit());

// ztgManager.createCategoricalMarket()
//     .then(console.log)
//     .catch(console.error)
//     .finally(() => process.exit());

export default ZeitgeistManager;

