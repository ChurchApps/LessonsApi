import { controller, httpPost, interfaces } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"

@controller("/pingback")
export class PingbackController extends LessonsBaseController {

  @httpPost("/")
  public async handleVideoTranscoded(req: express.Request<{}, {}, any>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    req.headers['content-type'] = req.headers['content-type'] || 'application/json';

    console.log("made it to pingback");
    return this.actionWrapperAnon(req, res, async () => {
      console.log("handle video transcoded");
      console.log(req.originalUrl);
      console.log(JSON.stringify(req.query));
      console.log(JSON.stringify(req.body));
      console.log(req.body);
      console.log(req.rawHeaders);
      console.log(JSON.stringify(req));
      // LoggingHelper.getCurrent().info(req.body);
      // await LoggingHelper.getCurrent().flush();
    });
  }

}
