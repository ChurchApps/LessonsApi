import { FeedFile } from "./FeedFile";

export class FeedAction {
  public actionType?: string;
  public content?: string;
  public files?: FeedFile[]
}
