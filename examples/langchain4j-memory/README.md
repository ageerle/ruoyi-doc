# LangChain4j 记忆关键代码

此工程是 RuoYi AI 记忆管理文档的独立示例，使用 LangChain4j **1.20.0**、JDK **17+** 和 Maven。所有 Java 类位于 `example.memory` 包，完整类名要用于运行命令。

## 先运行无需模型的示例

在含有本文件和 `pom.xml` 的目录运行：

```shell
mvn test
mvn -q compile exec:java "-Dexec.mainClass=example.memory.MemoryDemo"
```

MemoryDemo 会输出窗口条数 3、最早保留消息“已记住”、恢复条数 3、另一个会话条数 0，以及清空后条数 0。它使用 JVM 内存，不调用模型。首次 Maven 构建需要联网下载依赖。

## 验证进程退出后的持久化

按顺序运行以下命令，每条命令都是一次新的进程：

```shell
mvn -q compile exec:java "-Dexec.mainClass=example.memory.PersistenceDemo" "-Dexec.args=write"
mvn -q exec:java "-Dexec.mainClass=example.memory.PersistenceDemo" "-Dexec.args=read"
mvn -q exec:java "-Dexec.mainClass=example.memory.PersistenceDemo" "-Dexec.args=clear"
mvn -q exec:java "-Dexec.mainClass=example.memory.PersistenceDemo" "-Dexec.args=read"
```

预期依次为 `saved messages = 2`、`restored messages = 2`（并打印项目代号）、`after clear = 0`、`restored messages = 0`。

示例用 H2 的嵌入式文件模式将数据库放在当前目录的 `data/memory-demo.mv.db`，无需安装数据库服务器。四次运行应位于同一个目录，并顺序执行。`write` 覆盖示例固定 ID 的两条消息，`clear` 仅删除该 ID 的快照。[H2 文件模式说明](https://h2database.com/html/features.html#database_url)。

## 关键代码从哪里看

| 文件 | 作用 |
| --- | --- |
| `MemoryAssistantFactory.java` | `@MemoryId`、独立窗口、AI Services 自动管理用户/助手消息。 |
| `JsonChatMemoryStore.java` | 官方消息 JSON 序列化，按快照读写，空列表覆盖。 |
| `JdbcSnapshotRepository.java` | 参数化查询、MySQL upsert、按 ID 删除，错误向上抛出。 |
| `MemoryConversationService.java` | 单实例同步调用的整轮串行控制、实例释放与快照清空。 |
| `TokenMemoryFactory.java` | 固定 Token 窗口，估算器由调用方提供。 |
| `DynamicMemoryFactory.java` | 动态条数/Token 预算，读取调用方提供的限制函数。 |
| `AsyncJsonChatMemoryStore.java` | 三个异步存储接口及执行器拒绝时的失败 Future。 |
| `DemoDatabase.java`、`PersistenceDemo.java` | H2 初始化与跨进程持久化演示。 |
| `ChatDemo.java` | 从环境变量读取模型配置并实际调用两轮问答。 |
| `src/main/resources/schema-mysql.sql` | 后端接入时使用的 MySQL 示例表。 |
| `src/test/java/example/memory/MemoryExampleTest.java` | 覆盖快照覆盖、隔离、清空、动态窗口、异步和服务恢复的验证。 |

## 可选：调用真实模型

先在本机设置环境变量 `CHAT_BASE_URL`、`CHAT_API_KEY`、`CHAT_MODEL`，分别填写模型服务的 OpenAI 兼容基础地址（包括该服务要求的 `/v1` 等路径）、凭据和模型名。然后运行：

```shell
mvn -q compile exec:java "-Dexec.mainClass=example.memory.ChatDemo"
```

此命令会向配置的服务发送两轮文本，使用 `demo:model:session-1001` 保存窗口。该入口使用同步 `ChatModel`，没有实现 SSE。未运行该入口时，其他示例和测试不会请求外部模型；测试使用固定回复的本地模型替身。

## 接入 RuoYi AI

1. 将快照表纳入后端数据库迁移。保留 `chat_message` 作为完整历史，不用快照覆盖它。
2. 复制 `JsonChatMemoryStore`、`JdbcSnapshotRepository`、`MemoryAssistantFactory` 和需要的服务类到后端包路径。注入项目已有的 `DataSource`，替换演示用 `DemoDatabase`；后端沿用自己的连接池和 MySQL 驱动。样例 JDBC 操作使用连接默认自动提交，不参与业务消息与窗口的联合事务。
3. 使用项目模型工厂创建 `ChatModel`，将 `MemoryConversationService` 注册为可复用的单例。不要为每个请求新建服务实例，否则锁不能协调请求。
4. **先校验会话归属**，再由服务端用真实租户、用户、智能体和会话 ID 生成唯一字符串，调用 `chat(memoryId, question)`。示例 ID 不提供认证，不能直接信任来自浏览器的用户或租户字段。
5. AI Services 管理窗口，业务消息历史仍由原有业务入口单独保存，避免在窗口中重复添加当前输入。
6. `clear(id)` 仅清空窗口；完整历史、摘要、长期记忆和向量的删除需由业务逻辑另行协调，并防止从旧历史重建已清空内容。

本示例采用固定 64 个锁，锁冲突的不同 ID 也会顺序执行，避免锁表无限增长；它只适用于共享同一个服务实例的同步调用。多副本部署需要分布式串行控制；流式场景要等生成和最终写入结束再释放锁。模型失败可能已保存用户消息，重试与失败轮次处理需要应用定义，示例不自动回滚。

`MemoryConversationService` 每轮结束后移除 AI Services 实例缓存，下轮从共享 store 恢复，因此适配器必须能真实读写。提供的 JDBC 实现在 H2 MySQL 兼容模式下验证；接入实际 MySQL 仍需执行迁移与集成验证。工程不包含自动摘要、跨会话事实抽取、向量召回或权限管理，这些扩展的设计步骤见主文档。

## 异步存储如何装配

调用方显式管理有界执行器，并在应用停止时关闭：

```java
var executor = new java.util.concurrent.ThreadPoolExecutor(
        4, 4, 0L, java.util.concurrent.TimeUnit.MILLISECONDS,
        new java.util.concurrent.ArrayBlockingQueue<>(100),
        new java.util.concurrent.ThreadPoolExecutor.AbortPolicy());
var store = new AsyncJsonChatMemoryStore(repository, executor);
// 将 store 接到支持异步的模型与 AI Services 链路；示例只实现存储适配。
// 应用停止时调用 executor.shutdown()，并等待在途写入完成。
```

这会把阻塞 JDBC 调用放到显式线程池，并不会把 JDBC 变成非阻塞客户端。Future 超时/取消也不保证正在执行的 SQL 已取消；应用仍需配置连接池、SQL 超时，并在确认写入已结束后才允许同会话下一轮开始。三个异步方法都应串入当前请求的 Future 链，不能忽略返回结果。
