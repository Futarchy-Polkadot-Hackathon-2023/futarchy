export class MarketCreationResult {
    market;
    pool;
    success;
    isMainnet;

    getUrl() {
        if (this.isMainnet != null && this.isMainnet) {
            return `https://app.zeitgeist.pm/markets/${this.getMarketId()}`;
        }
        return `https://test.staging.zeitgeist.pm/markets/${this.getMarketId()}`;
    }

    getMarketId() {
        return this.market.marketId;
    }
    getPoolId() {
        return this.pool.marketId;
    }

}


export class MarketCreationArguments {
    question;
    description;
    slug;
    durationHours;
}

export default MarketCreationResult
