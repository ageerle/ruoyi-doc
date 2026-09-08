package example.memory;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;

/** 分别启动 write/read/clear 三次进程，验证磁盘持久化。 */
public final class PersistenceDemo {
    private static final String ID = "demo:persistence:session-1001";

    public static void main(String[] args) {
        if (args.length != 1 || !java.util.Set.of("write", "read", "clear").contains(args[0])) {
            throw new IllegalArgumentException("参数必须为 write、read 或 clear");
        }
        var store = new JsonChatMemoryStore(
                new JdbcSnapshotRepository(DemoDatabase.open(DemoDatabase.FILE_URL)));
        var memory = MessageWindowChatMemory.builder()
                .id(ID).maxMessages(20).chatMemoryStore(store).build();
        switch (args[0]) {
            case "write" -> {
                // 仅覆盖本示例固定 ID，重复运行结果一致。
                memory.set(UserMessage.from("项目代号是青云-4173"), AiMessage.from("已记住"));
                System.out.println("saved messages = " + memory.messages().size());
            }
            case "read" -> {
                var messages = memory.messages();
                System.out.println("restored messages = " + messages.size());
                if (!messages.isEmpty()) {
                    System.out.println("first message = " + ((UserMessage) messages.get(0)).singleText());
                }
            }
            case "clear" -> {
                memory.clear();
                System.out.println("after clear = " + memory.messages().size());
            }
            default -> throw new IllegalStateException("未识别的操作");
        }
    }
}
