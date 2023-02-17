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
    durationHours; // optional

    getPolkasemblyTreasuryUrl() {
        return `https://polkadot.polkassembly.io/treasury/${this.polkassemblyTreasuryId}`;
    }
    createMarketQuestion () {
        return `Will polkassembly treasury proposal #${this.polkassemblyTreasuryId} be successful?`;
    }
    createMarketDescription () {
        return `This market is created automatically for the polkasembly treasury proposal Nr ${this.polkassemblyTreasuryId}.\n ${this.getPolkasemblyTreasuryUrl()}\n\n${this.polkassemblyProposalDescription}`;
    }
    createMarketSlug () {
        return `polkassembly-treasury-proposal-${this.polkassemblyTreasuryId}`;
    }
}

export default MarketCreationResult
