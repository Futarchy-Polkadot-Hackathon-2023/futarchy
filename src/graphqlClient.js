import Polkassembly from "./polkassembly.js";
import squidQuery from "../subsquid-indexer/src/queries.mjs";   //redundant
import decodeJwt from "jwt-decode";
import util from "util";

// console.log(decodeJwt);

const polkassemblyClient = new Polkassembly();
polkassemblyClient.setToken()
  .then(console.log);

polkassemblyClient.isActive = ()=> { 
  if (polkassemblyClient.token) {
    try {
      const decoded = decodeJwt(polkassemblyClient.token);
      return decoded.exp*1000 > Date.now();
    } catch(e) {
      return false;
    }
  }
  if (util.inspect(polkassemblyClient.pleaseWait).includes("pending"))
    return false;
  
  throw new Error("Unexpected state in polkassemblyClient - no token");
}

const zeitgeist = {

}

// squidQuery : is imported directly in run.js 
// - re-exported here for completeness but don't add to the squidQuery object here expecting it to have an effect!

export { polkassemblyClient, squidQuery, zeitgeist }
