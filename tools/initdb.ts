import * as fs from "fs";
import * as path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { Migrator, type MigrationProvider, sql } from "kysely";
import { ensureEnvironment, createKysely, ensureDatabaseExists } from "./kysely-config.js";

// Avoid blocking AWS parameter-store lookups in Environment.init for these
// optional secrets when running initdb locally.
process.env.HUBSPOT_KEY ||= "demo-placeholder";
process.env.IP_GEO_KEY ||= "demo-placeholder";
process.env.VIMEO_TOKEN ||= "demo-placeholder";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEMO_FILE = path.join(__dirname, "dbScripts", "demo.sql");

export interface InitOptions {
  demoOnly?: boolean;
  schemaOnly?: boolean;
}

export async function initializeDatabase(options: InitOptions = {}) {
  await ensureEnvironment();

  console.log("Initializing lessons database...");

  if (!options.demoOnly) {
    await ensureDatabaseExists();
    await runMigrations();
  }

  if (!options.schemaOnly) {
    await loadDemoData();
  }

  console.log("\nDatabase initialized successfully!");
}

async function runMigrations() {
  console.log("  Running migrations...");

  const migrationsPath = path.join(__dirname, "migrations");
  if (!fs.existsSync(migrationsPath)) {
    console.log("  No migrations directory found, skipping schema.");
    return;
  }

  const db = createKysely();

  // Custom MigrationProvider that converts paths to file:// URLs.
  // The built-in FileMigrationProvider calls import() with a raw OS path,
  // which fails on Windows ESM (ERR_UNSUPPORTED_ESM_URL_SCHEME for d:\...).
  const provider: MigrationProvider = {
    async getMigrations() {
      const migrations: Record<string, any> = {};
      const files = (await fs.promises.readdir(migrationsPath)).sort();
      for (const fileName of files) {
        const isMigrationFile =
          fileName.endsWith(".js") ||
          fileName.endsWith(".mjs") ||
          (fileName.endsWith(".ts") && !fileName.endsWith(".d.ts")) ||
          (fileName.endsWith(".mts") && !fileName.endsWith(".d.mts"));
        if (!isMigrationFile) continue;

        const absolutePath = path.join(migrationsPath, fileName);
        const fileUrl = pathToFileURL(absolutePath).href;
        const mod = await import(fileUrl);
        const migration = mod?.default && typeof mod.default.up === "function" ? mod.default : mod;
        if (migration && typeof migration.up === "function") {
          const key = fileName.substring(0, fileName.lastIndexOf("."));
          migrations[key] = migration;
        }
      }
      return migrations;
    },
  };

  const migrator = new Migrator({ db, provider });

  try {
    const { error, results } = await migrator.migrateToLatest();

    results?.forEach((r) => {
      if (r.status === "Success") {
        console.log(`  Applied: ${r.migrationName}`);
      } else if (r.status === "Error") {
        console.error(`  Failed: ${r.migrationName}`);
      }
    });

    if (error) throw error;
    if (!results?.length) console.log("  Already up to date.");
  } finally {
    await db.destroy();
  }
}

async function loadDemoData() {
  if (!fs.existsSync(DEMO_FILE)) {
    console.log("  No demo.sql found, skipping demo data.");
    return;
  }

  console.log("  Loading demo data: demo.sql");
  const sqlContent = fs.readFileSync(DEMO_FILE, "utf8");

  if (sqlContent.includes("-- This file will be populated") || sqlContent.trim().length < 50) {
    console.log("  Skipping placeholder demo.sql");
    return;
  }

  const db = createKysely();
  try {
    const statements = splitSqlStatements(sqlContent);
    for (const statement of statements) {
      const clean = statement.trim();
      if (clean && !clean.startsWith("--")) {
        await sql.raw(clean).execute(db);
      }
    }
  } finally {
    await db.destroy();
  }
}

// Splits a SQL script into statements, treating CREATE PROCEDURE / CREATE FUNCTION
// blocks (delimited with $$) as a single statement.
function splitSqlStatements(sqlText: string): string[] {
  const statements: string[] = [];
  const lines = sqlText.split("\n");
  let current = "";
  let inProcedure = false;
  let procedureContent = "";

  for (const line of lines) {
    const trimmedLine = line.trim().toUpperCase();

    if (line.trim() === "" || line.trim().startsWith("--") || line.trim().startsWith("/*")) continue;

    if (
      trimmedLine.startsWith("CREATE PROCEDURE") ||
      trimmedLine.startsWith("CREATE FUNCTION") ||
      trimmedLine.startsWith("CREATE DEFINER")
    ) {
      inProcedure = true;
      procedureContent = line + "\n";
      continue;
    }

    if (trimmedLine.startsWith("DROP PROCEDURE") || trimmedLine.startsWith("DROP FUNCTION")) {
      statements.push(line);
      continue;
    }

    if (trimmedLine.startsWith("DELIMITER")) continue;

    if (inProcedure) {
      procedureContent += line + "\n";
      if (
        trimmedLine === "END" ||
        trimmedLine === "END;" ||
        trimmedLine === "END$$" ||
        trimmedLine === "END//" ||
        trimmedLine.match(/^END\s*(\/\/|\$\$)/)
      ) {
        let cleanProc = procedureContent.trim();
        cleanProc = cleanProc.replace(/\s*(\/\/|\$\$)\s*$/, "");
        statements.push(cleanProc);
        procedureContent = "";
        inProcedure = false;
      }
    } else {
      current += line + "\n";
      if (line.trim().endsWith(";")) {
        if (current.trim()) {
          statements.push(current.trim());
          current = "";
        }
      }
    }
  }

  if (current.trim()) statements.push(current.trim());
  if (procedureContent.trim()) statements.push(procedureContent.trim());

  return statements.filter((stmt) => stmt.length > 0);
}

function parseArguments(): InitOptions {
  const args = process.argv.slice(2);
  const options: InitOptions = {};
  for (const arg of args) {
    if (arg === "--demo-only") options.demoOnly = true;
    else if (arg === "--schema-only") options.schemaOnly = true;
  }
  return options;
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  initializeDatabase(parseArguments()).catch((err) => {
    console.error("Database initialization failed:", err);
    process.exit(1);
  });
}
