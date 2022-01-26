import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Customization } from "../models"
import { Permissions } from '../helpers/Permissions'

@controller("/customizations")
export class CustomizationController extends LessonsBaseController {

  @httpGet("/venue/:venueId")
  public async getForVenue(@requestParam("venueId") venueId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.customization.loadByVenueId(au.churchId, venueId);
    });
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.customization.load(au.churchId, id)
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Customization[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.schedules.edit)) return this.json({}, 401);
      else {
        const promises: Promise<Customization>[] = [];
        req.body.forEach(customization => { customization.churchId = au.churchId; promises.push(this.repositories.customization.save(customization)); });
        const result = await Promise.all(promises);
        return result;
      }
    });
  }

  @httpDelete("/:id")
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.schedules.edit)) return this.json({}, 401);
      else await this.repositories.customization.delete(au.churchId, id);
    });
  }

}
