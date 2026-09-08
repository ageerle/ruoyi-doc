package example.memory;

import dev.langchain4j.memory.ChatMemory;
import dev.langchain4j.memory.chat.TokenWindowChatMemory;
import dev.langchain4j.model.TokenCountEstimator;
import dev.langchain4j.store.memory.chat.ChatMemoryStore;

public class TokenMemoryFactory {
    public static ChatMemory create(String id, int memoryBudget,
                                    TokenCountEstimator estimator,
                                    ChatMemoryStore store) {
        return TokenWindowChatMemory.builder()
                .id(id)
                .maxTokens(memoryBudget, estimator)
                .alwaysKeepSystemMessageFirst(true)
                .chatMemoryStore(store)
                .build();
    }
}
