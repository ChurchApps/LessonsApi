import { FeedDownload } from "./FeedDownload";
import { FeedSection } from "./FeedSection";

export class FeedVenue {
  public name?: string;
  public lessonName?: string;
  public lessonImage?: string;
  public lessonDescription?: string;
  public studyName?: string;
  public studySlug?: string;
  public programName?: string;
  public programSlug?: string;
  public downloads?: FeedDownload[];
  public sections?: FeedSection[];

}
