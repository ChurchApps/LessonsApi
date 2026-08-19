import { FeedDownload } from "./FeedDownload";
import { FeedSection } from "./FeedSection";

export class FeedVenue {
  public name?: string;
  public id?: string;
  public lessonName?: string;
  public lessonImage?: string;
  public lessonDescription?: string;
  public bottomLine?: string;
  public verse?: string;
  public parentQuestion?: string;
  public parentNote?: string;
  public studyName?: string;
  public studySlug?: string;
  public programName?: string;
  public programSlug?: string;
  public programAbout?: string;
  public downloads?: FeedDownload[];
  public sections?: FeedSection[];

  public lessonId?: string;
}
