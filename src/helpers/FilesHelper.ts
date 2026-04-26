import { Repositories } from "../repositories";
import { FileStorageHelper } from "@churchapps/apihelper";
import { File } from "../models";
import Axios from "axios";

export class FilesHelper {
  static async deleteFile(churchId: string, id: string, resourceId: string) {
    const file = await Repositories.getCurrent().file.load(churchId, id);
    const resource = await Repositories.getCurrent().resource.load(file.churchId, resourceId);
    const bundle = await Repositories.getCurrent().bundle.load(file.churchId, resource.bundleId);
    const oldKey = "files/" + bundle.contentType + "/" + bundle.contentId + "/" + resource.id + "/" + file.fileName;
    await FileStorageHelper.remove(oldKey);
    await Repositories.getCurrent().file.delete(churchId, id);
  }

  static async updateSize(file: File) {
    const resp = await Axios.head(file.contentPath);
    file.size = parseInt(String(resp.headers["content-length"]), 10);
    await Repositories.getCurrent().file.save(file);
  }

  static async deleteResourceFolder(churchId: string, resourceId: string) {
    const resource = await Repositories.getCurrent().resource.load(churchId, resourceId);
    const bundle = await Repositories.getCurrent().bundle.load(churchId, resource.bundleId);
    const oldKey = "files/" + bundle.contentType + "/" + bundle.contentId + "/" + resource.id;
    // FileStorageHelper.removeLocalFolder uses fs.rmdirSync which throws ENOENT
    // if the folder doesn't exist yet (e.g. resource has no files). That's not
    // an error worth surfacing — swallow it.
    try { await FileStorageHelper.removeFolder(oldKey); } catch { /* folder absent */ }
  }

  static async deleteBundleFolder(churchId: string, bundleId: string) {
    const bundle = await Repositories.getCurrent().bundle.load(churchId, bundleId);
    const oldKey = "bundles/" + bundle.contentType + "/" + bundle.contentId + "/" + bundle.id;
    try { await FileStorageHelper.removeFolder(oldKey); } catch { /* folder absent */ }
  }
}
