import { S3Client, HeadObjectCommand, GetObjectCommand, ObjectCannedACL } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Repositories } from "../repositories/Repositories";
import { File, Variant, Bundle, Asset } from "../models";
import { Environment, FilesHelper } from ".";
import { Stream } from "stream";
import Archiver from "archiver";
import { ArrayHelper, FileStorageHelper } from "@churchapps/apihelper";

export class ZipHelper {
  private static S3() {
    return new S3Client({ apiVersion: "2006-03-01" });
  }

  static async checkFileExists(key: string) {
    try {
      const command = new HeadObjectCommand({ Bucket: Environment.s3Bucket, Key: key });
      await Promise.race([this.S3().send(command), new Promise((_, reject) => setTimeout(() => reject(new Error("S3 HeadObject timeout")), 10000))]);
      return true;
    } catch (err: any) {
      if (err.name === "NotFound") return false;
      console.error(`Failed to check file existence for ${key}:`, err.message);
      throw err;
    }
  }

  static async zipFiles(zipKey: string, files: { name: string; key: string; stream?: any }[]) {
    const verifiedFiles: { name: string; key: string; stream?: any }[] = [];
    for (const f of files) {
      if (await this.checkFileExists(f.key)) verifiedFiles.push(f);
    }

    return new Promise(async (resolve, reject) => {
      try {
        // Fetch all streams first with timeout
        for (const f of verifiedFiles) {
          const params = { Bucket: Environment.s3Bucket, Key: f.key };
          console.log(`Fetching file: ${f.key}`);
          try {
            const response = await Promise.race([this.S3().send(new GetObjectCommand(params)), new Promise((_, reject) => setTimeout(() => reject(new Error("S3 GetObject timeout")), 30000))]);
            f.stream = (response as any).Body;
          } catch (error) {
            console.error(`Failed to fetch file ${f.key} for zip ${zipKey}:`, error);
            throw error;
          }
        }

        const streamPassThrough = new Stream.PassThrough();

        // Use Upload class for streaming without ContentLength issues
        const upload = new Upload({
          client: this.S3(),
          params: {
            Bucket: Environment.s3Bucket,
            Key: zipKey,
            Body: streamPassThrough,
            ContentType: "application/zip",
            ACL: ObjectCannedACL.public_read
          }
        });

        console.log(`Starting upload for: ${zipKey}`);
        const uploadTimeout = setTimeout(() => {
          reject(new Error(`Upload timeout for ${zipKey} after 5 minutes`));
        }, 300000); // 5 minutes

        upload
          .done()
          .then(() => {
            clearTimeout(uploadTimeout);
            console.log(`Upload completed for: ${zipKey}`);
            resolve(null);
          })
          .catch(error => {
            clearTimeout(uploadTimeout);
            console.error(`Upload failed for ${zipKey}:`, error);
            reject(error);
          });

        console.log(zipKey);

        const archive = Archiver("zip", { zlib: { level: 0 } });
        archive.on("error", error => {
          console.error(`Archive error for ${zipKey}:`, error);
          reject(error);
        });

        archive.pipe(streamPassThrough);
        console.log(`Adding ${verifiedFiles.length} files to archive`);
        verifiedFiles.forEach(f => {
          console.log(`Adding file to archive: ${f.name}`);
          archive.append(f.stream, { name: f.name });
        });
        console.log(`Finalizing archive for: ${zipKey}`);
        archive.finalize();
      } catch (ex) {
        console.error(`zipFiles error for ${zipKey}:`, ex);
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
    const startTime = Date.now();
    console.log("Starting zipPendingBundles process");

    const bundles = await Repositories.getCurrent().bundle.loadPendingUpdate(5);
    console.log(`Found ${bundles.length} bundles pending zip update`);

    let processed = 0;
    let successful = 0;
    let failed = 0;

    for (const bundle of bundles) {
      const bundleStartTime = Date.now();
      console.log(`Processing bundle ${bundle.id} (${bundle.name}) for church ${bundle.churchId}`);

      try {
        await ZipHelper.zipBundle(bundle);
        successful++;
        console.log(`Successfully processed bundle ${bundle.id} in ${Date.now() - bundleStartTime}ms`);
      } catch (error) {
        failed++;
        console.error(`Failed to process bundle ${bundle.id} (${bundle.name}):`, {
          bundleId: bundle.id,
          churchId: bundle.churchId,
          error: (error as any).message,
          stack: (error as any).stack,
          processingTime: Date.now() - bundleStartTime
        });

        // Reset pending flag so it can be retried later
        bundle.pendingUpdate = false;
        await Repositories.getCurrent().bundle.save(bundle);
      }
      processed++;
    }

    const totalTime = Date.now() - startTime;
    console.log(`Completed zipPendingBundles process: ${processed} processed, ${successful} successful, ${failed} failed in ${totalTime}ms`);

    // Log metrics for monitoring
    if (failed > 0) {
      console.warn(`Bundle zipping failures detected`, {
        totalProcessed: processed,
        successful,
        failed,
        failureRate: ((failed / processed) * 100).toFixed(1) + "%"
      });
    }
  }

  static async zipBundle(bundle: Bundle) {
    console.log(`Starting zip process for bundle ${bundle.id} (${bundle.name})`);

    try {
      // Load resources and guard against nulls
      let resources = await Repositories.getCurrent().resource.loadByBundleId(bundle.churchId, bundle.id);
      if (!Array.isArray(resources)) resources = [];
      console.log(`Found ${resources.length} resources for bundle ${bundle.id}`);

      // Load variants only if there are resources
      const resourceIds = ArrayHelper.getIds(resources, "id");
      let variants: Variant[] = [];
      if ((resourceIds?.length || 0) > 0) {
        variants = await Repositories.getCurrent().variant.loadByResourceIds(bundle.churchId, resourceIds);
      }
      if (!Array.isArray(variants)) variants = [];
      console.log(`Found ${variants.length} variants for bundle ${bundle.id}`);

      // Load assets and include their files as well
      let assets: Asset[] = [];
      if ((resourceIds?.length || 0) > 0) {
        assets = await Repositories.getCurrent().asset.loadByResourceIds(bundle.churchId, resourceIds);
      }
      if (!Array.isArray(assets)) assets = [];
      console.log(`Found ${assets.length} assets for bundle ${bundle.id}`);

      // Build combined file id list from variants + assets
      const fileIds = (ArrayHelper.getIds(variants, "fileId") || []).concat(ArrayHelper.getIds(assets, "fileId") || []).filter((id: string) => !!id);
      let files: File[] = [];
      if (fileIds.length > 0) {
        files = await Repositories.getCurrent().file.loadByIds(bundle.churchId, fileIds);
      }
      if (!Array.isArray(files)) files = [];
      console.log(`Found ${files.length} files for bundle ${bundle.id}`);

      const zipFiles: { name: string; key: string }[] = [];
      const usedFileIds = new Set<string>();
      files.forEach(f => {
        const hasVariant: Variant = ArrayHelper.getOne(variants, "fileId", f.id);
        const hasAsset: Asset = ArrayHelper.getOne(assets, "fileId", f.id);
        const include = ((hasVariant && !hasVariant.hidden) || !!hasAsset) && f?.contentPath && f?.fileName;
        if (include && !usedFileIds.has(f.id)) {
          usedFileIds.add(f.id);
          let filePath = f.contentPath.split("?")[0];
          filePath = filePath.replace("/content/", "").replace(Environment.contentRoot + "/", "");
          zipFiles.push({ name: f.fileName, key: filePath });
        }
      });

      console.log(`Prepared ${zipFiles.length} files for zipping in bundle ${bundle.id}`);

      if (zipFiles.length === 0) {
        console.warn(`Bundle ${bundle.id} has no files to zip, marking as completed`);
        bundle.pendingUpdate = false;
        await Repositories.getCurrent().bundle.save(bundle);
        return;
      }

      const zipName = "files/bundles/" + bundle.id + "/" + bundle.name + ".zip";
      console.log(`Creating zip file: ${zipName}`);

      // Create the zip file
      await ZipHelper.zipFiles(zipName, zipFiles);
      console.log(`Successfully created zip file for bundle ${bundle.id}`);

      // Update file record and mark as complete
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
        file = { id: "", dateModified: now, contentPath: Environment.contentRoot + "/" + zipName + "?dt=" + now.getTime().toString(), churchId: bundle.churchId, fileName: bundle.name + ".zip", fileType: "application/zip" };
      } else {
        file.dateModified = now;
        file.contentPath = Environment.contentRoot + "/" + zipName + "?dt=" + now.getTime().toString();
      }
      file = await Repositories.getCurrent().file.save(file);
      bundle.fileId = file.id;

      // Only mark as not pending after all operations succeed
      bundle.pendingUpdate = false;
      await Repositories.getCurrent().bundle.save(bundle);
      await FilesHelper.updateSize(file);

      console.log(`Completed zip process for bundle ${bundle.id}`);
    } catch (error) {
      console.error(`Critical error in zipBundle for bundle ${bundle.id}:`, {
        bundleId: bundle.id,
        bundleName: bundle.name,
        churchId: bundle.churchId,
        error: (error as any).message,
        stack: (error as any).stack
      });
      throw error; // Re-throw to be handled by zipPendingBundles
    }
  }
}
