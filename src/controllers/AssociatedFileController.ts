import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { AssociatedFile } from "../models"
import { Permissions } from '../helpers/Permissions'

@controller("/studies")
export class AssociatedFileController extends LessonsBaseController {

    @httpGet("/:id")
    public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapperAnon(req, res, async () => {
            return await this.repositories.associatedFile.load(id)
        });
    }

    @httpGet("/file/:fileId")
    public async getForFile(@requestParam("fileId") fileId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapperAnon(req, res, async () => {
            return await this.repositories.associatedFile.loadByFileIdId(fileId);
        });
    }

    @httpGet("/content/:contentType/:contentId")
    public async getForContent(@requestParam("contentType") contentType: string, @requestParam("contentId") contentId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapperAnon(req, res, async () => {
            return await this.repositories.associatedFile.loadByContentTypeId(contentType, contentId);
        });
    }

    @httpPost("/")
    public async save(req: express.Request<{}, {}, AssociatedFile[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
            else {
                const promises: Promise<AssociatedFile>[] = [];
                req.body.forEach(associatedFile => { associatedFile.churchId = au.churchId; promises.push(this.repositories.associatedFile.save(associatedFile)); });
                const result = await Promise.all(promises);
                return result;
            }
        });
    }

    @httpDelete("/:id")
    public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
            else await this.repositories.associatedFile.delete(au.churchId, id);
        });
    }

}
