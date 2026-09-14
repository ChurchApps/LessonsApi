import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("yearPlans").addColumn("startMonth", "integer").execute();
  await db.schema.alterTable("yearPlanWeeks").addColumn("anchor", sql`varchar(20)`).execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("yearPlanWeeks").dropColumn("anchor").execute();
  await db.schema.alterTable("yearPlans").dropColumn("startMonth").execute();
}
