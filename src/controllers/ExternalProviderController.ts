import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Provider } from "../models"
import { Permissions } from '../helpers/Permissions'
import { ExternalProviderHelper } from "../helpers/ExternalProviderHelper";

@controller("/externalProviders")
export class ExternalProviderController extends LessonsBaseController {


  @httpGet("/:id/venue/:venueId")
  public async getPublicExternal(@requestParam("id") id: string, @requestParam("venueId") venueId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      const lessonData = await ExternalProviderHelper.loadExternalData(id, venueId);
      return lessonData;
    });
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.externalProvider.load(au.churchId, id)
    });
  }

  @httpGet("/")
  public async getAll(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.externalProvider.loadAll(au.churchId);
    });
  }


  @httpPost("/")
  public async save(req: express.Request<{}, {}, Provider[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.schedules.edit)) return this.json({}, 401);
      else {
        const promises: Promise<Provider>[] = [];
        req.body.forEach(externalProvider => { externalProvider.churchId = au.churchId; promises.push(this.repositories.externalProvider.save(externalProvider)); });
        const result = await Promise.all(promises);
        return result;
      }
    });
  }

  @httpDelete("/:id")
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.schedules.edit)) return this.json({}, 401);
      else await this.repositories.externalProvider.delete(au.churchId, id);
    });
  }

}