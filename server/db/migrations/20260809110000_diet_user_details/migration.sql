ALTER TABLE `health_profiles`
  ADD COLUMN `age` INT NULL AFTER `user_id`,
  ADD COLUMN `sex` VARCHAR(50) NULL AFTER `age`,
  ADD COLUMN `ibw` DOUBLE NULL AFTER `bmi`,
  ADD COLUMN `bmi_category` VARCHAR(50) NULL AFTER `ibw`,
  ADD COLUMN `food_behaviour` VARCHAR(50) NULL AFTER `bmi_category`,
  ADD COLUMN `food_allergy` TEXT NULL AFTER `food_behaviour`,
  ADD COLUMN `medical_conditions` JSON NULL AFTER `food_allergy`,
  ADD COLUMN `medical_other` TEXT NULL AFTER `medical_conditions`,
  ADD COLUMN `medication` TEXT NULL AFTER `medical_other`,
  ADD COLUMN `drinking_smoking` TEXT NULL AFTER `medication`,
  ADD COLUMN `fasting_or_no_meat` TEXT NULL AFTER `drinking_smoking`,
  ADD COLUMN `can_carry_tiffin` BOOLEAN NULL AFTER `fasting_or_no_meat`;
