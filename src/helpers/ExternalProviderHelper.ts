import { Repositories } from "../repositories"
import axios from "axios";

export class ExternalProviderHelper {

  public static async loadExternalData(externalProviderId:string, venueId:string)
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