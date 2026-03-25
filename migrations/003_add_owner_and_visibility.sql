SET @add_owner_id_column = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'cases'
        AND COLUMN_NAME = 'owner_id'
    ),
    'SELECT 1',
    'ALTER TABLE cases ADD COLUMN owner_id VARCHAR(255) NULL'
  )
);
PREPARE stmt_add_owner_id FROM @add_owner_id_column;
EXECUTE stmt_add_owner_id;
DEALLOCATE PREPARE stmt_add_owner_id;

SET @add_is_public_column = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'cases'
        AND COLUMN_NAME = 'is_public'
    ),
    'SELECT 1',
    'ALTER TABLE cases ADD COLUMN is_public BOOLEAN DEFAULT FALSE'
  )
);
PREPARE stmt_add_is_public FROM @add_is_public_column;
EXECUTE stmt_add_is_public;
DEALLOCATE PREPARE stmt_add_is_public;

SET @add_owner_fk = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'cases'
        AND CONSTRAINT_NAME = 'fk_cases_owner_id'
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    ),
    'SELECT 1',
    'ALTER TABLE cases ADD CONSTRAINT fk_cases_owner_id FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL'
  )
);
PREPARE stmt_add_owner_fk FROM @add_owner_fk;
EXECUTE stmt_add_owner_fk;
DEALLOCATE PREPARE stmt_add_owner_fk;
