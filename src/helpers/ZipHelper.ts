import AWS from "aws-sdk";
import { Repositories } from "../repositories/Repositories";
import { File, Variant, Bundle } from "../models";
import { Environment, FilesHelper } from ".";
import { Stream } from "stream";
import Archiver from "archiver"
import { ArrayHelper, FileHelper } from "../apiBase";


export class ZipHelper {


  private static S3() {
    return new AWS.S3({ apiVersion: "2006-03-01" });
  }


  static async zipFiles(zipKey: string, files: { name: string, key: string, stream?: any }[]) {
    return new Promise((resolve, reject) => {

      try {

        files.forEach(f => {
          const params: AWS.S3.GetObjectRequest = { Bucket: Environment.s3Bucket, Key: f.key };
          f.stream = this.S3().getObject(params).createReadStream();
        });

        const streamPassThrough = new Stream.PassThrough()
        const uploadParams: AWS.S3.PutObjectRequest = { Bucket: Environment.s3Bucket, ACL: "public-read", Body: streamPassThrough, ContentType: "application/zip", Key: zipKey }
        const s3Upload = this.S3().upload(uploadParams, (error: Error, data: AWS.S3.ManagedUpload.SendData) => {
          resolve(null);
        });

        s3Upload.on("httpUploadProgress", progress => {
          console.log(progress);
        })

        const archive = Archiver("zip", { zlib: { level: 7 } });
        archive.on("error", error => {
          reject(error);
          throw new Error(
            `${error.name} ${error.code} ${error.message} ${error.path}  ${error.stack}`
          )
        })

        archive.pipe(streamPassThrough);
        files.forEach(f => { archive.append(f.stream, { name: f.name }) });
        archive.finalize();
        console.log("finalized")
      } catch (ex) {
        reject(ex);
      }
    });
  }

  static async zipPendingBundles() {
    const bundles = await Repositories.getCurrent().bundle.loadPendingUpdate();
    for (const bundle of bundles) { await ZipHelper.zipBundle(bundle); }
  }

  static async zipBundle(bundle: Bundle) {
    const resources = await Repositories.getCurrent().resource.loadByBundleId(bundle.churchId, bundle.id);
    const variants = await Repositories.getCurrent().variant.loadByResourceIds(bundle.churchId, ArrayHelper.getIds(resources, "id"));
    const files = await Repositories.getCurrent().file.loadByIds(bundle.churchId, ArrayHelper.getIds(variants, "fileId"));

    const zipFiles: { name: string, key: string }[] = [];
    files.forEach(f => {
      const variant: Variant = ArrayHelper.getOne(variants, "fileId", f.id)
      if (variant && !variant.hidden) {
        let filePath = f.contentPath.split("?")[0];
        console.log(filePath);
        filePath = filePath.replace("/content/", "").replace(Environment.contentRoot + "/", "")
        console.log(filePath);
        zipFiles.push({ name: f.fileName, key: filePath });
      }
    });
    const zipName = "files/bundles/" + bundle.id + "/" + bundle.name + ".zip";
    try {
      console.log("zipping");
      await ZipHelper.zipFiles(zipName, zipFiles)
      console.log("done zipping");
    } catch {
      console.log("failed to zip");
    }
    let file: File = null;
    if (bundle.fileId) {
      console.log("existing file");
      file = await Repositories.getCurrent().file.load(bundle.churchId, bundle.fileId);
      const oldKey = file.contentPath.split("?")[0].replace(Environment.contentRoot + "/", "");
      if (oldKey !== zipName) {
        await FileHelper.remove(oldKey);
        await Repositories.getCurrent().file.delete(bundle.churchId, file.id);
        file = null;
      }
    }
    const now = new Date();
    if (file === null) {
      console.log("file is null")

      file = {
        id: "",
        dateModified: now,
        contentPath: Environment.contentRoot + "/" + zipName + "?dt=" + now.getTime().toString(),
        churchId: bundle.churchId,
        fileName: bundle.name + ".zip",
        fileType: "application/zip"
      }
    } else {
      file.dateModified = now;
      file.contentPath = Environment.contentRoot + "/" + zipName + "?dt=" + now.getTime().toString()
    }
    console.log("saving file")
    file = await Repositories.getCurrent().file.save(file);
    console.log("saved file")
    bundle.fileId = file.id;
    bundle.pendingUpdate = false;
    await Repositories.getCurrent().bundle.save(bundle)
    console.log("saved bundle")

  }

}


