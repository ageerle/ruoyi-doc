package example.memory;

import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.MemoryId;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.memory.ChatMemoryAccess;
import dev.langchain4j.store.memory.chat.ChatMemoryStore;

public class MemoryAssistantFactory {
    public interface Assistant extends ChatMemoryAccess {
        String chat(@MemoryId String memoryId, @UserMessage String question);
    }

    public static Assistant create(ChatModel model, ChatMemoryStore store) {
        return AiServices.builder(Assistant.class)
                .chatModel(model)
                .chatMemoryProvider(id -> MessageWindowChatMemory.builder()
                        .id(id)
                        .maxMessages(20)
                        .alwaysKeepSystemMessageFirst(true)
                        .chatMemoryStore(store)
                        .build())
                .build();
    }
}
