import { FeedAction, FeedDownload, FeedFile, FeedSection, FeedVenue } from "../models/feed";
import { Action, Asset, Bundle, ExternalVideo, File, Lesson, Program, Resource, Study, Venue } from "../models";
import { ArrayHelper } from "@churchapps/apihelper";

export class LessonFeedHelper {

  static async convertToFeed(lesson:Lesson, study:Study, program:Program, venue:Venue, bundles:Bundle[], resources:Resource[], externalVideos:ExternalVideo[]) {
    const result:FeedVenue = {
      name: venue.name,
      lessonName: lesson.name,
      lessonDescription: lesson.description,
      lessonImage: lesson.image,
      studyName: study.name,
      studySlug: study.slug,
      programName: program.name,
      programSlug: program.slug,
      downloads: [],
      sections: []
    }

    venue.sections.forEach(section => {
      const fs:FeedSection = {
        name: section.name,
        actions: []
      }

      section.roles.forEach(role => {
        role.actions.forEach(action => {
          if (action.actionType!=="Download")
          {
            const fa:FeedAction = {
              actionType: action.actionType.toLowerCase(),
              content: action.content,
            }
            if (fa.actionType==="play") fa.files = this.convertFiles(action, bundles, resources, externalVideos, false);
            fs.actions.push(fa);
          }
        });
        result.sections.push(fs);
      });
    });

    result.downloads = this.populateDownloads(bundles, externalVideos);
    return result;
  }

  private static populateDownloads(bundles:Bundle[], externalVideos:ExternalVideo[]) {

    const result:FeedDownload[] = [];
    bundles.forEach(b => {
      const fd:FeedDownload = {
        name: b.name,
        files: [
          {
            name: b.file.fileName,
            url: b.file.contentPath,
            bytes: b.file.size,
            fileType: b.file.fileType
          }
        ]
      }
      result.push(fd);
    });
    externalVideos.forEach(v => {
      const fd:FeedDownload = {
        name: v.name,
        files: [this.convertVideoFile(v, true)]
      }
      result.push(fd);
    });
    return result;

  }

  private static convertFiles(action: Action, bundles:Bundle[], resources:Resource[], externalVideos:ExternalVideo[], download:boolean) {
    const result:FeedFile[] = [];
    const video: ExternalVideo = ArrayHelper.getOne(externalVideos || [], "id", action.externalVideoId);
    const resource: Resource = ArrayHelper.getOne(resources || [], "id", action.resourceId);
    const asset = (action.assetId && resource) ? ArrayHelper.getOne(resource?.assets || [], "id", action.assetId) : null;
    if (asset) result.push(this.convertAssetFile(asset, resource, download));
    else if (resource) this.convertResourceFiles(resource, download).forEach(f => result.push(f));
    else if (video) result.push(this.convertVideoFile(video, download));
    return result;
  }

  private static convertVideoFile(video:ExternalVideo, download:boolean) {
    const file:FeedFile = {
      url: video.download1080 || video.download720,
      name: video.name,
    }
    if (video.thumbnail) file.thumbnail = video.thumbnail;
    if (download) {
      // file.bytes = video.?.file?.size;
      file.fileType = "video/mp4";
    } else {
      file.streamUrl = "https://vimeo.com/" + video.videoId;
    }
    if (video.loopVideo) file.loop = true; else file.seconds = video.seconds;
    return file;
  }

  private static convertAssetFile(asset:Asset, resource:Resource, download:boolean) {
    const file:FeedFile = {
      url: asset?.file?.contentPath,
      name: resource?.name + ": " +  asset?.name,
    }
    if (asset?.file?.thumbPath) file.thumbnail = asset?.file?.thumbPath;
    if (download) {
      file.bytes = asset?.file?.size;
      file.fileType = asset?.file?.fileType;
    }
    return file;
  }

  private static convertResourceFiles(resource:Resource, download:boolean) {
    const result:FeedFile[] = [];
    if (download)
    {
      resource.variants.forEach(variant => {
        const file:FeedFile = {
          url: resource.variants[0]?.file?.contentPath,
          name: resource.name,
          bytes: variant?.file?.size,
          fileType: variant?.file?.fileType
        }
        if (resource?.variants[0]?.file?.thumbPath) file.thumbnail = resource?.variants[0]?.file?.thumbPath;
        result.push(file);
      });
    } else {
      if (resource.assets?.length>0) {
        resource.assets.forEach(asset => {
          const file:FeedFile = {
            url: asset?.file?.contentPath,
            name: asset.name
          }
          if (asset.file?.thumbPath) file.thumbnail = asset.file?.thumbPath;
          result.push(file);
        });
      } else {
        const file:FeedFile = {
          url: resource.variants[0]?.file?.contentPath,
          name: resource.name,
        }
        if (resource?.variants[0]?.file?.thumbPath) file.thumbnail = resource?.variants[0]?.file?.thumbPath;
        result.push(file);
      }
    }



    return result;
  }

}