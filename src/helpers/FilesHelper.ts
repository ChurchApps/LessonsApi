import { Repositories } from "../repositories"
import { FileHelper } from "../apiBase"
import { Resource } from "../models";

export class FilesHelper {
  static async deleteFile(churchId: string, id: string, resourceId: string) {
    const file = await Repositories.getCurrent().file.load(churchId, id);
    const resource = await Repositories.getCurrent().resource.load(file.churchId, resourceId);
    const oldKey = "/files/" + resource.contentType + "/" + resource.contentId + "/" + resource.id + "/" + file.fileName;
    await FileHelper.remove(oldKey);
    await Repositories.getCurrent().file.delete(churchId, id);
  }

  static async deleteResourceFolder(churchId: string, resourceId: string) {
    const resource = await Repositories.getCurrent().resource.load(churchId, resourceId);
    const oldKey = "/files/" + resource.contentType + "/" + resource.contentId + "/" + resource.id;
    await FileHelper.removeFolder(oldKey);
  }

}