import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Provider } from "../models"
import { Permissions } from '../helpers/Permissions'
import { ExternalProviderHelper } from "../helpers/ExternalProviderHelper";
import axios from "axios";

@controller("/externalProviders")
export class ExternalProviderController extends LessonsBaseController {

  @httpGet("/playlist/:externalProviderId/:programId/:studyId/:lessonId/:venueId")
  public async getExternalPlaylist(@requestParam("externalProviderId") externalProviderId: string, @requestParam("programId") programId: string, @requestParam("studyId") studyId: string, @requestParam("lessonId") lessonId: string, @requestParam("venueId") venueId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      const data = await ExternalProviderHelper.loadExternalData(externalProviderId, programId, studyId, lessonId, venueId);
      return ExternalProviderHelper.convertToMessages(data);
    });
  }

  @httpGet("/:id/lessons")
  public async getPublicLessons(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      const ep = await this.repositories.externalProvider.loadPublic(id);
      const data = (await axios.get(ep.apiUrl)).data;
      return data;
    });
  }

  @httpGet("/:id/venue/:venueId")
  public async getPublicExternal(@requestParam("id") id: string, @requestParam("venueId") venueId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      const lessonData = await ExternalProviderHelper.loadExternalDataById(id, venueId);
      return lessonData;
    });
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.externalProvider.load(au.churchId, id)
    });
  }

  @httpGet("/")
  public async getAll(req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      return await this.repositories.externalProvider.loadAll(au.churchId);
    });
  }


  @httpPost("/")
  public async save(req: express.Request<{}, {}, Provider[]>, res: express.Response): Promise<any> {
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
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.schedules.edit)) return this.json({}, 401);
      else {
        await this.repositories.externalProvider.delete(au.churchId, id);
        return this.json({});
      }
    });
  }

}
