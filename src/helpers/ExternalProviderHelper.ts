import { Repositories } from "../repositories"
import axios from "axios";
import { ArrayHelper } from ".";

export class ExternalProviderHelper {

  static convertToMessages = (actionData:any) =>
  {
    const result = {
      lessonName:actionData.lessonName,
      lessonTitle:actionData.lessonTitle,
      lessonImage:actionData.lessonImage,
      lessonDescription:actionData.lessonDescription,
      venueName:"",
      messages:[]
    };

    actionData.sections.forEach((section:any) => {
      const actions = ArrayHelper.getAll(section.actions, "actionType", "play");
      if (actions.length>0)
      {
        const message = { name:section.name, files:[] };
        actions.forEach(a => {
          a.files.forEach((f:any) => {
            const file = {
              name:f.name,
              url:f.url,
              seconds:f.seconds || 3600,
              loopVideo:f.loopVideo || false
            };
            message.files.push(file);
          });
        });
        result.messages.push(message);
      }
    });

    return result;
  }

  public static async loadExternalData(externalProviderId:string, programId:string, studyId:string, lessonId:string, venueId:string)
  {
    const ep = await Repositories.getCurrent().externalProvider.loadPublic(externalProviderId);
    const data = (await axios.get(ep.apiUrl)).data;
    let venue = null;

    const program = ArrayHelper.getOne(data.programs, "id", programId);
    if (program) {
      const study = ArrayHelper.getOne(program.studies, "id", studyId);
      if (study) {
        const lesson = ArrayHelper.getOne(study.lessons, "id", lessonId);
        if (lesson) {
          venue = ArrayHelper.getOne(lesson.venues, "id", venueId);
        }
      }
    }

    if (!venue) throw new Error(("Could not load venue: " + venueId));
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