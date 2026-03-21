import { File } from "./File";

export interface Variant {
  id?: string;
  churchId?: string;
  resourceId?: string;
  fileId?: string;
  name?: string;
  downloadDefault?: boolean;
  playerDefault?: boolean;
  hidden?: boolean;

  file?: File;
}
