---
outline: deep
---

# 工具管理

::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai) 的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。

:::

## 概览

工具管理负责把外部能力暴露给模型或智能体调用。RuoYi AI 当前支持三类工具：

| 类型 | 说明 | 示例 |
| --- | --- | --- |
| `BUILTIN` | 内置 Java 工具，通常由 `@Tool` 注解暴露。 | 文件读取、目录列表、文件编辑。 |
| `LOCAL` | 本地 STDIO MCP 工具，通过命令启动本地 MCP Server。 | `npx -y @modelcontextprotocol/server-filesystem` |
| `REMOTE` | 远程 HTTP/SSE MCP 工具。 | 企业内部 MCP 服务、第三方工具服务。 |

核心入口是 `ToolProviderFactory`，它整合内置工具和 LangChain4j MCP 工具提供者，供对话服务和智能体统一使用。

## Function Calling 原理

Function Calling 的基本过程如下：

```text
1. 应用把工具名称、描述、参数 schema 提供给模型
2. 模型判断是否需要调用工具
3. 模型返回工具名和参数
4. 应用执行工具
5. 应用把工具结果放回上下文
6. 模型基于工具结果生成最终回复
```

关键点：

| 项目 | 说明 |
| --- | --- |
| 工具描述 | 决定模型是否知道何时调用工具。 |
| 参数描述 | 决定模型能否构造正确参数。 |
| 执行边界 | 工具执行在应用侧完成，模型不直接访问系统资源。 |
| 结果注入 | 工具返回值需要再次交给模型总结或继续推理。 |

## 内置工具

内置工具位于 `org.ruoyi.mcp.tools`：

| 工具 | 说明 |
| --- | --- |
| `ReadFileTool` | 读取文件内容。 |
| `ListDirectoryTool` | 列出目录内容。 |
| `EditFileTool` | 编辑文件。 |

内置工具通常实现 `BuiltinToolProvider`，由 `BuiltinToolRegistry` 扫描注册。

截图占位：内置工具列表页，建议放置在 `/images/tools/builtin-tools.webp`。

## 本地 MCP 工具

本地工具通过 STDIO 启动 MCP Server，适合封装命令行能力和本机资源。

配置示例：

```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "D:/workspace"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

注意事项：

- `command` 必须是服务端可执行命令。
- 文件系统类工具要限制可访问目录。
- 环境变量不要明文暴露给普通用户。
- 本地工具异常时会被健康检查和失败次数机制处理。

## 远程 MCP 工具

远程工具通过 HTTP/SSE 连接 MCP Server。

配置示例：

```json
{
  "baseUrl": "http://localhost:8080/mcp"
}
```

RuoYi AI 使用 `StreamableHttpMcpTransport` 和 `StdioMcpTransport` 创建 MCP Client，再通过 `McpToolProvider` 转换为 LangChain4j 可用的 `ToolProvider`。

截图占位：远程 MCP 工具配置页，建议放置在 `/images/tools/remote-mcp.webp`。

## 工具市场占位

`McpMarketController` 已提供市场管理接口，可用于拉取外部工具清单并加载到本地。

预留页面：

| 页面 | 说明 |
| --- | --- |
| MCP 工具管理 | 本地工具启停、测试、编辑、删除。 |
| MCP 市场管理 | 配置市场源、刷新工具、批量加载。 |
| 工具调用日志 | 查看工具调用参数、结果、耗时和错误。 |

## 参考资料

- [Model Context Protocol](https://modelcontextprotocol.io/docs)
- [LangChain4j Tools](https://docs.langchain4j.dev/tutorials/tools)
- [LangChain4j MCP](https://docs.langchain4j.dev/tutorials/mcp)
