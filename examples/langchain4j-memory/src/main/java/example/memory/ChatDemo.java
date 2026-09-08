package example.memory;

import dev.langchain4j.model.openai.OpenAiChatModel;
import java.time.Duration;

/** 用户主动运行此入口时，才会向配置的模型服务发送两次请求。 */
public final class ChatDemo {
    public static void main(String[] args) {
        var model = OpenAiChatModel.builder()
                .baseUrl(requiredEnv("CHAT_BASE_URL"))
                .apiKey(requiredEnv("CHAT_API_KEY"))
                .modelName(requiredEnv("CHAT_MODEL"))
                .timeout(Duration.ofSeconds(60))
                .build();
        var store = new JsonChatMemoryStore(
                new JdbcSnapshotRepository(DemoDatabase.open(DemoDatabase.FILE_URL)));
        var conversations = new MemoryConversationService(model, store);
        String id = "demo:model:session-1001";
        System.out.println(conversations.chat(id, "请记住项目代号青云-4173，只回复已记住。"));
        System.out.println(conversations.chat(id, "刚才的项目代号是什么？"));
    }

    private static String requiredEnv(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("请设置环境变量 " + name);
        }
        return value;
    }
}
