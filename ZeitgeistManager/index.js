import {create, mainnet, batterystation } from "@zeitgeistpm/sdk";
import { Keyring } from "@polkadot/keyring";
import {cryptoWaitReady} from  "@polkadot/util-crypto"
import ZtgConfiguration from "./ztgConfiguration.js"
import MarketCreationResult from "./models.js"
import * as dotenv from 'dotenv';

dotenv.config()

export default class ZeitgeistManager {

    constructor() {
        this.mainnet = process.env.mainnet === "true";

        if (this.mainnet){
            this.sdk = create(mainnet());
            console.log(`ZeitgeistManager initialized on the mainnet`)
        } else {
            this.sdk = create(batterystation());
            console.log(`ZeitgeistManager initialized on the battery station testnet`)
        }

    }

    async getSdk() {
        return this.sdk;
    }

    async getSigner() {
        await cryptoWaitReady()
        const keyring = new Keyring({ ss58Format: 73, type: 'sr25519' }) // battery station, zeitgeist testnet format
        return keyring.addFromMnemonic(ZtgConfiguration.signerSeed);
    }

    async getMarketById(marketId) {
        const sdk = await this.getSdk();
        return (await sdk.model.markets.get({ marketId: marketId })).unwrap();
    }


    async listAllMarkets() {
        const sdk = await this.getSdk();
        return await sdk.model.markets.list();
    }

    async listMarketsOwnedBySigner() {
        const signer = await this.getSigner()
        const sdk = await this.getSdk();
        return await sdk.model.markets.list({
            where: {
                creator_eq: signer.address
            },
        })
    }

    async createMarket(marketCreationArguments) {
        const sdk = await this.getSdk();

        const signer = await this.getSigner()
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
        marketCreationResult.isMainnet = this.mainnet;

        console.log(`Market created on ${this.mainnet? "mainnet" : "battery station"} with id: ${marketCreationResult.getMarketId()}. Pool created with id: ${marketCreationResult.getPoolId()}`);
        console.log(`View new market at ${marketCreationResult.getUrl()}`);
        console.log(`marketCreationResult: ${marketCreationResult}`)

        return marketCreationResult;
    }
}
