import { Action, ExternalVideo, File, Lesson, Schedule, Section, Study, Venue } from "../models";
import { Repositories } from "../repositories"
import axios from "axios";
import { ArrayHelper, Environment } from ".";
import { PlaylistHelper } from "./PlaylistHelper";

export class LibraryHelper {

  static loadLibrary = async () => {
    const repo = Repositories.getCurrent();
    const programs = await repo.program.loadPublicAll();
    const studies = await repo.study.loadPublicAll();
    const lessons = await repo.lesson.loadPublicAll();
    const venues = await repo.venue.loadPublicAll();

    const result = {
      treeLabels: ["Program", "Study", "Lesson", "Playlist"],
      categories: []
    };

    programs.forEach((program: any) => {
      const programNode = {
        id: program.id,
        name: program.name,
        description: program.description,
        image: program.image,
        children: []
      };
      this.appendStudies(studies, lessons, venues, programNode);
      result.categories.push(programNode);
    });

    return result;
  }

  private static appendStudies = (allStudies: Study[], allLessons: Lesson[], allVenues: Venue[], programNode: any) => {
    allStudies.forEach((study: any) => {
      if (study.programId === programNode.id) {
        const studyNode = {
          id: study.id,
          name: study.name,
          description: study.description,
          image: study.image,
          children: []
        };
        this.appendLessons(allLessons, allVenues, studyNode);
        programNode.children.push(studyNode);
      }
    });
  }

  private static appendLessons = (allLessons: Lesson[], allVenues: Venue[], studyNode: any) => {
    allLessons.forEach((lesson: any) => {
      if (lesson.studyId === studyNode.id) {
        const lessonNode = {
          id: lesson.id,
          name: lesson.name,
          description: lesson.description,
          image: lesson.image,
          playlists: []
        };
        this.appendVenues(allVenues, lessonNode);
        studyNode.children.push(lessonNode);
      }
    });
  }

  private static appendVenues = (allVenues: Venue[], lessonNode: any) => {
    allVenues.forEach((venue: any) => {
      if (venue.lessonId === lessonNode.id) {
        const venueNode = {
          id: venue.id,
          name: venue.name,
          apiUrl: "/venues/playlistNew/" + venue.id,
        };
        lessonNode.playlists.push(venueNode);
      }
    });
  }





  static getPlaylist = async (venue: Venue, sections: Section[], actions: Action[], availableFiles: File[], availableVideos: ExternalVideo[], stream: boolean, resolution: string) => {
    const result = {
      id: venue.id,
      name: venue.name,
      prefetch: false,
      playOrder: "sequential",
      messages: []
    };

    sections.forEach(s => {
      const sectionActions: Action[] = ArrayHelper.getAll(actions, "sectionId", s.id);
      const itemFiles: any[] = [];
      sectionActions.forEach(a => {
        if (a.externalVideoId || a.actionType === "Add-on") {
          const msg = this.getExternalVideoMessage(a, availableVideos, stream, resolution);
          if (msg) result.messages.push(msg);
        } else {
          result.messages = result.messages.concat(this.getFileMessage(a, availableFiles));
        }
      });
      // result.messages.push({ name: s.name, files: itemFiles });
    });
    return result;
  }

  static getFileMessage = (action: Action, availableFiles: File[]) => {
    const result: any[] = [];
    const files: any[] = PlaylistHelper.getBestFiles(action, availableFiles);
    if (files.length === 0) return result;

    const msg = {
      id: action.id,
      name: action.content,
      seconds: 3600,
      type: (files.length > 0) ? "gallery" : files[0].fileType.split("/")[0],
      thumbnail: files[0].thumbnail,
      loop: files[0].loopVideo,
      files: []
    }

    files.forEach(file => {
      const contentPath = (file.contentPath.indexOf("://") === -1) ? Environment.contentRoot + file.contentPath : file.contentPath;
      let seconds = parseInt(file.seconds, 0);
      const loopVideo = (file.loopVideo) ? true : false;
      if (!seconds || seconds === 0 || loopVideo) seconds = 3600;
      msg.seconds = seconds;
      msg.files.push(contentPath);
    });
    result.push(msg);
    return result;
  }

  static getExternalVideoMessage = (action: Action, availableVideos: ExternalVideo[], stream: boolean, resolution: string) => {
    let video: ExternalVideo = ArrayHelper.getOne(availableVideos, "id", action.externalVideoId);
    if (!video && action.actionType === "Add-on") video = ArrayHelper.getOne(availableVideos, "contentId", action.addOnId);

    if (video) {
      const result = {
        id: video.id,
        name: video.name,
        seconds: video.seconds,
        type: (stream) ? "stream" : "video",
        thumbnail: video.thumbnail,
        loop: video.loopVideo,
        files: []
      }

      if (stream) result.files.push(video.videoProvider.toLowerCase() + ":" + video.videoId)
      else result.files.push(resolution === "1080" ? video.play1080 : video.play720)
      return result;
    }
    return null;
  }



}