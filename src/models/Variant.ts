import { File } from "./File"

export class Variant {
  public id?: string;
  public churchId?: string;
  public resourceId?: string;
  public fileId?: string;
  public name?: string;
  public downloadDefault?: boolean;
  public playerDefault?: boolean;
  public hidden?: boolean;

  public file?: File;
}
