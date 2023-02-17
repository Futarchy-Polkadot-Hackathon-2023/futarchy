
const exampleEventResponse =  {
  "timestamp": "2022-11-22T11:29:30.016000Z",
  "proposalIndex": 229,
  "id": "0015438492-000039-c308a",
  "fee": "53544841",
  "extrinsicId": "0015438492-000002-c308a",
  "eventName": "Treasury.Proposed",
  "budgetRemaining": null,
  "blockNumber": 15438492,
  "beneficiary": "0xb1e8b074b1c82002a33e63338a04b974107769099111637275514fb0cd740978"
};

const GRAPH_QL_ENDPOINT = "http://localhost:4350/graphql";

async function fetchQuery(query) {
  return await fetch(GRAPH_QL_ENDPOINT, {
    "headers": {
      "content-type": "application/json"
    },
    "body": query,
    "method": "POST",
  });
}

const squidQuery = {
  async latestBlock () {
    const query = "{\"query\":\"query MyQuery {\\n  proposals(orderBy: blockNumber_DESC, limit: 1) {\\n    blockNumber\\n  }\\n}\",\"variables\":null,\"operationName\":\"MyQuery\"}";
    const response = await fetchQuery(query);
    return (await response.json()).data.proposals[0].blockNumber;
  },
  async allProposalEvents () {
    const query = "{\"query\":\"query MyQuery {\\n  proposals {\\n    proposalIndex\\n    eventName\\n    blockNumber\\n    timestamp\\n    extrinsicId\\n  }\\n}\",\"variables\":null,\"operationName\":\"MyQuery\"}";
    const response = await fetchQuery(query);
    return (await response.json()).data.proposals;
  },
  async byProposalIndexes(index) {
    const query = `{\"query\":\"query MyQuery {\\n  proposals(where: {proposalIndex_eq: ${index}}) {\\n    proposalIndex\\n    eventName\\n    blockNumber\\n    timestamp\\n    extrinsicId\\n  }\\n}\",\"variables\":null,\"operationName\":\"MyQuery\"}`;
    const response = await fetchQuery(query);
    return (await response.json()).data.proposals;
  },
  async allProposalEventsGteBlockNumber(blockNumber) {
    const query =  `{\"query\":\"query MyQuery {\\n  proposals(where: {blockNumber_gte: ${blockNumber}}) {\\n    proposalIndex\\n    eventName\\n    blockNumber\\n    timestamp\\n    extrinsicId\\n  }\\n}\",\"variables\":null,\"operationName\":\"MyQuery\"}`;
    const response = await fetchQuery(query);
    return (await response.json()).data.proposals;
  }
}

export default squidQuery