import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { File } from "../models"
import { Permissions } from '../helpers/Permissions'
import { FileHelper } from "../apiBase";
import { UploadedFile } from "express-fileupload";

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

  // Known bug - This post accepts multiple File modals but only a single file upload.  It's not a problem because the app restricts users to one upload at a time (for now).
  @httpPost("/")
  public async save(req: express.Request<{}, {}, File[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<File>[] = [];
        req.body.forEach(file => {
          file.churchId = au.churchId;
          const f = file;
          const saveFunction = async () => {
            if (f.fileContents) await this.saveFile(f);
            console.log(JSON.stringify(f));
            return await this.repositories.file.save(f);
          }
          promises.push(saveFunction());
        });
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


  private async saveFile(file: File) {
    const base64 = file.fileContents.split(',')[1];
    const buffer = Buffer.from(base64, 'base64');
    const resource = await this.repositories.resource.load(file.churchId, file.resourceId);
    const key = "/files/" + resource.contentType + "/" + resource.contentId + "/" + resource.id + "/" + file.fileName;
    await FileHelper.store(key, file.fileType, buffer);
    const fileUpdated = new Date();
    file.contentPath = process.env.CONTENT_ROOT + key + "?dt=" + fileUpdated.getTime().toString();
    file.fileContents = null;
    return file;
  }

}
