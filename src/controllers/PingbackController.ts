import { controller, httpPost, interfaces } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"

@controller("/pingback")
export class PingbackController extends LessonsBaseController {

  @httpPost("/")
  public async handleVideoTranscoded(req: express.Request<{}, {}, any>, res: express.Response): Promise<any> {
    req.headers['content-type'] = req.headers['content-type'] || 'application/json';

    return this.actionWrapperAnon(req, res, async () => {
      // LoggingHelper.getCurrent().info(req.body);
      // await LoggingHelper.getCurrent().flush();
    });
  }

}
