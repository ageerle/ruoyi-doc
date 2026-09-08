---
outline: [2, 3]
---

# 上下文管理

RuoYi AI 已支持同一会话的历史读取、聊天记录持久化与恢复，以及基于最近消息的记忆窗口。用户可以在同一会话中连续追问，也可以重新打开已保存的会话继续对话。

上下文管理决定**模型在本次请求中能看到哪些信息，以及这些信息以什么顺序、什么角色进入模型**。系统提示词、历史对话、当前问题、知识库片段和工具结果都可能参与其中；会话记忆是上下文管理的一部分。

本页已合并原「记忆管理」教程，先介绍上下文与会话记忆的概念，再说明如何使用和验证已有能力，最后介绍如何用 LangChain4j 扩展窗口、存储和长期记忆。第一次接触项目，建议按 **理解概念 → 页面验证 → 阅读现有代码 → 运行独立示例 → 选择扩展方式** 的顺序阅读。

::: info 版本与适用范围
本文于 **2026-09-08** 核对 [LangChain4j 最新发布](https://github.com/langchain4j/langchain4j/releases/tag/1.20.0)：稳定模块为 **1.20.0**，同批次 beta 模块为 **1.20.0-beta30**。本地 `ruoyi-ai/pom.xml` 当前使用 `1.17.2` / `1.17.2-beta27`，community 模块为 `1.17.0-beta27`。

第 1～3 节说明当前项目；第 4 节起是基于 **1.20.0** 的开发教程。新类、表和配置接线需要自行实现，不表示当前后台已提供这些功能。本次文档更新不升级后端依赖。
:::

需要直接运行关键代码，可跳到[示例工程与关键代码](#key-code)，或[下载完整 Maven 工程](/files/langchain4j-memory-1.20.0.zip)。工程包含 JDBC 快照实现和无需外部模型的验证入口。

## 1. 先理解：历史、记忆和上下文

### 1.1 模型如何“记住”上一轮

常规聊天模型调用不会替应用保存完整会话。应用需要选择与当前问题有关的内容，再发送给模型：

| 概念 | 可以怎样理解 | 在本项目中的例子 |
| --- | --- | --- |
| 聊天历史（History） | 用户实际说过什么、模型实际回复什么，供页面回看。 | 数据库 `chat_message` 中的记录。 |
| 会话记忆（Chat Memory） | 本轮继续对话时保留哪些历史内容。旧内容可以被移出窗口或压缩。 | 按 `session_id` 读取消息，由 `MessageWindowChatMemory` 选择最近的历史。 |
| 请求上下文（Context） | 本次真正发送给模型的输入。 | 系统提示词、选中的历史、当前问题，以及可能加入的知识库片段。 |

因此，**页面看得到一条旧消息，不代表本轮模型也看得到它**。LangChain4j 的 `ChatMemory` 管理模型记忆，完整历史需要应用自己保存。参见官方 [Chat Memory 教程](https://docs.langchain4j.dev/tutorials/chat-memory/)。

### 1.2 持久化与长期记忆有什么区别

| 需求 | 需要的能力 | 当前项目 |
| --- | --- | --- |
| 在原会话继续追问 | 会话记忆。 | 已接通。 |
| 刷新页面后能回看对话 | 历史持久化与会话恢复。 | 已接通。 |
| 对话很长时控制输入长度 | 消息窗口或 Token 窗口。Token 是模型计量输入、输出长度的单位，不等于字数。 | 当前按最近 20 条历史消息截取。 |
| 新开会话也知道“我偏好 Java 示例” | 跨会话长期记忆：保存用户事实或偏好，并在需要时检索。 | 尚无独立数据模型与召回链路。 |
| 自动概括旧对话 | 摘要生成、保存与重新注入。 | 有配置占位，尚未接通。 |

把聊天记录存进 MySQL 解决的是“数据不随进程退出而消失”；跨会话长期记忆还要解决“什么值得记住、属于谁、何时取出、如何更新”。知识库保存的通常是业务资料，长期记忆保存的通常是用户或任务的事实，两者可复用检索技术，数据范围要分别管理。

### 1.3 一次请求的上下文由什么组成

| 组成 | 用途 | 当前项目中的来源与边界 |
| --- | --- | --- |
| 系统提示词 | 指定角色、职责、回答风格和约束。 | 智能体的 `systemPrompt` 与子 Agent 提示词。当前普通模型对话不会自动注入智能体提示词。 |
| 历史消息 | 让“刚才那个方案”“继续修改”等追问有所指。 | 按 `sessionId` 读取已保存的文本消息，取最近最多 20 条历史。 |
| 当前问题 | 本轮用户要完成的任务。 | `ChatRequest.content`，放在历史之后；有知识库时增强这条输入。 |
| 知识片段 | 为回答提供业务事实与参考资料。 | 按请求或智能体关联的知识库检索；配置与召回验证见[知识管理](./knowledge.md)。 |
| 工具结果 | 将模型请求执行的查询或操作结果交回模型。 | 在智能体的实际工具执行过程中产生；MCP 工具当前注入网页搜索子 Agent，见[MCP 管理](./mcp.md)。 |
| 输出约束 | 要求返回 JSON、SQL、表格等可处理结果。 | 各业务提示词与代码校验，不是一个已实现的统一“上下文策略”管理页。 |

这些组成是否出现，取决于本次请求走的执行路径。普通聊天、Supervisor 智能体、工作流和 Coding Harness 各自组装输入，并非所有请求都会同时携带以上内容。

### 1.4 编写上下文时遵循哪些原则

1. **分清规则与资料。** 系统提示词描述职责；知识片段、历史和工具输出是完成任务的材料。保留材料来源，避免把检索到的文本直接当成系统规则。
2. **明确任务与输出。** 交代当前问题、背景、约束和输出格式；需要 JSON 或 SQL 时，还应在代码中做结构校验。
3. **控制整个请求的长度。** 历史窗口只限制历史；系统提示词、当前输入、检索结果和模型输出预留空间都需要计入预算。第 6 节介绍 Token 窗口。
4. **先观察实际请求，再调整提示词。** 排查时确认消息顺序、是否重复注入、召回片段是否相关，以及工具结果是否回传。第 2 节给出断点验证步骤。

## 2. 先在页面上验证已有记忆

### 2.1 准备一个可用会话

1. 按[本地安装](../getting-started/install.md)启动后端、用户端和管理端。
2. 按[模型管理](./model.md)配置一个能正常回复的聊天模型，确认用户端可以选择它。
3. 登录用户端，点击 **新对话**，选择普通聊天模型，先用纯文本验证。

当前没有需要先打开的“长期记忆”管理页或开关。普通聊天链路已经读取同一会话的历史。

### 2.2 用两轮提问验证上下文

在同一个会话中依次发送，等待第一轮回复完成后再发送第二轮：

```text
第一轮：记忆验证：请记住校验短语“青云-4173”，并只回复“已记住”。
第二轮：请告诉我刚才要求你记住的校验短语是什么？只回复短语。
```

预期第二轮回复包含 `青云-4173`。使用临时短语，是为了排除模型靠常识猜中的情况；模型可能回复额外文字，应重点检查短语是否正确。

### 2.3 验证保存、恢复和隔离

| 操作 | 应检查的结果 | 能说明什么 |
| --- | --- | --- |
| 记下会话 URL 中的 ID，刷新并重新打开同一会话。 | 两轮共四条用户/助手消息仍然存在。 | 页面从服务端恢复了历史。 |
| 在恢复的会话中再次询问校验短语。 | 仍能回答正确短语。 | 恢复后的历史继续进入模型上下文。 |
| 新建另一个会话，只问“刚才的校验短语是什么”。 | 新请求中不应包含原会话的消息。 | 上下文隔离；不能仅靠模型回答判断隔离是否正确。 |
| 管理端进入 **对话管理 → 聊天消息**，按会话检查记录。 | 能找到对应的 `user` 和 `assistant` 记录。 | 消息已持久化；继续追问后，记录数会超过四条。 |

开发者检查普通聊天的实际上下文时，可在后端 IDE 中给 `ChatServiceFacade#handleModelChat` 的 `streamingChatModel.chat(messages, ...)` 调用处打断点。使用调试模式启动后端并发送问题，在调用前展开 `messages`，确认原会话有历史、新会话没有原会话短语，且最后一条是当前问题。浏览器的网络面板只能看到前端提交的请求，不能替代这一步，因为历史由后端补入。

以下截图展示了已有环境使用 `deepseek-v4-flash` 验证两轮召回、刷新恢复和消息保存的过程。你可以使用自己的可用模型；这些截图不代表 1.20.0 扩展代码已经在后端部署。

<div class="image-gallery">

![用户端左侧显示从服务端加载的最近会话](/images/memory/runtime/memory-recent-sessions.png)

![同一会话第二轮返回上一轮的校验短语](/images/memory/runtime/memory-context-recall.png)

![刷新后重新打开原会话，用户消息与助手回复恢复](/images/memory/runtime/memory-session-restored.png)

![管理端聊天消息列表显示两轮对话的四条持久化记录](/images/memory/runtime/memory-message-persistence.png)

</div>

## 3. 当前项目怎样组装上下文与记忆

### 3.1 从一次请求找到对应代码

普通聊天的主要步骤如下，代码位于后端仓库 `ruoyi-ai`：

1. `ChatServiceFacade#sseChat` 校验会话归属，确认当前用户可以访问该 `sessionId`。
2. `buildContextMessages` 调用 `createChatMemory`，按会话 ID 获取记忆实例。
3. `PersistentChatMemoryStore#getMessages` 读取 `chat_message`，转换为 LangChain4j 消息。
4. `MessageWindowChatMemory.messages()` 截取最多 20 条历史，随后单独追加当前用户问题。
5. 项目组装最终模型请求；选择知识库时还会增强当前问题。用户消息由业务服务保存，普通流式回复在完成回调中保存。

这里的 **20 条是历史消息数，不是 20 轮对话，也不是整个请求的消息上限**。普通问答的一问一答通常占两条；当前问题在窗口外追加，系统提示词或知识库内容也会增加最终请求长度。

当前历史转换只恢复文本 `user` / `assistant` 消息。若要跨请求恢复工具调用过程或图片等多模态内容，还需扩展保存格式，不能仅凭文本历史假设这些内容已经恢复。

### 3.2 存储类与配置的实际行为

`PersistentChatMemoryStore` 的名字容易让人以为所有写入都由它完成，但当前实现中：

| 方法 | 当前行为 |
| --- | --- |
| `getMessages(memoryId)` | 查询该会话的数据库消息。 |
| `updateMessages(memoryId, messages)` | 只记录日志，没有写数据库。 |
| `deleteMessages(memoryId)` | 调用 `deleteBySessionId` 删除该会话的消息。 |

真正的新增由 `ChatMessageServiceImpl#saveChatMessage` 完成。因此当前用法是**业务层保存完整历史，记忆窗口负责读取和选择历史**。不要直接把这个类接给 AI Services 后，就期待 `memory.add()` 自动保存新内容。

`ChatMemoryProperties` 已定义以下字段，但尚未接入这条组装链路：

| 配置 | 定义的默认值 | 当前效果 |
| --- | --- | --- |
| `chat.memory.enabled` | `true` | 尚不能通过它关闭历史注入。 |
| `chat.memory.max-messages` | `20` | 实际仍使用 `DEFAULT_MAX_MESSAGES = 20`。 |
| `chat.memory.persistence-enabled` | `true` | 尚不能通过它关闭业务消息落库。 |
| `chat.memory.summarize-enabled` | `false` | 没有摘要执行逻辑。 |
| `chat.memory.auto-cleanup-days` | `0` | 没有按此字段执行的过期清理任务。 |

仅修改 YAML 不会让这些功能生效。[第 6 节](#project-integration)说明如何接线。

### 3.3 阅读普通对话的上下文组装代码

在 `ruoyi-modules/ruoyi-chat/src/main/java/org/ruoyi/service/chat/impl/ChatServiceFacade.java` 中，`buildContextMessages` 先组织 **系统提示词（有智能体配置时）→ 历史 → 当前问题**。普通对话随后调用下面的方法；这是当前实现中的代码片段：

```java
private List<ChatMessage> buildModelChatMessages(ChatRequest chatRequest) {
    List<ChatMessage> messages = new ArrayList<>(chatRequest.getContextMessages());
    String augmentedInput = augmentAgentInput(chatRequest, null);
    int lastIndex = messages.size() - 1;
    if (lastIndex >= 0 && messages.get(lastIndex) instanceof UserMessage) {
        messages.set(lastIndex, UserMessage.userMessage(augmentedInput));
    }
    return messages;
}
```

理解这段代码时，注意三个位置：

- `new ArrayList<>(...)`：复制已经组装好的历史和当前问题，保留顺序。
- `augmentAgentInput(chatRequest, null)`：复用知识库增强入口。这里传入的智能体配置为 `null`，普通聊天使用请求中的知识库信息。
- `messages.set(lastIndex, ...)`：用增强后的输入替换当前问题，避免把同一问题再次追加一份。

最终 `handleModelChat` 将这份 `messages` 交给 `streamingChatModel.chat(...)`。用第 2 节的两轮示例检查时，应看到第一轮的用户消息与助手回复位于当前问题之前；知识库片段则出现在本轮增强后的输入中。

### 3.4 不同执行路径怎样使用上下文

| 路径 | 组装方式 | 阅读入口 |
| --- | --- | --- |
| 普通模型对话 | 历史与当前问题组成消息列表，按需增强当前问题，直接调用模型。 | `ChatServiceFacade#handleModelChat`。 |
| Supervisor 智能体 | `formatHistoryMessages` 将历史整理成对话文本，当前问题单独增强，再结合系统提示词交给 Supervisor；工具结果在子 Agent 执行中产生。 | `ChatServiceFacade#handleAgentChat`；详见[智能体管理](./agent.md)。 |
| 工作流 | 由工作流运行时将启动输入与前置节点输出传给后续节点；模型节点使用自己的提示词与配置。 | `handleWorkflowChat` → `WorkFlowStarterService#streaming`；详见[流程编排](./orchestration.md)。 |
| Coding Harness | 使用自身的提示词、运行状态和技能装配链路。 | `DefaultHarnessPromptAssembler`；详见[技能管理](./skills.md)。 |

因此，普通聊天的 20 条历史窗口不能直接理解为所有智能体、工作流节点和编程助手都共享的统一窗口。修改上下文前，先定位实际请求走的是哪一条路径。

### 3.5 扩展业务提示词的写法

下面是可用于业务开发的提示词模板，**不是现有配置字段**。将占位内容映射到实际检索结果、工具结果或业务参数后，再接入对应执行路径。

```text
任务：根据参考资料回答当前问题。
当前问题：{question}
参考资料：{retrieved_documents}
工具返回：{tool_results}

要求：
1. 区分资料中已经确认的事实与推断。
2. 资料不足或工具失败时，说明缺口。
3. 按 {output_schema} 输出，并保留可追溯的资料来源。
```

知识库问答应说明材料不足时如何回答；工具调用应说明何时使用工具、缺少哪些参数时需要补充；图片或视频生成可将主体、场景、风格、尺寸和参考素材分开。媒体参数的实际支持范围见[多模态接口](./multimodal.md)。不要把整个会话历史、知识库全文或所有工具结果无差别塞进同一个字符串。

## 4. 用 LangChain4j 1.20.0 运行最小示例

### 4.1 先认识要用的 API

| API | 负责什么 | 适用场景 |
| --- | --- | --- |
| `ChatMemory` | 添加、读取、替换和清空当前记忆。 | 自己控制消息组装。 |
| `MessageWindowChatMemory` | 按消息条数控制窗口。 | 入门、消息长度比较稳定的场景。 |
| `TokenWindowChatMemory` | 根据 `TokenCountEstimator` 估计的 Token 数控制窗口。 | 长文本或需要控制输入预算的场景。 |
| `ChatMemoryStore` | 保存一个记忆 ID 对应的当前窗口状态。 | 数据库、Redis 等存储。 |
| `ChatMemoryProvider`、`@MemoryId` | 为不同会话提供不同记忆。 | AI Services 中的多用户、多会话隔离。 |
| `ChatMemoryAccess` | 读取 AI Service 中的记忆实例，移除实例缓存。 | 查看状态与释放闲置会话。 |

最新版还提供动态窗口配置，以及 **1.20.0 新增、标记为实验性的异步记忆接口**。这些能力在第 6、8 节展开；表中的基础 API 并非都在 1.20.0 才出现。

### 4.2 建立独立 Maven 示例

在后端仓库外新建 `memory-demo` 目录，准备 JDK 17 或更高版本与 Maven。把下面内容保存为 `pom.xml`，Java 文件放到 `src/main/java`。这样可以先学习 API，再决定如何迁移项目。

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>example</groupId>
    <artifactId>memory-demo</artifactId>
    <version>1.0.0</version>
    <properties>
        <maven.compiler.release>17</maven.compiler.release>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    <dependencies>
        <dependency>
            <groupId>dev.langchain4j</groupId>
            <artifactId>langchain4j</artifactId>
            <version>1.20.0</version>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.14.0</version>
            </plugin>
            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>exec-maven-plugin</artifactId>
                <version>3.5.0</version>
            </plugin>
        </plugins>
    </build>
</project>
```

在 `src/main/java/MemoryDemo.java` 中保存：

```java
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
```

在 `memory-demo` 目录运行：

```shell
mvn -q compile exec:java "-Dexec.mainClass=MemoryDemo"
```

预期输出如下（Maven/日志组件可能另有提示）：

```text
window size = 3
oldest retained = 已记住
restored size = 3
other session size = 0
after clear = 0
```

此示例不需要 API Key，也不验证模型回答；它验证窗口淘汰、相同 ID 恢复、不同 ID 隔离和清空。`InMemoryChatMemoryStore` 只保存在当前 JVM 中，重启进程后会丢失。第 5 节说明如何持久化。

### 4.3 让 AI Services 自动管理多轮消息

AI Services 可以把 Java 接口转换为模型服务，并自动将用户输入和模型输出加入记忆。保存为 `src/main/java/MemoryAssistantFactory.java`：

```java
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
```

`model` 是已按厂商配置构建好的 `ChatModel`；在 RuoYi AI 中可沿用 `ChatServiceFactory` 选择的服务及其 `buildChatModel`。`store` 可先传入上节的 `InMemoryChatMemoryStore`。在持有这两个对象的服务方法中调用：

```java
var assistant = MemoryAssistantFactory.create(model, store);
// 示例 ID；实际先校验会话归属，再由服务端生成。
String memoryId = "tenant-1:user-42:agent-7:session-1001";
String first = assistant.chat(memoryId, "项目代号是青云-4173，请记住。");
String second = assistant.chat(memoryId, "项目代号是什么？");
```

复用 `assistant` 服务实例，同一会话始终传相同 ID，并保持 ID 类型一致。使用共享存储时，builder 上的 `.id(id)` 同样要设置；只写 `@MemoryId` 不会替自定义 builder 设置存储 ID。上述复合字符串不能直接传给现有 `PersistentChatMemoryStore`，因为它按 `Long` 解析会话 ID。

在这种接法中，20 限制的是被加入 `ChatMemory` 的消息总数，当前问题也参与窗口淘汰，与项目现有的“20 条历史再加当前问题”不同。不要再把同一份历史或当前问题手工重复添加。接口和并发约束见官方 [AI Services：Chat Memory](https://docs.langchain4j.dev/tutorials/ai-services/#chat-memory)。

## 5. 扩展持久化：保存窗口，保留完整历史

### 5.1 先约定存储职责

`updateMessages(id, messages)` 收到的是**该 ID 的最新窗口快照**，包含本次保留的所有消息，不是本次新增的一条。存储层应替换旧快照；空列表也必须覆盖旧内容。追加快照会造成重复，而用快照覆盖完整聊天历史会丢失被淘汰的旧对话。参见 [1.20.0 ChatMemoryStore 接口](https://github.com/langchain4j/langchain4j/blob/1.20.0/langchain4j-core/src/main/java/dev/langchain4j/store/memory/chat/ChatMemoryStore.java)。

建议保留现有 `chat_message` 保存完整历史，再增加独立的窗口存储：

| 数据 | 内容 | 更新方式 |
| --- | --- | --- |
| `chat_message`（现有） | 用户与助手实际发生的历史。 | 按业务消息新增，供页面展示。 |
| `chat_memory_snapshot`（建议新增） | 供模型继续对话的窗口状态。 | 按 `memory_id` 覆盖，保留消息类型信息。 |
| 用户长期记忆（后续扩展） | 偏好、事实及其来源。 | 按事实更新、过期或删除。 |

### 5.2 接入数据库或 Redis 的适配器

下面的类负责消息与 JSON 的转换，保存为 `src/main/java/JsonChatMemoryStore.java`。`SnapshotRepository` 是**本教程定义的应用接口**，不是 LangChain4j 自带组件；需实现它，才具备跨进程恢复能力。[配套工程](#key-code)已经提供 JDBC 实现，也可以按此接口接入其他存储。

```java
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
```

官方序列化器可以保留消息角色和工具调用结构。仅保存 `message.toString()` 或文本内容，无法可靠恢复这些信息；远程图片、文件链接能否继续访问，还取决于资源有效期。

若选择 MySQL，在开发数据库建立以下**示例表**，再用 MyBatis 或 JDBC 实现 `SnapshotRepository`：

```sql
CREATE TABLE chat_memory_snapshot (
    memory_id VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    messages_json LONGTEXT NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (memory_id)
);
```

`find` 按主键读取；`replace` 用参数化 upsert 替换整个 JSON；`delete` 按主键删除。表结构需纳入自己的迁移脚本。示例以服务端生成的复合 ID 隔离数据，不会自动启用 RuoYi 的租户拦截器；管理接口也需实施租户与用户权限过滤。

Redis 可使用 `chat:memory:{memoryId}` 作为 key，对应 `GET`、`SET`、`DEL`，写入时按需求设置 TTL（自动过期时间）。TTL 只清理该快照，不会自动清理 MySQL 历史。

### 5.3 接入并验证恢复

1. 实现并注入 `SnapshotRepository`，创建一个可复用的 `JsonChatMemoryStore`。
2. 将它传给 `MemoryAssistantFactory.create(model, store)`。
3. 完成两轮对话，检查同一 ID 只有一份最新 JSON 快照，没有重复消息。
4. 重启示例服务，使用同一 ID 继续提问，确认快照被重新读取。另一个 ID 应读取自己的独立数据。
5. 模拟存储不可用，确认调用报告失败。不要把数据库异常当成“空历史”静默返回，否则会出现看似成功却丢失记忆的情况。

原子替换保证一份快照不会写到一半，不能防止两个请求同时“读旧值、分别写回”覆盖彼此。相同 ID 的整轮请求应串行执行，多实例部署也要共享这一约束。

## 6. 扩展窗口并接回项目 {#project-integration}

### 6.1 选择接入方式

| 方式 | 怎么做 | 适用情况 |
| --- | --- | --- |
| 保留当前 Facade 链路 | 业务层保存历史，窗口选择历史；接通配置读取。 | 只需调整已有会话记忆，改动范围较小。 |
| 接入 AI Services | 使用第 4～5 节的 provider 与可写快照存储，让 AI Services 管理窗口。 | 新增服务，或统一管理消息、工具过程与窗口状态。 |

两种方式要明确各自的写入入口。不要在 Facade 先写一遍窗口，又让 AI Services 将相同输入再写一遍。以下是接入步骤，不是当前已生效的配置。

### 6.2 接通原有开关和条数配置

1. 在 `ChatServiceFacade` 中注入 `ChatMemoryProperties`，沿用构造器注入方式，加入对应的 `final` 字段。
2. 在 `buildContextMessages` 的历史读取分支判断 `Boolean.TRUE.equals(chatMemoryProperties.getEnabled())`。关闭时跳过历史，仍添加当前问题及业务要求的系统提示词。
3. 在 `createChatMemory` 中用经过非空、正数校验的 `getMaxMessages()` 替换固定的 `DEFAULT_MAX_MESSAGES`。
4. 明确配置更新方式：静态 `maxMessages(...)` 在实例创建时确定值，现有缓存不会自动重建。修改启动配置后重启服务；热更新需刷新配置值并使用动态 provider，或清理对应实例。
5. 对比开启/关闭、不同窗口值时真正发给模型的消息，确认当前问题只出现一次。

完成接线后，才可以在后端 `ruoyi-admin/src/main/resources/application.yml` 或激活的 profile 中使用：

```yaml
chat:
  memory:
    enabled: true
    max-messages: 20
```

建议将 `enabled: false` 定义为“本轮不注入历史”，完整聊天记录仍可保存。`persistence-enabled` 是另一项产品行为，需要同时梳理业务保存入口，不能仅靠更换 `ChatMemoryStore` 实现。摘要和清理字段也要有对应执行逻辑。

### 6.3 长文本使用 Token 窗口

条数相同，内容可能从一句话变成数万字。Token 窗口需要与实际模型匹配的 `TokenCountEstimator`。下例保存为 `src/main/java/TokenMemoryFactory.java`，估算器由调用方提供：

```java
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
```

例如，OpenAI 文本模型可使用 `langchain4j-open-ai:1.20.0` 中的 `OpenAiTokenCountEstimator`，构造时传入它支持的模型名称。OpenAI 兼容的 HTTP 协议不代表兼容其 Token 算法；其他模型应选择匹配的估算器。该估算器也不能直接估算所有图片、音视频内容。参见 [1.20.0 估算器实现](https://github.com/langchain4j/langchain4j/blob/1.20.0/langchain4j-open-ai/src/main/java/dev/langchain4j/model/openai/OpenAiTokenCountEstimator.java)。

假设某模型上下文上限为 32,768 Token，可先为输出预留 4,096，为工具描述、知识库片段、窗口外系统提示词与安全余量预留 8,192，则记忆窗口的预算至多为 20,480。**这是预算示例，实际要按所用模型和本轮内容计算**；已纳入窗口的系统消息或当前问题不要重复扣除。

若保留现有 Facade 的“窗口外追加当前问题”方式，还要先从上述预算中扣除当前问题的 Token，剩余部分才可用于历史。AI Services 已将当前问题纳入窗口时，无需再次扣除。

Token 窗口按整条消息淘汰，不会自动把超长文本截成能放下的长度。调用前应检查当前问题是否超预算，选择拒绝、拆分或压缩，避免当前问题本身被移出窗口。仅剩的系统消息也可能超过预算，因此最终请求仍需检查长度。行为见 [1.20.0 TokenWindowChatMemory](https://github.com/langchain4j/langchain4j/blob/1.20.0/langchain4j/src/main/java/dev/langchain4j/memory/chat/TokenWindowChatMemory.java)。

### 6.4 动态窗口、系统消息与工具消息

1.20.0 的 builder 支持以下写法；参数是以记忆 ID 为输入、返回正整数的函数：

```java
// 替换固定 .maxMessages(20)，每次操作读取当前限制。
.dynamicMaxMessages(id -> windowLimits.maxMessages(id))

// 替换固定 .maxTokens(memoryBudget, estimator)。
.dynamicMaxTokens(id -> windowLimits.maxTokens(id), estimator)
```

`windowLimits` 是需要自行实现的配置查询服务。动态 provider 可按会话或模型选择预算，但不会替你监听 YAML 变化。`messages()` 会按当前限制裁剪返回的副本，不会单独把裁剪结果写回存储；后续 `add()` 或 `set()` 写入缩小后的快照后，再增大窗口也不会恢复已淘汰内容。需要恢复时，应从完整历史重建窗口。

窗口中的系统消息占用条数或 Token 预算；同一窗口只维护一个系统消息，更新规则后可用新内容替换旧内容，并用 `alwaysKeepSystemMessageFirst(true)` 使其处于首位。工具调用请求所在的 `AiMessage` 被移出窗口时，后续关联工具结果也会被移除，以避免请求/结果不配对。不要把工具消息当普通文本随意截取。参见 [1.20.0 MessageWindowChatMemory](https://github.com/langchain4j/langchain4j/blob/1.20.0/langchain4j/src/main/java/dev/langchain4j/memory/chat/MessageWindowChatMemory.java)。

### 6.5 后端依赖升级检查

独立示例只依赖稳定模块。RuoYi AI 还包含模型厂商、MCP、agentic 和 community 等依赖，不能把所有版本号统一替换成 `1.20.0`。应按模块真实发布版本对齐并检查对应 BOM；community 仓库单独发布。

在后端仓库执行下面命令，核对直接和传递依赖，再完成编译与模块测试：

```shell
mvn -pl ruoyi-modules/ruoyi-chat -am dependency:tree "-Dincludes=dev.langchain4j:*"
```

迁移时先覆盖普通文本聊天、流式完成/中断、同会话恢复，再验证实际使用的工具、知识库和智能体链路。依赖升级成功本身不会接通配置占位功能。

## 7. 进一步扩展：摘要与跨会话长期记忆

### 7.1 用摘要保留旧对话的关键信息

可以把旧对话压缩为“已确定事项、约束、待办”，与近期原文一起提供给模型。应用需要实现摘要策略；`ChatMemory#set(...)` 可替换窗口，但框架不会自动调用它生成摘要，也不会因为设置 `summarize-enabled: true` 就执行压缩。参见 [ChatMemory 的替换接口](https://github.com/langchain4j/langchain4j/blob/1.20.0/langchain4j-core/src/main/java/dev/langchain4j/memory/ChatMemory.java)。

建议按以下顺序实现：

1. 在旧消息被淘汰前判断预算，读取尚未摘要的已完成对话；保留最近几轮原文与完整工具调用组。
2. 调用独立的摘要服务，提取事实和决定，避免递归使用正在压缩的同一个带记忆助手。
3. 保存摘要文本、覆盖到的消息 ID/序号、版本和更新时间；摘要请求失败时保留旧状态。
4. 下一轮组装“摘要 + 最近原文 + 当前问题”，避免重复加入摘要已覆盖的全部原文，并检查最终预算。
5. 在同会话串行控制下更新快照；原始 `chat_message` 继续保留，便于追溯和重新摘要。

摘要可能遗漏或误写信息，关键原文应可追溯。把摘要作为对话数据注入，不要把用户说过的话直接提升为系统规则。

### 7.2 跨会话记住用户偏好

例如，用户在会话 A 说“代码示例优先用 Java”，希望会话 B 也沿用这个偏好。仅扩大 `maxMessages` 或将记忆 ID 改为用户 ID 都不完整：后者会把用户多个会话混到一个窗口中。

可以增加独立的用户记忆层，先从结构化偏好开始，再扩展语义检索：

| 阶段 | 开发内容 | 验收结果 |
| --- | --- | --- |
| 保存 | 新增事实/偏好记录，包含租户、用户、作用范围、内容、来源消息、更新时间、状态与可选过期时间。 | 知道一条记忆属于谁、从哪条对话产生。 |
| 更新 | 为同类偏好定义合并规则；“以后改用 Kotlin”替换原偏好。 | 新旧偏好不会同时生效。 |
| 召回 | 先按当前身份、作用范围和有效期过滤；结构化偏好可直接读取，语义检索可复用 Embedding 与向量库。 | 新会话能使用该用户的相关偏好。 |
| 注入 | 将少量相关事实作为参考资料加入本轮上下文，纳入 Token 预算。 | 模型使用偏好，原始业务规则仍然有效。 |
| 管理 | 提供查看、编辑、停用与删除入口，并同步移除对应向量。 | 改正或删除后，不再召回旧事实。 |

Embedding 把文本转换为便于相似度比较的向量，接入基础可参考[知识管理](./knowledge.md)。记忆检索必须在检索阶段限定租户、用户和授权范围，不能先在全库取相似结果再依赖提示词隔离。

全局业务规则更适合由管理员维护到系统提示词或知识库。普通用户的一句话不应直接生成全局共享规则。当前项目没有上述长期记忆管理页，也没有记忆写入审批流程；是否需要确认或审批，应根据具体内容和产品要求设计。

## 8. 1.20.0 异步记忆与流式请求

1.20.0 为非阻塞 AI Services 增加了实验性记忆接口。同步方法仍可使用；采用新的异步/响应式调用方式时，需检查整条依赖链的异步支持。

| 层次 | 异步方法 |
| --- | --- |
| `ChatMemory` | `addAsync`、`setAsync`、`messagesAsync`；清空仍为同步 `clear()`。 |
| `ChatMemoryStore` | `getMessagesAsync`、`updateMessagesAsync`、`deleteMessagesAsync`。 |

如需异步删除窗口，使用已实现异步能力的存储调用 `deleteMessagesAsync(id)`，完成后再移除对应实例缓存；1.20.0 的 `ChatMemory` 没有 `clearAsync()`。

自定义存储只实现同步三个方法时，默认异步方法会返回携带 `AsyncNotSupportedException` 的失败 Future，不会自动把阻塞数据库查询放到后台线程。第 5 节适配器也只有同步能力。实现时可使用非阻塞数据库客户端；若沿用 JDBC/MyBatis，应显式使用有界执行器承载阻塞操作，并处理超时、取消及错误。参见 [1.20.0 ChatMemoryStore](https://github.com/langchain4j/langchain4j/blob/1.20.0/langchain4j-core/src/main/java/dev/langchain4j/store/memory/chat/ChatMemoryStore.java)。

RuoYi AI 现在向浏览器返回 SSE（服务器逐段推送回复），不等于已经使用上述异步记忆 API。迁移时分别确认模型、存储和 AI Services 的支持情况。

同一记忆 ID 的并发调用仍可能覆盖彼此。串行控制应覆盖**读取历史、模型生成、工具执行和最终写入**，流式请求要等完成、失败或取消后的清理完成才能释放；仅给 `getMessages()` 加锁不够。模型中途失败时可能已经写入用户消息，应定义重试、失败轮次记录与回滚策略，避免重复添加输入。

## 9. 清空、删除和验收

### 9.1 区分三个操作

| 操作 | 含义 | 对持久化的影响 |
| --- | --- | --- |
| `assistant.evictChatMemory(id)` | 移除 AI Services 中的记忆实例缓存。 | 不删除外部存储；下次调用相同 ID 可以重新读取。 |
| `memory.clear()` | 调用存储的 `deleteMessages(id)`。 | 删除该存储管理的窗口；是否涉及完整历史取决于适配器。 |
| 产品中的“删除会话” | 删除会话及按产品约定应删除的关联数据。 | 需要业务事务与跨存储清理。 |

`getChatMemory(id)` 在实例不存在时可能返回 `null`。清空已持久化窗口时，应先校验权限并停止在途写入，再直接调用 `store.deleteMessages(id)`，然后移除实例缓存，不能只在实例存在时清空。实例释放行为见 [1.20.0 ChatMemoryService](https://github.com/langchain4j/langchain4j/blob/1.20.0/langchain4j/src/main/java/dev/langchain4j/service/memory/ChatMemoryService.java)。

当前 RuoYi AI 的 `ChatSessionServiceImpl#deleteWithValidByIds` 只删除 `chat_session`，初始化 SQL 没有为消息设置外键级联删除。虽然 `PersistentChatMemoryStore#deleteMessages` 可删除该会话消息，会话删除链路目前没有调用它。因此不能把“会话从列表消失”作为完整数据删除的证据。

开发清理功能时，应在权限校验后用事务处理会话和消息，同时处理窗口快照、`memoryCache`、摘要及按产品约定应删除的长期记忆/向量。跨 MySQL、Redis、向量库的操作需考虑重试，并阻止已删除会话的迟到流式回调重新写入。只清空快照却在下轮从旧历史重建，会把“已忘记”的内容再次带回来，需同时明确重建范围或设置记忆起点。

### 9.2 扩展完成后逐项验收

以下是开发后的验收清单，不是本页已完成的后端功能测试记录。

| 场景 | 应验证的行为 |
| --- | --- |
| 同会话两轮问答 | 第二轮包含首轮消息，当前问题只出现一次。 |
| 不同会话、用户、租户 | 上下文与存储查询都不会混入其他作用范围的数据。 |
| 重启服务 | 持久化窗口可恢复；仅 JVM 内存存储按预期丢失。 |
| 超出条数/Token 预算 | 旧消息移出窗口，完整历史仍可回看，当前问题不会意外消失。 |
| 系统消息、工具、多模态 | 系统消息位置正确，工具请求/结果配对，需要的内容能恢复。 |
| 关闭记忆 | 不注入历史；是否留档符合产品行为定义。 |
| 并发、流式失败与重试 | 顺序稳定，没有覆盖、半轮混入或重复输入。 |
| 清空或删除 | 不会从缓存、快照或历史重建出已清除内容。 |
| 摘要/长期记忆 | 摘要可追溯，旧偏好被更新，删除事实不再召回。 |

## 10. 常见问题与代码入口

### 10.1 遇到问题先查哪里

| 现象 | 优先检查 |
| --- | --- |
| 第二轮不知道上一轮说了什么 | 两轮是否同一 `sessionId`、首轮是否完成、数据库是否有消息、最终请求是否包含历史。 |
| 刷新后看得到消息，模型却不记得 | UI 恢复与模型上下文是两条链路；再查窗口淘汰、历史转换和请求组装。 |
| 修改 `max-messages` 没效果 | 当前版本尚未接线；接线后再查 profile、参数校验与实例缓存。 |
| 接入 AI Services 后消息丢失 | 是否误用了 `updateMessages()` 只打日志的原有存储；是否为每轮新建了内存 store。 |
| 多会话串话 | 是否共享单个 `.chatMemory(...)`、遗漏 `@MemoryId` 或 builder 的 `.id(id)`，以及存储 key 的作用范围。 |
| 消息重复或窗口越存越大 | 是否把快照当增量追加，或 Facade 与 AI Services 重复加入相同输入。 |
| `AsyncNotSupportedException` | 是否启用了异步调用，但 store/模型等仍只有同步实现。 |
| 删除后又能回忆旧内容 | 完整历史重建、快照、摘要、长期记忆、缓存和迟到的回调。 |

### 10.2 后端代码定位

下面路径均相对于**后端仓库 `ruoyi-ai`**，不是当前文档仓库。业务类主要位于 `ruoyi-modules/ruoyi-chat/src/main/java/org/ruoyi/`：

| 职责 | 文件或方法 |
| --- | --- |
| 依赖版本 | 根目录 `pom.xml`，以及 `ruoyi-common/ruoyi-common-chat/pom.xml`。 |
| 会话权限与入口 | `service/chat/impl/ChatServiceFacade.java` 中的 `sseChat`。 |
| 窗口构建与历史组装 | 同文件的 `createChatMemory`、`buildContextMessages`。 |
| 当前历史适配器 | `service/chat/impl/memory/PersistentChatMemoryStore.java`。 |
| 待接线配置 | `service/chat/impl/memory/ChatMemoryProperties.java`。 |
| 历史读写 | `service/chat/impl/ChatMessageServiceImpl.java` 中的 `getMessagesBySessionId`、`saveChatMessage`。 |
| 会话删除 | `service/chat/impl/ChatSessionServiceImpl.java` 中的 `deleteWithValidByIds`。 |
| 页面管理接口 | `/system/session`（会话）、`/system/message`（消息）。 |

阅读顺序建议从 `sseChat` 到 `buildContextMessages`，再看存储适配器与消息服务；先理解一次请求如何流动，再决定在哪一层扩展。

## 11. 示例工程与关键代码 {#key-code}

### 11.1 下载并运行

[下载 LangChain4j 1.20.0 记忆示例工程](/files/langchain4j-memory-1.20.0.zip)。解压后进入包含 `pom.xml` 的 `langchain4j-memory` 目录，准备 JDK 17+ 与 Maven：

```shell
mvn test
mvn -q compile exec:java "-Dexec.mainClass=example.memory.MemoryDemo"
```

源码也保存在文档仓库的 `examples/langchain4j-memory/`。与前文便于复制的独立代码块相比，下载工程为所有 Java 类加上了 `example.memory` 包名，因此运行命令要使用完整类名。

默认示例不需要 API Key。下面用四次独立进程验证“写入 → 重启读取 → 清空 → 再次读取”：

```shell
mvn -q compile exec:java "-Dexec.mainClass=example.memory.PersistenceDemo" "-Dexec.args=write"
mvn -q exec:java "-Dexec.mainClass=example.memory.PersistenceDemo" "-Dexec.args=read"
mvn -q exec:java "-Dexec.mainClass=example.memory.PersistenceDemo" "-Dexec.args=clear"
mvn -q exec:java "-Dexec.mainClass=example.memory.PersistenceDemo" "-Dexec.args=read"
```

预期消息数依次为 **2、2、0、0**，第一次读取还会打印含校验短语的原始消息。示例使用 H2 文件数据库，文件在运行目录下的 `data/`，四次命令应在同一目录顺序执行。

需要真实模型回复时，设置 `CHAT_BASE_URL`、`CHAT_API_KEY`、`CHAT_MODEL` 环境变量，再运行 `example.memory.ChatDemo`。该入口会向配置的 OpenAI 兼容服务发送两轮文本；详细配置和 MySQL 接入步骤见工程内的 `README.md`。

### 11.2 按职责查看关键代码

| 文件 | 重点阅读 |
| --- | --- |
| `MemoryAssistantFactory` | `@MemoryId` 和 `.id(id)` 如何共同保证独立窗口。 |
| `JsonChatMemoryStore` | 官方序列化器与窗口快照的覆盖语义。 |
| `JdbcSnapshotRepository` | 参数化查询、upsert 和删除，替换第 5 节中的存储接口。 |
| `MemoryConversationService` | 同步整轮串行执行、释放实例和清空快照。 |
| `DynamicMemoryFactory` / `TokenMemoryFactory` | 动态窗口与 Token 预算。 |
| `AsyncJsonChatMemoryStore` | 三个异步存储方法、执行器拒绝与错误传播。 |
| `PersistenceDemo` / `ChatDemo` | 磁盘持久化验证与真实模型调用入口。 |

下面直接展示配套工程的源文件，折叠块可展开复制。

::: details 会话隔离与 AI Services 装配
<<< @/../examples/langchain4j-memory/src/main/java/example/memory/MemoryAssistantFactory.java
:::

::: details JSON 快照存储
<<< @/../examples/langchain4j-memory/src/main/java/example/memory/JsonChatMemoryStore.java
:::

::: details JDBC 查询、覆盖与删除
<<< @/../examples/langchain4j-memory/src/main/java/example/memory/JdbcSnapshotRepository.java
:::

::: details 同步会话服务与清空
<<< @/../examples/langchain4j-memory/src/main/java/example/memory/MemoryConversationService.java
:::

::: details 动态条数与 Token 窗口
<<< @/../examples/langchain4j-memory/src/main/java/example/memory/DynamicMemoryFactory.java
:::

::: details 异步存储适配
<<< @/../examples/langchain4j-memory/src/main/java/example/memory/AsyncJsonChatMemoryStore.java
:::

### 11.3 接入前明确示例范围

`MemoryConversationService` 必须以单例复用，它的锁只协调经过同一个实例的同步调用；多副本与 SSE 需要按前文扩展串行控制。每轮结束后会释放实例缓存，下一轮从共享 store 读取，所以存储必须真正支持写入。

`clear(id)` 只清空窗口，完整聊天历史、摘要和长期记忆由业务逻辑处理。模型失败时可能已经保存用户输入，示例不自动回滚。异步适配器仅把阻塞操作提交给调用方管理的执行器，不会把 JDBC 变成非阻塞客户端；超时和取消也不保证 SQL 已停止。

数据库示例使用 H2 的 MySQL 兼容模式验证 JDBC SQL；接入实际 MySQL 时，仍需执行表结构迁移与集成验证。工程不实现自动摘要、跨会话事实抽取或向量召回，这些能力按第 7 节逐步开发。
