import {lookupArchive} from "@subsquid/archive-registry"
import * as ss58 from "@subsquid/ss58"
import {BatchContext, BatchProcessorItem, SubstrateBatchProcessor} from "@subsquid/substrate-processor"
import {Store, TypeormDatabase} from "@subsquid/typeorm-store"
import {In} from "typeorm"
import {Account, Proposal} from "./model"


const processor = new SubstrateBatchProcessor()
    .setDataSource({
        // Lookup archive by the network name in the Subsquid registry
        //archive: lookupArchive("kusama", {release: "FireSquid"})

        // Use archive created by archive/docker-compose.yml
        archive: lookupArchive('kusama', {release: 'FireSquid'} )
    })
    .setBlockRange({ from: 15426015 })    // Referendum executed: #244 Runtime v9320 Upgrade On Kusama Network
    // .setBlockRange({ from: 6998400 }) 
    .addEvent('Treasury.Proposed', {
        data: {
            event: {
                args: true,
                extrinsic: {
                    hash: true,
                    fee: true
                },
                call: {
                    args: true,
                    error: true
                }
            }
        }
    } as const)
    .addEvent('Treasury.Awarded', {
        data: {
            event: {
                args: true
            }
        }
    } as const)
    .addEvent('Treasury.SpendApproved', {
        data: {
            event: {
                args: true,
                extrinsic: {
                    hash: true,
                    fee: true
                },
                // // Why is .call null in SpendApproved?
                // call: {
                //     args: true,
                //     error: true
                // }
            }
        }
    } as const)
    .addEvent('Treasury.Spending', {
        data: {
            event: {
                args: true
            }
        }
    } as const)


type Item = BatchProcessorItem<typeof processor>
type Ctx = BatchContext<Store, Item>


processor.run(new TypeormDatabase(), async ctx => {
    const bountiesData = getBounties(ctx)

    const accountIds = new Set<string>()
    const accounts = await ctx.store.findBy(Account, {id: In([...accountIds])}).then(accounts => {
        return new Map(accounts.map(a => [a.id, a]))
    })

    const bountiesToStore: Proposal[] = []

    for (let b of bountiesData) {
        const {
            id, blockNumber, timestamp, eventName, proposalIndex, 
            extrinsicId, beneficiary, // approve, // proposer?: 
            fee 
        } = b

        // let proposer = getAccount(accounts, b.proposer)
        bountiesToStore.push(new Proposal({
            id,
            blockNumber,
            timestamp,
            eventName,
            proposalIndex,
            extrinsicId,
            // approve,
            beneficiary,
            // proposer
            fee
        }))
    }

    await ctx.store.save(Array.from(accounts.values()))
    await ctx.store.insert(bountiesToStore)
})

interface TreasuryEvent {
    id: string
    eventName: string
    blockNumber: number
    timestamp: Date
    proposalIndex?: number
    amount?: bigint
    extrinsicId?: string
    // approve: boolean
    beneficiary?: string
    // proposer?: string
    budgetRemaining?: bigint
    fee?: bigint
}


// NB These loops will run for every call and event, not just Bounty -related ones.
// and they will run once for the event, then once for the call.
function getBounties(ctx: Ctx): TreasuryEvent[] {
    // const blockBountiesLength = 0;
    const bounties: TreasuryEvent[] = []
    for (const block of ctx.blocks) {
        for (const item of block.items) {

            switch (item.name) {
                case "Treasury.Proposed": {         
                    bounties.push({
                        id: item.event.id,
                        eventName: item.event.name,
                        blockNumber: block.header.height,
                        timestamp: new Date(block.header.timestamp),
                        amount: item.event.call?.args.value,
                        extrinsicId: item.event.extrinsic?.id,
                        proposalIndex: item.event.args.proposalIndex,
                        // TODO: locate item.event.call.args.approve : bool
                        beneficiary: //ss58.codec('kusama').encode(
                            item.event.call?.args.beneficiary.value  ,// TODO: output as ss58 account
                        // ),
                        // proposer: ss58.codec('kusama').encode(rec.proposer),
                        fee: item.event.extrinsic?.fee || 0n
                    })
                    break
                }         
                       
                case "Treasury.Awarded": {
                    bounties.push({
                        id: item.event.id,
                        eventName: item.event.name,
                        blockNumber: block.header.height,
                        timestamp: new Date(block.header.timestamp),
                        amount: item.event.args.award,
                        proposalIndex: item.event.args.proposalIndex,
                        // TODO: locate item.event.call.args.approve : bool
                        beneficiary: //ss58.codec('kusama').encode(
                            item.event.call?.args.beneficiary.value  ,// TODO: output as ss58 account
                        // ),
                        // proposer: ss58.codec('kusama').encode(rec.proposer),
                    })
                    break
                }         
                       
                case "Treasury.SpendApproved": {                
                    bounties.push({
                        id: item.event.id,
                        eventName: item.event.name,
                        blockNumber: block.header.height,
                        timestamp: new Date(block.header.timestamp),
                        amount: item.event.args.amount,
                        extrinsicId: item.event.extrinsic?.id,
                        proposalIndex: item.event.args.proposalIndex,
                        // TODO: locate item.event.call.args.approve : bool
                        beneficiary: //ss58.codec('kusama').encode(
                            item.event.call?.args.beneficiary.value  ,// TODO: output as ss58 account
                        // ),
                        // proposer: ss58.codec('kusama').encode(rec.proposer),
                        fee: item.event.extrinsic?.fee || 0n
                    })
                    break
                }         
                       
                case "Treasury.Spending": {
                    bounties.push({
                        id: item.event.id,
                        eventName: item.event.name,
                        blockNumber: block.header.height,
                        timestamp: new Date(block.header.timestamp),
                        amount: item.event.args.budgetRemaining,
                    })
                    break
                }         
                default:
                    // log, etc.
            }

            // if (blockBountiesLength!==bounties.length) {
            //     console.log(`Last known length was ${blockBountiesLength}. New item (${bounties.length-1}) added to bounties= `, bounties[bounties.length-1])
            //     console.log('\n')
            //     blockBountiesLength = bounties.length               

            // }
        }
    }
    return bounties
}


function getAccount(m: Map<string, Account>, id: string): Account {
    let acc = m.get(id)
    if (acc == null) {
        acc = new Account()
        acc.id = id
        m.set(id, acc)
    }
    return acc
}

// uurgh
function searchItemlikeObjectFor(obj :  any, key : string): number | undefined {
    if (obj[key] !== undefined)
        return obj[key]
    if (obj.args !== undefined && obj.args[key] !== undefined)
        return obj.args[key]
    if (obj.value !== undefined && obj.value[key] !== undefined)
        return obj.value[key]
    if (obj.args !== undefined && obj.args.call !== undefined) {
        const iShallRecurThisOnlyOnce = obj.args.call
        if (iShallRecurThisOnlyOnce.value !== undefined && iShallRecurThisOnlyOnce.value[key] !== undefined)
            return iShallRecurThisOnlyOnce.value[key]            
        if (iShallRecurThisOnlyOnce.value !== undefined && iShallRecurThisOnlyOnce.value.call !== undefined && iShallRecurThisOnlyOnce.value.call.value !== undefined && iShallRecurThisOnlyOnce.value.call.value[key] !== undefined)
        return iShallRecurThisOnlyOnce.value.call.value[key]
    }
}
