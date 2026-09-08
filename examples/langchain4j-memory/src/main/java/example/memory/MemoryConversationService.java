package example.memory;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.store.memory.chat.ChatMemoryStore;
import java.util.Objects;
import java.util.concurrent.locks.ReentrantLock;

/** 单实例、同步聊天示例。业务调用前必须校验会话归属并生成 memoryId。 */
public final class MemoryConversationService {
    private final MemoryAssistantFactory.Assistant assistant;
    private final ChatMemoryStore store;
    // 固定数量的锁，避免为每个会话永久保留一个锁对象。
    private final ReentrantLock[] locks = new ReentrantLock[64];

    public MemoryConversationService(ChatModel model, ChatMemoryStore store) {
        this.store = Objects.requireNonNull(store);
        this.assistant = MemoryAssistantFactory.create(model, store);
        for (int i = 0; i < locks.length; i++) {
            locks[i] = new ReentrantLock();
        }
    }

    public String chat(String memoryId, String question) {
        var lock = lockFor(memoryId);
        lock.lock();
        try {
            // 锁覆盖 AI Services 的读、模型生成和写回，不仅锁住数据库查询。
            return assistant.chat(memoryId, Objects.requireNonNull(question));
        } finally {
            try {
                assistant.evictChatMemory(memoryId); // 快照已保存，可释放实例缓存。
            } finally {
                lock.unlock();
            }
        }
    }

    public void clear(String memoryId) {
        var lock = lockFor(memoryId);
        lock.lock();
        try {
            store.deleteMessages(memoryId); // 即使没有缓存实例，也删除持久化快照。
            assistant.evictChatMemory(memoryId);
        } finally {
            lock.unlock();
        }
    }

    private ReentrantLock lockFor(String memoryId) {
        if (memoryId == null || memoryId.isBlank() || memoryId.length() > 191) {
            throw new IllegalArgumentException("memoryId 必须为 1～191 个字符");
        }
        return locks[Math.floorMod(memoryId.hashCode(), locks.length)];
    }
}
