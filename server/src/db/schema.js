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

module.exports = {
  users, programs, subscriptions,
  passwordResetTokens, verificationTokens,
  resources, userResources, messages,
  notifications, progressEntries, instructorNotes,
  usersRelations, programsRelations, subscriptionsRelations,
  passwordResetTokensRelations, verificationTokensRelations,
  resourcesRelations, userResourcesRelations, messagesRelations,
  notificationsRelations, progressEntriesRelations, instructorNotesRelations,
};
