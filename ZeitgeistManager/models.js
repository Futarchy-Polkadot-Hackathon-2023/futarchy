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
    polkassemblyTreasuryId;
    polkassemblyProposalDescription;

    // an object E.g. Optional, default to duration 14 days
    // marketCompletionStrategy = {strategy : "duration", durationHours: 5}
    // marketCompletionStrategy = {strategy : "endBlock", startBlock: 2921441, endBlock: 2923000}
    marketCompletionStrategy;

    getPolkasemblyTreasuryUrl() {
        return `https://polkadot.polkassembly.io/treasury/${this.polkassemblyTreasuryId}`;
    }
    createMarketQuestion () {
        return `Will polkassembly treasury proposal #${this.polkassemblyTreasuryId} be successful?`;
    }
    createMarketDescription () {
        return `${this.getPolkasemblyTreasuryUrl()} This market is created automatically for the polkasembly treasury proposal #${this.polkassemblyTreasuryId}. \n${this.polkassemblyProposalDescription}`;
    }
    createMarketSlug () {
        return `polkassembly-treasury-proposal-${this.polkassemblyTreasuryId}`;
    }
}

export default MarketCreationResult
