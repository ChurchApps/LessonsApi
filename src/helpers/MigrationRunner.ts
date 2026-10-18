import * as fs from "fs";
import * as path from "path";
import { pathToFileURL } from "url";
import { Migrator, type Migration, type MigrationProvider } from "kysely";
import { getDb } from "../db";

export interface MigrationStatus {
  applied: number;
  pending: string[];
  /** kysely_migration is empty although migrations exist - nothing may run. */
  noHistory: boolean;
}

export interface MigrateResult {
  ok: boolean;
  applied: string[];
  pending: string[];
  failed?: string;
  error?: string;
}

/**
 * Runs tools/migrations from inside the Lambda - for production, whose database only
 * accepts connections from the VPC the Lambda runs in. Same Kysely migrator and the same
 * kysely_migration table as `yarn migrate`, so the two never disagree.
 *
 * Deployed: the build compiles tools/migrations to dist/_migrations (tsconfig.migrations.json).
 * Local dev (tsx): the .ts sources in tools/migrations.
 */
export class MigrationRunner {
  static root(): string | null {
    const base = process.env.LAMBDA_TASK_ROOT || process.cwd();
    for (const candidate of [path.join(base, "dist/_migrations/tools/migrations"), path.join(base, "tools/migrations")]) {
      if (fs.existsSync(candidate)) return candidate;
    }
    return null;
  }

  private static migrator(): Migrator {
    const folder = this.root();
    if (!folder) throw new Error("Migration files are not in this build");
    const provider: MigrationProvider = {
      async getMigrations() {
        const out: Record<string, Migration> = {};
        for (const file of fs.readdirSync(folder).filter((f) => /\.(js|ts)$/.test(f) && !f.endsWith(".d.ts")).sort()) {
          out[file.replace(/\.(js|ts)$/, "")] = (await import(pathToFileURL(path.join(folder, file)).href)) as Migration;
        }
        return out;
      }
    };
    return new Migrator({ db: getDb(), provider });
  }

  static async status(): Promise<MigrationStatus> {
    const all = await this.migrator().getMigrations();
    const done = all.filter((m) => m.executedAt);
    return { applied: done.length, pending: all.filter((m) => !m.executedAt).map((m) => m.name), noHistory: all.length > 0 && done.length === 0 };
  }

  /**
   * Apply every pending migration, oldest first; stops at the first failure.
   * Refuses a database with no migration history: its tables were built some other way,
   * and "pending" would mean replaying the initial schema over live tables. Record the
   * applied migrations in kysely_migration first.
   */
  static async run(): Promise<MigrateResult> {
    try {
      const before = await this.status();
      if (before.noHistory) {
        return { ok: false, applied: [], pending: before.pending, error: "No migration history in this database (kysely_migration is empty), so nothing was run. Record the already-applied migrations in kysely_migration first." };
      }
      const { error, results } = await this.migrator().migrateToLatest();
      const applied = (results || []).filter((r) => r.status === "Success").map((r) => r.migrationName);
      const failed = (results || []).find((r) => r.status === "Error")?.migrationName;
      const after = await this.status();
      return { ok: !error, applied, pending: after.pending, failed, error: error ? (error as any)?.message || String(error) : undefined };
    } catch (e: any) {
      return { ok: false, applied: [], pending: [], error: e?.message || String(e) };
    }
  }
}
