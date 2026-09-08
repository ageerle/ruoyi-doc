-- RuoYi AI agent report demo: synthetic data only, MySQL 5.7+/8.x.
-- Run as a database administrator in a dedicated test environment, not through executeSql.
-- This script intentionally fails if the demo table already exists. No DROP/TRUNCATE is performed.
CREATE DATABASE IF NOT EXISTS ruoyi_agent_demo CHARACTER SET utf8mb4;
USE ruoyi_agent_demo;

CREATE TABLE demo_agent_sales_order (
  id BIGINT NOT NULL PRIMARY KEY COMMENT 'Synthetic order ID',
  paid_at DATETIME NOT NULL COMMENT 'Business time in Asia/Shanghai',
  region VARCHAR(20) NOT NULL COMMENT 'Sales region',
  paid_amount DECIMAL(12,2) NOT NULL COMMENT 'Amount in CNY yuan, not cents',
  order_status VARCHAR(20) NOT NULL COMMENT 'PAID or CANCELLED',
  KEY idx_status_paid_at (order_status, paid_at)
) COMMENT='Synthetic sales data for the agent report tutorial';

INSERT INTO demo_agent_sales_order (id, paid_at, region, paid_amount, order_status) VALUES
  (1, '2026-08-01 10:00:00', '华东', 1200.00, 'PAID'),
  (2, '2026-08-03 11:00:00', '华东', 800.00, 'PAID'),
  (3, '2026-08-08 12:00:00', '华东', 2000.00, 'PAID'),
  (4, '2026-08-02 10:00:00', '华南', 1500.00, 'PAID'),
  (5, '2026-08-15 11:00:00', '华南', 900.00, 'PAID'),
  (6, '2026-08-04 10:00:00', '华北', 600.00, 'PAID'),
  (7, '2026-08-21 11:00:00', '华北', 1400.00, 'PAID'),
  (8, '2026-08-06 10:00:00', '西部', 500.00, 'PAID'),
  (9, '2026-08-31 23:59:59', '西部', 700.00, 'PAID'),
  (10, '2026-08-20 10:00:00', '华东', 9999.00, 'CANCELLED'),
  (11, '2026-07-31 23:59:59', '华南', 8888.00, 'PAID'),
  (12, '2026-09-01 00:00:00', '华北', 7777.00, 'PAID');

-- Expected: 华东 4000.00 / 3; 华南 2400.00 / 2; 华北 2000.00 / 2; 西部 1200.00 / 2.
-- All four groups: paid_amount = 9600.00, order_count = 9.
SELECT region, SUM(paid_amount) AS paid_amount, COUNT(*) AS order_count
FROM demo_agent_sales_order
WHERE order_status = 'PAID'
  AND paid_at >= '2026-08-01 00:00:00'
  AND paid_at < '2026-09-01 00:00:00'
GROUP BY region
ORDER BY paid_amount DESC, region ASC
LIMIT 10;
