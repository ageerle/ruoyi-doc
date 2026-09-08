package example.memory;

import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.ChatMessageDeserializer;
import dev.langchain4j.data.message.ChatMessageSerializer;
import dev.langchain4j.store.memory.chat.ChatMemoryStore;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class JsonChatMemoryStore implements ChatMemoryStore {
    public interface SnapshotRepository {
        String find(String memoryId); // 不存在时返回 null
        void replace(String memoryId, String json); // 原子替换整个快照
        void delete(String memoryId); // 不存在时也视为成功
    }

    private final SnapshotRepository repository;

    public JsonChatMemoryStore(SnapshotRepository repository) {
        this.repository = Objects.requireNonNull(repository);
    }

    @Override
    public List<ChatMessage> getMessages(Object memoryId) {
        String json = repository.find(key(memoryId));
        return json == null ? new ArrayList<>()
                : new ArrayList<>(ChatMessageDeserializer.messagesFromJson(json));
    }

    @Override
    public void updateMessages(Object memoryId, List<ChatMessage> messages) {
        Objects.requireNonNull(messages);
        repository.replace(key(memoryId), ChatMessageSerializer.messagesToJson(messages));
    }

    @Override
    public void deleteMessages(Object memoryId) {
        repository.delete(key(memoryId));
    }

    private static String key(Object memoryId) {
        return Objects.requireNonNull(memoryId, "memoryId").toString();
    }
}
