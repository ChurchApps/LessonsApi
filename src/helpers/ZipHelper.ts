import AWS from "aws-sdk";
import { Repositories } from "../repositories/Repositories";
import { File, Variant, Bundle } from "../models";
import { Environment, FilesHelper } from ".";
import { Stream } from "stream";
import Archiver from "archiver"
import { ArrayHelper, FileStorageHelper } from "@churchapps/apihelper";


export class ZipHelper {


  private static S3() {
    return new AWS.S3({ apiVersion: "2006-03-01" });
  }

  static async checkFileExists(key: string) {
    const exists = await this.S3()
      .headObject({ Bucket: Environment.s3Bucket, Key: key })
      .promise()
      .then(() => true,
        err => {
          if (err.code === 'NotFound') return false;
          throw err;
        }
      );
    return exists;
  }

  static async zipFiles(zipKey: string, files: { name: string, key: string, stream?: any }[]) {

    const verifiedFiles: { name: string, key: string, stream?: any }[] = [];
    for (const f of files) {
      if (await this.checkFileExists(f.key)) verifiedFiles.push(f);
    }


    return new Promise((resolve, reject) => {

      try {

        for (const f of verifiedFiles) {
          const params: AWS.S3.GetObjectRequest = { Bucket: Environment.s3Bucket, Key: f.key };
          f.stream = this.S3().getObject(params).createReadStream();
        }

        const streamPassThrough = new Stream.PassThrough()
        const uploadParams: AWS.S3.PutObjectRequest = { Bucket: Environment.s3Bucket, ACL: "public-read", Body: streamPassThrough, ContentType: "application/zip", Key: zipKey }
        const s3Upload = this.S3().upload(uploadParams, (error: Error, data: AWS.S3.ManagedUpload.SendData) => {
          resolve(null);
        });

        /*
        s3Upload.on("httpUploadProgress", progress => {
          console.log(progress);
        })*/
        console.log(zipKey);

        const archive = Archiver("zip", { zlib: { level: 0 } });
        archive.on("error", error => {
          reject(error);
          // throw new Error(
          //            `${error.name} ${error.code} ${error.message} ${error.path}  ${error.stack}`
          // )
        })

        archive.pipe(streamPassThrough);
        verifiedFiles.forEach(f => { archive.append(f.stream, { name: f.name }) });
        archive.finalize();
      } catch (ex) {
        reject(ex);
      }
    });
  }

  static async setBundlePendingResource(churchId: string, resourceId: string) {
    const r = await Repositories.getCurrent().resource.load(churchId, resourceId);
    await ZipHelper.setBundlePending(churchId, r.bundleId);
  }

  static async setBundlePending(churchId: string, bundleId: string) {
    const bundle = await Repositories.getCurrent().bundle.load(churchId, bundleId);
    bundle.pendingUpdate = true;
    await Repositories.getCurrent().bundle.save(bundle);
  }

  static async zipPendingBundles() {
    const bundles = await Repositories.getCurrent().bundle.loadPendingUpdate(5);
    for (const bundle of bundles) {
      try {
        await ZipHelper.zipBundle(bundle);
      } catch {
        bundle.pendingUpdate = false;
        await Repositories.getCurrent().bundle.save(bundle);
      }
    }
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
        filePath = filePath.replace("/content/", "").replace(Environment.contentRoot + "/", "")
        zipFiles.push({ name: f.fileName, key: filePath });
      }
    });
    const zipName = "files/bundles/" + bundle.id + "/" + bundle.name + ".zip";
    let success = true;
    try {
      // Note: We save this first to ensure this doesn't get stuck in a loop and run up bandwidth costs if anythign fails or times out.
      bundle.pendingUpdate = false;
      await Repositories.getCurrent().bundle.save(bundle);
      // End note
      await ZipHelper.zipFiles(zipName, zipFiles)
      console.log("done zipping");
    } catch {
      success = false;
      console.log("failed to zip");
    }
    if (success) {
      let file: File = null;
      if (bundle.fileId) {
        file = await Repositories.getCurrent().file.load(bundle.churchId, bundle.fileId);
        const oldKey = file.contentPath.split("?")[0].replace(Environment.contentRoot + "/", "");
        if (oldKey !== zipName) {
          await FileStorageHelper.remove(oldKey);
          await Repositories.getCurrent().file.delete(bundle.churchId, file.id);
          file = null;
        }
      }
      const now = new Date();
      if (file === null) {
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
      file = await Repositories.getCurrent().file.save(file);
      bundle.fileId = file.id;
      bundle.pendingUpdate = false;
      await Repositories.getCurrent().bundle.save(bundle);
      await FilesHelper.updateSize(file);
    }
  }

}


