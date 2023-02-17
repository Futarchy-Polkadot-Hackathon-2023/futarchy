/* eslint-disable @typescript-eslint/no-var-requires */
// import squidQuery from "./queries.js";
import squidQuery from "../subsquid-indexer/src/queries.mjs";
import { polkassemblyClient }  from "./graphqlClient.js";
import ZeitgeistManager from "../ZeitgeistManager/index.js";
// import ksmProvider from "somewhere";

import { error } from "selenium-webdriver";

import kProps from "../cache/knownProposals.json" assert { type: "json" };
const { knownProposals } = kProps;
const lastKnownKsmBlock = kProps.atBlock
import markets from "../cache/markets.json" assert { type: "json" };
import polkassemblyPosts from "../cache/posts.json" assert { type: "json" };
import postContents from "../content/postContents.json" assert { type: "json" };


const zeitgeistManager = new ZeitgeistManager();

console.log('knownProposals', knownProposals);
console.log('lastKnownKsmBlock', lastKnownKsmBlock);
console.log('markets', markets);
console.log('posts', polkassemblyPosts);

console.log(squidQuery);
console.log(polkassemblyClient);
console.log(zeitgeistManager);
// console.log(zeitgeist);

import web2Creds from  "../.secrets/web2Creds.js";
import { resolve } from "path";

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

// const { lastKnownZtgBlock=0 , lastKnownKsmBlock=0 } = require("./cache");

const findTriggers = ()=> new Promise (async (resolve, reject) => {
  // TODO Use provider independent from squid for latestBlock()
  const latestKsmBlock = await squidQuery.latestBlock();
  const proposalsWithNews= [];

  const newProposalEvents = await squidQuery.allProposalEvents({
    // query: { exclude: ['Treasury.Deposit', 'Treasury.Rollover'] }, // these not yet implemented so no need to exclude
    first: lastKnownKsmBlock,
    last: latestKsmBlock
  })
  .then(eventsUnordered=> {
    eventsUnordered
      // proposalIndex should be < 2<<10 but if not, better miss events than confusing behaviour
      .filter(event=> event.ProposalIndex < 2<<20)   
      // TODO: replace this with orderBy clause in query
      .sort((a, b)=> 
        (a.proposalIndex<<20 + a.blockNumber) - (b.proposalIndex<<20 + b.blockNumber)
      )
      .forEach(event=> {
        proposalsWithNews[event.proposalIndex] = proposalsWithNews[event.proposalIndex] || [];
        proposalsWithNews[event.proposalIndex].push(event);      
    })   

    // map over sparse array proposalsWithNews. Array methods only operate on populated elements.
    proposalsWithNews
      .map(behaviourFromProposal)
      .forEach((behaviour, idx)=> {
        const proposal = proposalsWithNews[idx]
        switch (behaviour) {
          case 'postNewProposal': {
            markets.todo.push( {
              proposalIndex: proposal[0].proposalIndex,
              events: proposal
            })
            break;
          }
          case 'postWeHaveWinner': {
            polkassemblyPosts.todo.push( {
              proposalIndex: proposal[0].proposalIndex,
              events: proposal.filter(event=> 
                ['Treasury.Proposed', 'Treasury.Awarded', 'Treasury.Rejected', 'Treasury.SpendApproved']
                  .includes(event.eventName)
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
  const newCloseToEndingBounties = (await squidQuery.byProposalIndexes({ 
      proposals: markets.deployed.live
        .filter(market => market.proposalIndex)
        .map(marketId=>marketId)    // TODO - correct for actual type of market[n]
    }))
    // The following can be more detailed filter to distinguish between, eg 'will it become active' and 'will it get paid'

  // TODO NEXT: add helper function for byProposalIndexes() to use, which bundles all events
  // onto a 'proposal' object
    // V currently uses made-up data structure - TODO: correct it once createMarket integrated!
    .filter(proposal=> proposal.events && proposal.events.none(event=> event.eventName==='Transfer.Proposal'))
    .filter(isCloseToEnding);
  // eslint-disable-next-line prefer-spread
  polkassemblyPosts.todo.push.apply( polkassemblyPosts.todo, newCloseToEndingBounties.map(postFromNewProposal) );

  console.log('\nFound the following new bounties which have some news to post (either 1- been proposed, or, 2-  awarded, rejected or approved for spending: ', proposalsWithNews);
  console.log('\nFound the following already known bounties which are close to ending: ', newCloseToEndingBounties);

  resolve({ proposalsWithNews, newCloseToEndingBounties }); 

})

const marketFromNewProposal = async proposal=> {
  // convert the subsquid bounty event into data for creation of a zeitgeist market
  // We need at minimum:
  // period: [blockStart|timeStart, blockEnd|timeEnd],
  // question: marketCreationArguments.question,
  // description: marketCreationArguments.description,
  // slug: marketCreationArguments.slug,

  const behaviour = behaviourFromProposal(proposal);
  const { proposalIndex, blockNumber }  = proposal[0];
  // Cannot currently see any use to call this function other than for new proposals
  if (behaviour !== 'postNewProposal') 
    return null;

  // Convert
  // INPUT: an array of events concerning one proposalIndex, which will not certainly have Proposed as first element
  // into OUTPUT: { description, question, slug, expiry }

  const selfDescribedTitle =  
    polkassemblyClient.getTitle(proposalIndex)
      .then(title =>{
        console.log({proposalIndex, title});
        return title;
      })
    
  const endBlock = blockNumber + 28.25*3600+1;
  const description = selfDescribedTitle
    .then(title=>
      `KSM Treasury proposal # ${proposalIndex} (${selfDescribedTitle}) - will it be Accepted or Rejected? Or not?` );
  const question = `Will KSM Treasury proposal #${proposalIndex} be Rejected, Accepted, or neither by (KSM) block ${endBlock}`;
  const slug = `KSM-treasury-prop-${proposalIndex}`;
  
  // await description;
  return { endBlock, selfDescribedTitle, description, question, slug }
}

const doCreateMarket = proposal=> new Promise((resolve,reject) => {

  try {
    const marketCreationResult = zeitgeistManager.createMarket(marketCreationArguments);
    if (marketCreationResult.success) {
      console.log('Successfully created market ',marketCreationResult.getMarketId());
      return { 
        marketId : marketCreationResult.getMarketId(),
        poolId : marketCreationResult.getPoolId(),
        link : marketCreationResult.getUrl(),
        marketCreationResult
      };
    }
  } catch (e) {
    throw e
  }

})

const doCreatePost = proposal=> new Promise((resolve,reject) => {


})

const postFromNewProposal = proposal =>{
  // convert the subsquid bounty event into data for a polkassembly post 
  // INPUT: an array of events concerning one proposalIndex, which will not certainly have Proposed as first element
  // currently this function is only called for new proposal
  // - but maybe used in future to also accept update posts (array including synthetic events?)
  // OUTPUT: single text string including links, suitable for interpolation into graphQL query
  const { proposalIndex } = proposal[0];
  if (!hasLiveMarket(proposalIndex))
    throw new Error('attempted to create post but market is not live');

  return `Most KSM treasury proposals pass on a tiny minority of KSM holders voting, which means little or no quality control on the\n`
  `proposals that make it through.\n`+
  `But we don't believe in crying over spilt KSM.\n`+
  `If you think this proposal should - or shouldn't - pass, then stake some ZTG on the outcome and start convincing people\n`+
  `The Futarchy bot has created a market at ${markets.deployed.live.link} \n`+
  `\n`+
  postContents[Math.floor(Math.random()*postContents.length)]+
  `\n`  
}

const isCloseToEnding = proposal =>{
  // Need to scrape data, eg, from Subsquare for this one
  // parses subsquid state/ subsquare api/ etc. to report if proposal is 'close' to ending 
  // (eg if it would end if 20% more votes were added, or if were to stay as is for 48 hours)
  // quick and dirty version - check if <36 hours before end of treshold period
}
    
// toDos is just an object containing { proposalsWithNews, newCloseToEndingBounties }
const performActions= async toDos=> {
  if (toDos) {
    if (!polkassemblyClient.isActive())
    await polkassemblyClient.setToken();
  }
  const { proposalsWithNews, newCloseToEndingBounties } = toDos;
  const newProposals = proposalsWithNews
    .filter(proposal=> proposal.events[0].eventName==='Transfer.Proposed')
    .map(marketFromNewProposal)
    .forEach(async proposal=> {
      // proposal.description is a Promise resolving to string
      // use it with catch and recursive (?) timeout Promise logic to retry if (Timeout) error thrown
      // console.log(`Waiting (5000ms) for polkassembly page for referendum ${proposalIndex}`);
      // console.log('Setting a timeout to try again');
      // // No-one's gonna tell me not to set object properties on an array :P
      // proposal.timeout = (proposal.timeout || 15000) * 2;
      // // TODO: but probably should set an upper limit on that timeout ;
      
      await proposal.description;
      doCreateMarket(proposal)
        .then(market=> {
          // assuming market was successfully created..
          markets.deployed.live.push(market);
          const newPost = postFromNewProposal(proposal);
          doCreatePost(newPost)
            .then()
            .catch(e=>{
              console.log(e);
              polkassemblyPosts.todo.push(newPost); 
            });
        })
        .catch(e=> {
          console.log(e);
          markets.todo.push(proposal);

        });
    })
}

const behaviourFromProposal = newProposalEvents=> {
  if (newProposalEvents.length !== 1) {
    const propIndex = newProposalEvents[0].proposalIndex;
    switch (newProposalEvents[0].eventName) {
      case 'Treasury.Proposed': 
        return 'postNewProposal'
      case 'Treasury.Awarded': {
        if (isKnownProposal(propIndex))
          if (markets.deployed.live[propIndex]) 
            return 'postWeHaveWinner'
        break;
      }
      case 'Treasury.Rejected': {
        if (isKnownProposal(propIndex))
          if (markets.deployed.live[propIndex]) 
            return 'postWeHaveWinner'
        break;
      }
      case 'Treasury.SpendApproved': {
        if (isKnownProposal(propIndex))
          if (markets.deployed.live[propIndex]) 
            return 'postWeHaveWinner'
        break;
      }
      default: return null
    }
  }
  
  // newProposalEvents.length !== 1, therefore should be >1
  if (newProposalEvents[0].eventName === 'Treasury.Proposed') {
    if (newProposalEvents.some(event=>
      ['Treasury.Awarded', 'Treasury.Rejected', 'Treasury.SpendApproved']
      .includes(event.eventName))) { 
        // We missed it.
        // Posting a message without further research risks being spammy, so let's do nothing.
        return null
      }
    // In this version, there's nothing interesting more to do with the history of the proposal's events.
    // Show's over, nothing to see..
    return null
  }

  // Other behaviour to define for other events...
}


const isKnownProposal = proposalIndex=> 
  Boolean(knownProposals[proposalIndex]);

const hasLiveMarket = proposalIndex=> 
  Boolean(markets.deployed.live[proposalIndex]);
 
[263,264,290,92]
  .forEach(id=>{
    polkassemblyClient.get.title(id)
      .then(title=> {console.log({id, title});})

  })


findTriggers()
  .then(performActions);

setInterval(()=>{
findTriggers()
  .then(performActions);
}, 5*60*1000);


// USAGE example (OLD ZeitgeistManager)

// const ztgManager = new ZeitgeistManager();

// // ztgManager.getAllMarketIds()
// //     .then(console.log)
// //     .catch(console.error)
// //     .finally(() => process.exit());

// ztgManager.createCategoricalMarket()
//     .then(marketDataIdString => console.log(marketDataIdString))
//     .catch(console.error)

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
