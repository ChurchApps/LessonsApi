import { Repositories } from "../repositories"
import { FileHelper } from "../apiBase"
import { File } from "../models";
import Axios from "axios"

export class FilesHelper {
  static async deleteFile(churchId: string, id: string, resourceId: string) {
    const file = await Repositories.getCurrent().file.load(churchId, id);
    const resource = await Repositories.getCurrent().resource.load(file.churchId, resourceId);
    const bundle = await Repositories.getCurrent().bundle.load(file.churchId, resource.bundleId);
    const oldKey = "files/" + bundle.contentType + "/" + bundle.contentId + "/" + resource.id + "/" + file.fileName;
    await FileHelper.remove(oldKey);
    await Repositories.getCurrent().file.delete(churchId, id);
  }

  static async updateSize(file: File) {
    const resp = await Axios.head(file.contentPath);
    file.size = parseInt(resp.headers["content-length"], 0);
    await Repositories.getCurrent().file.save(file);
  }

  static async deleteResourceFolder(churchId: string, resourceId: string) {
    const resource = await Repositories.getCurrent().resource.load(churchId, resourceId);
    const bundle = await Repositories.getCurrent().bundle.load(churchId, resource.bundleId);
    const oldKey = "files/" + bundle.contentType + "/" + bundle.contentId + "/" + resource.id;
    await FileHelper.removeFolder(oldKey);
  }

  static async deleteBundleFolder(churchId: string, bundleId: string) {
    const bundle = await Repositories.getCurrent().bundle.load(churchId, bundleId);
    const oldKey = "bundles/" + bundle.contentType + "/" + bundle.contentId + "/" + bundle.id;
    await FileHelper.removeFolder(oldKey);
  }

}