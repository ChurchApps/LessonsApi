import { File } from "./File";

export class Bundle {
  public id?: string;
  public churchId?: string;
  public contentType?: string;
  public contentId?: string;
  public name?: string;
  public fileId?: string;
  public pendingUpdate?: boolean;
  public dateModified?: Date;

  public file?: File;
}
