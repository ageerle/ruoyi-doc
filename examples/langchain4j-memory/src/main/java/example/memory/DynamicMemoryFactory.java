package example.memory;

import dev.langchain4j.memory.ChatMemory;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.memory.chat.TokenWindowChatMemory;
import dev.langchain4j.model.TokenCountEstimator;
import dev.langchain4j.store.memory.chat.ChatMemoryStore;
import java.util.function.Function;

public final class DynamicMemoryFactory {
    public static ChatMemory messages(String id, Function<Object, Integer> limits,
                                      ChatMemoryStore store) {
        return MessageWindowChatMemory.builder()
                .id(id).dynamicMaxMessages(limits)
                .alwaysKeepSystemMessageFirst(true).chatMemoryStore(store).build();
    }

    public static ChatMemory tokens(String id, Function<Object, Integer> budgets,
                                    TokenCountEstimator estimator, ChatMemoryStore store) {
        return TokenWindowChatMemory.builder()
                .id(id).dynamicMaxTokens(budgets, estimator)
                .alwaysKeepSystemMessageFirst(true).chatMemoryStore(store).build();
    }
}
