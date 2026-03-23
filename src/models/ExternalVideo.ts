export interface ExternalVideo {
  id?: string;
  churchId?: string;
  contentType?: string;
  contentId?: string;
  name?: string;
  videoProvider?: string;
  videoId?: string;
  seconds?: number;
  loopVideo?: boolean;
  play720?: string;
  play1080?: string;
  play4k?: string;
  download720?: string;
  download1080?: string;
  download4k?: string;
  thumbnail?: string;
  downloadsExpire?: Date;
  pendingUpdate?: boolean;
}
