import { Schedule } from "../models";
import { Repositories } from "../repositories"
import axios from "axios";
import { ArrayHelper } from ".";

export class ExternalProviderHelper {

  public static async loadExternalData(schedule:Schedule)
  {
    const ep = await Repositories.getCurrent().externalProvider.loadPublic(schedule.externalProviderId);
    const data = (await axios.get(ep.apiUrl)).data;
    let venue = null;

    const program = ArrayHelper.getOne(data.programs, "id", schedule.programId);
    if (program) {
      const study = ArrayHelper.getOne(program.studies, "id", schedule.studyId);
      if (study) {
        const lesson = ArrayHelper.getOne(study.lessons, "id", schedule.lessonId);
        if (lesson) {
          venue = ArrayHelper.getOne(lesson.venues, "id", schedule.venueId);
        }
      }
    }

    if (!venue) throw new Error(("Could not load venue: " + schedule.venueId));
    else {
      const result = (await axios.get(venue.apiUrl)).data;
      return result;
    }
  }

  public static async loadExternalDataById(externalProviderId:string, venueId:string)
  {
    const ep = await Repositories.getCurrent().externalProvider.loadPublic(externalProviderId);
    const data = (await axios.get(ep.apiUrl)).data;

    let venue = null;
    data.programs.forEach((program:any) => {
      program.studies.forEach((study:any) => {
        study.lessons.forEach((lesson:any) => {
          lesson.venues.forEach((v:any) => {
            if (v.id === venueId) venue = v;
          });
        });
      });
    });

    if (!venue) throw new Error(("Could not load venue: " + venueId));
    else {
      const result = (await axios.get(venue.apiUrl)).data;
      return result;
    }
  }


}