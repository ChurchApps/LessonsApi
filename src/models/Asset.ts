import { File } from "./File"

export class Asset {
  public id?: string;
  public churchId?: string;
  public resourceId?: string;
  public fileId?: string;
  public name?: string;
  public sort?: number;

  public file?: File;
}
