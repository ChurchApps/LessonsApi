import { controller, httpPost, httpGet, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import path from "path";
import { LessonsBaseController } from "./LessonsBaseController";
import { File } from "../models";
import { Permissions } from "../helpers/Permissions";
import { AwsHelper, FileStorageHelper } from "@churchapps/apihelper";
import { Environment } from "../helpers";

@controller("/files")
export class FileController extends LessonsBaseController {
  @httpGet("/cleanup")
  public async getCleanup(req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      await this.repositories.file.cleanUp();
      const paths = await this.getOrphanedFiles();
      for (const p of paths) await FileStorageHelper.remove(p);
      return { paths };
    });
  }

  private async getOrphanedFiles() {
    const paths = await FileStorageHelper.list("files/");
    const files: File[] = await this.repositories.file.loadAll();
    for (let i = paths.length - 1; i >= 0; i--) {
      let match = false;
      files.forEach(f => {
        if (f.contentPath?.indexOf(paths[i]) > -1) match = true;
      });
      if (match) paths.splice(i, 1);
    }
    return paths;
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      return await this.repositories.file.load(au.churchId, id);
    });
  }

  @httpGet("/")
  public async getAll(req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      return await this.repositories.file.loadForChurch(au.churchId);
    });
  }

  // Known bug - This post accepts multiple File modals but only a single file upload.  It's not a problem because the app restricts users to one upload at a time (for now).
  @httpPost("/")
  public async save(req: express.Request<{}, {}, File[]>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<File>[] = [];
        req.body.forEach(file => {
          file.churchId = au.churchId;
          const f = file;
          const saveFunction = async () => {
            await this.saveFile(f);
            return await this.repositories.file.save(f);
          };
          promises.push(saveFunction());
        });
        const result = await Promise.all(promises);
        return result;
      }
    });
  }

  @httpPost("/postUrl/content/:contentType/:contentId")
  public async getUploadUrManual(@requestParam("contentType") contentType: string, @requestParam("contentId") contentId: string, req: express.Request<{}, {}, { fileName: string }>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const key = "/files/" + FileController.sanitizeKeyPart(contentType) + "/" + FileController.sanitizeKeyPart(contentId) + "/" + FileController.sanitizeKeyPart(req.body.fileName);
        const result = Environment.fileStore === "S3" ? await AwsHelper.S3PresignedUrl(key) : {};
        return result;
      }
    });
  }

  @httpPost("/postUrl")
  public async getUploadUrl(req: express.Request<{}, {}, { resourceId: string; fileName: string }>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const resource = await this.repositories.resource.load(au.churchId, req.body.resourceId);
        const bundle = await this.repositories.bundle.load(au.churchId, resource.bundleId);
        const key = "/files/" + bundle.contentType + "/" + bundle.contentId + "/" + resource.id + "/" + FileController.sanitizeKeyPart(req.body.fileName);
        const result = Environment.fileStore === "S3" ? await AwsHelper.S3PresignedUrl(key) : {};
        return result;
      }
    });
  }

  @httpDelete("/:id")
  public async delete(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapper(req, res, async au => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        await this.repositories.file.delete(au.churchId, id);
        return this.json({});
      }
    });
  }

  // strip path separators and parent refs so request-supplied values can't escape the content directory
  private static sanitizeKeyPart(value: string) {
    return path.basename(value || "").replace(/\.\.+/g, ".");
  }

  private async saveFile(file: File) {
    file.fileName = FileController.sanitizeKeyPart(file.fileName);
    let folder = "";

    if (file.resourceId) {
      const resource = await this.repositories.resource.load(file.churchId, file.resourceId);
      const bundle = await this.repositories.bundle.load(file.churchId, resource.bundleId);
      folder = "/files/" + bundle.contentType + "/" + bundle.contentId + "/" + resource.id + "/";
    } else {
      folder = "/files/" + FileController.sanitizeKeyPart(file.contentType) + "/" + FileController.sanitizeKeyPart(file.contentId) + "/";
    }
    const key = folder + file.fileName;

    if (file.id) {
      // delete existing uploadFile
      const existingFile = await this.repositories.file.load(file.churchId, file.id);
      const oldKey = path + existingFile.fileName;
      if (oldKey !== key) await FileStorageHelper.remove(oldKey);
    }

    if (file.fileContents) {
      const base64 = file.fileContents.split(",")[1];
      const buffer = Buffer.from(base64, "base64");
      await FileStorageHelper.store(key, file.fileType, buffer);
    }

    const fileUpdated = new Date();
    file.contentPath = Environment.contentRoot + key + "?dt=" + fileUpdated.getTime().toString();
    file.fileContents = null;
    return file;
  }
}
