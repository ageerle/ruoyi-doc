package example.memory;

import org.h2.jdbcx.JdbcDataSource;
import org.h2.tools.RunScript;
import javax.sql.DataSource;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Objects;

/** 只供本地示例初始化 H2；业务接入时注入项目已配置的 DataSource。 */
public final class DemoDatabase {
    public static final String FILE_URL =
            "jdbc:h2:file:./data/memory-demo;MODE=MySQL;DATABASE_TO_LOWER=TRUE";

    private DemoDatabase() {}

    public static DataSource open(String url) {
        var dataSource = new JdbcDataSource();
        dataSource.setURL(url);
        dataSource.setUser("sa");
        dataSource.setPassword("");
        try (var connection = dataSource.getConnection();
             var input = Objects.requireNonNull(
                     DemoDatabase.class.getResourceAsStream("/schema-h2.sql"));
             var reader = new InputStreamReader(input, StandardCharsets.UTF_8)) {
            RunScript.execute(connection, reader);
        } catch (Exception e) {
            throw new IllegalStateException("初始化示例数据库失败", e);
        }
        return dataSource;
    }
}
