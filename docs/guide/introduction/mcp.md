

# 如何使用MCP

## 开启mcp客户端
application.yml中mcp.client.enabled改为true
```
spring:
  ai:
    openai:
      api-key: sk-xx
      base-url: https://api.pandarobot.chat/
    mcp:
      client:
        enabled: true
        name: ruoyi-ai-mcp
        sse:
          connections:
            server:
              url: http://127.0.0.1:8081
        stdio:
          servers-configuration: classpath:mcp-server.json
```
## 配置openai api-key
配置你的api-key,如果是openai官方key base-url可以不填
```
spring:
  ai:
    openai:
      api-key: sk-xx
      base-url: https://api.pandarobot.chat/
``` 
### 自定义model
如果不想通过配置方式加载模型如何自定义
```
        OpenAiApi openAiApi = OpenAiApi.builder()
                .apiKey("sk-kk")
                .baseUrl("https://api.pandarobot.chat/")
                .build();

        OpenAiChatModel openAiModel = OpenAiChatModel.builder()
                .openAiApi(openAiApi)
                .build();
```
如果想定义多个model需要关闭自动配置
```
 # Disable the chat client auto-configuration because we are using multiple chat models
spring:
  ai:
    chat:
      client:
        enabled: false
```

### 修改[mcp-server.json]
1. 配置fileSystem.command
- 将fileSystem.command改成你的npx本地安装路径
- 默认在"C:\\\\Program Files\\\\nodejs\\\\npx.cmd"目录


2. 指定fileSystem操作目录
- 默认配置是 "D:\\\\",可能会提示没有权限,可以D盘新建一个test目录
- 然后修改配置为"D:\\\\test\\\\",如果开启了MCP,那么配置的路径必须存在本地,如不存在会启动失败

3. 配置search1api.env.SEARCH1API_KEY 
- 申请地址：https://www.search1api.com/

#### 如何通过代码实现
``` java
    @Bean
    public McpSyncClient mcpClient(List<McpSyncClient> mcpSyncClients) {
        // 定义文件管理mcp工具
        // https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem
        var stdioParams = ServerParameters.builder("C:\\Program Files\\nodejs\\npx.cmd")
                .args("-y", "@modelcontextprotocol/server-filesystem", "D:\\test")
                .build();

        var mcpClient = McpClient.sync(new StdioClientTransport(stdioParams))
                .requestTimeout(Duration.ofSeconds(100)).build();

        var init = mcpClient.initialize();

        System.out.println("MCP Initialized: " + init);
        mcpSyncClients.add(mcpClient);
        return mcpClient;
    }
```
### 启动[ruoyi-mcp-server]
1. 运行ruoyi-mcp-server\src\main\java\org\ruoyi\mcpserve\RuoyiMcpServeApplication.java

### 工具调用


``` java
    @Value("${spring.ai.mcp.client.enabled}")
    private Boolean enabled;

    @Override
    public SseEmitter chat(ChatRequest chatRequest,SseEmitter emitter) {
        ChatModelVo chatModelVo = chatModelService.selectModelByName(chatRequest.getModel());
        openAiStreamClient = ChatConfig.createOpenAiStreamClient(chatModelVo.getApiHost(), chatModelVo.getApiKey());
        List<Message> messages = chatRequest.getMessages();
        if (enabled) {
            String toolString = mcpChat(chatRequest.getPrompt());
            Message userMessage = Message.builder().content("工具返回信息："+toolString).role(Message.Role.USER).build();
            messages.add(userMessage);
        }
        SSEEventSourceListener listener = new SSEEventSourceListener(emitter);
        ChatCompletion completion = ChatCompletion
                .builder()
                .messages(messages)
                .model(chatRequest.getModel())
                .stream(true)
                .build();
        openAiStreamClient.streamChatCompletion(completion, listener);
        return emitter;
    }

    public String mcpChat(String prompt){
        return this.chatClient.prompt(prompt).call().content();
    }
```
# MCP中文简介

MCP (Model Context Protocol) 是一个开放协议，用于标准化应用程序如何向 LLM 提供上下文。可以将 MCP 想象成 AI 应用程序的 USB-C 接口。就像 USB-C 为设备连接各种外设和配件提供标准化方式一样，MCP 为 AI 模型连接不同的数据源和工具提供了标准化的方式。


# 服务器开发

### WebFlux 服务器传输

完整的 MCP 服务器功能支持，基于 Spring WebFlux 的 `SSE`（Server-Sent Events）服务器传输，以及可选的 `STDIO` 传输。

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-mcp-server-webflux-spring-boot-starter</artifactId>
</dependency>
```

## 配置属性

所有属性都以 `spring.ai.mcp.server` 为前缀：

| 属性                           | 描述                         | 默认值         |
| :----------------------------- | :--------------------------- | :------------- |
| `enabled`                      | 启用/禁用 MCP 服务器         | `true`         |
| `stdio`                        | 启用/禁用 stdio 传输         | `false`        |
| `name`                         | 服务器名称，用于标识         | `mcp-server`   |
| `version`                      | 服务器版本                   | `1.0.0`        |
| `type`                         | 服务器类型（SYNC/ASYNC）     | `SYNC`         |
| `resource-change-notification` | 启用资源变更通知             | `true`         |
| `tool-change-notification`     | 启用工具变更通知             | `true`         |
| `prompt-change-notification`   | 启用提示变更通知             | `true`         |
| `sse-message-endpoint`         | 用于 Web 传输的 SSE 端点路径 | `/mcp/message` |

## 定义工具

该工具将定义为一个带有 `@Tool` 注解的方法。为了帮助模型理解何时调用此工具，我们将提供该工具功能的详细描述。

```java
    @Tool(description = "Get the current date and time in the user's timezone")
    String getCurrentDateTime() {
        return LocalDateTime.now().atZone(LocaleContextHolder.getTimeZone().toZoneId()).toString();
    }

```

# 客户端开发

标准 MCP 客户端

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-mcp-client-spring-boot-starter</artifactId>
</dependency>

```

### 通用属性

常见的属性以 `spring.ai.mcp.client` 为前缀：

| 属性                       | 描述                                                         | 默认值                 |
| :------------------------- | :----------------------------------------------------------- | :--------------------- |
| `enabled`                  | 启用/禁用 MCP 客户端                                         | `true`                 |
| `name`                     | MCP 客户端实例的名称（用于兼容性检查）                       | `spring-ai-mcp-client` |
| `version`                  | MCP 客户端实例的版本                                         | `1.0.0`                |
| `initialized`              | 是否在创建时初始化客户端                                     | `true`                 |
| `request-timeout`          | MCP 客户端请求的超时时间                                     | `20s`                  |
| `type`                     | 客户端类型（SYNC 或 ASYNC）。所有客户端必须为同步或异步，不支持混合类型 | `SYNC`                 |
| `root-change-notification` | 启用/禁用所有客户端的根变更通知                              | `true`                 |

### Stdio 传输属性

标准 I/O 传输的属性前缀为 `spring.ai.mcp.client.stdio`：

| 属性                         | 描述                                   | 默认值 |
| :--------------------------- | :------------------------------------- | :----- |
| `servers-configuration`      | 包含 MCP 服务器配置的资源，格式为 JSON | -      |
| `connections`                | 命名的 stdio 连接配置的映射            | -      |
| `connections.[name].command` | 为 MCP 服务器执行的命令                | -      |
| `connections.[name].args`    | 命令参数列表                           | -      |
| `connections.[name].env`     | 服务器进程的环境变量映射               | -      |

## 功能演示
![26](/guide/image/26.png)


参考文档：

- springai-mcp中文文档
https://springdoc.tech/spring-ai/

- mcp中文文档
https://mcpcn.com/docs/examples/


