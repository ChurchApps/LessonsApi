import { FeedAction } from "./FeedAction";

export class FeedSection {
  public name?: string;
  public materials?: string;
  public actions?: FeedAction[];
  public id?: string;
  public sort?: number;
}
