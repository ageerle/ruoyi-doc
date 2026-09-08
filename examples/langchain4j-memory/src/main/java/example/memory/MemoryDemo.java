package example.memory;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.store.memory.chat.InMemoryChatMemoryStore;

public class MemoryDemo {
    public static void main(String[] args) {
        var store = new InMemoryChatMemoryStore();
        var memory = MessageWindowChatMemory.builder()
                .id("session-1001")
                .maxMessages(3)
                .chatMemoryStore(store)
                .build();

        // 手工添加消息，观察窗口行为，不调用模型。
        memory.add(UserMessage.from("项目代号是青云-4173"));
        memory.add(AiMessage.from("已记住"));
        memory.add(UserMessage.from("请用 Java 举例"));
        memory.add(AiMessage.from("好的"));
        System.out.println("window size = " + memory.messages().size());
        System.out.println("oldest retained = "
                + ((AiMessage) memory.messages().get(0)).text());

        // 相同 ID + 相同 store：新实例读取已保存的窗口。
        var restored = MessageWindowChatMemory.builder()
                .id("session-1001").maxMessages(3).chatMemoryStore(store).build();
        System.out.println("restored size = " + restored.messages().size());
        var other = MessageWindowChatMemory.builder()
                .id("session-1002").maxMessages(3).chatMemoryStore(store).build();
        System.out.println("other session size = " + other.messages().size());
        memory.clear();
        System.out.println("after clear = " + restored.messages().size());
    }
}
