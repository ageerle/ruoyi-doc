package example.memory;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.Objects;

/** MySQL 快照实现；演示与测试使用 H2 的 MySQL 兼容模式。 */
public final class JdbcSnapshotRepository implements JsonChatMemoryStore.SnapshotRepository {
    private final DataSource dataSource;

    public JdbcSnapshotRepository(DataSource dataSource) {
        this.dataSource = Objects.requireNonNull(dataSource);
    }

    @Override
    public String find(String memoryId) {
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "SELECT messages_json FROM chat_memory_snapshot WHERE memory_id = ?")) {
            statement.setString(1, memoryId);
            try (var result = statement.executeQuery()) {
                return result.next() ? result.getString(1) : null;
            }
        } catch (SQLException e) {
            // 查询失败必须向上报告，不能伪装成不存在的记忆。
            throw new IllegalStateException("读取记忆快照失败", e);
        }
    }

    @Override
    public void replace(String memoryId, String json) {
        // 一次 upsert 覆盖整个快照，不把窗口中的每条消息再次追加到历史表。
        String sql = "INSERT INTO chat_memory_snapshot (memory_id, messages_json) VALUES (?, ?) "
                + "ON DUPLICATE KEY UPDATE messages_json = ?";
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(sql)) {
            statement.setString(1, memoryId);
            statement.setString(2, json);
            statement.setString(3, json);
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new IllegalStateException("保存记忆快照失败", e);
        }
    }

    @Override
    public void delete(String memoryId) {
        try (var connection = dataSource.getConnection();
             var statement = connection.prepareStatement(
                     "DELETE FROM chat_memory_snapshot WHERE memory_id = ?")) {
            statement.setString(1, memoryId);
            statement.executeUpdate();
        } catch (SQLException e) {
            throw new IllegalStateException("删除记忆快照失败", e);
        }
    }
}
