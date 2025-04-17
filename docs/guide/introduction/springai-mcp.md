# 关于 RuoYi AI

::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai) `2.0`版本的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。
- 如果你只是想体验一下，你可以查看[快速开始](/guide/introduction/roadmap)。

:::

## 
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
