import { File } from "./File";

export interface Bundle {
  id?: string;
  churchId?: string;
  contentType?: string;
  contentId?: string;
  name?: string;
  fileId?: string;
  pendingUpdate?: boolean;
  dateModified?: Date;

  file?: File;
}
