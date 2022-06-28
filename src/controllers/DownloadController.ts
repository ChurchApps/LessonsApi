import { controller, httpGet, httpPost, interfaces, requestParam } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Download } from "../models"


@controller("/downloads")
export class DownloadController extends LessonsBaseController {

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
      return result;
    });
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
