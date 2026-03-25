SET @add_case_type_column = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'cases'
        AND COLUMN_NAME = 'case_type'
    ),
    'SELECT 1',
    'ALTER TABLE cases ADD COLUMN case_type VARCHAR(64) NOT NULL DEFAULT ''openclaw_app'''
  )
);
PREPARE stmt_add_case_type FROM @add_case_type_column;
EXECUTE stmt_add_case_type;
DEALLOCATE PREPARE stmt_add_case_type;
