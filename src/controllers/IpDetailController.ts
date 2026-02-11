import { controller, httpPost } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController";
import { GeoHelper } from "../helpers";

@controller("/ipDetails")
export class IpDetailController extends LessonsBaseController {
  @httpPost("/lookup")
  public async save(req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      await GeoHelper.lookupMissing();
    });
  }
}
