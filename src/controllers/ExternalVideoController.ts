import { controller, httpPost, httpGet, interfaces, requestParam, httpDelete } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController"
import { ExternalVideo } from "../models"
import { Permissions } from '../helpers/Permissions'
import { ArrayHelper } from "../apiBase";
import { VimeoHelper } from "../helpers/VimeoHelper";

@controller("/externalVideos")
export class ExternalVideoController extends LessonsBaseController {
  /*
    @httpGet("/public/lesson/:lessonId")
    public async getPublicForLesson(@requestParam("lessonId") lessonId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
      return this.actionWrapperAnon(req, res, async () => {
        const externalVideos: ExternalVideo[] = await this.repositories.externalVideo.loadPublicForLesson(lessonId);
        return externalVideos;
      });
    }
  */
  @httpGet("/test")
  public async test(req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapperAnon(req, res, async () => {
      /*
      const lessons = await this.repositories.lesson.tempLessonsNeedingVideoFiles();

      for (const lesson of lessons) {
        try {
          const videoId = lesson.videoEmbedUrl.replace("https://player.vimeo.com/video/", "").split("?")[0];
          const vimeo = await VimeoHelper.getVideoDetails(videoId);
          const ev: ExternalVideo = {
            churchId: lesson.churchId,
            contentId: lesson.id,
            contentType: "lesson",
            videoProvider: "vimeo",
            videoId,
            download1080: vimeo.download1080p,
            download4k: vimeo.downlaod4k,
            download720: vimeo.download720p,
            name: lesson.name + " Video",
            seconds: vimeo.duration,
            loopVideo: false
          }
          await this.repositories.externalVideo.save(ev);
        } catch (e) {
          console.log(e);

        }
      }
      */
      return { status: "success" }
    });
  }

  @httpGet("/:id")
  public async get(@requestParam("id") id: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.externalVideo.load(au.churchId, id)
    });
  }

  @httpGet("/content/:contentType/:contentId")
  public async getForContent(@requestParam("contentType") contentType: string, @requestParam("contentId") contentId: string, req: express.Request<{}, {}, null>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else return await this.repositories.externalVideo.loadByContentTypeId(au.churchId, contentType, contentId);
    });
  }

  @httpPost("/")
  public async save(req: express.Request<{}, {}, ExternalVideo[]>, res: express.Response): Promise<interfaces.IHttpActionResult> {
    return this.actionWrapper(req, res, async (au) => {
      if (!au.checkAccess(Permissions.lessons.edit)) return this.json({}, 401);
      else {
        const promises: Promise<ExternalVideo>[] = [];
        req.body.forEach(externalVideo => {
          externalVideo.churchId = au.churchId;
          if (externalVideo.videoId) {
            promises.push(
              VimeoHelper.getVideoDetails(externalVideo.videoId).then(vimeo => {
                externalVideo.seconds = vimeo.duration;
                externalVideo.download720 = vimeo.download720p;
                externalVideo.download1080 = vimeo.download1080p;
                externalVideo.download4k = vimeo.downlaod4k;
                this.repositories.externalVideo.save(externalVideo);
                return externalVideo;
              })
            );
          } else {
            promises.push(this.repositories.externalVideo.save(externalVideo));
          }

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
      else {
        await this.repositories.externalVideo.delete(au.churchId, id);
      }
    });
  }

}
