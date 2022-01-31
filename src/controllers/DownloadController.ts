import { controller, httpPost, interfaces } from "inversify-express-utils";
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


}
