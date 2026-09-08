package example.memory;

import dev.langchain4j.data.message.ChatMessage;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;
import java.util.function.Supplier;

/** 显式将阻塞存储操作提交到调用方管理的执行器；底层 JDBC 仍为阻塞式。 */
public final class AsyncJsonChatMemoryStore extends JsonChatMemoryStore {
    private final Executor executor;

    public AsyncJsonChatMemoryStore(SnapshotRepository repository, Executor executor) {
        super(repository);
        this.executor = Objects.requireNonNull(executor);
    }

    @Override
    public CompletableFuture<List<ChatMessage>> getMessagesAsync(Object id) {
        return submit(() -> super.getMessages(id));
    }

    @Override
    public CompletableFuture<Void> updateMessagesAsync(Object id, List<ChatMessage> messages) {
        final List<ChatMessage> snapshot;
        try {
            snapshot = List.copyOf(messages); // 提交前复制列表，避免调用方随后增删。
        } catch (RuntimeException e) {
            return CompletableFuture.failedFuture(e);
        }
        return submit(() -> { super.updateMessages(id, snapshot); return null; });
    }

    @Override
    public CompletableFuture<Void> deleteMessagesAsync(Object id) {
        return submit(() -> { super.deleteMessages(id); return null; });
    }

    private <T> CompletableFuture<T> submit(Supplier<T> operation) {
        try {
            return CompletableFuture.supplyAsync(operation, executor);
        } catch (RejectedExecutionException e) {
            return CompletableFuture.failedFuture(e);
        }
    }
}
