import type { PublicObjectSearchRequest, SimplePublicObjectInput } from "@hubspot/api-client/lib/codegen/crm/companies";
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
    const req = { filterGroups: [{ filters: [{ propertyName: "church_id", operator: "EQ", value: churchId }] }], limit: 1 } as PublicObjectSearchRequest;
    const response = await client.crm.companies.searchApi.doSearch(req);
    return response.results[0];
  };

  static setProperties = async (companyId: string, properties: Record<string, unknown>) => {
    const client = await this.getClient();
    try {
      const response = await client.crm.companies.basicApi.update(companyId, { properties } as SimplePublicObjectInput);
      return response;
    } catch (error) {
      console.log(error);
      return { error };
    }
  };
}
