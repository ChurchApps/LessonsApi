import { controller, httpPost } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController";
import { GeoHelper } from "../helpers";
import { Permissions } from "../helpers/Permissions";

@controller("/ipDetails")
export class IpDetailController extends LessonsBaseController {
  @httpPost("/lookup")
  public async save(req: express.Request<{}, {}, []>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      await GeoHelper.lookupMissing();
      return this.json({});
    });
  }
}
