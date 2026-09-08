---
outline: [2, 3]
description: 从 MCP 概念、LOCAL 与 REMOTE 配置到魔搭 ModelScope 接入，结合 RuoYi AI 源码完成工具调用、故障定位与开发扩展。
---

# MCP 管理

RuoYi AI 的 MCP 管理支持接入本地或远程工具服务、测试连接，并将工具关联到智能体。智能体可以通过这些工具完成网页抓取、搜索、文件读取或业务查询，具体能力由所接入的服务提供。

MCP（Model Context Protocol，模型上下文协议）规定了 AI 应用发现和使用外部能力的统一方式。提供这些能力的服务称为 **MCP Server**。当前 RuoYi AI 主要接入其中的工具（Tools）能力；Resources 和 Prompts 的概念与接入范围见第 1 节。

本页先解释 MCP 的基本概念和接入方式，再通过本地文件工具与魔搭服务介绍配置、验证和开发扩展。工具列表和内置工具说明见[工具管理](./tools.md)，模型配置见[模型管理](./model.md)，智能体基础配置见[智能体管理](./agent.md)。

| 你现在要做什么 | 从这里开始 |
| --- | --- |
| 第一次接触 MCP，想知道它与模型、API 的关系 | [1. 理解 MCP](#concepts) |
| 后端已运行，希望先接通一个服务 | [3. LOCAL 接入实战](#local) |
| 使用魔搭上的 MCP 服务 | [4. ModelScope 接入实战](#modelscope) |
| 已测试成功，但对话没调用工具 | [5. 绑定与验收](#verification)、[9. 排障](#troubleshooting) |
| 想读懂源码或接入公司自己的业务 | [6. 源码调用链](#source)、[8. 开发扩展](#extensions) |

::: info 本文对应的实现范围
依据当前 `ruoyi-ai/ruoyi-modules/ruoyi-chat` 源码及 `ruoyi-admin/apps/web-antd` 管理端核对。后端 Maven 配置为 LangChain4j `1.17.2`，MCP 模块使用 `1.17.2-beta27`。第三方页面于 **2026-09-08** 核对；服务供应方、鉴权方式和有效期应以接入时页面为准。

下面将当前可直接配置的能力与需要修改后端的扩展分别说明。已有截图用于定位界面，记录数量、服务名称和配置回显不作为当前运行环境的保证。
:::

## 1. 先理解 MCP，再填写配置 {#concepts}

### 1.1 模型、Host、Client、Server 各自做什么

假设用户问：“读取指定文件，把第一行告诉我。”模型可以判断需要读取文件，但真正打开文件的是工具程序。

| 概念 | 职责 | 在本项目中的对应物 |
| --- | --- | --- |
| 大模型 | 理解问题，选择工具名和参数，根据结果组织回答 | 智能体使用的聊天模型，需要支持工具调用 |
| MCP Host | 管理用户会话、模型和工具使用流程的 AI 应用 | RuoYi AI 后端的智能体对话能力 |
| MCP Client | 与 Server 建立协议连接，发现工具并发起调用 | `DefaultMcpClient` |
| MCP Server | 描述自己的能力，接收请求并执行操作 | 文件系统进程、魔搭托管服务、自建业务服务 |
| Transport | 负责 Client 与 Server 之间如何传递消息 | `StdioMcpTransport` 或 `StreamableHttpMcpTransport` |
| ToolProvider | 将工具定义与执行器提供给 LangChain4j 的适配入口 | `McpToolProvider`，以及项目合并后的统一提供者 |

**浏览器负责发起对话和展示结果，连接 MCP 的位置是后端。** `LOCAL` 中的“本地”指后端所在机器或容器；魔搭 Hosted 服务中的文件、依赖和环境则属于远程运行环境。

这些角色沿用 [MCP 官方架构](https://modelcontextprotocol.io/docs/learn/architecture)。`ToolProvider` 是 LangChain4j 的集成概念，不是 MCP 协议中的新角色。

### 1.2 Tools、Resources、Prompts 的区别

| 能力 | 可以怎样理解 | 例子 | 当前 RuoYi AI 接入情况 |
| --- | --- | --- | --- |
| Tools | 可以执行的函数 | `fetch(url)`、查询订单状态 | 主要接入能力，装配给智能体调用 |
| Resources | 可以读取的上下文数据 | 文档、配置、资源 URI 对应的内容 | SDK 与监听器有相关能力，当前管理页面没有独立配置与消费流程 |
| Prompts | Server 提供的可复用提示词模板 | 代码审查模板、报告模板 | 当前没有独立的 MCP Prompt 选择、拉取和注入流程 |

一个 Server 可以同时提供这三类能力，只提供工具也可以接入。MCP 的 Prompts 与智能体表单中的系统提示词是两个配置来源，新增 Server 不会自动覆盖智能体提示词。

### 1.3 MCP 与 Function Calling、HTTP API 的关系

- **Function Calling / Tool Calling**：模型输出“调用哪个函数、参数是什么”。
- **MCP**：应用如何发现工具、连接提供工具的服务、调用工具并拿到结果。
- **业务 HTTP API**：工具内部可能调用的接口，例如库存系统的查询接口。

三者可以串在一起：模型选择库存工具，RuoYi AI 通过 MCP 发起调用，MCP Server 再请求库存 API。把普通 REST URL 填进 `baseUrl`，不会自动把它转换成 MCP 服务。

一个工具通常会声明 `name`、`description` 和参数的 JSON Schema。下面是教学示意，并非需要填入管理端的配置：

```json
{
  "name": "get_inventory",
  "description": "按商品编码查询可用库存，不能下单或扣减库存",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sku": { "type": "string", "description": "商品编码，例如 DEMO-001" }
    },
    "required": ["sku"]
  }
}
```

`description` 帮助模型判断何时使用工具，`inputSchema` 描述参数。**管理页的“工具描述”主要用于管理；模型实际看到的外部函数说明来自 Server 的工具定义。** 仅修改管理页描述，不会重写 Server 的 schema。

### 1.4 一条工具记录不一定只代表一个函数

`mcp_tool` 中的一条 `LOCAL` 或 `REMOTE` 记录代表一个 Server 连接。一个文件系统 Server 可能提供读文件、列目录、写文件等多个函数。

智能体的 `mcpToolIds` 保存的是这些**记录 ID**，不是 Server 内部函数名。当前装配代码没有配置单个 Server 的函数白名单；选择一个 Server 后，会通过它的 ToolProvider 提供所发现的工具。只想开放查询能力时，应使用只提供查询工具的 Server，或开发服务端/提供者过滤逻辑。

## 2. 接入前的选择与准备 {#preparation}

### 2.1 三种类型如何选

| 类型 | 适用场景 | 运行方式 | 当前配置入口 |
| --- | --- | --- | --- |
| `BUILTIN` | 已有 Java 工具，或在项目内新增简单能力 | JVM 内直接执行 `@Tool` 方法，不经过 MCP 网络协议 | 由注册表和初始化器同步；不能在管理端新建为 BUILTIN |
| `LOCAL` | 后端可安装的 Node.js / Python MCP 包或自编程序 | 后端启动子进程，通过 stdin/stdout 通信 | `command`、`args` |
| `REMOTE` | 魔搭 Hosted、自建远程 MCP、其他平台兼容服务 | 后端连接 Streamable HTTP 端点 | `baseUrl` |

远程服务若只能使用旧式 **HTTP+SSE transport**，当前 `REMOTE` 分支不能仅靠改 JSON 直接切换。Streamable HTTP 自身也可能返回 SSE 数据流，不能用“响应是不是 `text/event-stream`”判断是否为旧协议。协议差异见 [MCP 传输层说明](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)。

### 2.2 准备好这四项

1. 按[本地安装](../getting-started/install.md)启动后端、管理端和用户端。
2. 配好一个支持工具调用的聊天模型，并完成普通对话验证。模型测试成功仅证明基本连接可用。
3. 管理账号具有 MCP 工具新增、查询、测试权限，并能编辑智能体。接口权限见[第 7 节](#api)。
4. 在**后端服务账户和运行环境**中准备命令或网络：LOCAL 需要解释器、依赖和目录；REMOTE 需要 DNS、TLS 和目标服务可达。

### 2.3 配置信息的填写规则

进入 **MCP 管理 → MCP 工具管理 → 新增**：

| 表单字段 | 填写规则 |
| --- | --- |
| 工具名称 | 为连接起一个便于区分的名字，例如 `filesystem-demo`、`modelscope-fetch`；不需要等于服务内部函数名 |
| 工具描述 | 说明用途、运行环境和维护者，便于管理时区分 |
| 工具类型 | 本地工具 `LOCAL` 或远程工具 `REMOTE` |
| 状态 | 首次联调选启用，后端值为 `ENABLED`；禁用值为 `DISABLED` |
| 配置信息 | 一个合法 JSON 对象；不要包含注释、尾逗号或最外层 `mcpServers` |

::: tip 编辑时配置框为空是正常行为
当前连接配置采用**只写不回显**策略。列表、详情、导出和选项接口不返回原始 `configJson`。修改时留空会保留原配置，填写新 JSON 会替换原配置；提交 `{}` 不是“保留”，而是用空对象替换。当前管理端编辑时也不能切换工具类型，需要另一种类型时新建对应连接。
:::

<img src="/images/mcp/runtime/mcp-tool-overview.png" alt="MCP 工具管理列表，可在此新增、测试和管理连接" width="1440" height="1000" loading="lazy" style="height: auto;" />

## 3. LOCAL 实战：让智能体读取一个测试文件 {#local}

本例使用 MCP 文件系统 Server。它会暴露多种文件工具，因此只给它一个专门的演示目录。完成后应能读到自己写入的标记，而不是只看到“连接成功”。

### 3.1 在后端机器准备目录与运行环境

以下 Windows PowerShell 示例假设后端仓库位于 `D:/Project/github/ruoyi-ai`。路径不同就统一替换：

```powershell
node --version
npx --version
New-Item -ItemType Directory -Force D:/Project/github/ruoyi-ai/workspace/mcp-demo
Set-Content -LiteralPath D:/Project/github/ruoyi-ai/workspace/mcp-demo/hello.txt -Value 'RUOYI_MCP_DEMO_20260908' -Encoding utf8
```

首次使用 `npx` 会下载包，需要后端网络可以访问 npm 源。Node.js 版本应满足所选 Server 的要求。演示验证后，在部署配置中固定已验证的包版本，避免每次启动使用不同版本。

Linux 或容器环境使用该环境内部的绝对路径，例如 `/app/workspace/mcp-demo`；宿主机的 Windows 路径不能直接给容器内进程使用。

### 3.2 新增 LOCAL 记录

名称填写 `filesystem-demo`，类型选“本地工具”，状态选“启用”，配置信息填写：

```json
{
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "D:/Project/github/ruoyi-ai/workspace/mcp-demo"
  ]
}
```

目录参数传给文件系统 Server，用来指定允许访问的目录。不同 Server 的 `args` 不同，应根据其发布说明填写。该包的参数说明见 [MCP 文件系统 Server 源码](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)。

| 字段 | 后端怎样使用 | 常见错误 |
| --- | --- | --- |
| `command` | 作为进程可执行文件，先执行一次 `command --version` 检查 | 把整条命令写成 `npx -y 包名` |
| `args` | 逐项追加为参数列表 | 把全部参数写成一个字符串，或人为增加 shell 引号 |
| 路径参数 | 交由 Server 解释 | 填写浏览器所在电脑的路径、相对路径或容器外路径 |

路径含空格时，一个 JSON 数组元素就是一个参数，不需要再在字符串内部嵌套引号。JSON 中 Windows 路径可以使用 `/`，或将反斜杠写成 `\\`。

<img src="/images/mcp/runtime/mcp-local-config.png" alt="LOCAL 表单配置示意；当前编辑接口不回显已保存配置" width="1440" height="1000" loading="lazy" style="height: auto;" />

### 3.3 测试连接，再执行实际读取

1. 保存记录，在列表中点击该行的 **测试**。
2. 若连接失败，先在后端机器运行同样的命令检查包能否启动：

   ```powershell
   npx -y @modelcontextprotocol/server-filesystem D:/Project/github/ruoyi-ai/workspace/mcp-demo
   ```

   STDIO 服务启动后等待协议输入是正常现象。检查完用 `Ctrl+C` 退出；实际接入时后端会自行启动进程，不需要保留这个手动实例。

3. 在智能体的 **关联工具** 中选择 `filesystem-demo`，保存并在用户端选中该智能体。
4. 发送下面的问题，核对是否返回文件中的标记：

   ```text
   请使用文件系统工具，读取 D:/Project/github/ruoyi-ai/workspace/mcp-demo/hello.txt，
   只返回第一行。如果读取失败，请说明失败，不要猜测内容。
   ```

5. 按[第 5 节](#verification)核对工具实际执行的证据；不要只看最终自然语言答案。

<img src="/images/mcp/runtime/mcp-local-test-success.png" alt="已有 LOCAL 服务的连接测试界面示例" width="1440" height="1000" loading="lazy" style="height: auto;" />

截图中的 `bing-cn-mcp-server` 是另一条 LOCAL 记录，用于展示测试入口，不是上述文件系统教程的运行结果。

### 3.4 Windows、环境变量和进程输出

当前 `resolveCommand()` 对裸命令 `npx/npm/node/pnpm/yarn/uv/uvx` 自动追加 `.cmd`。这只是当前代码的处理规则，**不保证这些程序都实际安装为 `.cmd`**。例如 `node`、`uv` 常见安装物是 `.exe`；找不到 `node.cmd` 或 `uv.cmd` 时，使用实际可执行文件的绝对路径，如 `C:/Program Files/nodejs/node.exe`，并确认后端账户能够执行它。

配置中的 `env` **当前不会被 `createStdioClient()` 读取**。需要环境变量的服务，先确认后端启动环境已有对应变量，或按[扩展配置传递](#transport-extension)增加显式支持。不能照搬第三方客户端 JSON 后就假设 `env` 生效。当前还会用 `ChildProcessSecretSanitizer` 遮蔽子进程继承的 `DEEPSEEK_API_KEY`；不要依赖后端模型密钥透传给 MCP。

STDIO 的 stdout 用于协议消息。自行开发 Server 时，把普通日志写到 stderr；不要把欢迎语、调试 `print()` 或进度条混进 stdout。

## 4. 第三方平台实战：接入魔搭 ModelScope {#modelscope}

### 4.1 先区分魔搭的三个入口

从[魔搭首页](https://www.modelscope.cn/home)进入 [MCP 广场](https://www.modelscope.cn/mcp)。与本页任务有关的入口如下：

| 入口 | 用来做什么 | 与 RuoYi AI 的关系 |
| --- | --- | --- |
| 模型库 / 模型推理服务 | 选择模型、使用模型 API | 配置到模型管理，提供模型推理能力 |
| MCP 广场 | 查找工具服务，查看文档、参数和连接配置 | 获取 Server 地址或启动命令，配置到 MCP 工具管理 |
| MCP 实验场 | 在平台内组合模型和 MCP 进行对话体验 | 可辅助检查服务本身是否可用；不会自动同步到 RuoYi 的智能体 |

**使用魔搭 MCP 不要求同时使用魔搭模型。** RuoYi AI 中已配置且支持工具调用的模型，可以配合兼容的魔搭 MCP 服务。

### 4.2 选一个便于验证的服务

本例使用 [Fetch 网页内容抓取](https://www.modelscope.cn/mcp/servers/@modelcontextprotocol/fetch)。它的输入是网页 URL，主要工具是 `fetch`，可以将网页内容提取为适合模型处理的文本。

在服务详情中依次确认：

1. **来源与用途**：查看维护者、源码仓库、工具说明，确认功能与需求一致。
2. **服务类型**：Hosted 表示可使用平台提供的远程服务；Local 通常提供本地安装配置。最终以“服务配置”里的实际可选连接方式为准。
3. **传输类型**：本项目直接接入远程服务时选 **Streamable HTTP**。
4. **鉴权与有效期**：确认是否要求 token/header，以及地址何时失效。
5. **工具参数**：查看“工具测试”或服务说明，了解必填字段。

本次核对时，Fetch 页面显示 `Remote` / `Stdio` 配置入口，Remote 默认传输类型为 **Streamable HTTP**，显示“无鉴权”“24小时有效”和“连接”按钮。这是该服务在核对时的页面状态，不代表所有魔搭服务永久免鉴权或统一为 24 小时有效。

::: tip Hosted 与 LOCAL 的取舍
Hosted 减少在 RuoYi 后端安装依赖的工作，适合接入远程搜索、网页抓取等能力。需要读取后端私有目录、访问内网业务或控制自己的运行环境时，使用 LOCAL 或自建可达的 REMOTE 服务。远程 Fetch 不能因此读取你的本机文件。
:::

### 4.3 登录并取得自己的连接配置

1. 登录自己的魔搭账号，打开目标服务详情。
2. 在 **服务配置 → Remote** 选择 **Streamable HTTP**。
3. 按页面要求填写该服务的配置。如果需要上游服务 Key，应使用该服务要求的凭证；魔搭账号 token、模型 API Key 和上游业务 Key 不应混用。
4. 点击 **连接**，按实际页面获取自己的 Remote URL 或客户端配置。若页面要求开通服务或部署，完成其提示的准备后再获取地址。
5. 记录地址有效期，并在安全位置保管完整配置。下列示例全部使用占位地址，没有包含真实连接凭证。

魔搭可能给出这类客户端配置：

```json
{
  "mcpServers": {
    "fetch": {
      "type": "streamable_http",
      "url": "https://mcp.api-inference.modelscope.net/YOUR_CONNECTION_ID/streamable_http"
    }
  }
}
```

这里的 `type` 是第三方客户端的传输类型声明。RuoYi AI 的管理表单已经选择了 `REMOTE`，配置信息中要把内层的 **`url` 值转换为 `baseUrl`**：

```json
{
  "baseUrl": "https://mcp.api-inference.modelscope.net/YOUR_CONNECTION_ID/streamable_http"
}
```

用实际复制的完整地址替换占位值。**不要凭示例拼接 ID，也不要把 `/sse` 手工改名为 `/streamable_http`**；只有平台实际提供对应协议端点才可使用。魔搭官方 SDK 也区分这两种连接配置，见 [ModelScope MCP API 源码](https://github.com/modelscope/modelscope/blob/master/modelscope/hub/mcp_api.py)。

::: warning 专属连接地址也可能是凭证
魔搭页面提示 Hosted Remote URL 为专属敏感地址。“无鉴权”不代表可以公开共享该地址。不要把真实 URL 放进 Git、截图、问题反馈或模型提示词；这里只在受控的后端连接配置中保存它。
:::

### 4.4 保存到 RuoYi AI 并触发网页抓取

在 **MCP 工具管理 → 新增** 中填写：

| 字段 | 本例填写内容 |
| --- | --- |
| 工具名称 | `modelscope-fetch` |
| 工具描述 | `通过魔搭 Fetch 获取公开网页内容` |
| 工具类型 | 远程工具（`REMOTE`） |
| 状态 | 启用 |
| 配置信息 | 上一步转换后的 `{"baseUrl":"实际地址"}` |

<img src="/images/mcp/runtime/mcp-remote-form.png" alt="REMOTE 新增表单示意；图中 example.com 为占位地址" width="1440" height="1000" loading="lazy" style="height: auto;" />

保存后点击 **测试**。测试通过后，将它绑定到智能体，在用户端用该智能体发送：

```text
请使用 Fetch 工具抓取 https://example.com/ 的内容，
告诉我页面标题并摘取一句原文。若工具失败，直接报告失败，不要凭已有知识作答。
```

这个页面通常返回 “Example Domain”，适合检查最基本的请求；最终仍要核对服务执行记录，不能以模型知道这个标题就判定工具调用成功。真实业务验收可以换成自己控制的、包含新标记的公开测试页面。

在魔搭的 **工具测试** 中也可使用同一 URL，参数示例为：

```json
{
  "url": "https://example.com/",
  "max_length": 1000,
  "start_index": 0,
  "raw": false
}
```

先在平台测试，再在 RuoYi 测试，有助于区分服务问题与集成问题。[MCP 实验场](https://www.modelscope.cn/mcp/playground)还可以验证模型与服务组合，但它使用的平台会话、模型和网络不等于 RuoYi 后端环境。

### 4.5 第三方配置怎样转换

| 第三方提供的配置 | RuoYi AI 中怎样使用 |
| --- | --- |
| `mcpServers` 下有多个 Server | 每个 Server 分别新增一条记录，不把整个字典贴进 `configJson` |
| Streamable HTTP 的 `url` | 新增 `REMOTE`，改为 `baseUrl` 字段 |
| Stdio 的 `command` / `args` | 新增 `LOCAL`，取出这两个字段；依赖要安装在后端环境 |
| 只有旧式 SSE 地址 | 当前无法直接选择 SSE transport；寻找平台的 Streamable HTTP 配置，或按第 8 节扩展 |
| 包含 `headers` / Bearer token | 当前 REMOTE 构造没有读取 headers，粘贴不会生效；需要可信网关或后端扩展 |
| 包含 `env` | 当前 LOCAL 构造忽略它；需准备后端进程环境或扩展环境变量传递 |
| 包含 `timeout`、`cwd` 等字段 | 当前服务没有解析这些字段，不会自动生效 |

只有 LOCAL 配置时，可以选服务配置中的 `Stdio` 方案。例如 Fetch 发布说明给出 `python -m mcp_server_fetch` 的启动方式：安装依赖后，将实际 Python 路径作为 `command`，将 `-m`、`mcp_server_fetch` 分别作为 `args`。具体包版本和额外配置按服务说明处理。

### 4.6 地址过期与常见误用

- 连接曾经成功、后来失败：先查看平台连接是否过期、服务是否停止或额度是否耗尽，再更新 RuoYi 中的完整 `baseUrl`。
- 更新地址时：编辑连接，在空白配置框粘贴完整新 JSON 并保存，然后重新测试。留空只会保留旧地址。
- 复制的是模型推理 URL、魔搭主页或服务详情 URL：这些不是 MCP 协议端点，不能填写为 `baseUrl`。
- 将魔搭首页或 `/mcp` 填进 RuoYi 的 **MCP 市场 URL**：当前市场服务只解析指定结构的 JSON 清单，没有对魔搭网页做适配。单个服务请使用工具管理；批量目录适配见[第 7 节](#market)。

本教程核对了公开页面与代码配置方式，未使用私人账号生成连接，也未宣称魔搭账号下的完整模型对话已在本次环境中跑通。

## 5. 绑定智能体与分层验收 {#verification}

### 5.1 绑定后还要选择正确的智能体

1. 打开 **智能体管理 → 智能体列表 → 新增/编辑**。
2. 配置可用的聊天模型，在 **关联工具** 中勾选刚创建的连接。
3. 保存智能体，在用户端对话中选择这个智能体，再发送能触发工具的具体问题。
4. 首次验证只绑定当前任务必需的工具，避免多个相似工具让路由和排障变得复杂。

<img src="/images/mcp/runtime/mcp-agent-binding.png" alt="在智能体关联工具中选择所需连接" width="1440" height="1000" loading="lazy" style="height: auto;" />

当前选项请求为 `GET /mcp/tool/options`，只返回已启用工具的公开元数据。`GET /mcp/tool/all` 是管理用列表接口，两者权限不同。不能看见工具时，先检查工具状态、当前租户及智能体表单权限。

### 5.2 保存成功、连接成功、执行成功分别证明什么

| 层次 | 验证方法 | 能证明什么 |
| --- | --- | --- |
| 1. 配置保存 | 保存后列表存在该记录 | 记录已写入，不代表外部服务可连接 |
| 2. 连接测试 | 点击测试，检查 `data.success` | 后端能构建 MCP Client 并完成初始化连接路径 |
| 3. 工具发现与执行 | 平台工具测试、MCP 调试客户端或服务端执行记录 | 目标函数存在，参数有效，业务逻辑确实返回结果 |
| 4. 智能体端到端调用 | 选中智能体，发送问题，核对实际调用与答案 | 模型、绑定、路由、工具和结果回填共同工作 |

当前 `testMcpTool()` 成功时填入的 `toolCount = 1` 和 `tools = [记录名称]` 是服务层构造的结果，**不是远程 `tools/list` 返回的真实函数数量和名称**。测试实现也没有执行一次业务 `tools/call`。

### 5.3 怎样确认不是模型猜出来的

使用可核对的输入：自己的文件标记、自建只读服务中的样例数据，或自己控制的公开测试页面。同时查看 MCP Server 日志、平台执行记录或实际接入的追踪信息，确认函数、结果状态和时间一致。

不要把前端必须出现 `event=mcp` 当作当前实现的验收条件。`MyMcpClientListener` 虽有事件转换逻辑，但当前 `createStdioClient()` / `createRemoteClient()` 的 Client Builder 没有显式注册它；默认 Bean 也未携带会话 ID。没有该 SSE 事件本身不能证明工具没执行，具体原因见[观测扩展](#observability)。

::: tip 智能体路由也参与决定是否调用
当前 `ChatServiceFacade.handleAgentChat()` 把显式选择的工具交给 `WebSearchAgent`，再由 Supervisor 编排。保存绑定不会强制每次对话都调用工具。业务类型与搜索子 Agent 的定位不符时，除了工具描述，还需要调整子 Agent 职责和路由提示；普通模型聊天分支也不会自动装配智能体的 `mcpToolIds`。

文件或库存任务未被调度时，具体代码改法见[业务工具路由扩展](#agent-routing)。首次只想体验无需调整角色定位的第三方接入，可以先使用第 4 节的网页抓取示例。
:::

### 5.4 在 IDE 中确认本次对话真正执行了 MCP

没有现成平台执行记录时，开发环境可以直接用断点取证，不需要开启全部协议日志：

以下 MCP Client 断点适用于 **LOCAL / REMOTE**。验证 BUILTIN 时，应在对应的 `@Tool` 方法设置断点，例如 `ReadFileTool.readFile()` 或本页的 `InventoryDemoTool.query()`；Java 内置工具不会经过 `DefaultMcpClient.executeTool()`。

1. 用 IDE 的 **Debug** 模式启动后端，在 `ChatServiceFacade.handleAgentChat()` 请求 `getToolProvider()` 的位置设置断点。发送一次智能体问题，核对 `agentVo.getMcpToolIds()` 包含目标记录 ID。
2. 在 `LangChain4jMcpToolProviderService.getToolProvider()` 查询后的代码设置断点，确认该 ID 对应启用记录；再检查 `buildToolProvider()` 中是否成功加入 Client。
3. 在 IDE 的外部依赖中打开 `dev.langchain4j.mcp.client.DefaultMcpClient`。项目使用的 SDK 提供 `executeTool(ToolExecutionRequest, InvocationContext)`；在这个重载内部设置断点，并恢复运行。仅执行 `listTools()` 不能证明业务工具被调用。
4. 当工具执行断点命中时，在 Variables 中核对请求的函数名、参数和调用栈。例如文件工具的路径应指向测试文件；库存工具应为 `get_inventory`，参数包含 `sku`。
5. 单步执行到方法返回，检查 `ToolExecutionResult` 中的内容与实际文件或样例数据相符，再继续观察最终答案。若出现异常，沿当前调用栈定位传输错误或 Server 业务错误。

断点停留太久可能触发请求超时，应只在自己的开发实例上使用。这样的证据证明的是**这一次 RuoYi 对话**调用了工具；在另一个客户端里单独测试成功，只能证明 Server 侧功能可用。

## 6. 对照后端源码理解调用链 {#source}

以下路径均相对 **`ruoyi-ai/ruoyi-modules/ruoyi-chat/src/main/java/org/ruoyi/`**。代码节选用于解释现有逻辑，不需要复制到项目中再次新增一遍。

### 6.1 从管理记录到模型工具

| 顺序 | 类 / 方法 | 做了什么 |
| --- | --- | --- |
| 1 | `controller/mcp/McpToolController` | 接收工具新增、编辑、列表、测试等请求 |
| 2 | `service/mcp/impl/McpToolServiceImpl` | 维护 `mcp_tool`，限制 BUILTIN 修改，处理只写配置和连接刷新 |
| 3 | `service/chat/impl/ChatServiceFacade.handleAgentChat()` | 读取智能体的 `mcpToolIds`，向工具服务请求提供者 |
| 4 | `mcp/service/core/LangChain4jMcpToolProviderService.getToolProvider()` | 去重 ID，只查询启用记录，按请求 ID 顺序装配 |
| 5 | `buildToolProvider()` | BUILTIN 转为 Java 工具，LOCAL / REMOTE 创建或复用 MCP Client |
| 6 | `combineToolProviders()` | 合并内置工具与 `McpToolProvider` 发现的外部工具 |
| 7 | `WebSearchAgent` 与 LangChain4j 工具执行链 | 将工具说明交给模型，执行模型选择的调用，回填结果 |

`ToolProviderFactory` 也提供“所有已启用工具”等封装方法，但**当前智能体对话分支直接调用 `LangChain4jMcpToolProviderService`**，不是经过工厂自动注入全部工具。方法存在不代表每条对话链路都会调用它。

### 6.2 智能体绑定怎样生效

`ChatServiceFacade` 的关键逻辑：

```java
ToolProvider toolProvider = null;
if (agentVo != null && agentVo.getMcpToolIds() != null
        && !agentVo.getMcpToolIds().isEmpty()) {
    toolProvider = langChain4jMcpToolProviderService
        .getToolProvider(agentVo.getMcpToolIds());
}

var searchAgentBuilder = AgenticServices.agentBuilder(WebSearchAgent.class)
    .chatModel(plannerModel)
    .listener(new MyAgentListener());
if (toolProvider != null) {
    searchAgentBuilder.toolProvider(toolProvider);
}
```

因此，新增工具不会自动授予所有智能体使用权；绑定 ID 对应记录被禁用时，后续装配会过滤它。这里说的是 `mcpToolIds` 这一路配置工具，不能据此推断 Supervisor 中其他子 Agent 的独立 Java 工具也受同一个列表控制。

### 6.3 LOCAL 与 REMOTE 的构造位置

`createStdioClient()` 解析 `command` 和 `args`，处理 Windows 命令名，执行最长等待 5 秒的 `--version` 预检查，再构造：

```java
McpTransport transport = StdioMcpTransport.builder()
    .command(fullCommand)
    .environment(ChildProcessSecretSanitizer.emptyProviderSecretOverride())
    .logEvents(TRAFFIC_LOGGING_ENABLED)
    .build();
```

5 秒只用于命令可用性预检查，不是全部工具调用的超时。预检查只要求进程能启动并在时间内退出，没有要求退出码必须为零。

`createRemoteClient()` 只提取 `baseUrl`：

```java
String baseUrl = configNode.get("baseUrl").asText();
McpTransport transport = StreamableHttpMcpTransport.builder()
    .url(baseUrl)
    .logRequests(TRAFFIC_LOGGING_ENABLED)
    .build();
```

两个分支都通过以下形式创建 Client：

```java
return new DefaultMcpClient.Builder()
    .transport(transport)
    .logHandler(SAFE_NO_OP_LOG_HANDLER)
    .build();
```

这解释了为何第三方 JSON 中的 `headers`、`env`、传输类型或超时字段不会因为“JSON 合法”就自动生效。参数必须有对应的后端解析和 Builder 传递逻辑。

### 6.4 缓存、失败计数与刷新

| 行为 | 当前实现细节 |
| --- | --- |
| 对话首次装配 | `getOrCreateClient()` 创建 Client，按工具 ID 缓存在当前 JVM 的 `activeClients` |
| 后续装配 | 健康且未在暂停期的缓存 Client 可被复用 |
| Client 创建或手动健康检查失败 | 增加失败计数；达到 3 次后设置 5 分钟暂停时间 |
| 工具业务调用失败 | 当前没有在该服务中统一接回这个计数，不能将它当成所有业务调用的熔断器 |
| 编辑、启停、删除 | 调用 `refreshClient()`，移除该工具的 Client 缓存 |
| 点击测试 | `checkToolHealth()` 直接新建 Client，不经缓存和暂停判断，也不把测试 Client 放入 `activeClients` |
| 应用关闭 | `cleanup()` 遍历移除缓存引用 |

需要特别理解两个边界：

1. `refreshClient()` 不会清空失败次数和 `toolDisabledUntil`。手动测试成功虽然标记健康，也没有删除已设置的暂停截止时间。因此可能出现“测试成功，但对话仍暂时跳过工具”；等待暂停到期，或在修复后重启对应后端实例再验证。
2. 当前 `closeClient()` 仅移除 Map 引用，没有显式调用 SDK 的关闭方法。不能把它描述为已经终止本地子进程或释放远程会话。频繁测试和修改连接时应关注资源占用，生产扩展需补齐关闭逻辑。

这些状态保存在进程内，多实例部署不会自动同步缓存失效。更改连接后，应让处理请求的各实例都更新。

### 6.5 按问题查源码

| 要修改什么 | 主要文件 |
| --- | --- |
| 工具字段、返回数据边界 | `domain/bo/mcp/McpToolBo.java`、`domain/vo/mcp/McpToolVo.java`、`domain/dto/mcp/` |
| 新增、编辑、状态、测试 | `controller/mcp/McpToolController.java`、`service/mcp/impl/McpToolServiceImpl.java` |
| 连接字段、协议、缓存、工具组合 | `mcp/service/core/LangChain4jMcpToolProviderService.java` |
| 智能体装配与路由 | `service/chat/impl/ChatServiceFacade.java` |
| Java 工具发现与同步 | `mcp/service/core/BuiltinToolRegistry.java`、`config/mcp/SystemToolInitializer.java` |
| 市场解析与加载 | `service/mcp/impl/McpMarketServiceImpl.java` |
| MCP 事件与日志 | `observability/MyMcpClientListener.java`、`observability/LangChain4jObservabilityConfig.java` |
| 子进程环境变量处理 | `common/process/ChildProcessSecretSanitizer.java` |

可在[后端源码目录](https://github.com/ageerle/ruoyi-ai/tree/main/ruoyi-modules/ruoyi-chat/src/main/java/org/ruoyi)中按上述路径查找；本地工作树若包含尚未提交的修改，以本地对应实现为准。管理端表单位于 `ruoyi-admin/apps/web-antd/src/views/mcp/tool/`，请求定义位于 `src/api/mcp/tool/` 和 `src/api/agent/agent/`。

## 7. 管理接口与 MCP 市场 {#api}

### 7.1 工具管理接口

以下是后端 Controller 相对路径。使用前端开发代理时可能还有 `/api` 等前缀，请以自己的部署和登录请求配置为准。管理 API 需要已有登录态和权限，与远程 MCP 的鉴权是两回事。

| 方法与路径 | 用途 / 参数 | 权限 |
| --- | --- | --- |
| `GET /mcp/tool/list` | 分页管理列表 | `mcp:tool:list` |
| `GET /mcp/tool/all` | 不分页列表，可传 `keyword`、`type`、`status` | `mcp:tool:list` |
| `GET /mcp/tool/options` | 智能体可选的已启用工具 | `agent:agent:list`、`agent:agent:add`、`agent:agent:edit` 任一权限 |
| `GET /mcp/tool/{id}` | 公开详情，不回显连接配置 | `mcp:tool:query` |
| `POST /mcp/tool` | 新增 LOCAL / REMOTE | `mcp:tool:add` |
| `PUT /mcp/tool` | 修改记录，body 需携带 `id` | `mcp:tool:edit` |
| `PUT /mcp/tool/{id}/status?status=DISABLED` | 修改外部工具启停状态 | `mcp:tool:edit` |
| `POST /mcp/tool/{id}/test` | 连接或注册检查 | `mcp:tool:test` |
| `DELETE /mcp/tool/{ids}` | 删除外部工具，多个 ID 用逗号分隔 | `mcp:tool:remove` |

通过 API 新增 REMOTE 的请求体示例：

```json
{
  "name": "company-inventory",
  "description": "公司库存只读 MCP 服务",
  "type": "REMOTE",
  "status": "ENABLED",
  "configJson": "{\"baseUrl\":\"http://127.0.0.1:8001/mcp\"}"
}
```

`configJson` 在 API 请求体中是**字符串**，所以内部引号需要 JSON 转义；管理页文本框中则直接粘贴内部 JSON 对象。`POST` 成功返回 `R<Void>`，不直接返回新 ID，可通过列表查询获得。

测试响应示意（外层成功不等于 `data.success` 为真）：

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "success": true,
    "message": "MCP工具 [company-inventory] 连接测试成功",
    "toolCount": 1,
    "tools": ["company-inventory"]
  }
}
```

### 7.2 MCP 市场是清单导入，不是任意网页抓取 {#market}

**MCP 市场管理**用于维护外部目录源，将清单中的服务加载为 `mcp_tool` 记录。“加载到本地”指进入本系统的工具管理，并不保证会变为 `LOCAL` 类型，也不会自动部署服务或绑定智能体。

<img src="/images/mcp/runtime/mcp-market-empty.png" alt="尚未配置市场源时的市场管理界面" width="1440" height="1000" loading="lazy" style="height: auto;" />

| 操作 | 当前准确路径 |
| --- | --- |
| 市场源列表 / 新增 / 编辑 | `GET /mcp/market/list`、`POST /mcp/market`、`PUT /mcp/market` |
| 查看缓存清单 | `GET /mcp/market/{marketId}/tools?page=1&size=10` |
| 从源地址刷新 | `POST /mcp/market/{marketId}/refresh` |
| 加载一条市场工具 | `POST /mcp/market/tools/{toolId}/load` |
| 批量加载 | `POST /mcp/market/tools/batch-load`，body 为市场工具 ID 数组 |

注意区分 `marketId`、市场工具的 `toolId` 与加载后生成的 `mcp_tool.id`。智能体最终选择的是工具管理中的记录 ID。

### 7.3 当前能解析的市场 JSON

`refreshMarketTools()` 对市场 URL 发起一次普通 HTTP GET，超时为 30 秒。它接受顶层数组，或 `{"data":[...]}`，例如下面的**自建清单格式**：

```json
{
  "data": [
    {
      "name": "company-inventory",
      "description": "库存只读工具",
      "version": "1.0.0",
      "baseUrl": "https://mcp.example.com/mcp"
    },
    {
      "name": "filesystem-demo",
      "description": "演示目录的文件工具",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/app/workspace/mcp-demo"]
    }
  ]
}
```

远程域名是占位符，应换成真正提供 Streamable HTTP 的地址。清单 URL 也必须是后端能获取 JSON 的地址。

加载时的字段规则如下：

- 有 `baseUrl` 或 `url`：生成 `REMOTE`，连接配置统一保存为 `baseUrl`，没有按 `type=sse` 切换传输的逻辑。
- 否则生成 `LOCAL`：提取 `command`、`args` 和 `env`；其中 `env` 虽可保存，当前运行时仍未读取。
- 有 `package` 或 `npmPackage`：重写为 `npx -y 包名`，会覆盖先前提取的命令和参数；需要目录等额外参数时，不要依赖这一简化分支。

当前还存在这些边界：市场 `authConfig` 虽有存储字段，刷新请求没有把它变成认证头；刷新按名称新增或更新缓存清单，不会删除源中已消失的项目，也不会把变更自动同步到已经加载的 `mcp_tool`。非数组 JSON 甚至可能返回“刷新成功、数量为 0”，因此应核对新增/更新数量和实际清单。

### 7.4 如何扩展魔搭目录同步

首次接入优先按第 4 节逐个配置。要批量接入时，在 `McpMarketServiceImpl` 外增加平台适配层或受控的清单转换服务：

1. 按魔搭正式 API / SDK 获取服务目录，处理认证、分页和返回结构。
2. 提取名称、说明和真实可用的连接配置，明确区分 SSE、Streamable HTTP 与 Stdio。
3. 将可直接使用的服务转换为本项目清单字段；需要用户专属连接或上游 Key 的服务应在加载时补齐配置。
4. 保留来源 ID、版本与连接有效期，设计过期更新和已加载记录的同步规则。
5. 接入现有租户归属校验，再验证“刷新 → 加载 → 工具测试 → 绑定 → 调用”。

这是需要开发的适配，不是把魔搭首页粘贴进市场 URL 就能完成的功能。不要将用户专属连接地址发布到公共市场清单。

## 8. 开发扩展：从业务函数到 MCP Server {#extensions}

### 8.1 选择扩展层次

| 目标 | 推荐修改位置 |
| --- | --- |
| 在后端增加简单 Java 工具 | 实现 `BuiltinToolProvider`，提供 `@Tool` 方法 |
| 让 RuoYi 和其他 MCP 客户端共用业务能力 | 单独开发 MCP Server，再以 LOCAL / REMOTE 接入 |
| 支持 headers、env、旧 SSE 或超时配置 | 扩展 `LangChain4jMcpToolProviderService` 的配置解析和 Transport 构建 |
| 做工具级权限、按会话追踪和资源释放 | 扩展提供者、调用上下文和 Client 生命周期 |

### 8.2 示例：开发一个只读库存 MCP Server

下面是可独立运行的 Python 示例，使用 [MCP Python SDK 的 v1 API](https://github.com/modelcontextprotocol/python-sdk/tree/v1.x)。它用内存中的虚构商品数据演示查询，不连接实际数据库。本例固定 SDK 版本，避免新版 SDK 的导入方式和启动 API 变化影响复现。

在后端机器的 `D:/mcp/inventory-demo` 目录中准备 Python 3.10+，创建独立虚拟环境：

```powershell
New-Item -ItemType Directory -Force D:/mcp/inventory-demo
Set-Location D:/mcp/inventory-demo
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install "mcp==1.30.0"
```

创建 `server.py`：

```python
import argparse
import logging
import sys

from mcp.server.fastmcp import FastMCP

logging.basicConfig(stream=sys.stderr, level=logging.INFO)
logger = logging.getLogger("inventory-demo")

mcp = FastMCP("inventory-demo", host="127.0.0.1", port=8001)
INVENTORY = {"DEMO-001": 12, "DEMO-002": 0}


@mcp.tool()
def get_inventory(sku: str) -> dict:
    """按商品编码查询演示库存，例如 DEMO-001；只读，不下单、不扣库存。"""
    normalized_sku = sku.strip().upper()
    if not normalized_sku:
        raise ValueError("sku 不能为空")

    found = normalized_sku in INVENTORY
    logger.info("inventory_lookup completed found=%s", found)
    return {
        "sku": normalized_sku,
        "found": found,
        "available": INVENTORY.get(normalized_sku),
        "source": "demo-data",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--transport", choices=["stdio", "streamable-http"], default="stdio"
    )
    args = parser.parse_args()
    mcp.run(transport=args.transport)
```

`@mcp.tool()` 暴露函数，类型标注生成参数结构，docstring 说明使用时机。返回值将作为工具结果交回客户端。普通日志进入 stderr，不会污染 STDIO 协议通道。

本例已使用 Python SDK `1.30.0` 的客户端分别验证 STDIO 与 Streamable HTTP 的初始化、工具发现和调用，覆盖正常库存、零库存、未知商品以及空值、缺失参数、错误参数类型。该验证不包含你的模型账号或智能体路由，后两项仍需按下文联调。

### 8.3 先用 LOCAL 接入这个 Server

创建名称为 `inventory-demo` 的 LOCAL 工具，填入：

```json
{
  "command": "D:/mcp/inventory-demo/.venv/Scripts/python.exe",
  "args": ["D:/mcp/inventory-demo/server.py"]
}
```

使用虚拟环境中的 Python 绝对路径，可以确保后端使用刚安装 SDK 的那个解释器。这里不需要手动启动 Server，后端会负责启动它。

保存、测试、绑定智能体后发送：“请调用 `get_inventory` 查询 `DEMO-001` 的库存，并说明数据来源。”预期工具数据为 `found=true`、`available=12`、`source=demo-data`。另测 `DEMO-002` 应为库存 0；不存在的编码应为 `found=false` 和 `available=null`，不能把未知商品与库存为 0 混为一谈。

如果模型一直把问题路由到 SQL Agent，而没有调用这个 MCP 工具，需要按[业务工具路由扩展](#agent-routing)修改后端角色说明和调度提示，再重新构建运行；这不是管理页里可以独立切换的选项。

### 8.4 再切换为 REMOTE 验证

同一份代码可以单独启动 HTTP 服务：

```powershell
Set-Location D:/mcp/inventory-demo
.\.venv\Scripts\python.exe server.py --transport streamable-http
```

保留这个服务进程，**另建** REMOTE 工具：

```json
{
  "baseUrl": "http://127.0.0.1:8001/mcp"
}
```

绑定这个 REMOTE 记录并重复库存查询，即可对比两个 Transport 的使用方式。为避免同名函数冲突，测试时不要同时给一个智能体绑定 LOCAL 和 REMOTE 两个库存连接。

本例监听 `127.0.0.1`，仅适用于 Server 与 Java 后端处于同一网络环境。后端若在容器或另一台机器，`127.0.0.1` 指向的是后端自己的网络空间；正式部署需配置可达的受控地址、认证和 TLS，再填入真实端点。

替换真实业务时，将内存查询替换为业务服务调用，保留参数校验、返回结构和错误语义。租户、用户身份应从可信调用上下文获取并执行权限检查，不能只相信模型传来的 `tenantId`。写操作还需处理幂等和明确的执行授权。

### 8.5 在项目内增加 Java 内置工具

对于不需要跨进程共享的简单能力，可以新增 `mcp/tools/InventoryDemoTool.java`：

```java
package org.ruoyi.mcp.tools;

import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import org.ruoyi.mcp.service.core.BuiltinToolProvider;
import org.springframework.stereotype.Component;

@Component
public class InventoryDemoTool implements BuiltinToolProvider {
    @Override
    public String getToolName() {
        return "inventory_demo";
    }

    @Override
    public String getDisplayName() {
        return "演示库存查询";
    }

    @Override
    public String getDescription() {
        return "查询虚构的演示商品库存";
    }

    @Tool(name = "inventory_demo", value = "按商品编码查询演示库存；只读，不下单")
    public String query(@P("商品编码，例如 DEMO-001") String sku) {
        if (sku == null || sku.isBlank()) {
            return "错误：sku 不能为空";
        }
        if ("DEMO-001".equalsIgnoreCase(sku.trim())) {
            return "演示商品 DEMO-001 的可用库存为 12，数据来源 demo-data";
        }
        return "未找到该演示商品，不代表库存为 0";
    }
}
```

重新构建并启动后端后，`BuiltinToolRegistry` 发现这个 `BuiltinToolProvider`，`SystemToolInitializer` 将其同步到工具表。随后在管理端做注册测试，并绑定智能体完成真实调用。不要通过工具新增 API 伪造 `BUILTIN` 记录；服务层明确拒绝创建或转换为内置类型。

当前注册表保存的是类，通过 `getDeclaredConstructor().newInstance()` 创建执行实例。因此示例保留无参构造，不能仅添加需要 Spring 注入的 Service 字段或构造器后就假设它在执行实例中可用。接入 Spring 业务服务时，需调整实例提供方式，或遵循项目现有的业务服务获取方案，再验证代理、事务和调用上下文。

`getToolName()` 用于注册表查找；`@Tool(name=...)` 用于模型函数名。示例主动让两者一致，便于排障；已有工具的 Java 方法名与注册名称可能不同。当前 `getAllBuiltinTools()` 生成的数据库描述为空，模型侧详细说明应落实在 `@Tool` / `@P` 上。

### 8.6 让文件与库存请求进入正确的子 Agent {#agent-routing}

当前 `agent/WebSearchAgent.java` 的 `@Agent` 声明定位为浏览器工具助手，`@SystemMessage` 也围绕 `bing_search`、`crawl_webpage` 和 Playwright 编写。库存函数即使成功装配，也可能不被 Supervisor 分配到这个角色。

下面是**开发环境验证文件与库存示例的最小修改方案**，会改变共用的搜索角色行为；需要保留严格角色分工的产品，应新增专用业务 Agent，而不是把所有业务继续放进搜索角色。

1. 在 `agent/WebSearchAgent.java` 中，保留原接口、方法和参数，把 `@SystemMessage` 与方法上的 `@Agent` 说明分别调整为：

   ```java
   @SystemMessage("""
       你负责使用当前提供的工具完成用户明确要求的网页、文件和演示库存查询。
       只使用本次提供的真实函数名和参数，不假设固定存在某个工具。
       文件任务使用文件工具；演示库存使用 get_inventory 或 inventory_demo。
       必须先取得工具返回结果再回答；工具缺失或失败时说明情况，不编造结果。
       只读请求不能执行写入、删除或命令操作。
       """)
   // 保留原来的 @UserMessage("{{query}}")。
   @Agent("工具助手：处理网页查询、文件读取和使用 get_inventory 或 inventory_demo 的演示库存查询")
   // 保留原来的 String search(@V("query") String query)。
   ```

2. 在 `service/chat/impl/ChatServiceFacade.java` 的 `handleAgentChat()` 中，为原有 `.supervisorContext(...)` 追加明确的调度说明，例如：

   ```java
   .supervisorContext(
       "仅问候或简单闲聊时使用 chitChatAgent；其他请求使用对应专业 Agent。"
       + "网页查询、文件读取，以及明确调用 get_inventory 或 inventory_demo 的请求，"
       + "交给工具助手 WebSearchAgent。演示库存由 MCP/内置工具查询，不转为 SQL 查询。")
   ```

3. 保留按 `mcpToolIds` 装配的逻辑，重新构建并启动后端，只关联本次要验证的连接。再发送带明确函数名的问题，并按第 5.4 节核对执行断点。

这两个改动分别解决“Supervisor 把任务交给谁”和“子 Agent 如何选择已有工具”，不会自动增加权限或安装新工具。正式业务中，专用 Agent 也应使用经过筛选的 ToolProvider，并加入 Supervisor 的 `.subAgents(...)`，避免把所有连接注入所有角色。

### 8.7 扩展 headers、env、协议和超时 {#transport-extension}

下面是需要开发的事项，当前没有通过表单即刻开启这些能力：

| 需求 | 修改位置 | 实现要点 |
| --- | --- | --- |
| 远程 Bearer / 自定义 headers | `createRemoteClient()` | 定义配置结构并传给当前 SDK 支持的请求头 API；密钥从受控来源解析，保持详情和日志不回显 |
| LOCAL 环境变量 | `createStdioClient()` | 校验并合并允许传入的 `env`，在最终传递前继续应用敏感变量屏蔽 |
| 旧 SSE transport | `createMcpClient()` / 远程构造 | 新增明确的传输类型配置并选择对应实现，不能靠替换 URL 后缀转换协议 |
| 连接与工具执行超时 | Transport / Client 构造 | 分别定义连接、读取、工具执行超时，确认所用 SDK 版本的真实 Builder 方法 |
| 仅开放指定函数 | `combineToolProviders()` 及工具发现结果 | 按 Server 与函数白名单过滤实际提供给模型的工具，处理名称冲突 |
| 刷新与恢复 | `refreshClient()` / `checkToolHealth()` | 正确关闭 Client、回收测试资源、清理失败状态，考虑多实例缓存失效 |

扩展后至少覆盖正常连接、认证失败、配置更新、禁用、超时和资源回收。工具 ID 缓存若开始承载不同用户的凭证，还需重新设计缓存键和隔离边界，不能把一个账号的连接复用给所有会话。SDK 能力请对照项目锁定版本和 [LangChain4j MCP 文档](https://docs.langchain4j.dev/tutorials/mcp/)确认。

### 8.8 扩展调用观测与 Resources / Prompts {#observability}

`MyMcpClientListener` 的工具、资源、提示词回调会构造 `event="mcp"`，内容包含 `name`、`status` 和 `result`。当前实现只推送状态，`result` 为 `null`，普通日志也关闭了协议报文和服务端日志透传。

要让这些事件参与当前 MCP 调用，需要把监听器显式注册到 Client，并提供正确的会话上下文。由于 Client 按工具 ID 缓存，**不能直接把某个用户的 `sessionId` 固定在共享 Client 上**；应按单次调用上下文路由，或设计合适的会话隔离。记录工具名、状态、耗时、追踪 ID 即可满足许多排障需求，参数与结果应按需要脱敏后处理。

要使用 Resources / Prompts，还需设计资源选择与读取、提示词参数填写、结果注入模型的流程，以及相应权限和审计。增加监听回调不会自动完成这些产品能力。

## 9. 按现象排障 {#troubleshooting}

建议按照“配置 → 后端进程/网络 → MCP 连接 → 工具执行 → 智能体路由”逐层检查。

| 现象 | 优先检查 | 下一步 |
| --- | --- | --- |
| 保存成功，测试失败 | JSON 只验证语法，是否缺 `command` / `baseUrl` | 按 LOCAL / REMOTE 示例填写完整配置 |
| 编辑页配置框为空 | 只写不回显策略 | 不改配置就留空，更换连接就提交完整新 JSON |
| `Command ... is not available` | 后端 PATH、账号、程序是否在 5 秒预检查中退出 | 用同一服务账户运行 `command --version` |
| Windows 找不到 `node.cmd` / `uv.cmd` | 裸命令被自动加 `.cmd` | 改为实际 `.exe` 的绝对路径 |
| LOCAL 启动后立即退出 | 包未安装、参数/路径错误、环境变量缺失 | 在后端终端执行同样命令，检查 stderr |
| JSON-RPC 解析错误 | stdout 混入日志或启动提示 | 普通日志改写 stderr，使用标准 SDK |
| REMOTE 返回 404 / 405 | 端点错误、普通 REST API、旧 SSE 协议不匹配 | 从平台复制正确协议地址，不改后缀猜测 |
| REMOTE 返回 401 / 403 | 地址过期、缺认证头、权限不足 | 查平台配置，当前 headers 不会自动传递 |
| 浏览器能访问，后端不能连 | 网络、代理、证书库、容器 DNS 不同 | 从后端环境检查 DNS、TLS 和端口 |
| 魔搭之前能用，隔天失败 | Remote URL 有效期、服务状态或用量 | 获取新配置并完整替换 `baseUrl` |
| JSON 有 `env`，进程仍提示缺 Key | LOCAL 未读取 env，或变量被屏蔽 | 使用受控运行环境或扩展传递逻辑 |
| 测试返回 HTTP 200，页面却显示失败 | 外层 `R.ok` 与业务测试结果不同 | 查看 `data.success` 和 `data.message` |
| 测试显示一个工具，实际有多个函数 | `toolCount` 是固定构造的值 | 用协议工具发现或平台测试查看真实函数 |
| 测试成功，对话仍跳过连接 | 未绑定/禁用/租户不符/仍在暂停期 | 检查选项、绑定 ID、请求实例和暂停时间 |
| 对话一直回答，不调用工具 | 智能体、模型能力、子 Agent 路由 | 用明确任务核对 `handleAgentChat()` 装配 |
| 没有前端 MCP SSE 事件 | Client 未显式绑定会话监听器 | 查 Server 执行记录，不以事件缺失单独判失败 |
| 修改后仍使用旧地址 | 暂停状态、多实例缓存未同步 | 更新实际处理请求的实例，修复后必要时重启 |
| 测试次数越多，子进程越多 | 测试 Client 和刷新流程缺少显式关闭 | 减少重复测试，补齐生命周期释放逻辑 |
| 市场刷新为 0 条或解析失败 | 返回网页或非兼容 JSON | 使用顶层数组或 `data` 数组清单接口 |
| 市场更新，工具配置没变 | 刷新只更新市场缓存元数据 | 手动更新已加载工具，或开发同步机制 |

完成一次接入后，保存可复现的连接模板、依赖版本、验证输入和预期结果，模板中使用凭证占位符。后续新增第三方服务时，沿用同一套步骤即可定位问题发生在哪一层。
