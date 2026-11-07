const getMigrations = jest.fn();
const migrateToLatest = jest.fn();

jest.mock("kysely", () => ({ Migrator: jest.fn().mockImplementation(() => ({ getMigrations, migrateToLatest })) }));
jest.mock("../../db", () => ({ getDb: () => ({}) }));

import { MigrationRunner } from "../MigrationRunner";

const done = (name: string) => ({ name, executedAt: new Date("2026-09-14") });
const pending = (name: string) => ({ name, executedAt: undefined });

describe("MigrationRunner.run", () => {
  beforeEach(() => {
    getMigrations.mockReset();
    migrateToLatest.mockReset();
  });

  it("applies pending migrations and reports ok", async () => {
    getMigrations
      .mockResolvedValueOnce([done("2026-03-21_initial_schema"), pending("2026-10-01_new")])
      .mockResolvedValueOnce([done("2026-03-21_initial_schema"), done("2026-10-01_new")]);
    migrateToLatest.mockResolvedValue({ results: [{ migrationName: "2026-10-01_new", status: "Success" }] });
    const result = await MigrationRunner.run();
    expect(result).toMatchObject({ ok: true, applied: ["2026-10-01_new"], pending: [] });
  });

  it("reports the failed migration and is not ok", async () => {
    getMigrations.mockResolvedValue([done("2026-03-21_initial_schema"), pending("2026-10-01_bad")]);
    migrateToLatest.mockResolvedValue({ error: new Error("Duplicate column"), results: [{ migrationName: "2026-10-01_bad", status: "Error" }] });
    const result = await MigrationRunner.run();
    expect(result).toMatchObject({ ok: false, failed: "2026-10-01_bad", error: "Duplicate column" });
  });

  it("refuses a database with no migration history", async () => {
    getMigrations.mockResolvedValue([pending("2026-03-21_initial_schema"), pending("2026-08-19_year_plans")]);
    const result = await MigrationRunner.run();
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/No migration history/);
    expect(migrateToLatest).not.toHaveBeenCalled();
  });
});
