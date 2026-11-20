// A file row from the asset/variant playlist queries. id, thumbnail and thumbPath are not
// selected by those queries but are read by the playlist builders, so they stay optional.
export interface PlaylistFile {
  id?: string;
  contentPath?: string;
  resourceId?: string;
  resourceName?: string;
  assetId?: string;
  fileType?: string;
  seconds?: number;
  loopVideo?: boolean;
  thumbnail?: string;
  thumbPath?: string;
}
