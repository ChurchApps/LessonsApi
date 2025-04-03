import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Customization } from "../models"
import { Permissions } from '../helpers/Permissions'
import { ArrayHelper } from "@churchapps/apihelper";

@controller("/customizations")
export class CustomizationController extends LessonsBaseController {

  @httpGet("/venue/:venueId")
  public async getForVenue(@requestParam("venueId") venueId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      const customizations =  await this.repositories.customization.loadByVenueId(au.churchId, venueId);
      if (req.query.classroomId) {
        // get all the customizations where classroomId is NULL
        const appliedToAll = ArrayHelper.getAll(customizations, "classroomId", null);

        // get all the customizations where classroomId matches
        const classroomSpecific = ArrayHelper.getAll(customizations, "classroomId", req.query.classroomId.toString());

        const result = [ ...appliedToAll, ...classroomSpecific ];
        return result;
      }
      return customizations;
    });
  }

  @httpGet("/public/venue/:venueId/:churchId")
  public async getPublicForVenue(@requestParam("venueId") venueId: string, @requestParam("churchId") churchId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      const customizations =  await this.repositories.customization.loadByVenueId(churchId, venueId);
      if (req.query.classroomId) {
        const appliedToAll = ArrayHelper.getAll(customizations, "classroomId", null);
        const classroomSpecific = ArrayHelper.getAll(customizations, "classroomId", req.query.classroomId.toString());

        const result = [ ...appliedToAll, ...classroomSpecific ];
        return result;
      }
      return customizations;
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
      else {
        await this.repositories.customization.delete(au.churchId, id);
        return this.json({});
      }
    });
  }

}
