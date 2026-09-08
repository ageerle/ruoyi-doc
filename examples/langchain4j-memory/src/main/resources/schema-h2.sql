CREATE TABLE IF NOT EXISTS chat_memory_snapshot (
    memory_id VARCHAR(191) PRIMARY KEY,
    messages_json CLOB NOT NULL
);
