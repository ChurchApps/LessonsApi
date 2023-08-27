import "reflect-metadata";
import dotenv from "dotenv";
import { Pool } from "@churchapps/apihelper"
import { Environment } from "../src/helpers/Environment";
import { DBCreator } from "@churchapps/apihelper"

const init = async () => {
  dotenv.config();
  Environment.init(process.env.APP_ENV);
  console.log("Connecting");
  Pool.initPool();

  const tables: { title: string, file: string }[] = [
    { title: "Actions", file: "actions.mysql" },
    { title: "Assets", file: "assets.mysql" },
    { title: "Bundles", file: "bundles.mysql" },
    { title: "Classrooms", file: "classrooms.mysql" },
    { title: "ExternalVideos", file: "externalVideos.mysql" },
    { title: "Files", file: "files.mysql" },
    { title: "Lessons", file: "lessons.mysql" },
    { title: "Programs", file: "programs.mysql" },
    { title: "Providers", file: "providers.mysql" },
    { title: "Resources", file: "resources.mysql" },
    { title: "Roles", file: "roles.mysql" },
    { title: "Schedules", file: "schedules.mysql" },
    { title: "Sections", file: "sections.mysql" },
    { title: "Studies", file: "studies.mysql" },
    { title: "Variants", file: "variants.mysql" },
    { title: "Venues", file: "venues.mysql" },
    { title: "Labelled Bundles", file: "labelledBundles.mysql" },
  ];

  await initTables("Access", tables);
}

const initTables = async (displayName: string, tables: { title: string, file: string }[]) => {
  console.log("");
  console.log("SECTION: " + displayName);
  for (const table of tables) await DBCreator.runScript(table.title, "./tools/dbScripts/" + table.file, false);
}

init()
  .then(() => { console.log("Database Created"); process.exit(0); })
  .catch((ex) => {
    console.log(ex);
    console.log("Database not created due to errors");
    process.exit(0);
  });