import { Environment } from ".";


export class HubspotHelper {
  static contactId: string = "";
  static companyId: string = "";

  private static getClient = async () => {
    const hubspot = await import("@hubspot/api-client");
    const client = new hubspot.Client({ accessToken: Environment.hubspotKey });
    return client;
  };

  static lookupCompanByChurchId = async (churchId: string) => {
    const client = await this.getClient();
    const req: any = { filterGroups: [{ filters: [{ propertyName: "church_id", operator: "EQ", value: churchId }] }], limit: 1 };
    const response = await client.crm.companies.searchApi.doSearch(req);
    return response.results[0];
  };

  static setProperties = async (companyId: string, properties: any) => {
    const client = await this.getClient();
    try {
      const response = await client.crm.companies.basicApi.update(companyId, { properties });
      return response;
    } catch (error) {
      console.log(error);
      return { error };
    }
  };
}
