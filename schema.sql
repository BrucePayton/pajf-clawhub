--平安财服 OpenClaw 应用价值案例库 - 数据库初始化脚本
--建议数据库名: claw_cases

CREATE TABLE IF NOT EXISTS cases (
    id VARCHAR(255) PRIMARY KEY COMMENT '案例唯一ID',
    case_data JSON NOT NULL COMMENT '案例详情数据(JSON格式)',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
