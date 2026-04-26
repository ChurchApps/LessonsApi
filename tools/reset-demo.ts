import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { initializeDatabase } from "./initdb.js";

// Avoid blocking AWS parameter-store lookups in Environment.init for these
// optional secrets when running reset-demo locally.
process.env.HUBSPOT_KEY ||= "demo-placeholder";
process.env.IP_GEO_KEY ||= "demo-placeholder";
process.env.VIMEO_TOKEN ||= "demo-placeholder";

const ALLOWED_ENVIRONMENTS = ["demo", "dev"] as const;
const ALLOWED_HOST_SUBSTRINGS = ["demo", "localhost"] as const;

function refuse(message: string): never {
  console.error("\n========================================");
  console.error("reset-demo refused to run.");
  console.error(message);
  console.error("========================================\n");
  process.exit(1);
}

function parseConnectionString(connectionString: string) {
  const firstSplit = connectionString.replace("mysql://", "").split("@");
  const userPass = firstSplit[0].split(":");
  const userName = userPass[0];
  const password = userPass[1];

  const hostDb = firstSplit[1].split("/");
  const database = hostDb[1];
  const hostPort = hostDb[0].split(":");
  const host = hostPort[0];
  const port = hostPort[1] ? parseInt(hostPort[1], 10) : 3306;

  return { host, port, database, userName, password };
}

async function main() {
  dotenv.config();

  const env = process.env.APP_ENV;
  if (!env || !ALLOWED_ENVIRONMENTS.includes(env as (typeof ALLOWED_ENVIRONMENTS)[number])) {
    refuse(
      `APP_ENV is "${env ?? "<unset>"}" but must be one of: ${ALLOWED_ENVIRONMENTS.join(", ")}.\n` +
        `Set APP_ENV=demo or APP_ENV=dev in LessonsApi/.env before running tests.`
    );
  }

  const connString = process.env.CONNECTION_STRING;
  if (!connString) {
    refuse("CONNECTION_STRING is not set. Add it to LessonsApi/.env.");
  }

  let parsed;
  try {
    parsed = parseConnectionString(connString);
  } catch (err) {
    refuse(`CONNECTION_STRING could not be parsed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const hostMatches = ALLOWED_HOST_SUBSTRINGS.some((sub) => parsed.host.includes(sub));
  if (!hostMatches) {
    refuse(
      `CONNECTION_STRING host "${parsed.host}" must contain one of: ${ALLOWED_HOST_SUBSTRINGS.join(", ")}.\n` +
        `Point CONNECTION_STRING at a localhost or demo host in LessonsApi/.env.`
    );
  }

  console.log(
    `reset-demo: APP_ENV=${env}, host=${parsed.host}, db=${parsed.database}. Proceeding.\n`
  );

  // Drop and recreate the database, then run migrations + load demo data.
  const adminConn = await mysql.createConnection({
    host: parsed.host,
    port: parsed.port,
    user: parsed.userName,
    password: parsed.password,
  });

  try {
    console.log(`  Dropping ${parsed.database}...`);
    await adminConn.execute(`DROP DATABASE IF EXISTS \`${parsed.database}\``);
    console.log(`  Creating ${parsed.database}...`);
    await adminConn.execute(`CREATE DATABASE \`${parsed.database}\``);
  } finally {
    await adminConn.end();
  }

  await initializeDatabase({});

  console.log("\nDatabase reset completed!");
}

main().catch((err) => {
  console.error("reset-demo failed:", err);
  process.exit(1);
});
