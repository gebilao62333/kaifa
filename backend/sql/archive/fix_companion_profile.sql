USE eudazi;

ALTER TABLE xn_companion_profile
  ADD COLUMN game_id INT DEFAULT 0 AFTER user_id,
  ADD COLUMN price DECIMAL(10,2) DEFAULT 0 AFTER game_id,
  ADD COLUMN tags VARCHAR(255) DEFAULT NULL AFTER price,
  ADD COLUMN voice_intro VARCHAR(255) DEFAULT NULL AFTER tags,
  ADD COLUMN voice_time INT DEFAULT 0 AFTER voice_intro,
  ADD COLUMN order_num INT DEFAULT 0 AFTER voice_time,
  ADD COLUMN income_total DECIMAL(12,2) DEFAULT 0 AFTER order_num,
  ADD COLUMN pingjia_num INT DEFAULT 0 AFTER income_total,
  ADD COLUMN star DECIMAL(3,2) DEFAULT 5.00 AFTER pingjia_num;

UPDATE xn_companion_profile
SET game_id = CAST(SUBSTRING_INDEX(game_ids, ',', 1) AS UNSIGNED)
WHERE game_ids IS NOT NULL AND game_ids != '';

UPDATE xn_companion_profile
SET price = price_per_hour
WHERE price_per_hour IS NOT NULL;

UPDATE xn_companion_profile
SET tags = intro
WHERE intro IS NOT NULL AND intro != '';

ALTER TABLE xn_companion_profile
  ADD INDEX idx_game_status (game_id, status),
  ADD INDEX idx_price (price);

SELECT 'Migration completed!' AS result;
SHOW COLUMNS FROM xn_companion_profile;
