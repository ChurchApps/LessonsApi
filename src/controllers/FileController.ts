import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { File } from "../models"
import { Permissions } from '../helpers/Permissions'

@controller("/files")
export class FileController extends LessonsBaseController {

    @httpGet("/:id")
    public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapperAnon(req, res, async () => {
            return await this.repositories.file.load(id)
        });
    }

    @httpGet("/")
    public async getAll(@requestParam("studyId") studyId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapperAnon(req, res, async () => {
            return await this.repositories.file.loadAll(studyId);
        });
    }

    @httpPost("/")
    public async save(req: express.Request<{}, {}, File[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
            else {
                const promises: Promise<File>[] = [];
                req.body.forEach(file => { file.churchId = au.churchId; promises.push(this.repositories.file.save(file)); });
                const result = await Promise.all(promises);
                return result;
            }
        });
    }

    @httpDelete("/:id")
    public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
            else await this.repositories.file.delete(au.churchId, id);
        });
    }

}
