import { FeedAction, FeedFile, FeedSection, FeedVenue } from "./feed";

// The catalog JSON an external provider serves at its apiUrl (programs > studies > lessons > venues).
export interface ExternalCatalogVenue {
  id?: string;
  name?: string;
  apiUrl?: string;
}

export interface ExternalCatalogLesson {
  id?: string;
  name?: string;
  description?: string;
  bottomLine?: string;
  verse?: string;
  parentQuestion?: string;
  parentNote?: string;
  venues?: ExternalCatalogVenue[];
}

export interface ExternalCatalogStudy {
  id?: string;
  lessons?: ExternalCatalogLesson[];
}

export interface ExternalCatalogProgram {
  id?: string;
  studies?: ExternalCatalogStudy[];
}

export interface ExternalCatalog {
  programs?: ExternalCatalogProgram[];
}

// A venue feed served by an external provider: our FeedVenue plus the extra fields providers send.
export interface ExternalFeedFile extends FeedFile {
  loopVideo?: boolean;
}

export interface ExternalFeedAction extends FeedAction {
  name?: string;
  roleName?: string;
  files?: ExternalFeedFile[];
}

export interface ExternalFeedSection extends FeedSection {
  actions?: ExternalFeedAction[];
}

export interface ExternalFeedVenue extends FeedVenue {
  lessonTitle?: string;
  sections?: ExternalFeedSection[];
}
