# Squid indexer demo

A starter [Squid](https://subsquid.io) project.
It accumulates [kusama](https://kusama.network) bounty events and serves them via GraphQL API.

## Summary
- [Based on ](https://github.com/subsquid-labs/squid-substrate-template)
- [Main docs for subsquid templates in general](https://docs.subsquid.io/basics/squid-development/)
- [(but read in conjunction with these docs)](https://github.com/subsquid/squid-evm-template)

## Prerequisites

* node 16.x
* docker
* npm -- note that `yarn` package manager is not supported

## Try it out

```bash
# 0. have docker running

# 1. installation
npm run update
npm ci

# 2. Set the location of a perisitent volume for storage in docker-compose.yml

# 3. Clean old files if anything has been changed
sqd down
sqd migration:clean

# 4. Start target Postgres database and detach
sqd up

# 5. prepare db and processor
sqd codegen
sqd migration:generate

# 6. pick a segment of the kusama chain, eg from https://kusama.subscan.io/event?module=bounties&event=all , that you wish to index and edit
    .setBlockRange({ from: <myStartingBlock> })
#    in:
     src/processor.ts
# or just delete that line to index the whole chain (approx 6-8 hours)

# 7. Start the processor
sqd process

# 8. The command above will block the terminal
#    being busy with fetching the chain data, 
#    transforming and storing it in the target database.
#
#    To start the graphql server open the separate terminal
#    and run
sqd serve

# 9. Try out queries in a local graphQL explorer on http://localhost:4350/graphql

```
 [local graphQL explorer](http://localhost:4350/graphql)