import { AwsHelper, EnvironmentBase } from "@churchapps/apihelper";

export class Environment extends EnvironmentBase {
  static transcodePipeline: string;
  static transcodePreset: string;
  static ipGeoKey: string;
  static vimeoToken: string;
  static hubspotKey: string;
  static mauticUrl: string;
  static mauticUser: string;
  static mauticPassword: string;

  static async init(environment: string) {
    const data = await this.initBase(environment, { appName: "lessonsApi", fileMap: { selfhost: "selfhost.json" } });

    this.contentRoot = process.env.CONTENT_ROOT || this.contentRoot;

    this.transcodePipeline = data.transcodePipeline;
    this.transcodePreset = data.transcodePreset;

    if (environment === "selfhost") {
      this.hubspotKey = process.env.HUBSPOT_KEY || "";
      this.ipGeoKey = process.env.IP_GEO_KEY || "";
      this.vimeoToken = process.env.VIMEO_TOKEN || "";
      this.mauticUrl = process.env.MAUTIC_URL || "";
      this.mauticUser = process.env.MAUTIC_USER || "";
      this.mauticPassword = process.env.MAUTIC_PASSWORD || "";
    } else {
      this.hubspotKey = process.env.HUBSPOT_KEY || (await AwsHelper.readParameter(`/${environment}/hubspotKey`));
      this.ipGeoKey = process.env.IP_GEO_KEY || (await AwsHelper.readParameter(`/${environment}/ipGeoKey`));
      this.vimeoToken = process.env.VIMEO_TOKEN || (await AwsHelper.readParameter(`/${environment}/vimeoToken`));
      this.mauticUrl = process.env.MAUTIC_URL || (await AwsHelper.readParameter(`/${environment}/mauticUrl`));
      this.mauticUser = process.env.MAUTIC_USER || (await AwsHelper.readParameter(`/${environment}/mauticUser`));
      this.mauticPassword = process.env.MAUTIC_PASSWORD || (await AwsHelper.readParameter(`/${environment}/mauticPassword`));
    }
  }
}
