import { Variant } from "./Variant"
import { Asset } from "./Asset"

export class Resource {
  public id?: string;
  public churchId?: string;
  public bundleId?: string;
  public name?: string;
  public category?: string;

  public variants?: Variant[];
  public assets?: Asset[];
}
