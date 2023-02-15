/* eslint-disable @typescript-eslint/no-var-requires */
import squidQuery from "./subsquid-indexer/queries";
import polkassemblyGetQuery from "./polkassemblyClient";
import ZeitgeistManager from "./ZeitgeistManager";
// import ksmProvider from "somewhere";

// TODO: add to polkassemblyClient.js
let polkassemblyClient;
import web2Creds from  "./secrets/web2Creds";

// sparse arrays - set by index, access by index, unset with delete keyword
const emptyMarketsObject = {
  todo : [],
  deployed : {
    pending : [],
    live : [],
    failed : []
  },
  resolved : [],
};

const emptyPolkassemblyPostsObject = {
  todo : [],
  posted : []
};

// const emptyPostObject = {
//   bountyNo,
//   timeStamp,
//   textVersion
// };


const knownProposals = require("./cache/knownProposals") || {};
const markets = require("./cache/markets") || emptyMarketsObject;
const polkassemblyPosts = require("./cache/posts") || emptyPolkassemblyPostsObject;
const { lastKnownZtgBlock=0 , lastKnownKsmBlock=0 } = require("./cache");

const bootstrap = ()=> new Promise (async (resolve, reject) => {
  const latestZtgBlock = await zeitgeist.latestBlock();
  const latestKsmBlock = await provider({ chain: 'ksm' }).latestBlock();
  const proposalsWithNews= [];

  const newProposalEvents = await squidQuery.allProposalEvents({
    // query: { exclude: ['Treasury.Deposit', 'Treasury.Rollover'] }, // these not yet implemented so no need to exclude
    first: lastKnownKsmBlock,
    last: latestKsmBlock
  })
  .then(eventsUnordered=> {
    eventsUnordered
      .filter(event=> event.ProposalIndex < 2<<20)   // proposalIndex should be < 2<<10 but if not, better miss events than confusing behaviour
      // TODO: replace with orderBy in query
      .sort((a, b)=> 
        (a.proposalIndex<<20 + a.blockNumber) - (b.proposalIndex<<20 + b.blockNumber)
      )
      .forEach(event=> {
        proposalsWithNews[event.proposalIndex] = proposalsWithNews[event.proposalIndex] || [];
        proposalsWithNews[event.proposalIndex].push(event);      
    })
    proposalsWithNews.forEach(addProposalBehaviour);
    // this could better have been a .map
    // don't change it until working and then you can test it! ;)
    proposalsWithNews.forEach(proposal=> {
      const behaviour = proposal[0];     //because that's how proposal array was mutated
      switch (behaviour) {
        case 'postNewProposal': {
          markets.todo.push( {
            proposalIndex: proposal[1].proposalIndex,
            events: proposal.slice(1)
          })
          break;
        }
        case 'postWeHaveWinner': {
          polkassemblyPosts.todo.push( {
            proposalIndex: proposal[1].proposalIndex,
            events: proposal.filter( proposal=> 
              ['Treasury.Proposed', 'Treasury.Awarded', 'Treasury.Rejected', 'Treasury.SpendApproved']
                .includes(proposal.proposalName)
            )            
          })
          break;
        }
        default: break;
      }
    })
  });

  // const knownBountiesState = await squidQuery.allProposalEvents({
  //   bounties: bounties.map(bounty => bounty.number)
  // });

  // Let's work on live markets instead of filtering all events from squid
  // const newCloseToEndingBounties = knownBountiesState
  //   .filter(....
  const newCloseToEndingBounties = await squidQuery.byProposalIndexes({ 
      proposals: markets.deployed.live.filter(market => market.proposalIndex)
    })
    // The following can be more detailed filter to distinguish between, eg 'will it become active' and 'will it get paid'
    .filter(proposal=> proposal.events.none(event=> event.proposalName==='Transfer.Proposal'))
    .map(isCloseToEnding);    
  // eslint-disable-next-line prefer-spread
  polkassemblyPosts.todo.push.apply( polkassemblyPosts.todo, newCloseToEndingBounties.map(postFromNewProposal) );

  console.log('\nFound the following new bounties which have some news to post (either 1- been proposed, or, 2-  awarded, rejected or approved for spending: ', proposalsWithNews);
  console.log('\nFound the following already known bounties which are close to ending: ', newCloseToEndingBounties);

  resolve({ proposalsWithNews, newCloseToEndingBounties }); 

})



const marketFromNewProposal = proposal =>{
  // convert the subsquid bounty event into data for creation of a zeitgeist market
}

const postFromNewProposal = proposal =>{
  // convert the subsquid bounty event into data for a polkassembly post 
}

const isCloseToEnding = proposal =>{
  // Need to scrape data, eg, from Subsquare for this one
  // parses subsquid state/ subsquare api/ etc. to report if proposal is 'close' to ending 
  // (eg if it would end if 20% more votes were added, or if were to stay as is for 48 hours)
  // quick and dirty version - check if <36 hours before end of treshold period
}
    
const updateAll= async toDos=> {
  if (toDos) {
    if (!polkassemblyClient.active())
    await polkassemblyClient.login();
  }
  const { proposalsWithNews, newCloseToEndingBounties } = toDos;
  const newProposals = proposalsWithNews
    .filter(proposal=> proposal.events[0].proposalName==='Transfer.Proposed');
    newProposals.forEach(proposal=> {
    doCreateMarket(proposal)
      .then (market=> {
        const newPost = postFromNewProposal(proposal);
        polkassemblyPosts.todo.push(newPost);
        doCreatePost(newPost);
      });
  })
}

// NB ignore the return values from this function - the passed array is mutated to add the behaviour (at the start)
// eslint-disable-next-line consistent-return
const addProposalBehaviour = newProposalEvents=> {
  if (newProposalEvents.length !== 1) {
    const propIndex = newProposalEvents[0].proposalIndex;
    switch (newProposalEvents[0].proposalName) {
      case 'Treasury.Proposed': 
        return newProposalEvents.unshift('postNewProposal')
      case 'Treasury.Awarded': {
        if (isKnownProposal(propIndex))
          if (markets.deployed.live[propIndex]) 
            return newProposalEvents.unshift('postWeHaveWinner')
        break;
      }
      case 'Treasury.Rejected': {
        if (isKnownProposal(propIndex))
          if (markets.deployed.live[propIndex]) 
            return newProposalEvents.unshift('postWeHaveWinner')
        break;
      }
      case 'Treasury.SpendApproved': {
        if (isKnownProposal(propIndex))
          if (markets.deployed.live[propIndex]) 
            return newProposalEvents.unshift('postWeHaveWinner')
        break;
      }
      default: return
    }
  }
  
  // newProposalEvents.length !== 1, therefore should be >1
  if (newProposalEvents[0].proposalName === 'Treasury.Proposed') {
    if (newProposalEvents.some(event=>
      ['Treasury.Awarded', 'Treasury.Rejected', 'Treasury.SpendApproved']
      .includes(event.proposalName))) { 
        // We missed it.
        // Posting a message without further research risks being spammy, so let's do nothing.
        return
      }
    // In this version, there's nothing interesting more to do with the history of the proposal's events.
    // Show's over, nothing to see..
    return
  }

  // Other behaviour to define for other events...
}


const isKnownProposal = proposalIndex=> 
  Boolean(knownProposals[proposalIndex])

const hasLiveMarket = proposalIndex=> 
  Boolean(markets.deployed.live[proposalIndex])

bootstrap()
  .then(updateAll);

setInterval(()=>{
  bootstrap()
    .then(updateAll);
}, 5*60*1000);


// USAGE example:

const ztgManager = new ZeitgeistManager();

// ztgManager.getAllMarketIds()
//     .then(console.log)
//     .catch(console.error)
//     .finally(() => process.exit());

ztgManager.createCategoricalMarket()
    .then(marketDataIdString => console.log(marketDataIdString))
    .catch(console.error)

// zeitgeist.sdk.createMarket resolving successful market creation be like:
//     if (method == `MarketCreated`) {
//       console.log(`\x1b[36m%s\x1b[0m`, `\nMarket created with id ${data[0].toString()}.\n`);
//       _resolve(data[0].toString());


// // zeitgeist.sdk.getAllMarketIds :
// const entries = yield this.api.query.marketCommons.markets.entries();
// const ids = entries.map(([{ args: [val], },]) => {
//     return Number(val.toHuman());
// });
// ids.sort((a, b) => a - b);
// return ids;
// // that would be an array of something (what?)
// // formatted toHuman() https://polkadot.js.org/docs/api/start/types.basics/
