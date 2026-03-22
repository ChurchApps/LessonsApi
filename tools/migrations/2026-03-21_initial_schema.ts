import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {

  // providers
  await db.schema
    .createTable("providers")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("name", sql`varchar(255)`)
    .addColumn("live", sql`bit(1)`)
    .modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=latin1`)
    .execute();

  // programs
  await db.schema
    .createTable("programs")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("providerId", sql`char(11)`)
    .addColumn("name", sql`varchar(255)`)
    .addColumn("slug", sql`varchar(45)`)
    .addColumn("image", sql`varchar(1000)`)
    .addColumn("shortDescription", sql`varchar(1000)`)
    .addColumn("description", "text")
    .addColumn("videoEmbedUrl", sql`varchar(255)`)
    .addColumn("live", sql`bit(1)`)
    .addColumn("aboutSection", "text")
    .addColumn("age", sql`varchar(45)`)
    .addColumn("sort", "integer")
    .modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    .execute();

  await db.schema.createIndex("idx_programs_provider_live").on("programs").columns(["providerId", "live"]).execute();

  // studies
  await db.schema
    .createTable("studies")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("programId", sql`char(11)`)
    .addColumn("name", sql`varchar(255)`)
    .addColumn("slug", sql`varchar(45)`)
    .addColumn("image", sql`varchar(1000)`)
    .addColumn("shortDescription", sql`varchar(1000)`)
    .addColumn("description", "text")
    .addColumn("videoEmbedUrl", sql`varchar(255)`)
    .addColumn("sort", "integer")
    .addColumn("live", sql`bit(1)`)
    .modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=latin1`)
    .execute();

  // studyCategories
  await db.schema
    .createTable("studyCategories")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("programId", sql`char(11)`)
    .addColumn("studyId", sql`char(11)`)
    .addColumn("categoryName", sql`varchar(255)`)
    .addColumn("sort", sql`float`)
    .modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    .execute();

  // lessons
  await db.schema
    .createTable("lessons")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("studyId", sql`char(11)`)
    .addColumn("name", sql`varchar(45)`)
    .addColumn("slug", sql`varchar(45)`)
    .addColumn("title", sql`varchar(255)`)
    .addColumn("sort", "integer")
    .addColumn("image", sql`varchar(1000)`)
    .addColumn("live", sql`bit(1)`)
    .addColumn("description", "text")
    .addColumn("videoEmbedUrl", sql`varchar(255)`)
    .modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=latin1`)
    .execute();

  await db.schema.createIndex("idx_lessons_study_live_sort").on("lessons").columns(["studyId", "live", "sort"]).execute();
  await db.schema.createIndex("idx_lessons_live").on("lessons").column("live").execute();

  // venues
  await db.schema
    .createTable("venues")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("lessonId", sql`char(11)`)
    .addColumn("name", sql`varchar(45)`)
    .addColumn("sort", "integer")
    .modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=latin1`)
    .execute();

  // sections
  await db.schema
    .createTable("sections")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("lessonId", sql`char(11)`)
    .addColumn("venueId", sql`char(11)`)
    .addColumn("name", sql`varchar(255)`)
    .addColumn("sort", "integer")
    .addColumn("materials", sql`mediumtext`)
    .modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=latin1`)
    .execute();

  // roles
  await db.schema
    .createTable("roles")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("lessonId", sql`char(11)`)
    .addColumn("sectionId", sql`char(11)`)
    .addColumn("name", sql`varchar(45)`)
    .addColumn("sort", "integer")
    .modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=latin1`)
    .execute();

  // actions
  await db.schema
    .createTable("actions")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("lessonId", sql`char(11)`)
    .addColumn("roleId", sql`char(11)`)
    .addColumn("actionType", sql`varchar(45)`)
    .addColumn("content", "text")
    .addColumn("sort", "integer")
    .addColumn("resourceId", sql`char(11)`)
    .addColumn("assetId", sql`char(11)`)
    .addColumn("externalVideoId", sql`char(11)`)
    .addColumn("addOnId", sql`char(11)`)
    .modifyEnd(sql`ENGINE=InnoDB`)
    .execute();

  await db.schema.createIndex("idx_actions_lesson").on("actions").column("lessonId").execute();

  // files
  await db.schema
    .createTable("files")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("fileName", sql`varchar(255)`)
    .addColumn("contentPath", sql`varchar(1024)`)
    .addColumn("fileType", sql`varchar(45)`)
    .addColumn("size", "integer")
    .addColumn("dateModified", "datetime")
    .addColumn("seconds", "integer")
    .addColumn("thumbPath", sql`varchar(1024)`)
    .modifyEnd(sql`ENGINE=InnoDB`)
    .execute();

  await db.schema.createIndex("idx_files_church").on("files").column("churchId").execute();

  // bundles
  await db.schema
    .createTable("bundles")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("contentType", sql`varchar(45)`)
    .addColumn("contentId", sql`char(11)`)
    .addColumn("name", sql`varchar(45)`)
    .addColumn("fileId", sql`char(11)`)
    .addColumn("pendingUpdate", sql`bit(1)`)
    .modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=latin1`)
    .execute();

  await db.schema.createIndex("idx_bundles_content").on("bundles").columns(["contentType", "contentId"]).execute();
  await db.schema.createIndex("idx_bundles_pending").on("bundles").column("pendingUpdate").execute();

  // resources
  await db.schema
    .createTable("resources")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("contentType", sql`varchar(45)`)
    .addColumn("contentId", sql`char(11)`)
    .addColumn("name", sql`varchar(45)`)
    .addColumn("category", sql`varchar(45)`)
    .addColumn("bundleId", sql`char(11)`)
    .addColumn("loopVideo", sql`bit(1)`, (col) => col.defaultTo(0))
    .modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=latin1`)
    .execute();

  await db.schema.createIndex("idx_resources_bundle").on("resources").column("bundleId").execute();
  await db.schema.createIndex("idx_resources_content").on("resources").columns(["contentType", "contentId"]).execute();

  // variants
  await db.schema
    .createTable("variants")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("resourceId", sql`char(11)`)
    .addColumn("fileId", sql`char(11)`)
    .addColumn("name", sql`varchar(45)`)
    .addColumn("downloadDefault", sql`bit(1)`)
    .addColumn("playerDefault", sql`bit(1)`)
    .addColumn("hidden", sql`bit(1)`)
    .modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=latin1`)
    .execute();

  await db.schema.createIndex("idx_variants_resource").on("variants").column("resourceId").execute();

  // assets
  await db.schema
    .createTable("assets")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("resourceId", sql`char(11)`)
    .addColumn("fileId", sql`char(11)`)
    .addColumn("name", sql`varchar(45)`)
    .addColumn("sort", "integer")
    .modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=latin1`)
    .execute();

  // externalProviders
  await db.schema
    .createTable("externalProviders")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("name", sql`varchar(45)`)
    .addColumn("apiUrl", sql`varchar(1024)`)
    .modifyEnd(sql`ENGINE=InnoDB`)
    .execute();

  // externalVideos
  await db.schema
    .createTable("externalVideos")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("contentType", sql`varchar(45)`)
    .addColumn("contentId", sql`char(11)`)
    .addColumn("name", sql`varchar(45)`)
    .addColumn("videoProvider", sql`varchar(45)`)
    .addColumn("videoId", sql`varchar(45)`)
    .addColumn("seconds", sql`float`)
    .addColumn("loopVideo", sql`bit(1)`)
    .addColumn("download720", sql`varchar(2048)`)
    .addColumn("download1080", sql`varchar(2048)`)
    .addColumn("download4k", sql`varchar(2048)`)
    .addColumn("play720", sql`varchar(2048)`)
    .addColumn("play1080", sql`varchar(2048)`)
    .addColumn("play4k", sql`varchar(2048)`)
    .addColumn("thumbnail", sql`varchar(255)`)
    .addColumn("downloadsExpire", "datetime")
    .modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    .execute();

  // classrooms
  await db.schema
    .createTable("classrooms")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("name", sql`varchar(45)`)
    .addColumn("recentGroupId", sql`char(11)`)
    .addColumn("upcomingGroupId", sql`char(11)`)
    .modifyEnd(sql`ENGINE=InnoDB`)
    .execute();

  await db.schema.createIndex("idx_classrooms_church_groups").on("classrooms").columns(["churchId", "recentGroupId", "upcomingGroupId"]).execute();

  // customizations
  await db.schema
    .createTable("customizations")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("venueId", sql`char(11)`)
    .addColumn("classroomId", sql`char(11)`)
    .addColumn("contentType", sql`varchar(45)`)
    .addColumn("contentId", sql`char(11)`)
    .addColumn("action", sql`varchar(45)`)
    .addColumn("actionContent", sql`mediumtext`)
    .modifyEnd(sql`ENGINE=InnoDB`)
    .execute();

  // schedules
  await db.schema
    .createTable("schedules")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("classroomId", sql`char(11)`)
    .addColumn("scheduledDate", "date")
    .addColumn("externalProviderId", sql`char(11)`)
    .addColumn("programId", sql`char(11)`)
    .addColumn("studyId", sql`char(11)`)
    .addColumn("lessonId", sql`char(11)`)
    .addColumn("venueId", sql`char(11)`)
    .addColumn("displayName", sql`varchar(255)`)
    .modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=latin1`)
    .execute();

  await db.schema.createIndex("idx_schedules_church_classroom").on("schedules").columns(["churchId", "classroomId"]).execute();
  await db.schema.createIndex("idx_schedules_date").on("schedules").column("scheduledDate").execute();

  // downloads
  await db.schema
    .createTable("downloads")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("lessonId", sql`char(11)`)
    .addColumn("fileId", sql`char(11)`)
    .addColumn("userId", sql`char(11)`)
    .addColumn("churchId", sql`char(11)`)
    .addColumn("ipAddress", sql`varchar(45)`)
    .addColumn("downloadDate", "datetime")
    .addColumn("fileName", sql`varchar(255)`)
    .modifyEnd(sql`ENGINE=InnoDB`)
    .execute();

  await db.schema.createIndex("idx_downloads_lesson_church").on("downloads").columns(["lessonId", "churchId"]).execute();
  await db.schema.createIndex("idx_downloads_date").on("downloads").column("downloadDate").execute();

  // addOns
  await db.schema
    .createTable("addOns")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("providerId", sql`char(11)`)
    .addColumn("category", sql`varchar(45)`)
    .addColumn("name", sql`varchar(45)`)
    .addColumn("image", sql`varchar(1000)`)
    .addColumn("addOnType", sql`varchar(45)`)
    .addColumn("fileId", sql`char(11)`)
    .modifyEnd(sql`ENGINE=InnoDB`)
    .execute();

  // addOnPlaylists
  await db.schema
    .createTable("addOnPlaylists")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("providerId", sql`char(11)`)
    .addColumn("name", sql`varchar(45)`)
    .modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    .execute();

  // addOnPlaylistItems
  await db.schema
    .createTable("addOnPlaylistItems")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("churchId", sql`char(11)`)
    .addColumn("playlistId", sql`char(11)`)
    .addColumn("addOnId", sql`char(11)`)
    .addColumn("sort", sql`float`)
    .modifyEnd(sql`ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    .execute();

  // ipDetails
  await db.schema
    .createTable("ipDetails")
    .ifNotExists()
    .addColumn("id", sql`char(11)`, (col) => col.notNull().primaryKey())
    .addColumn("ipAddress", sql`varchar(45)`)
    .addColumn("city", sql`varchar(45)`)
    .addColumn("state", sql`varchar(45)`)
    .addColumn("country", sql`varchar(45)`)
    .addColumn("lat", sql`float`)
    .addColumn("lon", sql`float`)
    .addColumn("isp", sql`varchar(45)`)
    .modifyEnd(sql`ENGINE=InnoDB`)
    .execute();

  // labelledBundles (VIEW)
  await sql`
    CREATE OR REPLACE VIEW \`labelledBundles\` AS
    SELECT
      b.id AS id,
      b.churchId AS churchId,
      b.contentType AS contentType,
      b.contentId AS contentId,
      b.name AS name,
      b.fileId AS fileId,
      b.pendingUpdate AS pendingUpdate,
      IFNULL(IFNULL(l.name, s.name), p.name) AS contentName,
      IFNULL(l.studyId, s.id) AS studyId,
      IFNULL(s.programId, p.id) AS programId
    FROM bundles b
      LEFT JOIN programs p ON (b.contentType = 'program' AND p.id = b.contentId)
      LEFT JOIN studies s ON (b.contentType = 'study' AND s.id = b.contentId)
      LEFT JOIN lessons l ON (b.contentType = 'lesson' AND l.id = b.contentId)
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop view first
  await sql`DROP VIEW IF EXISTS \`labelledBundles\``.execute(db);

  // Drop tables in reverse order
  const tables = [
    "ipDetails",
    "addOnPlaylistItems",
    "addOnPlaylists",
    "addOns",
    "downloads",
    "schedules",
    "customizations",
    "classrooms",
    "externalVideos",
    "externalProviders",
    "assets",
    "variants",
    "resources",
    "bundles",
    "files",
    "actions",
    "roles",
    "sections",
    "venues",
    "lessons",
    "studyCategories",
    "studies",
    "programs",
    "providers",
  ];

  for (const table of tables) {
    await db.schema.dropTable(table).ifExists().execute();
  }
}
