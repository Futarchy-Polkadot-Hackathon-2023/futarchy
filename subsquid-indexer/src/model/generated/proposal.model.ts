import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class Proposal {
    constructor(props?: Partial<Proposal>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @Column_("int4", {nullable: false})
    blockNumber!: number

    @Index_()
    @Column_("timestamp with time zone", {nullable: false})
    timestamp!: Date

    @Column_("text", {nullable: true})
    eventName!: string | undefined | null

    @Index_()
    @Column_("int4", {nullable: true})
    proposalIndex!: number | undefined | null

    @Index_()
    @Column_("text", {nullable: true})
    extrinsicId!: string | undefined | null

    @Index_()
    @Column_("text", {nullable: true})
    beneficiary!: string | undefined | null

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
    budgetRemaining!: bigint | undefined | null

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
    fee!: bigint | undefined | null
}
