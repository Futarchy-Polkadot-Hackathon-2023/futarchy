import {create, mainnet, batterystation } from "@zeitgeistpm/sdk";
import { Keyring } from "@polkadot/keyring";
import {cryptoWaitReady} from  "@polkadot/util-crypto"
import ZtgConfiguration from "./ztgConfiguration.js"
import MarketCreationResult from "./models.js"
import * as dotenv from 'dotenv';

dotenv.config()

export default class ZtgManager {
    async getSdk() {
        if (await this.isMainnet()){
            return await create(mainnet());
        } else {
            return await create(batterystation());
        }
    }

    async isMainnet() {
        return process.env.mainnet && process.env.mainnet === "true";
    }

    async getMarketById(marketId) {
        const sdk = await this.getSdk();
        return await sdk.model.markets.get({ marketId: marketId });
    }


    async listAllMarkets() {
        const sdk = await this.getSdk();
        return await sdk.model.markets.list();
        // return await sdk.model.markets.get();
    }

    async createMarket(marketCreationArguments) {
        const sdk = await this.getSdk();

        await cryptoWaitReady()
        const keyring = new Keyring({ ss58Format: 73, type: 'sr25519' }) // battery station, zeitgeist testnet format
        const signer = keyring.addFromMnemonic(ZtgConfiguration.signerSeed);
        console.log(`Signer address to be used for market creation ${signer.address}`)

        const durationHours = marketCreationArguments.durationHours ? marketCreationArguments.durationHours : ZtgConfiguration.defaultDurationHours;

        const params = {
            baseAsset: { Ztg: null },
            signer,
            disputeMechanism: "Authorized",
            marketType: { Categorical: 2 },
            oracle: signer.address,
            period: { Timestamp: [Date.now(), Date.now() + 1000 * 60 * 60 * durationHours] },
            deadlines: {
                disputeDuration: 5000,
                gracePeriod: 200,
                oracleDuration: 500,
            },
            metadata: {
                __meta: "markets",
                question: marketCreationArguments.question,
                description: marketCreationArguments.description,
                slug: marketCreationArguments.slug,
                categories: [
                    { name: "yes", ticker: "Y" },
                    { name: "no", ticker: "N" },
                ],
                tags: ZtgConfiguration.tags,
            },
            pool: {
                amount: ZtgConfiguration.defaultPoolAmount,
                swapFee: ZtgConfiguration.defaultSwapFee,
                weights: ["50000000000", "50000000000"],
            },
        };

        console.log("Attempt to create a market with params:\n", JSON.stringify(params))

        const response = await sdk.model.markets.create(params);
        // extracts the market and pool creation events from block
        const { market, pool } = response.saturate().unwrap();

        let marketCreationResult = new MarketCreationResult();
        marketCreationResult.market = market;
        marketCreationResult.pool = pool;
        marketCreationResult.success = true;
        marketCreationResult.isMainnet = await this.isMainnet();

        console.log(`Market created on ${await this.isMainnet()? "mainnet" : "battery station"} with id: ${market.marketId}. Pool created with id: ${pool.poolId}`);
        console.log(`View new market at ${marketCreationResult.getUrl()}`);

        console.log(marketCreationResult);
        console.log(marketCreationResult.getMarketId());
        console.log(`https://test.staging.zeitgeist.pm/markets/${marketCreationResult.getMarketId()}`);
        console.log(marketCreationResult.getPoolId());
        return marketCreationResult;
    }
}
