import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Study } from "../models"
import { Permissions } from '../helpers/Permissions'

@controller("/studies")
export class StudyController extends LessonsBaseController {

    @httpGet("/:id")
    public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapperAnon(req, res, async () => {
            return await this.repositories.study.load(id)
        });
    }

    @httpGet("/provider/:providerId")
    public async getForProvider(@requestParam("providerId") providerId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapperAnon(req, res, async () => {
            return await this.repositories.study.loadByProviderId(providerId);
        });
    }

    @httpPost("/")
    public async save(req: express.Request<{}, {}, Study[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
            else {
                const promises: Promise<Study>[] = [];
                req.body.forEach(study => { study.churchId = au.churchId; promises.push(this.repositories.study.save(study)); });
                const result = await Promise.all(promises);
                return result;
            }
        });
    }

    @httpDelete("/:id")
    public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
            else await this.repositories.study.delete(au.churchId, id);
        });
    }

}
