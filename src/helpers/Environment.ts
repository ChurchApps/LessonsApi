import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AwsHelper, EnvironmentBase } from "@churchapps/apihelper";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class Environment extends EnvironmentBase {
  static transcodePipeline: string;
  static transcodePreset: string;
  static ipGeoKey: string;
  static vimeoToken: string;
  static hubspotKey: string;

  static async init(environment: string) {
    let file = "dev.json";
    if (environment === "demo") file = "demo.json";
    if (environment === "staging") file = "staging.json";
    if (environment === "prod") file = "prod.json";

    const relativePath = "../../config/" + file;
    const physicalPath = path.resolve(__dirname, relativePath);

    const json = fs.readFileSync(physicalPath, "utf8");
    const data = JSON.parse(json);
    await this.populateBase(data, "lessonsApi", environment);

    this.transcodePipeline = data.transcodePipeline;
    this.transcodePreset = data.transcodePreset;
    this.hubspotKey = process.env.HUBSPOT_KEY || (await AwsHelper.readParameter(`/${environment}/hubspotKey`));
    this.ipGeoKey = process.env.IP_GEO_KEY || (await AwsHelper.readParameter(`/${environment}/ipGeoKey`));
    this.vimeoToken = process.env.VIMEO_TOKEN || (await AwsHelper.readParameter(`/${environment}/vimeoToken`));
  }
}
