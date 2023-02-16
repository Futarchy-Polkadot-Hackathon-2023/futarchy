// import squidQuery from "../subsquid-indexer/src/queries.mjs";
import { polkassemblyClient, squidQuery, zeitgeist } from "./graphqlClient.js";

console.log(squidQuery);

polkassemblyClient.setToken()
  .then(currentToken=> {
    console.log(currentToken);
    console.log(polkassemblyClient);
    console.log(polkassemblyClient.isActive());
    // setTimeout(()=>{ console.log('>>> after 2s:', polkassemblyClient.isActive(), '<<<'); }, 2000)
    
  })




