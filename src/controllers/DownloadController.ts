import { controller, httpGet, httpPost, interfaces, requestParam } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Download } from "../models"
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
          console.log(d.churchId, comp);
          if (comp) {
            const downloadDate = new Date(d.lastDownload).toISOString().split('T')[0];
            await HubspotHelper.setProperties(comp.id, { lessons_downloaded: d.downloadCount, last_lesson_downloaded: downloadDate });
          }
        }
      });
    }
  */

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Download[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async () => {
      const promises: Promise<Download>[] = [];
      req.body.forEach(download => {
        if (!download.id) {
          download.ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress).toString().split(",")[0];
          download.downloadDate = new Date();
        }
        promises.push(this.repositories.download.save(download));
      });
      const result = await Promise.all(promises);
      await this.updateHubspot(req.body[0].churchId);
      return result;
    });
  }

  private async updateHubspot(churchId: string) {
    if (Environment.hubspotKey) {
      const countRow = await this.repositories.download.getDownloadCount(churchId);
      if (!countRow) return;
      const downloadDate = new Date(countRow.lastDownload).toISOString().split('T')[0];
      const properties = { lessons_downloaded: countRow.downloadCount, last_lesson_downloaded: downloadDate };
      const company = await HubspotHelper.lookupCompanByChurchId(churchId);
      if (company) await HubspotHelper.setProperties(churchId, properties);
    }
  }

  @httpGet("/:programId/geo")
  public async geoData(@requestParam("programId") programId: string, req: express.Request, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
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
    return this.actionWrapper(req, res, async (au) => {
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
    return this.actionWrapper(req, res, async (au) => {
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
