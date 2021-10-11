import { Repositories } from "../repositories"
import { FileHelper } from "../apiBase"
import { File } from "../models";
import Axios from "axios"

export class FilesHelper {
  static async deleteFile(churchId: string, id: string, resourceId: string) {
    const file = await Repositories.getCurrent().file.load(churchId, id);
    const resource = await Repositories.getCurrent().resource.load(file.churchId, resourceId);
    const oldKey = "files/" + resource.contentType + "/" + resource.contentId + "/" + resource.id + "/" + file.fileName;
    await FileHelper.remove(oldKey);
    await Repositories.getCurrent().file.delete(churchId, id);
  }

  static async updateSize(file: File) {
    const url = process.env.CONTENT_ROOT + "/" + file.contentPath + "?dt=" + file.dateModified.getTime().toString();
    const resp = await Axios.head(url);
    file.size = parseInt(resp.headers["content-length"], 0);
    await Repositories.getCurrent().file.save(file);
  }

  static async deleteResourceFolder(churchId: string, resourceId: string) {
    const resource = await Repositories.getCurrent().resource.load(churchId, resourceId);
    const oldKey = "files/" + resource.contentType + "/" + resource.contentId + "/" + resource.id;
    await FileHelper.removeFolder(oldKey);
  }

}