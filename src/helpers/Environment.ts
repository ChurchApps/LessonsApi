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
  static retryDelayMs = 250;

  static async init(environment: string) {
    const data = await this.initBase(environment, { appName: "lessonsApi", fileMap: { selfhost: "selfhost.json" } });
    if (environment !== "selfhost") await this.rereadEmptySecrets(environment.toLowerCase());

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

  // apihelper 0.7.x reads each secret once and turns any SSM error into "". A burst of cold starts gets
  // throttled, and a container left with an empty connection string fails every request, so retry those.
  private static async rereadEmptySecrets(env: string) {
    const secrets: { key: "connectionString" | "jwtSecret" | "encryptionKey"; envVar: string; name: string }[] = [
      { key: "connectionString", envVar: "CONNECTION_STRING", name: `/${env}/lessonsApi/connectionString` },
      { key: "encryptionKey", envVar: "ENCRYPTION_KEY", name: `/${env}/encryptionKey` },
      { key: "jwtSecret", envVar: "JWT_SECRET", name: `/${env}/jwtSecret` }
    ];
    for (const secret of secrets) {
      if (EnvironmentBase[secret.key] || process.env[secret.envVar]) continue;
      let value = "";
      for (let attempt = 1; attempt < 5 && !value; attempt++) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelayMs * 2 ** (attempt - 1) * (0.5 + Math.random())));
        value = await AwsHelper.readParameter(secret.name);
      }
      if (value) EnvironmentBase[secret.key] = value;
      else console.error(`Environment.init: SSM parameter ${secret.name} is still empty after 5 reads`);
    }
  }
}
