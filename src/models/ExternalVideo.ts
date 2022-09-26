export class ExternalVideo {
  public id?: string;
  public churchId?: string;
  public contentType?: string;
  public contentId?: string;
  public name?: string;
  public videoProvider?: string;
  public videoId?: string;
  public seconds?: number;
  public loopVideo?: boolean;
  public play720?: string;
  public play1080?: string;
  public play4k?: string;
  public download720?: string;
  public download1080?: string;
  public download4k?: string;
  public thumbnail?: string;
  public downloadsExpire: Date;
}
