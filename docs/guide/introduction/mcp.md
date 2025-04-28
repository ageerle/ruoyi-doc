

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

