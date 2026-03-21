import { Role } from "./Role";

export interface Section {
  id?: string;
  churchId?: string;
  lessonId?: string;
  venueId?: string;
  name?: string;
  sort?: number;
  materials?: string;

  roles?: Role[];
}
