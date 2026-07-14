---
outline: deep
---

# MCP 协议

::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai) 的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。

:::

## 概览

MCP（Model Context Protocol）用于标准化 AI 应用连接外部上下文、工具和资源的方式。RuoYi AI 中 MCP 能力已经合并到 [工具管理](./tools.md) 主线，本页保留协议说明和配置参考。

## 能力模型

| 能力 | 说明 |
| --- | --- |
| Tools | 模型可调用的函数或操作，例如文件读取、数据库查询。 |
| Resources | 可读取的上下文资源，例如文件、网页、知识条目。 |
| Prompts | 可复用提示词模板。 |

## RuoYi AI 中的 MCP 工具类型

| 类型 | 说明 |
| --- | --- |
| `LOCAL` | 本地 STDIO MCP Server。 |
| `REMOTE` | 远程 HTTP/SSE MCP Server。 |
| `BUILTIN` | 应用内置工具，不需要外部 MCP Server。 |

配置示例：

```json
{
  "name": "filesystem",
  "type": "LOCAL",
  "status": "ENABLED",
  "configJson": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "D:/workspace"]
  }
}
```

远程服务示例：

```json
{
  "name": "remote-search",
  "type": "REMOTE",
  "status": "ENABLED",
  "configJson": {
    "baseUrl": "http://localhost:8080/mcp"
  }
}
```

## 参考资料

- [Model Context Protocol Docs](https://modelcontextprotocol.io/docs)
- [LangChain4j MCP](https://docs.langchain4j.dev/tutorials/mcp)
