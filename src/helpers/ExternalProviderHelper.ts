import { Repositories } from "../repositories";
import axios from "axios";
import { ArrayHelper } from ".";

export class ExternalProviderHelper {
  // Converts external venue data to planItems format matching /venues/public/planItems/:id response
  static convertToPlanItems = (externalData: any, venueName: string) => {
    const lessonHeader: any = {
      id: "ext-" + Date.now(),
      churchId: null,
      planId: null,
      parentId: null,
      sort: 1,
      itemType: "header",
      relatedId: null,
      label: externalData.lessonName + " - " + venueName,
      description: externalData.lessonTitle || externalData.lessonName,
      seconds: null,
      children: []
    };

    externalData.sections?.forEach((section: any, index: number) => {
      let sectionSeconds = 0;
      section.actions?.forEach((action: any) => {
        action.files?.forEach((file: any) => {
          sectionSeconds += file.seconds || 0;
        });
      });

      const sectionId = section.id || "ext-section-" + index;
      lessonHeader.children.push({
        id: sectionId,
        churchId: null,
        planId: null,
        parentId: null,
        sort: index + 1,
        itemType: "lessonSection",
        relatedId: sectionId,
        label: section.name,
        description: "",
        seconds: sectionSeconds || null,
        link: null,
        children: []
      });
    });

    return { venueName, items: [lessonHeader] };
  };

  // Converts external venue data to actions format matching /venues/public/actions/:id response
  static convertToActions = (externalData: any, venueName: string) => {
    const result = { venueName, sections: [] as any[] };

    externalData.sections?.forEach((section: any, sectionIndex: number) => {
      const sectionActions: any[] = [];
      const sectionId = section.id || "ext-section-" + sectionIndex;

      section.actions?.forEach((action: any, actionIndex: number) => {
        let actionSeconds = 0;
        action.files?.forEach((file: any) => {
          actionSeconds += file.seconds || 0;
        });

        sectionActions.push({
          id: action.id || sectionId + "-action-" + actionIndex,
          name: action.name || action.actionType || "Action",
          actionType: action.actionType || "play",
          roleName: action.roleName || "",
          seconds: actionSeconds
        });
      });

      if (sectionActions.length > 0) {
        result.sections.push({
          id: sectionId,
          name: section.name,
          actions: sectionActions
        });
      }
    });

    return result;
  };

  // Loads external venue data and returns both the data and venue name
  public static async loadExternalDataWithVenueName(externalProviderId: string, venueId: string) {
    const ep = await Repositories.getCurrent().externalProvider.loadPublic(externalProviderId);
    const data = (await axios.get(ep.apiUrl)).data;

    let venue = null;
    data.programs.forEach((program: any) => {
      program.studies.forEach((study: any) => {
        study.lessons.forEach((lesson: any) => {
          lesson.venues.forEach((v: any) => {
            if (v.id === venueId) venue = v;
          });
        });
      });
    });

    if (!venue) throw new Error("Could not load venue: " + venueId);
    else {
      const result = (await axios.get(venue.apiUrl)).data;
      return { data: result, venueName: venue.name };
    }
  }

  static convertToMessages = (actionData: any) => {
    const result = { lessonName: actionData.lessonName, lessonTitle: actionData.lessonTitle, lessonImage: actionData.lessonImage, lessonDescription: actionData.lessonDescription, venueName: "", messages: [] };

    actionData.sections.forEach((section: any) => {
      const actions = ArrayHelper.getAll(section.actions, "actionType", "play");
      if (actions.length > 0) {
        const message = { name: section.name, files: [] };
        actions.forEach(a => {
          a.files.forEach((f: any) => {
            const file = { name: f.name, url: f.url, seconds: f.seconds || 3600, loopVideo: f.loopVideo || false };
            message.files.push(file);
          });
        });
        result.messages.push(message);
      }
    });

    return result;
  };

  public static async loadExternalData(externalProviderId: string, programId: string, studyId: string, lessonId: string, venueId: string) {
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

    if (!venue) throw new Error("Could not load venue: " + venueId);
    else {
      const result = (await axios.get(venue.apiUrl)).data;
      return result;
    }
  }

  public static async loadExternalDataById(externalProviderId: string, venueId: string) {
    const ep = await Repositories.getCurrent().externalProvider.loadPublic(externalProviderId);
    const data = (await axios.get(ep.apiUrl)).data;

    let venue = null;
    data.programs.forEach((program: any) => {
      program.studies.forEach((study: any) => {
        study.lessons.forEach((lesson: any) => {
          lesson.venues.forEach((v: any) => {
            if (v.id === venueId) venue = v;
          });
        });
      });
    });

    if (!venue) throw new Error("Could not load venue: " + venueId);
    else {
      const result = (await axios.get(venue.apiUrl)).data;
      return result;
    }
  }
}
