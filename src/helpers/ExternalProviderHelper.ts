import { Repositories } from "../repositories";
import { ArrayHelper } from "@churchapps/apihelper";
import { fetchProviderJson, providerHostname } from "./ProviderUrlHelper";
import { ExternalCatalog, ExternalCatalogLesson, ExternalCatalogProgram, ExternalCatalogStudy, ExternalCatalogVenue, ExternalFeedAction, ExternalFeedFile, ExternalFeedSection, ExternalFeedVenue, PlanItem, PlaylistMessage, VenueActionsSection, VenueActionSummary } from "../models";

type TakeHomeKey = "bottomLine" | "verse" | "parentQuestion" | "parentNote";

export class ExternalProviderHelper {
  static mergeTakeHome<T extends ExternalFeedVenue>(feed: T, lesson?: ExternalCatalogLesson) {
    const pick = (source: Partial<Record<TakeHomeKey, string>>, key: TakeHomeKey) => (source && source[key] ? source[key] : undefined);
    return {
      ...feed,
      bottomLine: pick(feed, "bottomLine") ?? pick(lesson, "bottomLine"),
      verse: pick(feed, "verse") ?? pick(lesson, "verse"),
      parentQuestion: pick(feed, "parentQuestion") ?? pick(lesson, "parentQuestion"),
      parentNote: pick(feed, "parentNote") ?? pick(lesson, "parentNote")
    };
  }

  // Converts external venue data to planItems format matching /venues/public/planItems/:id response
  static convertToPlanItems = (externalData: ExternalFeedVenue, venueName: string) => {
    const lessonHeader: PlanItem = {
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

    externalData.sections?.forEach((section: ExternalFeedSection, index: number) => {
      let sectionSeconds = 0;
      section.actions?.forEach((action: ExternalFeedAction) => {
        action.files?.forEach((file: ExternalFeedFile) => {
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
  static convertToActions = (externalData: ExternalFeedVenue, venueName: string) => {
    const result = { venueName, sections: [] as VenueActionsSection[] };

    externalData.sections?.forEach((section: ExternalFeedSection, sectionIndex: number) => {
      const sectionActions: VenueActionSummary[] = [];
      const sectionId = section.id || "ext-section-" + sectionIndex;

      section.actions?.forEach((action: ExternalFeedAction, actionIndex: number) => {
        let actionSeconds = 0;
        action.files?.forEach((file: ExternalFeedFile) => {
          actionSeconds += file.seconds || 0;
        });

        sectionActions.push({ id: action.id || sectionId + "-action-" + actionIndex, name: action.name || action.actionType || "Action", actionType: action.actionType || "play", roleName: action.roleName || "", seconds: actionSeconds });
      });

      if (sectionActions.length > 0) {
        result.sections.push({ id: sectionId, name: section.name, actions: sectionActions });
      }
    });

    return result;
  };

  // Loads external venue data and returns both the data and venue name
  public static async loadExternalDataWithVenueName(externalProviderId: string, venueId: string) {
    const ep = await Repositories.getCurrent().externalProvider.loadPublic(externalProviderId);
    const data: ExternalCatalog = await fetchProviderJson(ep.apiUrl);

    let venue: ExternalCatalogVenue = null;
    let lesson: ExternalCatalogLesson = null;
    data.programs.forEach((program: ExternalCatalogProgram) => {
      program.studies.forEach((study: ExternalCatalogStudy) => {
        study.lessons.forEach((l: ExternalCatalogLesson) => {
          l.venues.forEach((v: ExternalCatalogVenue) => {
            if (v.id === venueId) {
              venue = v;
              lesson = l;
            }
          });
        });
      });
    });

    if (!venue) throw new Error("Could not load venue: " + venueId);
    else {
      const result: ExternalFeedVenue = await fetchProviderJson(venue.apiUrl, [providerHostname(ep.apiUrl)]);
      return { data: ExternalProviderHelper.mergeTakeHome(result, lesson), venueName: venue.name };
    }
  }

  static convertToMessages = (actionData: ExternalFeedVenue) => {
    const result = { lessonName: actionData.lessonName, lessonTitle: actionData.lessonTitle, lessonImage: actionData.lessonImage, lessonDescription: actionData.lessonDescription, bottomLine: actionData.bottomLine, verse: actionData.verse, parentQuestion: actionData.parentQuestion, parentNote: actionData.parentNote, venueName: "", messages: [] };

    actionData.sections.forEach((section: ExternalFeedSection) => {
      const actions = ArrayHelper.getAll(section.actions, "actionType", "play");
      if (actions.length > 0) {
        const message: PlaylistMessage = { name: section.name, files: [] };
        actions.forEach((a: ExternalFeedAction) => {
          a.files.forEach((f: ExternalFeedFile) => {
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
    const data: ExternalCatalog = await fetchProviderJson(ep.apiUrl);
    let venue: ExternalCatalogVenue = null;
    let lesson: ExternalCatalogLesson = null;

    const program = ArrayHelper.getOne(data.programs, "id", programId);
    if (program) {
      const study = ArrayHelper.getOne(program.studies, "id", studyId);
      if (study) {
        lesson = ArrayHelper.getOne(study.lessons, "id", lessonId);
        if (lesson) {
          venue = ArrayHelper.getOne(lesson.venues, "id", venueId);
        }
      }
    }

    if (!venue) throw new Error("Could not load venue: " + venueId);
    const feed: ExternalFeedVenue = await fetchProviderJson(venue.apiUrl, [providerHostname(ep.apiUrl)]);
    return ExternalProviderHelper.mergeTakeHome(feed, lesson);
  }

  public static async loadExternalDataById(externalProviderId: string, venueId: string) {
    const ep = await Repositories.getCurrent().externalProvider.loadPublic(externalProviderId);
    const data: ExternalCatalog = await fetchProviderJson(ep.apiUrl);

    let venue: ExternalCatalogVenue = null;
    let lesson: ExternalCatalogLesson = null;
    data.programs.forEach((program: ExternalCatalogProgram) => {
      program.studies.forEach((study: ExternalCatalogStudy) => {
        study.lessons.forEach((l: ExternalCatalogLesson) => {
          l.venues.forEach((v: ExternalCatalogVenue) => {
            if (v.id === venueId) {
              venue = v;
              lesson = l;
            }
          });
        });
      });
    });

    if (!venue) throw new Error("Could not load venue: " + venueId);
    const feed: ExternalFeedVenue = await fetchProviderJson(venue.apiUrl, [providerHostname(ep.apiUrl)]);
    return ExternalProviderHelper.mergeTakeHome(feed, lesson);
  }
}
