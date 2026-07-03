import { controller, httpGet, httpPost, requestParam } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController";
import { Download } from "../models";
import { Environment } from "../helpers";
import { HubspotHelper } from "../helpers/HubspotHelper";

@controller("/downloads")
export class DownloadController extends LessonsBaseController {
  /*
    @httpGet("/updateHubspot")
    public async addHubspot(req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
      return this.actionWrapperAnon(req, res, async () => {
        const data = await this.repositories.download.getDownloadCounts();
        for (const d of data) {
          const comp = await HubspotHelper.lookupCompanByChurchId(d.churchId);
          if (comp) {
            const downloadDate = new Date(d.lastDownload).toISOString().split('T')[0];
            await HubspotHelper.setProperties(comp.id, { lessons_downloaded: d.downloadCount, last_lesson_downloaded: downloadDate });
          }
        }
      });
    }
  */

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Download[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async () => {
      const promises: Promise<Download>[] = [];
      req.body.forEach(download => {
        if (!download.id) {
          download.ipAddress = (req.headers["x-forwarded-for"] || req.socket.remoteAddress).toString().split(",")[0];
          download.downloadDate = new Date();
        }
        // Sanitize empty strings to undefined so they are stored as NULL
        if (download.userId === "") download.userId = undefined;
        if (download.churchId === "") download.churchId = undefined;
        promises.push(this.repositories.download.save(download));
      });
      const result = await Promise.all(promises);
      // Only update HubSpot/Mautic if there's a valid churchId
      if (req.body[0].churchId && req.body[0].churchId.trim() !== "") {
        await this.updateHubspot(req.body[0].churchId);
        this.updateMautic(req.body[0].churchId).catch(() => {}); // fire and forget — never block a download
      }
      return result;
    });
  }

  private async updateHubspot(churchId: string) {
    if (Environment.hubspotKey && churchId && churchId.trim() !== "") {
      const countRow = await this.repositories.download.getDownloadCount(churchId);
      if (!countRow || !countRow.downloadCount) return;
      const downloadDate = new Date(countRow.lastDownload).toISOString().split("T")[0];
      const properties = { lessons_downloaded: countRow.downloadCount, last_lesson_downloaded: downloadDate };
      const company = await HubspotHelper.lookupCompanByChurchId(churchId);
      // Use company.id instead of churchId when setting properties
      if (company) await HubspotHelper.setProperties(company.id, properties);
    }
  }

  private async updateMautic(churchId: string) {
    if (!Environment.mauticUrl || !Environment.mauticUser || !Environment.mauticPassword) return;
    try {
      const countRow = await this.repositories.download.getDownloadCount(churchId);
      if (!countRow || !countRow.downloadCount) return;
      const authHeader = "Basic " + Buffer.from(`${Environment.mauticUser}:${Environment.mauticPassword}`).toString("base64");
      // The company church-id field alias written by MauticHelper.register() is "companychurchid"
      const search = await fetch(`${Environment.mauticUrl}/api/companies?search=companychurchid:${churchId}&limit=1`, { headers: { Authorization: authHeader } });
      const data: any = await search.json();
      const companies = Object.values(data.companies || {}) as any[];
      if (!companies.length) return;
      await fetch(`${Environment.mauticUrl}/api/companies/${companies[0].id}/edit`, {
        method: "PATCH",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          lessons_last_download: new Date(countRow.lastDownload).toISOString(),
          lessons_download_count: countRow.downloadCount
        })
      });
    } catch {
      // Never block a download because Mautic is unavailable
    }
  }

  @httpGet("/:programId/geo")
  public async geoData(@requestParam("programId") programId: string, req: express.Request, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      const program = await this.repositories.program.load(au.churchId, programId);
      if (!program) return this.denyAccess(["Access denied"]);
      else {
        const startDate = new Date(req.query.startDate.toString());
        const endDate = new Date(req.query.endDate.toString());
        endDate.setDate(endDate.getDate() + 1);
        endDate.setSeconds(endDate.getSeconds() - 1);
        return await this.repositories.download.geo(programId, startDate, endDate);
      }
    });
  }

  @httpGet("/:programId/studies")
  public async programStudies(@requestParam("programId") programId: string, req: express.Request, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      const program = await this.repositories.program.load(au.churchId, programId);
      if (!program) return this.denyAccess(["Access denied"]);
      else {
        const startDate = new Date(req.query.startDate.toString());
        const endDate = new Date(req.query.endDate.toString());
        endDate.setDate(endDate.getDate() + 1);
        endDate.setSeconds(endDate.getSeconds() - 1);
        return await this.repositories.download.countsByStudy(programId, startDate, endDate);
      }
    });
  }

  @httpGet("/:programId/churches")
  public async programChurches(@requestParam("programId") programId: string, req: express.Request, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      const program = await this.repositories.program.load(au.churchId, programId);
      if (!program) return this.denyAccess(["Access denied"]);
      else {
        const startDate = new Date(req.query.startDate.toString());
        const endDate = new Date(req.query.endDate.toString());
        endDate.setDate(endDate.getDate() + 1);
        endDate.setSeconds(endDate.getSeconds() - 1);
        return await this.repositories.download.uniqueChurches(programId, startDate, endDate);
      }
    });
  }
}
