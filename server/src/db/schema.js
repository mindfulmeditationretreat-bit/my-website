const {
  mysqlTable, int, varchar, text, longtext, boolean,
  datetime, double, json, mysqlEnum, index, uniqueIndex,
} = require('drizzle-orm/mysql-core');
const { relations, sql } = require('drizzle-orm');

// ─── Tables ──────────────────────────────────────────────────────────────────

const users = mysqlTable('users', {
  id:                int('id').primaryKey().autoincrement(),
  email:             varchar('email', { length: 255 }).notNull().unique(),
  passwordHash:      varchar('password_hash', { length: 255 }),
  googleId:          varchar('google_id', { length: 255 }).unique(),
  role:              mysqlEnum('role', ['user', 'instructor', 'admin']).notNull().default('user'),
  fullName:          varchar('full_name', { length: 255 }),
  age:               int('age'),
  gender:            varchar('gender', { length: 50 }),
  wellnessGoals:     json('wellness_goals'),
  photoUrl:          varchar('photo_url', { length: 500 }),
  bio:               text('bio'),
  expertise:         varchar('expertise', { length: 255 }),
  availability:      varchar('availability', { length: 255 }),
  address:           varchar('address', { length: 500 }),
  phone:             varchar('phone', { length: 50 }),
  country:           varchar('country', { length: 255 }),
  travelCountry:     varchar('travel_country', { length: 255 }),
  notificationPrefs: json('notification_prefs'),
  onboarded:         boolean('onboarded').notNull().default(false),
  emailVerified:     boolean('email_verified').notNull().default(false),
  active:            boolean('active').notNull().default(true),
  createdAt:         datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
  updatedAt:         datetime('updated_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({
  roleIdx: index('role_idx').on(t.role),
}));

const programs = mysqlTable('programs', {
  id:          int('id').primaryKey().autoincrement(),
  slug:        varchar('slug', { length: 100 }).notNull().unique(),
  name:        varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  features:    json('features'),
  priceCents:  int('price_cents').notNull().default(0),
  currency:    varchar('currency', { length: 10 }).notNull().default('NPR'),
  trialDays:   int('trial_days').notNull().default(14),
  category:    mysqlEnum('category', ['diet', 'meditation', 'counseling', 'general']).notNull().default('general'),
  active:      boolean('active').notNull().default(true),
  createdAt:   datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
});

const subscriptions = mysqlTable('subscriptions', {
  id:                   int('id').primaryKey().autoincrement(),
  userId:               int('user_id').notNull(),
  programId:            int('program_id').notNull(),
  instructorId:         int('instructor_id'),
  status:               mysqlEnum('status', ['trialing', 'active', 'expired', 'cancelled']).notNull().default('trialing'),
  trialStartedAt:       datetime('trial_started_at', { mode: 'date' }),
  trialEndsAt:          datetime('trial_ends_at', { mode: 'date' }),
  currentPeriodEnd:     datetime('current_period_end', { mode: 'date' }),
  trialEndingNotified:  boolean('trial_ending_notified').notNull().default(false),
  createdAt:            datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
  updatedAt:            datetime('updated_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({
  statusIdx:          index('status_idx').on(t.status),
  userProgramUnique:  uniqueIndex('user_program_unique').on(t.userId, t.programId),
}));

const passwordResetTokens = mysqlTable('password_reset_tokens', {
  id:        int('id').primaryKey().autoincrement(),
  userId:    int('user_id').notNull(),
  token:     varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: datetime('expires_at', { mode: 'date' }).notNull(),
  usedAt:    datetime('used_at', { mode: 'date' }),
  createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
});

const verificationTokens = mysqlTable('verification_tokens', {
  id:        int('id').primaryKey().autoincrement(),
  userId:    int('user_id').notNull(),
  token:     varchar('token', { length: 255 }).notNull().unique(),
  code:      varchar('code', { length: 10 }),
  expiresAt: datetime('expires_at', { mode: 'date' }).notNull(),
  usedAt:    datetime('used_at', { mode: 'date' }),
  createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
});

const resources = mysqlTable('resources', {
  id:          int('id').primaryKey().autoincrement(),
  title:       varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type:        mysqlEnum('type', ['pdf', 'video', 'audio', 'image', 'article']).notNull(),
  category:    mysqlEnum('category', ['diet', 'meditation', 'counseling', 'general']).notNull(),
  programId:   int('program_id'),
  url:         varchar('url', { length: 1000 }),
  body:        longtext('body'),
  isPremium:   boolean('is_premium').notNull().default(false),
  uploadedBy:  int('uploaded_by'),
  createdAt:   datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({
  categoryIdx:  index('category_idx').on(t.category),
  typeIdx:      index('type_idx').on(t.type),
  programIdIdx: index('program_id_idx').on(t.programId),
}));

const userResources = mysqlTable('user_resources', {
  id:           int('id').primaryKey().autoincrement(),
  userId:       int('user_id').notNull(),
  resourceId:   int('resource_id').notNull(),
  assignedById: int('assigned_by_id'),
  note:         text('note'),
  createdAt:    datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({
  userIdIdx:        index('user_id_idx').on(t.userId),
  userResourceUniq: uniqueIndex('user_resource_unique').on(t.userId, t.resourceId),
}));

const messages = mysqlTable('messages', {
  id:             int('id').primaryKey().autoincrement(),
  senderId:       int('sender_id').notNull(),
  recipientId:    int('recipient_id').notNull(),
  subscriptionId: int('subscription_id'),
  body:           text('body'),
  fileUrl:        varchar('file_url', { length: 1000 }),
  fileName:       varchar('file_name', { length: 255 }),
  readAt:         datetime('read_at', { mode: 'date' }),
  createdAt:      datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({
  senderRecipientIdx:  index('sender_recipient_idx').on(t.senderId, t.recipientId),
  recipientReadAtIdx:  index('recipient_read_at_idx').on(t.recipientId, t.readAt),
}));

const notifications = mysqlTable('notifications', {
  id:        int('id').primaryKey().autoincrement(),
  userId:    int('user_id').notNull(),
  type:      varchar('type', { length: 100 }).notNull(),
  title:     varchar('title', { length: 255 }).notNull(),
  body:      text('body'),
  link:      varchar('link', { length: 500 }),
  readAt:    datetime('read_at', { mode: 'date' }),
  createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({
  userReadAtIdx: index('user_read_at_idx').on(t.userId, t.readAt),
}));

const progressEntries = mysqlTable('progress_entries', {
  id:         int('id').primaryKey().autoincrement(),
  userId:     int('user_id').notNull(),
  type:       mysqlEnum('type', ['weight', 'meditation', 'mood']).notNull(),
  value:      double('value'),
  note:       text('note'),
  recordedAt: datetime('recorded_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({
  userTypeRecordedIdx: index('user_type_recorded_idx').on(t.userId, t.type, t.recordedAt),
}));

const instructorNotes = mysqlTable('instructor_notes', {
  id:        int('id').primaryKey().autoincrement(),
  userId:    int('user_id').notNull(),
  authorId:  int('author_id').notNull(),
  body:      text('body').notNull(),
  createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({
  userIdIdx: index('user_id_idx').on(t.userId),
}));

// ─── Relations ───────────────────────────────────────────────────────────────

const usersRelations = relations(users, ({ many }) => ({
  subscriptions:       many(subscriptions, { relationName: 'UserSubscriptions' }),
  instructedClients:   many(subscriptions, { relationName: 'InstructorSubscriptions' }),
  passwordResetTokens: many(passwordResetTokens),
  verificationTokens:  many(verificationTokens),
  sentMessages:        many(messages, { relationName: 'SentMessages' }),
  receivedMessages:    many(messages, { relationName: 'ReceivedMessages' }),
  notifications:       many(notifications),
  progressEntries:     many(progressEntries),
  uploadedResources:   many(resources, { relationName: 'UploadedResources' }),
  notes:               many(instructorNotes, { relationName: 'UserNotes' }),
  authoredNotes:       many(instructorNotes, { relationName: 'AuthorNotes' }),
  assignedResources:   many(userResources, { relationName: 'UserResourceOwner' }),
  resourcesAssignedBy: many(userResources, { relationName: 'UserResourceAssigner' }),
}));

const programsRelations = relations(programs, ({ many }) => ({
  subscriptions: many(subscriptions),
  resources:     many(resources),
}));

const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user:       one(users, { fields: [subscriptions.userId],       references: [users.id], relationName: 'UserSubscriptions' }),
  program:    one(programs, { fields: [subscriptions.programId], references: [programs.id] }),
  instructor: one(users, { fields: [subscriptions.instructorId], references: [users.id], relationName: 'InstructorSubscriptions' }),
  messages:   many(messages),
}));

const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] }),
}));

const verificationTokensRelations = relations(verificationTokens, ({ one }) => ({
  user: one(users, { fields: [verificationTokens.userId], references: [users.id] }),
}));

const resourcesRelations = relations(resources, ({ one, many }) => ({
  uploader:        one(users, { fields: [resources.uploadedBy], references: [users.id], relationName: 'UploadedResources' }),
  program:         one(programs, { fields: [resources.programId], references: [programs.id] }),
  userAssignments: many(userResources),
}));

const userResourcesRelations = relations(userResources, ({ one }) => ({
  user:       one(users, { fields: [userResources.userId],       references: [users.id], relationName: 'UserResourceOwner' }),
  resource:   one(resources, { fields: [userResources.resourceId], references: [resources.id] }),
  assignedBy: one(users, { fields: [userResources.assignedById], references: [users.id], relationName: 'UserResourceAssigner' }),
}));

const messagesRelations = relations(messages, ({ one }) => ({
  sender:       one(users, { fields: [messages.senderId],       references: [users.id], relationName: 'SentMessages' }),
  recipient:    one(users, { fields: [messages.recipientId],    references: [users.id], relationName: 'ReceivedMessages' }),
  subscription: one(subscriptions, { fields: [messages.subscriptionId], references: [subscriptions.id] }),
}));

const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

const progressEntriesRelations = relations(progressEntries, ({ one }) => ({
  user: one(users, { fields: [progressEntries.userId], references: [users.id] }),
}));

const instructorNotesRelations = relations(instructorNotes, ({ one }) => ({
  user:   one(users, { fields: [instructorNotes.userId],   references: [users.id], relationName: 'UserNotes' }),
  author: one(users, { fields: [instructorNotes.authorId], references: [users.id], relationName: 'AuthorNotes' }),
}));

// ─── Dashboard Structure features ────────────────────────────────────────────

const wellnessAssessments = mysqlTable('wellness_assessments', {
  id:             int('id').primaryKey().autoincrement(),
  userId:         int('user_id').notNull(),
  mental:         json('mental'),
  physical:       json('physical'),
  spiritual:      json('spiritual'),
  mentalScore:    int('mental_score').notNull().default(0),
  physicalScore:  int('physical_score').notNull().default(0),
  spiritualScore: int('spiritual_score').notNull().default(0),
  overallScore:   int('overall_score').notNull().default(0),
  createdAt:      datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({ userIdx: index('wellness_assessments_user_id_idx').on(t.userId) }));

const journeyItems = mysqlTable('journey_items', {
  id:        int('id').primaryKey().autoincrement(),
  userId:    int('user_id').notNull(),
  title:     varchar('title', { length: 255 }).notNull(),
  category:  varchar('category', { length: 50 }).notNull().default('general'),
  completed: boolean('completed').notNull().default(false),
  sortOrder: int('sort_order').notNull().default(0),
  createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({ userIdx: index('journey_items_user_id_idx').on(t.userId) }));

const healthProfiles = mysqlTable('health_profiles', {
  id:                 int('id').primaryKey().autoincrement(),
  userId:             int('user_id').notNull().unique(),
  age:                int('age'),
  sex:                varchar('sex', { length: 50 }),
  weightKg:           double('weight_kg'),
  heightCm:           double('height_cm'),
  bmi:                double('bmi'),
  ibw:                double('ibw'),
  bmiCategory:        varchar('bmi_category', { length: 50 }),
  foodBehaviour:      varchar('food_behaviour', { length: 50 }),
  foodAllergy:        text('food_allergy'),
  medicalConditions:  json('medical_conditions'),
  medicalOther:       text('medical_other'),
  medication:         text('medication'),
  drinkingSmoking:    text('drinking_smoking'),
  fastingOrNoMeat:    text('fasting_or_no_meat'),
  canCarryTiffin:     boolean('can_carry_tiffin'),
  medicalConcerns:    text('medical_concerns'),
  dietPreferences:    json('diet_preferences'),
  updatedAt:          datetime('updated_at', { mode: 'date' }).notNull().default(sql`now()`),
});

const mealPlans = mysqlTable('meal_plans', {
  id:          int('id').primaryKey().autoincrement(),
  title:       varchar('title', { length: 255 }).notNull(),
  slug:        varchar('slug', { length: 100 }).notNull().unique(),
  category:    varchar('category', { length: 50 }).notNull(),
  description: text('description'),
  fileUrl:     varchar('file_url', { length: 1000 }),
  body:        longtext('body'),
  isPremium:   boolean('is_premium').notNull().default(false),
  active:      boolean('active').notNull().default(true),
  createdAt:   datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({ catIdx: index('meal_plans_category_idx').on(t.category) }));

const mealPlanLogs = mysqlTable('meal_plan_logs', {
  id:         int('id').primaryKey().autoincrement(),
  userId:     int('user_id').notNull(),
  mealPlanId: int('meal_plan_id').notNull(),
  loggedOn:   datetime('logged_on', { mode: 'date' }).notNull(),
  compliant:  boolean('compliant').notNull().default(true),
  note:       text('note'),
  createdAt:  datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({ userIdx: index('meal_plan_logs_user_idx').on(t.userId) }));

const consultSlots = mysqlTable('consult_slots', {
  id:           int('id').primaryKey().autoincrement(),
  instructorId: int('instructor_id').notNull(),
  startsAt:     datetime('starts_at', { mode: 'date' }).notNull(),
  endsAt:       datetime('ends_at', { mode: 'date' }).notNull(),
  mode:         mysqlEnum('mode', ['online', 'in_person']).notNull().default('online'),
  location:     varchar('location', { length: 255 }),
  bookedById:   int('booked_by_id'),
  status:       mysqlEnum('status', ['open', 'booked', 'cancelled']).notNull().default('open'),
  note:         text('note'),
  createdAt:    datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({
  instrIdx: index('consult_slots_instructor_idx').on(t.instructorId),
  startIdx: index('consult_slots_starts_at_idx').on(t.startsAt),
}));

const meditations = mysqlTable('meditations', {
  id:          int('id').primaryKey().autoincrement(),
  title:       varchar('title', { length: 255 }).notNull(),
  category:    varchar('category', { length: 50 }).notNull(),
  description: text('description'),
  audioUrl:    varchar('audio_url', { length: 1000 }),
  durationSec: int('duration_sec').notNull().default(300),
  isPremium:   boolean('is_premium').notNull().default(false),
  active:      boolean('active').notNull().default(true),
  createdAt:   datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({ catIdx: index('meditations_category_idx').on(t.category) }));

const meditationFavorites = mysqlTable('meditation_favorites', {
  id:           int('id').primaryKey().autoincrement(),
  userId:       int('user_id').notNull(),
  meditationId: int('meditation_id').notNull(),
  createdAt:    datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({ uniq: uniqueIndex('meditation_favorites_unique').on(t.userId, t.meditationId) }));

const meditationPlays = mysqlTable('meditation_plays', {
  id:           int('id').primaryKey().autoincrement(),
  userId:       int('user_id').notNull(),
  meditationId: int('meditation_id').notNull(),
  playedAt:     datetime('played_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({ userIdx: index('meditation_plays_user_idx').on(t.userId, t.playedAt) }));

const dailyPractices = mysqlTable('daily_practices', {
  id:               int('id').primaryKey().autoincrement(),
  practiceDate:     datetime('practice_date', { mode: 'date' }).notNull().unique(),
  practiceText:     varchar('practice_text', { length: 500 }).notNull(),
  reflectionPrompt: varchar('reflection_prompt', { length: 500 }).notNull(),
  challengeText:    varchar('challenge_text', { length: 500 }).notNull(),
});

const dailyPracticeLogs = mysqlTable('daily_practice_logs', {
  id:            int('id').primaryKey().autoincrement(),
  userId:        int('user_id').notNull(),
  practiceDate:  datetime('practice_date', { mode: 'date' }).notNull(),
  practiceDone:  boolean('practice_done').notNull().default(false),
  challengeDone: boolean('challenge_done').notNull().default(false),
  reflection:    text('reflection'),
  createdAt:     datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({ uniq: uniqueIndex('daily_practice_logs_unique').on(t.userId, t.practiceDate) }));

const destinations = mysqlTable('destinations', {
  id:        int('id').primaryKey().autoincrement(),
  country:   varchar('country', { length: 100 }).notNull(),
  name:      varchar('name', { length: 255 }).notNull(),
  slug:      varchar('slug', { length: 120 }).notNull().unique(),
  summary:   text('summary'),
  imageUrl:  varchar('image_url', { length: 1000 }),
  active:    boolean('active').notNull().default(true),
  createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({ countryIdx: index('destinations_country_idx').on(t.country) }));

const retreats = mysqlTable('retreats', {
  id:                   int('id').primaryKey().autoincrement(),
  destinationId:        int('destination_id'),
  title:                varchar('title', { length: 255 }).notNull(),
  slug:                 varchar('slug', { length: 120 }).notNull().unique(),
  category:             varchar('category', { length: 50 }).notNull(),
  country:              varchar('country', { length: 100 }).notNull(),
  description:          text('description'),
  durationDays:         int('duration_days').notNull().default(7),
  priceCents:           int('price_cents').notNull().default(0),
  currency:             varchar('currency', { length: 10 }).notNull().default('USD'),
  meditationIntensity:  mysqlEnum('meditation_intensity', ['gentle', 'moderate', 'intense']).notNull().default('moderate'),
  englishSpoken:        boolean('english_spoken').notNull().default(true),
  womenAllowed:         boolean('women_allowed').notNull().default(true),
  privateRoom:          boolean('private_room').notNull().default(false),
  imageUrl:             varchar('image_url', { length: 1000 }),
  isMonastery:          boolean('is_monastery').notNull().default(false),
  active:               boolean('active').notNull().default(true),
  createdAt:            datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({
  countryIdx: index('retreats_country_idx').on(t.country),
  catIdx:     index('retreats_category_idx').on(t.category),
}));

const retreatSaves = mysqlTable('retreat_saves', {
  id:        int('id').primaryKey().autoincrement(),
  userId:    int('user_id').notNull(),
  retreatId: int('retreat_id').notNull(),
  createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({ uniq: uniqueIndex('retreat_saves_unique').on(t.userId, t.retreatId) }));

const retreatWaitlist = mysqlTable('retreat_waitlist', {
  id:        int('id').primaryKey().autoincrement(),
  userId:    int('user_id').notNull(),
  retreatId: int('retreat_id').notNull(),
  note:      text('note'),
  createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({ uniq: uniqueIndex('retreat_waitlist_unique').on(t.userId, t.retreatId) }));

const journalEntries = mysqlTable('journal_entries', {
  id:             int('id').primaryKey().autoincrement(),
  userId:         int('user_id').notNull(),
  mood:           int('mood'),
  gratitude:      text('gratitude'),
  meditationNote: text('meditation_note'),
  energy:         int('energy'),
  body:           text('body'),
  recordedAt:     datetime('recorded_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({ userIdx: index('journal_entries_user_idx').on(t.userId, t.recordedAt) }));

const events = mysqlTable('events', {
  id:          int('id').primaryKey().autoincrement(),
  title:       varchar('title', { length: 255 }).notNull(),
  type:        varchar('type', { length: 50 }).notNull(),
  description: text('description'),
  startsAt:    datetime('starts_at', { mode: 'date' }).notNull(),
  endsAt:      datetime('ends_at', { mode: 'date' }),
  mode:        mysqlEnum('mode', ['online', 'in_person', 'hybrid']).notNull().default('online'),
  location:    varchar('location', { length: 255 }),
  linkUrl:     varchar('link_url', { length: 1000 }),
  active:      boolean('active').notNull().default(true),
  createdAt:   datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({ startIdx: index('events_starts_at_idx').on(t.startsAt) }));

const courses = mysqlTable('courses', {
  id:          int('id').primaryKey().autoincrement(),
  title:       varchar('title', { length: 255 }).notNull(),
  slug:        varchar('slug', { length: 120 }).notNull().unique(),
  description: text('description'),
  priceCents:  int('price_cents').notNull().default(0),
  currency:    varchar('currency', { length: 10 }).notNull().default('NPR'),
  lessons:     json('lessons'),
  isPremium:   boolean('is_premium').notNull().default(true),
  active:      boolean('active').notNull().default(true),
  createdAt:   datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
});

const courseEnrollments = mysqlTable('course_enrollments', {
  id:        int('id').primaryKey().autoincrement(),
  userId:    int('user_id').notNull(),
  courseId:  int('course_id').notNull(),
  status:    mysqlEnum('status', ['enrolled', 'completed', 'cancelled']).notNull().default('enrolled'),
  createdAt: datetime('created_at', { mode: 'date' }).notNull().default(sql`now()`),
}, (t) => ({ uniq: uniqueIndex('course_enrollments_unique').on(t.userId, t.courseId) }));

module.exports = {
  users, programs, subscriptions,
  passwordResetTokens, verificationTokens,
  resources, userResources, messages,
  notifications, progressEntries, instructorNotes,
  wellnessAssessments, journeyItems, healthProfiles,
  mealPlans, mealPlanLogs, consultSlots,
  meditations, meditationFavorites, meditationPlays,
  dailyPractices, dailyPracticeLogs,
  destinations, retreats, retreatSaves, retreatWaitlist,
  journalEntries, events, courses, courseEnrollments,
  usersRelations, programsRelations, subscriptionsRelations,
  passwordResetTokensRelations, verificationTokensRelations,
  resourcesRelations, userResourcesRelations, messagesRelations,
  notificationsRelations, progressEntriesRelations, instructorNotesRelations,
};
