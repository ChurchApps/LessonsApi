import { Lesson, Schedule, Study, Venue } from "../models";
import { Repositories } from "../repositories"
import axios from "axios";
import { ArrayHelper } from ".";

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
          apiUrl: "/venues/playlist/" + venue.id,
        };
        lessonNode.playlists.push(venueNode);
      }
    });
  }

}