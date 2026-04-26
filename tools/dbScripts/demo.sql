DROP PROCEDURE IF EXISTS resetDemoData;

DELIMITER $$
CREATE PROCEDURE resetDemoData()
BEGIN
    SET FOREIGN_KEY_CHECKS = 0;
    TRUNCATE TABLE actions;
    TRUNCATE TABLE roles;
    TRUNCATE TABLE sections;
    TRUNCATE TABLE venues;
    TRUNCATE TABLE lessons;
    TRUNCATE TABLE studyCategories;
    TRUNCATE TABLE studies;
    TRUNCATE TABLE programs;
    TRUNCATE TABLE providers;
    TRUNCATE TABLE addOnPlaylistItems;
    TRUNCATE TABLE addOnPlaylists;
    TRUNCATE TABLE addOns;
    TRUNCATE TABLE downloads;
    TRUNCATE TABLE schedules;
    TRUNCATE TABLE customizations;
    TRUNCATE TABLE classrooms;
    TRUNCATE TABLE externalVideos;
    TRUNCATE TABLE externalProviders;
    TRUNCATE TABLE assets;
    TRUNCATE TABLE variants;
    TRUNCATE TABLE resources;
    TRUNCATE TABLE bundles;
    TRUNCATE TABLE files;
    TRUNCATE TABLE ipDetails;
    SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- Provider (publisher of the demo curriculum)
-- ========================================
INSERT INTO providers (id, churchId, name, live) VALUES
('PRO00000001', 'CHU00000099', 'Lessons.church Free', 1);

-- ========================================
-- Programs (top-level curriculum series, browsable by anyone via live=1)
-- ========================================
INSERT INTO programs (id, churchId, providerId, name, slug, image, shortDescription, description, videoEmbedUrl, live, aboutSection, age, sort) VALUES
('PGM00000001', 'CHU00000099', 'PRO00000001', 'Old Testament Heroes', 'old-testament-heroes',
 '/content/programs/old-testament-heroes.jpg',
 'Stories of God''s faithful servants from the Old Testament.',
 'A 12-week journey through the lives of key figures from Genesis through the prophets, designed for elementary students.',
 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1,
 'This program covers Adam, Noah, Abraham, Moses, David, and the prophets. Each week includes a memory verse, a story, and an application activity.',
 'Elementary', 1),
('PGM00000002', 'CHU00000099', 'PRO00000001', 'New Testament Stories', 'new-testament-stories',
 '/content/programs/new-testament-stories.jpg',
 'Jesus'' life and parables for preschool learners.',
 'A 10-week introduction to the life of Jesus and his parables, geared toward children ages 3 to 5.',
 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1,
 'Covers the birth of Jesus, his miracles, and a selection of his parables. Hands-on crafts reinforce each lesson.',
 'Preschool', 2);

-- ========================================
-- Study Categories
-- ========================================
INSERT INTO studyCategories (id, programId, studyId, categoryName, sort) VALUES
('SCT00000001', 'PGM00000001', NULL, 'Heroes of Faith', 1),
('SCT00000002', 'PGM00000002', NULL, 'Life of Jesus', 1);

-- ========================================
-- Studies (4 — 2 per program)
-- ========================================
INSERT INTO studies (id, churchId, programId, name, slug, image, shortDescription, description, videoEmbedUrl, sort, live) VALUES
('STU00000001', 'CHU00000099', 'PGM00000001', 'Genesis Stories', 'genesis-stories',
 '/content/studies/genesis-stories.jpg',
 'From creation through Joseph.',
 'Six lessons covering creation, the fall, Noah, Abraham, Isaac, and Joseph.',
 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1, 1),
('STU00000002', 'CHU00000099', 'PGM00000001', 'Exodus Adventures', 'exodus-adventures',
 '/content/studies/exodus-adventures.jpg',
 'Moses and the deliverance of Israel.',
 'Five lessons walking through the call of Moses, the plagues, the Passover, and the giving of the Law.',
 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2, 1),
('STU00000003', 'CHU00000099', 'PGM00000002', 'Birth of Jesus', 'birth-of-jesus',
 '/content/studies/birth-of-jesus.jpg',
 'The Christmas story for little ones.',
 'Four lessons leading up to the birth of Jesus and the visit of the wise men.',
 'https://www.youtube.com/embed/dQw4w9WgXcQ', 1, 1),
('STU00000004', 'CHU00000099', 'PGM00000002', 'Parables', 'parables',
 '/content/studies/parables.jpg',
 'Stories Jesus told.',
 'Six lessons exploring the lessons in the Good Samaritan, the Prodigal Son, and other parables.',
 'https://www.youtube.com/embed/dQw4w9WgXcQ', 2, 1);

-- ========================================
-- Lessons (8 — 2 per study)
-- ========================================
INSERT INTO lessons (id, churchId, studyId, name, slug, title, sort, image, live, description, videoEmbedUrl) VALUES
('LSN00000001', 'CHU00000099', 'STU00000001', 'Creation', 'creation', 'In the Beginning', 1,
 '/content/lessons/creation.jpg', 1,
 'God created the heavens and the earth in six days and rested on the seventh.',
 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
('LSN00000002', 'CHU00000099', 'STU00000001', 'Noah''s Ark', 'noahs-ark', 'God Saves Noah', 2,
 '/content/lessons/noahs-ark.jpg', 1,
 'God instructs Noah to build an ark and saves him from the flood.',
 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
('LSN00000003', 'CHU00000099', 'STU00000002', 'Moses and Pharaoh', 'moses-and-pharaoh', 'Let My People Go', 1,
 '/content/lessons/moses.jpg', 1,
 'Moses confronts Pharaoh to free the Israelites from slavery.',
 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
('LSN00000004', 'CHU00000099', 'STU00000002', 'Ten Commandments', 'ten-commandments', 'God Gives the Law', 2,
 '/content/lessons/ten-commandments.jpg', 1,
 'God gives Moses the ten commandments on Mount Sinai.',
 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
('LSN00000005', 'CHU00000099', 'STU00000003', 'Mary''s Visit', 'marys-visit', 'An Angel Visits Mary', 1,
 '/content/lessons/marys-visit.jpg', 1,
 'The angel Gabriel announces to Mary that she will give birth to Jesus.',
 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
('LSN00000006', 'CHU00000099', 'STU00000003', 'Shepherds and Angels', 'shepherds-and-angels', 'Good News in the Fields', 2,
 '/content/lessons/shepherds.jpg', 1,
 'Angels announce the birth of Jesus to shepherds watching their flocks.',
 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
('LSN00000007', 'CHU00000099', 'STU00000004', 'The Good Samaritan', 'good-samaritan', 'Loving Your Neighbor', 1,
 '/content/lessons/samaritan.jpg', 1,
 'Jesus tells the parable of the Good Samaritan to teach who our neighbor is.',
 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
('LSN00000008', 'CHU00000099', 'STU00000004', 'The Prodigal Son', 'prodigal-son', 'A Father''s Love', 2,
 '/content/lessons/prodigal.jpg', 1,
 'Jesus tells the parable of the Prodigal Son to illustrate God''s forgiveness.',
 'https://www.youtube.com/embed/dQw4w9WgXcQ');

-- ========================================
-- Venues (Creation has 2 — Preschool + Elementary; others have 1)
-- ========================================
INSERT INTO venues (id, churchId, lessonId, name, sort) VALUES
('VEN00000001', 'CHU00000099', 'LSN00000001', 'Preschool', 1),
('VEN00000002', 'CHU00000099', 'LSN00000001', 'Elementary', 2),
('VEN00000003', 'CHU00000099', 'LSN00000002', 'Elementary', 1),
('VEN00000004', 'CHU00000099', 'LSN00000003', 'Elementary', 1),
('VEN00000005', 'CHU00000099', 'LSN00000004', 'Elementary', 1),
('VEN00000006', 'CHU00000099', 'LSN00000005', 'Preschool', 1),
('VEN00000007', 'CHU00000099', 'LSN00000006', 'Preschool', 1),
('VEN00000008', 'CHU00000099', 'LSN00000007', 'Elementary', 1),
('VEN00000009', 'CHU00000099', 'LSN00000008', 'Elementary', 1);

-- ========================================
-- Sections (3 per fully-built venue, 1 per minimal venue)
-- ========================================
-- Creation / Preschool venue (VEN00000001)
INSERT INTO sections (id, churchId, lessonId, venueId, name, sort, materials) VALUES
('SCN00000001', 'CHU00000099', 'LSN00000001', 'VEN00000001', 'Welcome', 1, NULL),
('SCN00000002', 'CHU00000099', 'LSN00000001', 'VEN00000001', 'Bible Story', 2, 'Picture book of creation'),
('SCN00000003', 'CHU00000099', 'LSN00000001', 'VEN00000001', 'Activity', 3, 'Construction paper, glue, scissors'),
-- Creation / Elementary venue (VEN00000002)
('SCN00000004', 'CHU00000099', 'LSN00000001', 'VEN00000002', 'Welcome', 1, NULL),
('SCN00000005', 'CHU00000099', 'LSN00000001', 'VEN00000002', 'Bible Story', 2, 'Bible, whiteboard'),
('SCN00000006', 'CHU00000099', 'LSN00000001', 'VEN00000002', 'Activity', 3, 'Worksheets, markers'),
-- Other lessons each get one section so the structure exists
('SCN00000007', 'CHU00000099', 'LSN00000002', 'VEN00000003', 'Bible Story', 1, NULL),
('SCN00000008', 'CHU00000099', 'LSN00000003', 'VEN00000004', 'Bible Story', 1, NULL),
('SCN00000009', 'CHU00000099', 'LSN00000004', 'VEN00000005', 'Bible Story', 1, NULL),
('SCN00000010', 'CHU00000099', 'LSN00000005', 'VEN00000006', 'Bible Story', 1, NULL),
('SCN00000011', 'CHU00000099', 'LSN00000006', 'VEN00000007', 'Bible Story', 1, NULL),
('SCN00000012', 'CHU00000099', 'LSN00000007', 'VEN00000008', 'Bible Story', 1, NULL),
('SCN00000013', 'CHU00000099', 'LSN00000008', 'VEN00000009', 'Bible Story', 1, NULL);

-- ========================================
-- Roles (2 per fully-built section, 1 per minimal section)
-- ========================================
-- Creation / Preschool sections
INSERT INTO roles (id, churchId, lessonId, sectionId, name, sort) VALUES
('LRO00000001', 'CHU00000099', 'LSN00000001', 'SCN00000001', 'Lead Teacher', 1),
('LRO00000002', 'CHU00000099', 'LSN00000001', 'SCN00000001', 'Helper', 2),
('LRO00000003', 'CHU00000099', 'LSN00000001', 'SCN00000002', 'Lead Teacher', 1),
('LRO00000004', 'CHU00000099', 'LSN00000001', 'SCN00000003', 'Lead Teacher', 1),
-- Creation / Elementary sections
('LRO00000005', 'CHU00000099', 'LSN00000001', 'SCN00000004', 'Lead Teacher', 1),
('LRO00000006', 'CHU00000099', 'LSN00000001', 'SCN00000005', 'Lead Teacher', 1),
('LRO00000007', 'CHU00000099', 'LSN00000001', 'SCN00000006', 'Lead Teacher', 1),
-- Other lessons
('LRO00000008', 'CHU00000099', 'LSN00000002', 'SCN00000007', 'Lead Teacher', 1),
('LRO00000009', 'CHU00000099', 'LSN00000003', 'SCN00000008', 'Lead Teacher', 1),
('LRO00000010', 'CHU00000099', 'LSN00000004', 'SCN00000009', 'Lead Teacher', 1),
('LRO00000011', 'CHU00000099', 'LSN00000005', 'SCN00000010', 'Lead Teacher', 1),
('LRO00000012', 'CHU00000099', 'LSN00000006', 'SCN00000011', 'Lead Teacher', 1),
('LRO00000013', 'CHU00000099', 'LSN00000007', 'SCN00000012', 'Lead Teacher', 1),
('LRO00000014', 'CHU00000099', 'LSN00000008', 'SCN00000013', 'Lead Teacher', 1);

-- ========================================
-- Actions (Say / Do / Note / Play)
-- One of each type for every Lead Teacher role on the fully-built lesson;
-- minimal lessons get one Say + one Do.
-- ========================================
-- Creation / Preschool / Welcome (LRO00000001 lead, LRO00000002 helper)
INSERT INTO actions (id, churchId, lessonId, roleId, actionType, content, sort, resourceId, assetId, externalVideoId, addOnId) VALUES
('ACT00000001', 'CHU00000099', 'LSN00000001', 'LRO00000001', 'Say', 'Welcome to Sunday School! We are so glad you are here.', 1, NULL, NULL, NULL, NULL),
('ACT00000002', 'CHU00000099', 'LSN00000001', 'LRO00000001', 'Do', 'Greet each child by name as they arrive and help them find a seat on the carpet.', 2, NULL, NULL, NULL, NULL),
('ACT00000003', 'CHU00000099', 'LSN00000001', 'LRO00000001', 'Note', 'Be ready to comfort any child who is anxious about being separated from their parents.', 3, NULL, NULL, NULL, NULL),
('ACT00000004', 'CHU00000099', 'LSN00000001', 'LRO00000001', 'Play', 'Welcome song video.', 4, NULL, NULL, NULL, NULL),
('ACT00000005', 'CHU00000099', 'LSN00000001', 'LRO00000002', 'Do', 'Pass out name tags to any visitors.', 1, NULL, NULL, NULL, NULL),
-- Creation / Preschool / Bible Story (LRO00000003)
('ACT00000006', 'CHU00000099', 'LSN00000001', 'LRO00000003', 'Say', 'In the beginning, God created the heavens and the earth.', 1, NULL, NULL, NULL, NULL),
('ACT00000007', 'CHU00000099', 'LSN00000001', 'LRO00000003', 'Do', 'Open the picture book and turn the pages slowly as you tell the story.', 2, NULL, NULL, NULL, NULL),
('ACT00000008', 'CHU00000099', 'LSN00000001', 'LRO00000003', 'Note', 'Pause for questions after each day of creation.', 3, NULL, NULL, NULL, NULL),
('ACT00000009', 'CHU00000099', 'LSN00000001', 'LRO00000003', 'Play', 'Creation video.', 4, NULL, NULL, NULL, NULL),
-- Creation / Preschool / Activity (LRO00000004)
('ACT00000010', 'CHU00000099', 'LSN00000001', 'LRO00000004', 'Say', 'Today we are going to make our own creation collage.', 1, NULL, NULL, NULL, NULL),
('ACT00000011', 'CHU00000099', 'LSN00000001', 'LRO00000004', 'Do', 'Hand out the construction paper and demonstrate gluing the cut-outs.', 2, NULL, NULL, NULL, NULL),
-- Creation / Elementary / Welcome (LRO00000005)
('ACT00000012', 'CHU00000099', 'LSN00000001', 'LRO00000005', 'Say', 'Good morning! Today we are exploring how God created the world.', 1, NULL, NULL, NULL, NULL),
('ACT00000013', 'CHU00000099', 'LSN00000001', 'LRO00000005', 'Do', 'Take attendance and check in any new visitors.', 2, NULL, NULL, NULL, NULL),
-- Creation / Elementary / Bible Story (LRO00000006)
('ACT00000014', 'CHU00000099', 'LSN00000001', 'LRO00000006', 'Say', 'Open your Bible to Genesis chapter 1, verse 1.', 1, NULL, NULL, NULL, NULL),
('ACT00000015', 'CHU00000099', 'LSN00000001', 'LRO00000006', 'Do', 'Write the six days of creation on the whiteboard as you teach.', 2, NULL, NULL, NULL, NULL),
('ACT00000016', 'CHU00000099', 'LSN00000001', 'LRO00000006', 'Note', 'Be prepared for questions about evolution and how to handle them sensitively.', 3, NULL, NULL, NULL, NULL),
('ACT00000017', 'CHU00000099', 'LSN00000001', 'LRO00000006', 'Play', 'Time-lapse of creation.', 4, NULL, NULL, NULL, NULL),
-- Creation / Elementary / Activity (LRO00000007)
('ACT00000018', 'CHU00000099', 'LSN00000001', 'LRO00000007', 'Say', 'Use the worksheet to draw your favorite day of creation.', 1, NULL, NULL, NULL, NULL),
('ACT00000019', 'CHU00000099', 'LSN00000001', 'LRO00000007', 'Do', 'Walk around and offer encouragement as kids work.', 2, NULL, NULL, NULL, NULL),
-- Other lessons: 1 Say + 1 Do each
('ACT00000020', 'CHU00000099', 'LSN00000002', 'LRO00000008', 'Say', 'God told Noah to build a giant boat to save his family and the animals.', 1, NULL, NULL, NULL, NULL),
('ACT00000021', 'CHU00000099', 'LSN00000002', 'LRO00000008', 'Do', 'Show pictures of Noah loading animals onto the ark.', 2, NULL, NULL, NULL, NULL),
('ACT00000022', 'CHU00000099', 'LSN00000003', 'LRO00000009', 'Say', 'Moses said to Pharaoh: Let my people go!', 1, NULL, NULL, NULL, NULL),
('ACT00000023', 'CHU00000099', 'LSN00000003', 'LRO00000009', 'Do', 'Act out the confrontation between Moses and Pharaoh.', 2, NULL, NULL, NULL, NULL),
('ACT00000024', 'CHU00000099', 'LSN00000004', 'LRO00000010', 'Say', 'On Mount Sinai, God gave Moses ten commandments to live by.', 1, NULL, NULL, NULL, NULL),
('ACT00000025', 'CHU00000099', 'LSN00000004', 'LRO00000010', 'Do', 'Hand out the printable list of commandments.', 2, NULL, NULL, NULL, NULL),
('ACT00000026', 'CHU00000099', 'LSN00000005', 'LRO00000011', 'Say', 'The angel Gabriel told Mary she would have a special baby named Jesus.', 1, NULL, NULL, NULL, NULL),
('ACT00000027', 'CHU00000099', 'LSN00000005', 'LRO00000011', 'Do', 'Use a finger puppet to play the angel.', 2, NULL, NULL, NULL, NULL),
('ACT00000028', 'CHU00000099', 'LSN00000006', 'LRO00000012', 'Say', 'Angels appeared to shepherds and told them about Jesus.', 1, NULL, NULL, NULL, NULL),
('ACT00000029', 'CHU00000099', 'LSN00000006', 'LRO00000012', 'Do', 'Play shepherd music in the background.', 2, NULL, NULL, NULL, NULL),
('ACT00000030', 'CHU00000099', 'LSN00000007', 'LRO00000013', 'Say', 'Jesus told a story about a man who helped his enemy.', 1, NULL, NULL, NULL, NULL),
('ACT00000031', 'CHU00000099', 'LSN00000007', 'LRO00000013', 'Do', 'Discuss who counts as our neighbor today.', 2, NULL, NULL, NULL, NULL),
('ACT00000032', 'CHU00000099', 'LSN00000008', 'LRO00000014', 'Say', 'A father welcomed his lost son home with a great feast.', 1, NULL, NULL, NULL, NULL),
('ACT00000033', 'CHU00000099', 'LSN00000008', 'LRO00000014', 'Do', 'Discuss a time you needed forgiveness.', 2, NULL, NULL, NULL, NULL);

-- ========================================
-- External Provider (covers ChurchAppsSupport: admin/third-party-providers.md)
-- ========================================
INSERT INTO externalProviders (id, churchId, name, apiUrl) VALUES
('EXT00000001', 'CHU00000099', 'Bible Project Lessons', 'https://api.bibleproject.com/v1/lessons');

-- ========================================
-- Grace's Classrooms + Schedules (consumer of the global curriculum)
-- ========================================
INSERT INTO classrooms (id, churchId, name, recentGroupId, upcomingGroupId) VALUES
('CLS00000001', 'CHU00000001', 'Preschool Room', NULL, NULL),
('CLS00000002', 'CHU00000001', 'Elementary Room', NULL, NULL);

-- Schedules: dates are kept far enough in the future that they remain "upcoming"
-- across long-running test branches. Adjust if running far past mid-2026.
INSERT INTO schedules (id, churchId, classroomId, scheduledDate, externalProviderId, programId, studyId, lessonId, venueId, displayName) VALUES
('SCH00000001', 'CHU00000001', 'CLS00000001', '2026-06-07', NULL, 'PGM00000002', 'STU00000003', 'LSN00000005', 'VEN00000006', 'Mary''s Visit (Preschool)'),
('SCH00000002', 'CHU00000001', 'CLS00000002', '2026-06-07', NULL, 'PGM00000001', 'STU00000001', 'LSN00000001', 'VEN00000002', 'Creation (Elementary)'),
('SCH00000003', 'CHU00000001', 'CLS00000002', '2026-06-14', NULL, 'PGM00000001', 'STU00000001', 'LSN00000002', 'VEN00000003', 'Noah''s Ark (Elementary)');

END $$
DELIMITER ;

-- Execute the stored procedure to populate demo data
CALL resetDemoData();
