import { FeedFile } from "./FeedFile";

export class FeedAction {
  public actionType?: string;
  public content?: string;
  public role?: string;
  public files?: FeedFile[]
}
