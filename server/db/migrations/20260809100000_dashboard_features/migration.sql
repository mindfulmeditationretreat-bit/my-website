-- Dashboard Structure: Feature and Services

CREATE TABLE IF NOT EXISTS `wellness_assessments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `mental` JSON NULL,
  `physical` JSON NULL,
  `spiritual` JSON NULL,
  `mental_score` INT NOT NULL DEFAULT 0,
  `physical_score` INT NOT NULL DEFAULT 0,
  `spiritual_score` INT NOT NULL DEFAULT 0,
  `overall_score` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `wellness_assessments_user_id_idx` (`user_id`),
  CONSTRAINT `wellness_assessments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `journey_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'general',
  `completed` BOOLEAN NOT NULL DEFAULT false,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `journey_items_user_id_idx` (`user_id`),
  CONSTRAINT `journey_items_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `health_profiles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `weight_kg` DOUBLE NULL,
  `height_cm` DOUBLE NULL,
  `bmi` DOUBLE NULL,
  `medical_concerns` TEXT NULL,
  `diet_preferences` JSON NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `health_profiles_user_id_key` (`user_id`),
  CONSTRAINT `health_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `meal_plans` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `description` TEXT NULL,
  `file_url` VARCHAR(1000) NULL,
  `body` LONGTEXT NULL,
  `is_premium` BOOLEAN NOT NULL DEFAULT false,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `meal_plans_slug_key` (`slug`),
  INDEX `meal_plans_category_idx` (`category`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `meal_plan_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `meal_plan_id` INT NOT NULL,
  `logged_on` DATE NOT NULL,
  `compliant` BOOLEAN NOT NULL DEFAULT true,
  `note` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `meal_plan_logs_user_idx` (`user_id`),
  CONSTRAINT `meal_plan_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `meal_plan_logs_meal_plan_id_fkey` FOREIGN KEY (`meal_plan_id`) REFERENCES `meal_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `consult_slots` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `instructor_id` INT NOT NULL,
  `starts_at` DATETIME NOT NULL,
  `ends_at` DATETIME NOT NULL,
  `mode` ENUM('online', 'in_person') NOT NULL DEFAULT 'online',
  `location` VARCHAR(255) NULL,
  `booked_by_id` INT NULL,
  `status` ENUM('open', 'booked', 'cancelled') NOT NULL DEFAULT 'open',
  `note` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `consult_slots_instructor_idx` (`instructor_id`),
  INDEX `consult_slots_starts_at_idx` (`starts_at`),
  CONSTRAINT `consult_slots_instructor_id_fkey` FOREIGN KEY (`instructor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `consult_slots_booked_by_id_fkey` FOREIGN KEY (`booked_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `meditations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `description` TEXT NULL,
  `audio_url` VARCHAR(1000) NULL,
  `duration_sec` INT NOT NULL DEFAULT 300,
  `is_premium` BOOLEAN NOT NULL DEFAULT false,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `meditations_category_idx` (`category`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `meditation_favorites` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `meditation_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `meditation_favorites_unique` (`user_id`, `meditation_id`),
  CONSTRAINT `meditation_favorites_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `meditation_favorites_meditation_id_fkey` FOREIGN KEY (`meditation_id`) REFERENCES `meditations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `meditation_plays` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `meditation_id` INT NOT NULL,
  `played_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `meditation_plays_user_idx` (`user_id`, `played_at`),
  CONSTRAINT `meditation_plays_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `meditation_plays_meditation_id_fkey` FOREIGN KEY (`meditation_id`) REFERENCES `meditations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `daily_practices` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `practice_date` DATE NOT NULL,
  `practice_text` VARCHAR(500) NOT NULL,
  `reflection_prompt` VARCHAR(500) NOT NULL,
  `challenge_text` VARCHAR(500) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `daily_practices_date_key` (`practice_date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `daily_practice_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `practice_date` DATE NOT NULL,
  `practice_done` BOOLEAN NOT NULL DEFAULT false,
  `challenge_done` BOOLEAN NOT NULL DEFAULT false,
  `reflection` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `daily_practice_logs_unique` (`user_id`, `practice_date`),
  CONSTRAINT `daily_practice_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `destinations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `country` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(120) NOT NULL,
  `summary` TEXT NULL,
  `image_url` VARCHAR(1000) NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `destinations_slug_key` (`slug`),
  INDEX `destinations_country_idx` (`country`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `retreats` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `destination_id` INT NULL,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(120) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `country` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `duration_days` INT NOT NULL DEFAULT 7,
  `price_cents` INT NOT NULL DEFAULT 0,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `meditation_intensity` ENUM('gentle', 'moderate', 'intense') NOT NULL DEFAULT 'moderate',
  `english_spoken` BOOLEAN NOT NULL DEFAULT true,
  `women_allowed` BOOLEAN NOT NULL DEFAULT true,
  `private_room` BOOLEAN NOT NULL DEFAULT false,
  `image_url` VARCHAR(1000) NULL,
  `is_monastery` BOOLEAN NOT NULL DEFAULT false,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `retreats_slug_key` (`slug`),
  INDEX `retreats_country_idx` (`country`),
  INDEX `retreats_category_idx` (`category`),
  CONSTRAINT `retreats_destination_id_fkey` FOREIGN KEY (`destination_id`) REFERENCES `destinations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `retreat_saves` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `retreat_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `retreat_saves_unique` (`user_id`, `retreat_id`),
  CONSTRAINT `retreat_saves_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `retreat_saves_retreat_id_fkey` FOREIGN KEY (`retreat_id`) REFERENCES `retreats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `retreat_waitlist` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `retreat_id` INT NOT NULL,
  `note` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `retreat_waitlist_unique` (`user_id`, `retreat_id`),
  CONSTRAINT `retreat_waitlist_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `retreat_waitlist_retreat_id_fkey` FOREIGN KEY (`retreat_id`) REFERENCES `retreats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `journal_entries` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `mood` INT NULL,
  `gratitude` TEXT NULL,
  `meditation_note` TEXT NULL,
  `energy` INT NULL,
  `body` TEXT NULL,
  `recorded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `journal_entries_user_idx` (`user_id`, `recorded_at`),
  CONSTRAINT `journal_entries_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `events` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `description` TEXT NULL,
  `starts_at` DATETIME NOT NULL,
  `ends_at` DATETIME NULL,
  `mode` ENUM('online', 'in_person', 'hybrid') NOT NULL DEFAULT 'online',
  `location` VARCHAR(255) NULL,
  `link_url` VARCHAR(1000) NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `events_starts_at_idx` (`starts_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `courses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(120) NOT NULL,
  `description` TEXT NULL,
  `price_cents` INT NOT NULL DEFAULT 0,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'NPR',
  `lessons` JSON NULL,
  `is_premium` BOOLEAN NOT NULL DEFAULT true,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `courses_slug_key` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `course_enrollments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `status` ENUM('enrolled', 'completed', 'cancelled') NOT NULL DEFAULT 'enrolled',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `course_enrollments_unique` (`user_id`, `course_id`),
  CONSTRAINT `course_enrollments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `course_enrollments_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
