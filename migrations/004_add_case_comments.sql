CREATE TABLE IF NOT EXISTS case_comments (
  id VARCHAR(64) PRIMARY KEY,
  case_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  username VARCHAR(128) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_case_comments_case_id (case_id),
  CONSTRAINT fk_comments_case_id FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
