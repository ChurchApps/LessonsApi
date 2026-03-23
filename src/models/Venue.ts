import { Section } from "./Section";

export interface Venue {
  id?: string;
  churchId?: string;
  lessonId?: string;
  name?: string;
  sort?: number;
  sections?: Section[];
}
