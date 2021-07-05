import { Section } from "./Section"

export class Venue {
  public id?: string;
  public churchId?: string;
  public lessonId?: string;
  public name?: string;
  public sort?: number;
  public sections?: Section[];
}
