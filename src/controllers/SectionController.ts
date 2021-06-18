import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { Section } from "../models"
import { Permissions } from '../helpers/Permissions'

@controller("/sections")
export class SectionController extends LessonsBaseController {

    @httpGet("/:id")
    public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapperAnon(req, res, async () => {
            return await this.repositories.section.load(id)
        });
    }

    @httpGet("/lesson/:lessonId")
    public async getForLesson(@requestParam("lessonId") lessonId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapperAnon(req, res, async () => {
            return await this.repositories.section.loadByLessonId(lessonId);
        });
    }

    @httpPost("/")
    public async save(req: express.Request<{}, {}, Section[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
            else {
                const promises: Promise<Section>[] = [];
                req.body.forEach(section => { section.churchId = au.churchId; promises.push(this.repositories.section.save(section)); });
                const result = await Promise.all(promises);
                return result;
            }
        });
    }

    @httpDelete("/:id")
    public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
        return this.actionWrapper(req, res, async (au) => {
            if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
            else await this.repositories.section.delete(au.churchId, id);
        });
    }

}
