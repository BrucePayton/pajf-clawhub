SET @add_real_name_column = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'real_name'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN real_name VARCHAR(128) NULL AFTER username'
  )
);
PREPARE stmt_add_real_name FROM @add_real_name_column;
EXECUTE stmt_add_real_name;
DEALLOCATE PREPARE stmt_add_real_name;

SET @add_um_number_column = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'um_number'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN um_number VARCHAR(128) NULL AFTER username'
  )
);
PREPARE stmt_add_um_number FROM @add_um_number_column;
EXECUTE stmt_add_um_number;
DEALLOCATE PREPARE stmt_add_um_number;

SET @add_team_column = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'team'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN team VARCHAR(128) DEFAULT '''' AFTER email'
  )
);
PREPARE stmt_add_team FROM @add_team_column;
EXECUTE stmt_add_team;
DEALLOCATE PREPARE stmt_add_team;

SET @add_organization_column = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'organization'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN organization VARCHAR(128) DEFAULT ''财服总部'' AFTER team'
  )
);
PREPARE stmt_add_organization FROM @add_organization_column;
EXECUTE stmt_add_organization;
DEALLOCATE PREPARE stmt_add_organization;

SET @add_default_case_public_column = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'default_case_public'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN default_case_public BOOLEAN DEFAULT FALSE AFTER organization'
  )
);
PREPARE stmt_add_default_case_public FROM @add_default_case_public_column;
EXECUTE stmt_add_default_case_public;
DEALLOCATE PREPARE stmt_add_default_case_public;

UPDATE users
SET um_number = username
WHERE (um_number IS NULL OR TRIM(um_number) = '');

UPDATE users
SET real_name = username
WHERE (real_name IS NULL OR TRIM(real_name) = '');

UPDATE users
SET team = ''
WHERE team IS NULL;

UPDATE users
SET organization = '财服总部'
WHERE (organization IS NULL OR TRIM(organization) = '');

SET @make_um_number_not_null = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'um_number'
        AND IS_NULLABLE = 'YES'
    ),
    'ALTER TABLE users MODIFY COLUMN um_number VARCHAR(128) NOT NULL',
    'SELECT 1'
  )
);
PREPARE stmt_make_um_number_not_null FROM @make_um_number_not_null;
EXECUTE stmt_make_um_number_not_null;
DEALLOCATE PREPARE stmt_make_um_number_not_null;

SET @make_real_name_not_null = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'real_name'
        AND IS_NULLABLE = 'YES'
    ),
    'ALTER TABLE users MODIFY COLUMN real_name VARCHAR(128) NOT NULL',
    'SELECT 1'
  )
);
PREPARE stmt_make_real_name_not_null FROM @make_real_name_not_null;
EXECUTE stmt_make_real_name_not_null;
DEALLOCATE PREPARE stmt_make_real_name_not_null;

SET @add_um_unique = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND INDEX_NAME = 'uq_users_um_number'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD UNIQUE KEY uq_users_um_number (um_number)'
  )
);
PREPARE stmt_add_um_unique FROM @add_um_unique;
EXECUTE stmt_add_um_unique;
DEALLOCATE PREPARE stmt_add_um_unique;
