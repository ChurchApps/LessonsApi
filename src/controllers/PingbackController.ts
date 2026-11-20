import { controller, httpPost } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController";

@controller("/pingback")
export class PingbackController extends LessonsBaseController {
  @httpPost("/")
  public async handleVideoTranscoded(req: express.Request<{}, {}, unknown>, res: express.Response): Promise<unknown> {
    req.headers["content-type"] = req.headers["content-type"] || "application/json";

    return this.actionWrapperAnon(req, res, async () => {
      // LoggingHelper.getCurrent().info(req.body);
      // await LoggingHelper.getCurrent().flush();
    });
  }
}
