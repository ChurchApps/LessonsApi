import { Role } from "./Role"

export class Section {
  public id?: string;
  public churchId?: string;
  public lessonId?: string;
  public venueId?: string;
  public name?: string;
  public sort?: number;

  public roles?: Role[];
}
