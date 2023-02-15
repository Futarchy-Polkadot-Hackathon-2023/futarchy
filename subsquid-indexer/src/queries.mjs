
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


const squidQuery = {
  latestBlock : ()=> new Promise ((resolve, reject)=> {

    resolve(0);
  }),

  allProposalEvents : ({ query, first, last })=> new Promise ((resolve, reject)=> {
    
    resolve([ exampleEventResponse ]);
  }),

  byProposalIndexes : ()=> new Promise ((resolve, reject)=> {

    resolve([ exampleEventResponse ]);
  })

}

export default squidQuery