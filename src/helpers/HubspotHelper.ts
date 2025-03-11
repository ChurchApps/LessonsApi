// import Hubspot from "@hubspot/api-client";
import { Environment } from ".";
import { PublicObjectSearchRequest } from "@hubspot/api-client/lib/codegen/crm/companies";

export class HubspotHelper {
  static contactId: string = "";
  static companyId: string = "";


  private static getClient = () => {
    const hubspot = require('@hubspot/api-client')
    const client = new hubspot.Client({ accessToken: Environment.hubspotKey })
    return client;
  }

  static lookupCompany = async (query: string) => {
    const client = this.getClient();
    const req: PublicObjectSearchRequest = { query, limit: 1, after: "", sorts: [], properties: [], filterGroups: [] }
    const response = await client.crm.companies.searchApi.doSearch(req);
    return response.results[0];
  }

  static setProperties = async (companyId: string, properties: any) => {
    const client = this.getClient();
    try {
      const response = await client.crm.companies.basicApi.update(companyId, { properties });
      return response;
    } catch (error) {
      console.log(error);
      return { error };
    }
  }




}