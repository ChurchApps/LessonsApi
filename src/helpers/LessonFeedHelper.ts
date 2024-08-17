import { FeedAction, FeedDownload, FeedFile, FeedSection, FeedVenue } from "../models/feed";
import { Action, AddOn, Asset, Bundle, ExternalVideo, File, Lesson, Program, Resource, Role, Section, Study, Variant, Venue } from "../models";
import { ArrayHelper } from "@churchapps/apihelper";
import { Repositories } from "../repositories";

export class LessonFeedHelper {


  static async getExpandedLessonData(program: Program, study: Study, lesson: Lesson)
  {
    let venues: Venue[] = null;
    let bundles: Bundle[] = null;
    let resources: Resource[] = null;
    let addOns: AddOn[] = null;
    let externalVideos: ExternalVideo[] = null;
    const promises: Promise<any>[] = [];
    promises.push(this.getVenues(lesson.id).then(v => venues = v));
    promises.push(this.getBundles(lesson.id).then(b => bundles = b));
    promises.push(this.getResources(lesson.id).then(r => resources = r));
    promises.push(this.getAddOns(lesson.id).then(a => addOns = a));
    promises.push(Repositories.getCurrent().externalVideo.loadPublicForLesson(lesson.id).then(ev => externalVideos = ev));
    await Promise.all(promises);

    const result = { lesson, study, program, venues, bundles, resources, externalVideos, addOns }
    return result;
  }

  private static async getVenues(lessonId: string) {
    const venues = await Repositories.getCurrent().venue.loadPublicByLessonId(lessonId);
    const sections = await Repositories.getCurrent().section.loadByLessonId(lessonId);
    const roles = await Repositories.getCurrent().role.loadByLessonId(lessonId);
    const actions = await Repositories.getCurrent().action.loadByLessonId(lessonId);
    venues.forEach(v => this.appendSections(v, sections, roles, actions));
    return venues;
  }


  private static async getBundles(lessonId: string) {
    const bundles: Bundle[] = await Repositories.getCurrent().bundle.loadPublicForLesson(lessonId);
    if (bundles.length === 0) return bundles;
    const fileIds = ArrayHelper.getIds(bundles, "fileId");
    for (let i = fileIds.length; i >= 0; i--) if (!fileIds[i]) fileIds.splice(i, 1);
    if (fileIds.length > 0) {
      const files = await Repositories.getCurrent().file.loadByIds(bundles[0].churchId, fileIds);
      bundles.forEach(b => { b.file = ArrayHelper.getOne(files, "id", b.fileId) });
    }
    return bundles;
  }

  private static async getResources(lessonId: string) {
    const resources: Resource[] = await Repositories.getCurrent().resource.loadPublicForLesson(lessonId);
    if (resources.length === 0) return resources;

    const resourceIds = ArrayHelper.getIds(resources, "id");
    const variants = await Repositories.getCurrent().variant.loadByResourceIds(resources[0].churchId, resourceIds);
    const assets = await Repositories.getCurrent().asset.loadByResourceIds(resources[0].churchId, resourceIds);

    const fileIds = ArrayHelper.getIds(variants, "fileId").concat(ArrayHelper.getIds(assets, "fileId"));
    const files = await Repositories.getCurrent().file.loadByIds(resources[0].churchId, fileIds);

    resources.forEach(r => this.appendVariantsAssets(r, variants, assets, files));
    return resources;
  }

  private static async getAddOns(lessonId: string) {
    const addOns: AddOn[] = await Repositories.getCurrent().addOn.loadPublicForLesson(lessonId);
    if (addOns.length === 0) return addOns;
    const fileIds = ArrayHelper.getIds(addOns, "fileId");
    const files = await Repositories.getCurrent().file.loadPublicByIds(fileIds);

    addOns.forEach(a => { a.file = ArrayHelper.getOne(files, "id", a.fileId); });
    return addOns;
  }

  private static async appendSections(venue: Venue, allSections: Section[], allRoles: Role[], allActions: Action[]) {
    venue.sections = ArrayHelper.getAll(allSections, "venueId", venue.id);
    venue.sections.forEach(s => {
      s.roles = ArrayHelper.getAll(allRoles, "sectionId", s.id);
      s.roles.forEach(r => {
        r.actions = ArrayHelper.getAll(allActions, "roleId", r.id);
      });
    });
  }


  private static async appendVariantsAssets(resource: Resource, allVariants: Variant[], allAssets: Asset[], allFiles: File[]) {
    resource.variants = ArrayHelper.getAll(allVariants, "resourceId", resource.id);
    resource.assets = ArrayHelper.getAll(allAssets, "resourceId", resource.id);

    resource.variants.forEach(v => v.file = ArrayHelper.getOne(allFiles, "id", v.fileId));
    resource.assets.forEach(a => a.file = ArrayHelper.getOne(allFiles, "id", a.fileId));

  }

  static convertToFeed(lesson:Lesson, study:Study, program:Program, venue:Venue, bundles:Bundle[], resources:Resource[], externalVideos:ExternalVideo[], addOns:AddOn[]) {
    const result:FeedVenue = {
      name: venue.name,
      id: venue.id,
      lessonId: lesson.id,
      lessonName: lesson.title,
      lessonDescription: lesson.description,
      lessonImage: lesson.image,
      studyName: study.name,
      studySlug: study.slug,
      programName: program.name,
      programSlug: program.slug,
      programAbout: program.aboutSection,
      downloads: [],
      sections: []
    }


    venue.sections.forEach(section => {
      const fs:FeedSection = {
        name: section.name,
        id: section.id,
        sort: section.sort,
        actions: []
      }

      if (section.materials) fs.materials = section.materials;

      let lastRole = "";
      section.roles.forEach(role => {
        role.actions.forEach(action => {
          if (action.actionType!=="Download")
          {
            const fa:FeedAction = {
              actionType: action.actionType.toLowerCase(),
              content: action.content,
              id: action.id,
              sort: action.sort,
              roleId: action.roleId,
            }
            if (role.name!==lastRole && role.name) {
              lastRole = role.name;
              fa.role = role.name;
            }
            if (fa.actionType==="play" || fa.actionType==="add-on") fa.files = this.convertFiles(action, bundles, resources, externalVideos, addOns, false);
            if (fa.actionType==="add-on") fa.actionType = "play";
            fs.actions.push(fa);
          }
        });
      });
      result.sections.push(fs);
    });

    result.downloads = this.populateDownloads(bundles, externalVideos);
    return result;
  }

  private static populateDownloads(bundles:Bundle[], externalVideos:ExternalVideo[]) {

    const result:FeedDownload[] = [];
    bundles.forEach(b => {
      if (b.file) {
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
      }
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

  private static convertFiles(action: Action, bundles:Bundle[], resources:Resource[], externalVideos:ExternalVideo[], addOns:AddOn[], download:boolean) {
    const result:FeedFile[] = [];
    const externalVideoId = action.externalVideoId;


    const resource: Resource = ArrayHelper.getOne(resources || [], "id", action.resourceId);
    const asset = (action.assetId && resource) ? ArrayHelper.getOne(resource?.assets || [], "id", action.assetId) : null;
    const addOn:AddOn = ArrayHelper.getOne(addOns || [], "id", action.addOnId);
    if (addOn) {
      // externalVideoId = addOn.externalVideoId;
    }
    const video: ExternalVideo = ArrayHelper.getOne(externalVideos || [], "id", externalVideoId);

    if (asset) result.push(this.convertAssetFile(asset, resource, download));
    else if (resource) this.convertResourceFiles(resource, download).forEach(f => result.push(f));
    else if (video) result.push(this.convertVideoFile(video, download));
    else if (addOn) result.push(this.convertAddOnFile(addOn));
    return result;
  }

  private static convertVideoFile(video:ExternalVideo, download:boolean) {
    const file:FeedFile = {
      // url: video.download1080 || video.download720,
      url: "https://api.lessons.church/externalVideos/download/" + video.id,
      name: video.name,
      id: video.id,
      expires: video.downloadsExpire
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
      id: asset?.file?.id
    }
    if (asset?.file?.thumbPath) file.thumbnail = asset?.file?.thumbPath;
    if (download) {
      file.bytes = asset?.file?.size;
      file.fileType = asset?.file?.fileType;
    }
    return file;
  }

  private static convertAddOnFile(addOn:AddOn) {
    const file:FeedFile = {
      url: addOn?.file?.contentPath,
      name: addOn?.name,
      bytes: addOn?.file?.size,
      fileType: addOn?.file?.fileType,
      id: addOn?.file?.id
    }
    if (addOn?.image) file.thumbnail = addOn.image;
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
          fileType: variant?.file?.fileType,
          id: variant?.file?.id
        }
        if (resource?.variants[0]?.file?.thumbPath) file.thumbnail = resource?.variants[0]?.file?.thumbPath;
        result.push(file);
      });
    } else {
      if (resource.assets?.length>0) {
        resource.assets.forEach(asset => {
          const file:FeedFile = {
            url: asset?.file?.contentPath,
            name: asset.name,
            id: asset?.file?.id
          }
          if (asset.file?.thumbPath) file.thumbnail = asset.file?.thumbPath;
          result.push(file);
        });
      } else {
        const file:FeedFile = {
          url: resource.variants[0]?.file?.contentPath,
          name: resource.name,
          id: resource.variants[0]?.file?.id
        }
        if (resource?.variants[0]?.file?.thumbPath) file.thumbnail = resource?.variants[0]?.file?.thumbPath;
        result.push(file);
      }
    }



    return result;
  }

}