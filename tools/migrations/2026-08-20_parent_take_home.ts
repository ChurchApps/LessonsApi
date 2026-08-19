import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("lessons").addColumn("bottomLine", sql`varchar(500) CHARACTER SET utf8mb4`).execute();
  await db.schema.alterTable("lessons").addColumn("verse", sql`varchar(255) CHARACTER SET utf8mb4`).execute();
  await db.schema.alterTable("lessons").addColumn("parentQuestion", sql`varchar(500) CHARACTER SET utf8mb4`).execute();
  await db.schema.alterTable("lessons").addColumn("parentNote", sql`text CHARACTER SET utf8mb4`).execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("lessons").dropColumn("parentNote").execute();
  await db.schema.alterTable("lessons").dropColumn("parentQuestion").execute();
  await db.schema.alterTable("lessons").dropColumn("verse").execute();
  await db.schema.alterTable("lessons").dropColumn("bottomLine").execute();
}
