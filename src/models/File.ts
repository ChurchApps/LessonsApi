export interface File {
  id?: string;
  churchId?: string;
  fileName?: string;
  contentPath?: string;
  fileType?: string;
  size?: number;
  dateModified?: Date;
  seconds?: number;
  thumbPath?: string;
  contentType?: string;
  contentId?: string;

  resourceId?: string; // doesn't get saved, but determines the file path.
  fileContents?: string;
}
