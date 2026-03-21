export interface Study {
  id?: string;
  churchId?: string;
  programId?: string;
  name?: string;
  slug?: string;
  image?: string;
  shortDescription?: string;
  description?: string;
  videoEmbedUrl?: string;
  sort?: number;
  live?: boolean;

  lessonCount?: number;
}
