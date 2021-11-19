import AWS from "aws-sdk";
import { Repositories } from "../repositories/Repositories";
import { File, Variant, Resource } from "../models";
import { Environment, FilesHelper } from ".";
import { Stream } from "stream";
import Archiver from "archiver"


export class ZipHelper {


  private static S3() {
    return new AWS.S3({ apiVersion: "2006-03-01" });
  }

  static async zipFiles(zipKey: string, files: { name: string, key: string, stream?: any }[]) {
    return new Promise((resolve, reject) => {

      console.log(JSON.stringify(files));

      files.forEach(f => {
        const params: AWS.S3.GetObjectRequest = { Bucket: Environment.s3Bucket, Key: f.key };
        f.stream = this.S3().getObject(params).createReadStream();
      });

      const streamPassThrough = new Stream.PassThrough()
      const uploadParams: AWS.S3.PutObjectRequest = { Bucket: Environment.s3Bucket, ACL: "public-read", Body: streamPassThrough, ContentType: "application/zip", Key: zipKey }

      console.log(zipKey);
      const s3Upload = this.S3().upload(uploadParams, (error: Error, data: AWS.S3.ManagedUpload.SendData) => {
        console.log("error")
        console.log(error);
        console.log("data")
        console.log(data);
        resolve(null);
      });

      s3Upload.on("httpUploadProgress", progress => {
        console.log(progress);
      })

      console.log("created upload")

      const archive = Archiver("zip", { zlib: { level: 7 } });

      archive.on("error", error => {
        throw new Error(
          `${error.name} ${error.code} ${error.message} ${error.path}  ${error.stack}`
        )
      })

      console.log("created archiver")

      archive.pipe(streamPassThrough);
      console.log("piping")
      files.forEach(f => { archive.append(f.stream, { name: f.name }) });
      console.log("added files")





      archive.finalize();
      console.log("finalized")



    });



  }




}