package example.memory;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.request.ChatRequest;
import dev.langchain4j.model.chat.response.ChatResponse;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletionException;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.jupiter.api.Assertions.*;

class MemoryExampleTest {
    private JdbcSnapshotRepository repository() {
        return new JdbcSnapshotRepository(DemoDatabase.open("jdbc:h2:mem:" + UUID.randomUUID()
                + ";MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1"));
    }

    @Test
    void snapshotReplacesInsteadOfAppendingAndEmptyListClearsState() {
        var store = new JsonChatMemoryStore(repository());
        store.updateMessages("a", List.of(UserMessage.from("old")));
        store.updateMessages("a", List.of(UserMessage.from("new"), AiMessage.from("answer")));
        assertEquals(2, store.getMessages("a").size());
        assertEquals("new", ((UserMessage) store.getMessages("a").get(0)).singleText());
        store.updateMessages("a", List.of());
        assertTrue(store.getMessages("a").isEmpty());
    }

    @Test
    void newStoreRestoresWindowAndDeleteDoesNotAffectAnotherSession() {
        var repository = repository();
        var store = new JsonChatMemoryStore(repository);
        var memory = MessageWindowChatMemory.builder().id("a")
                .maxMessages(2).chatMemoryStore(store).build();
        memory.add(UserMessage.from("one"), AiMessage.from("two"), UserMessage.from("three"));
        store.updateMessages("b", List.of(UserMessage.from("separate")));
        var restored = new JsonChatMemoryStore(repository);
        assertEquals(2, restored.getMessages("a").size());
        assertInstanceOf(AiMessage.class, restored.getMessages("a").get(0));
        restored.deleteMessages("a");
        restored.deleteMessages("a"); // 重复删除也是成功操作。
        assertTrue(store.getMessages("a").isEmpty());
        assertEquals(1, store.getMessages("b").size());
    }

    @Test
    void dynamicReadOnlyTrimsCopyUntilNextWrite() {
        var store = new JsonChatMemoryStore(repository());
        var limit = new AtomicInteger(4);
        var memory = DynamicMemoryFactory.messages("a", id -> limit.get(), store);
        memory.add(UserMessage.from("1"), AiMessage.from("2"), UserMessage.from("3"));
        limit.set(2);
        assertEquals(2, memory.messages().size());
        assertEquals(3, store.getMessages("a").size());
        memory.add(AiMessage.from("4"));
        limit.set(4);
        assertEquals(2, memory.messages().size());
    }

    @Test
    void aiServiceRestoresHistoryWithoutDuplicateInputsAndClearWorksWithoutCache() {
        var seen = new AtomicReference<List<ChatMessage>>();
        ChatModel model = new ChatModel() {
            @Override
            public ChatResponse doChat(ChatRequest request) {
                seen.set(List.copyOf(request.messages()));
                return ChatResponse.builder().aiMessage(AiMessage.from("ok")).build();
            }
        };
        var store = new JsonChatMemoryStore(repository());
        var service = new MemoryConversationService(model, store);
        service.chat("a", "first");
        service.chat("a", "second");
        assertEquals(3, seen.get().size()); // 首轮输入/输出 + 本轮输入。
        assertEquals(4, store.getMessages("a").size());
        service.chat("b", "independent");
        assertEquals(1, seen.get().size());
        service.clear("a"); // 服务每轮已经释放缓存，此处仍应清空数据库。
        service.chat("a", "fresh");
        assertEquals(1, seen.get().size());
        assertEquals(2, store.getMessages("b").size());
    }

    @Test
    void asyncStoreCompletesWritesReadsAndDeletion() {
        var executor = Executors.newSingleThreadExecutor();
        try {
            var store = new AsyncJsonChatMemoryStore(repository(), executor);
            store.updateMessagesAsync("a", List.of(UserMessage.from("async"))).join();
            assertEquals(1, store.getMessagesAsync("a").join().size());
            store.deleteMessagesAsync("a").join();
            assertTrue(store.getMessagesAsync("a").join().isEmpty());
        } finally {
            executor.shutdown();
        }
    }

    @Test
    void executorRejectionIsReturnedAsFailedFuture() {
        var executor = Executors.newSingleThreadExecutor();
        executor.shutdown();
        var store = new AsyncJsonChatMemoryStore(repository(), executor);
        var result = assertDoesNotThrow(() -> store.getMessagesAsync("a"));
        var failure = assertThrows(CompletionException.class, result::join);
        assertInstanceOf(RejectedExecutionException.class, failure.getCause());
    }
}
