import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { StudyCategory } from "../models"
import { Permissions } from '../helpers/Permissions'

@controller("/studyCategories")
export class StudyCategoryController extends LessonsBaseController {

  @httpGet("/categoryNames/:programId")
  public async getCategoryNames(@requestParam("programId") programId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const data = await this.repositories.studyCategory.loadCategoryNames(programId);
        const result:string[] = [];
        if (data) data.forEach(d => { result.push(d.categoryName); });
        return result;
      }
    });
  }

  @httpGet("/:programId")
  public async getByCategoryName(@requestParam("programId") programId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const categoryName = req.query.categoryName as string;
        return await this.repositories.studyCategory.loadByCategoryName(programId, categoryName);
      }
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, StudyCategory[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<StudyCategory>[] = [];
        req.body.forEach(studyCategory => {
          promises.push(this.repositories.studyCategory.save(studyCategory));
        });
        const result = await Promise.all(promises);
        this.resort(req.body[0].programId, req.body[0].categoryName);
        return result;
      }
    });
  }

  private async resort(programId: string, categoryName: string): Promise<void> {
    const studyCategories = await this.repositories.studyCategory.loadByCategoryName(programId, categoryName);
    let sortOrder = 0;
    studyCategories.forEach(studyCategory => {
      studyCategory.sort = sortOrder;
      sortOrder++;
    });

    const promises: Promise<StudyCategory>[] = [];
    studyCategories.forEach(studyCategory => {
      promises.push(this.repositories.studyCategory.save(studyCategory));
    });
    await Promise.all(promises);
  }

  @httpDelete("/:id")
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        return await this.repositories.studyCategory.delete(id);
      }
    });
  }

}
