import { Action } from "./Action";

export interface Role {
  id?: string;
  churchId?: string;
  lessonId?: string;
  sectionId?: string;
  name?: string;
  sort?: number;

  actions?: Action[];
}
