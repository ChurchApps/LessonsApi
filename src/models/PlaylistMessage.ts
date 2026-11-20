export interface PlaylistMessageFile {
  name?: string;
  url?: string;
  seconds?: number;
  loopVideo?: boolean;
  thumbnail?: string;
}

export interface PlaylistMessage {
  name?: string;
  files: PlaylistMessageFile[];
}
