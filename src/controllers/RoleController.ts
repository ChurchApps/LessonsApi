import { controller, httpPost, httpGet, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController";
import { Role } from "../models";
import { Permissions } from "../helpers/Permissions";

@controller("/roles")
export class RoleController extends LessonsBaseController {
  @httpGet("/public/lesson/:lessonId")
  public async getForLesson(@requestParam("lessonId") lessonId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.role.loadByLessonId(lessonId);
    });
  }

  @httpGet("/section/:sectionId")
  public async getForSection(@requestParam("sectionId") sectionId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.role.loadBySectionId(au.churchId, sectionId);
    });
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      return await this.repositories.role.load(id);
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, Role[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        // Parents must belong to the caller's church; public playlists and feeds join children by parent id.
        for (const role of req.body) {
          if (role.sectionId) {
            const section = await this.repositories.section.load(role.sectionId);
            if (section?.churchId !== au.churchId) return this.json({}, 404);
          }
          if (role.lessonId && !(await this.repositories.lesson.load(au.churchId, role.lessonId))) return this.json({}, 404);
        }
        const promises: Promise<Role>[] = [];
        req.body.forEach(role => {
          role.churchId = au.churchId;
          promises.push(this.repositories.role.save(role));
        });
        const result = await Promise.all(promises);
        return result;
      }
    });
  }

  @httpDelete("/:id")
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        await this.repositories.role.delete(au.churchId, id);
        return this.json({});
      }
    });
  }
}
