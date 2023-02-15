import { resolve } from "path"

const squidQuery = {
  latestBlock : ()=> new Promise ((res,rej)=> {

    resolve(0);
  }),

  allProposalEvents : ()=> new Promise ((res,rej)=> {

    resolve([]);
  }),

  byProposalIndexes : ()=> new Promise ((res,rej)=> {

    resolve([]);
  })

}

export default squidQuery