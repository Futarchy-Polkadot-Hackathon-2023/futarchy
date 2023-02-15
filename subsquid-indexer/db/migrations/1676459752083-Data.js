module.exports = class Data1676459752083 {
    name = 'Data1676459752083'

    async up(db) {
        await db.query(`CREATE TABLE "account" ("id" character varying NOT NULL, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`)
        await db.query(`CREATE TABLE "proposal" ("id" character varying NOT NULL, "block_number" integer NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "event_name" text, "proposal_index" integer, "extrinsic_id" text, "beneficiary" text, "budget_remaining" numeric, "fee" numeric, CONSTRAINT "PK_ca872ecfe4fef5720d2d39e4275" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_31e576190c59080227d877a36f" ON "proposal" ("block_number") `)
        await db.query(`CREATE INDEX "IDX_353c7f025ae061d2e6f273e80e" ON "proposal" ("timestamp") `)
        await db.query(`CREATE INDEX "IDX_58728266b15337b722ab0318ad" ON "proposal" ("proposal_index") `)
        await db.query(`CREATE INDEX "IDX_4ed4d95c64c9fb1dd8fe41fd8c" ON "proposal" ("extrinsic_id") `)
        await db.query(`CREATE INDEX "IDX_7ae5435545e6097d72114371b0" ON "proposal" ("beneficiary") `)
    }

    async down(db) {
        await db.query(`DROP TABLE "account"`)
        await db.query(`DROP TABLE "proposal"`)
        await db.query(`DROP INDEX "public"."IDX_31e576190c59080227d877a36f"`)
        await db.query(`DROP INDEX "public"."IDX_353c7f025ae061d2e6f273e80e"`)
        await db.query(`DROP INDEX "public"."IDX_58728266b15337b722ab0318ad"`)
        await db.query(`DROP INDEX "public"."IDX_4ed4d95c64c9fb1dd8fe41fd8c"`)
        await db.query(`DROP INDEX "public"."IDX_7ae5435545e6097d72114371b0"`)
    }
}
