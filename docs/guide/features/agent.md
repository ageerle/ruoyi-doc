---
outline: [2, 3]
---

# 智能体管理

RuoYi AI 的智能体可以组合模型、知识库和工具，提供日常问答、资料检索、数据库问数和图表生成等能力。你可以在管理端为智能体配置名称、模型、提示词及关联资源，再由用户端进入应用并发起对话。涉及业务数据或外部服务时，还需要配置相应的数据源、访问范围和工具。

本页按 **理解概念 → 创建智能体 → 验证对话 → 接入数据与工具 → 报表示例** 的顺序介绍使用方法，后面附有排障与开发扩展说明。首次使用先完成基础对话，再按需要接入资源；需要调整子智能体调度、工具执行或数据访问控制时，可继续阅读对应的后端实现。

| 你现在要做什么 | 从这里开始 |
| --- | --- |
| 第一次使用，先跑通一次对话 | [准备环境](#prerequisites)、[创建与使用](#quick-start) |
| 已经能对话，想接入业务数据 | [知识库与工具](#resources)、[SQL 数据源配置](#sql-config) |
| 想体验“用一句话生成报表” | [完整报表示例](#report-demo) |
| 保存成功但运行结果不对 | [分层排查](#troubleshooting) |
| 需要加工具、子智能体或确定性报表流程 | [关键代码位置](#source-map)、[扩展开发](#extension) |

::: info 本页对应的实现
本文是 **2026-09-08 核对的本地待发布教程**，以配套工作树的 `ruoyi-ai`、`ruoyi-admin`、`ruoyi-web` 为依据，包含本次随文修正的 SQL 校验、数据源路由和图表输出约定。修正尚未对应公开发布版本；使用公开仓库时，先对照[修正说明](#changes)检查源码，再执行示例。下面的固定数据是教程用的合成数据，预期输出用于验收，不代表已在你的模型账号上执行成功。
:::

## 1. 先理解智能体怎样工作 {#concepts}

### 1.1 一个应用与多个子智能体

后台新增一条智能体记录，会保存到 `agent_info`。这是一份应用配置；它本身不是一个新 Java 类，也不代表后台创建了独立运行的服务。

用户端发送带有 `agentId` 的聊天请求后，`ChatServiceFacade` 读取配置，构建 LangChain4j Supervisor。Supervisor 负责规划任务，并将各个步骤交给相应的子智能体执行；当前每次请求固定装配五个角色：

| 子智能体 | 适合处理的任务 | 数据/工具从哪里来 |
| --- | --- | --- |
| `WebSearchAgent` | 搜索、网页内容及配置工具相关任务 | 后台显式关联的 `mcpToolIds`；角色说明目前偏浏览器和搜索 |
| `SqlAgent` | 数据库问数，输出 SQL、查询结果和分析 | 三个 Java 工具：`queryAllTables`、`queryTableSchema`、`executeSql` |
| `ChartGenerationAgent` | 根据已经提供的准确数据生成 ECharts 配置 | 用户提供的数据或前一步 SQL 结果；自身没有查询工具 |
| `EchartsAgent` | 查询数据库后直接生成 ECharts 图表 | 同一组三个 SQL 工具；在一个子智能体内完成查数和绘图 |
| `ChitChatAgent` | 问候、简单闲聊 | 模型自身；作为闲聊兜底 |

这里的“图表智能体”是 `ChartGenerationAgent` / `EchartsAgent`，与后台“展示图标”字段无关。后台也没有“选择任意子 Agent 组合”的拖拽式配置；新增、移除子 Agent 要修改装配代码。

### 1.2 一次请求的实际顺序

```text
用户端选中智能体，POST /chat/send，携带 agentId + sessionId + content
  → 校验登录用户是否拥有这个会话、智能体是否存在且启用
  → 按智能体绑定的 modelId 解析模型，覆盖请求中的 model
  → 构建 Supervisor 和五个子智能体，按绑定记录装配 MCP 工具
  → 读取会话历史；可选地对当前问题执行一次知识库检索
  → 拼接：自定义提示词 + 历史对话 + 增强后的当前问题
  → Supervisor 规划，子智能体调用模型和工具，必要时继续下一步
  → 取最后一个子智能体结果，通过 SSE 发送 content、done
  → 保存助手回复并关闭本次连接
```

Supervisor 和所有子智能体当前共用一个 `plannerModel`。一次用户提问可能触发多次模型请求、工具调用和规划，因此耗时和费用不能按“一次普通聊天”估计。

::: tip SSE 连接不等于逐字输出
当前智能体分支异步调用同步的 `supervisor.invoke(prompt)`，完成后一次性发送最终内容。等待期间没有逐字文本不一定是故障。它也没有把每个规划步骤和工具执行结果实时推送到聊天气泡，排查执行过程应结合日志和断点。
:::

### 1.3 与普通对话、工作流的区别

| 模式 | 如何进入 | 适合什么 |
| --- | --- | --- |
| 普通模型聊天 | 不传 `agentId`，不启用工作流 | 直接问答；不会因此装配五个子 Agent 或智能体关联工具 |
| 智能体 | 传 `agentId` | 模型根据问题决定使用哪些专业角色和工具 |
| 工作流 | `enableWorkFlow=true`，提供工作流参数 | 业务步骤和分支需要明确编排、独立观察和维护 |

`agentId` 与工作流模式互斥，同时传入会报“对话模式参数冲突”。Supervisor 当前使用 `LAST` 响应策略，**只返回最后一个子智能体的结果**。如果最后一步生成图表，前一步 SQL 分析不会自动作为额外正文拼接给用户。

## 2. 准备环境与模型 {#prerequisites}

先按[本地安装与启动](../getting-started/install.md)启动后端、管理端和用户端，确认 MySQL、Redis 可用。知识库检索还需要 embedding 模型和对应向量存储；基础对话不要求先配置知识库。

| 服务 | 本地常用地址 | 你需要确认什么 |
| --- | --- | --- |
| Java 后端 | `http://127.0.0.1:6039` | 已连接基础设施，能正常登录和调用聊天接口 |
| 管理端 `ruoyi-admin` | `http://127.0.0.1:5666` | 有智能体新增、编辑、查询权限 |
| 用户端 `ruoyi-web` | 以 Vite 启动输出为准，常见 `http://localhost:5173` | 能进入应用市场和聊天页 |
| 文档站 `ruoyi-doc` | 本页所在地址 | 与用户端是不同项目 |
| Ollama（可选） | `http://127.0.0.1:11434` | 后端能够访问，模型已经下载 |

**端口不要照抄。** 当文档站已经占用 `5173`，用户端可能启动在 `5174` 或其他端口。浏览器打开后先确认页面是用户端应用，而不是文档首页。

### 2.1 选择适合任务的模型

先在 **对话管理 → 厂商管理 / 模型管理** 配好聊天模型，详见[模型管理](./model.md)。普通文本问答能成功，只能证明基础连接可用；SQL 报表还需要模型稳定输出工具调用、理解表结构、遵循多步指令并输出合法 JSON。

建议分开验收：先验证一次简短问答，再验证一次工具调用，最后再运行报表示例。不要一开始同时绑定多个 MCP、知识库和复杂提示词，否则很难判断问题在哪一层。

### 2.2 使用本地 Ollama 验证基础对话

已有页面使用过 `qwen2.5:1.5b` 做本地对话演示，相关截图保留在下文。它适合验证基础链路；是否能稳定完成 Supervisor 规划和报表工具调用，必须另行测试，不能从截图推断。

宿主机安装 Ollama 时：

```bash
ollama pull qwen2.5:1.5b
ollama list
```

使用项目 Ollama 容器时：

```bash
docker exec ruoyi-ai-ollama ollama pull qwen2.5:1.5b
docker exec ruoyi-ai-ollama ollama list
```

先直接调用模型，隔离项目配置问题。PowerShell 示例：

```powershell
$body = @{
  model = 'qwen2.5:1.5b'
  stream = $false
  messages = @(@{ role = 'user'; content = '只回复 OK' })
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/chat' `
  -Method Post -ContentType 'application/json' `
  -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
```

下图保留了早期本地配置：供应商为 `ollama`，模型名包含 `ollama list` 中完整的名称和标签，密钥未填写。宿主机可通过 `http://127.0.0.1:11434` 检查 Ollama；容器中的后端需使用可达的服务地址，例如同一网络的 `http://ollama:11434`。容器里的 `127.0.0.1` 指向容器自身。

当前新增模型要求 HTTPS。无需鉴权的 Ollama 可使用后端可访问的 HTTPS 地址，并保持密钥字段未填写；通过 API 创建时省略 `apiKey` 或传 `null`，不要传空字符串。Ollama 聊天适配器不读取 Key，若网关需要认证，还需扩展适配器。完整规则见[模型管理](./model.md#provider-extension)。

![Ollama 本地对话模型配置](/images/model/ollama-chat-config.png)

## 3. 创建、使用与维护一个智能体 {#quick-start}

### 3.1 填写后台配置

进入 **智能体管理 → 智能体列表 → 新增**。第一次只填写名称、描述、模型、提示词和状态，其他关联先留空。

| 字段 / API 名 | 实际作用 | 填写注意事项 |
| --- | --- | --- |
| 智能体名称 `agentName` | 管理和识别应用 | 必填，最长 200 字符；建议用“销售分析助手”这样的业务名称。接口关联使用 ID，不依赖名称唯一 |
| 智能体描述 `agentDescribe` | 应用市场卡片优先显示的文字 | 简洁说明用户能做什么；为空时卡片回退显示名称 |
| 展示图标 `agentShow` | 头像 URL | 使用浏览器可访问的图片地址，不是本地磁盘路径 |
| 绑定模型 `modelId` | Supervisor 与全部子 Agent 使用的模型 | 必填，选择聊天模型。保存记录成功不代表工具调用已经验证 |
| 深度思考 `enableThinking` | 保存 `0` / `1` 配置 | 当前智能体分支没有把该字段传给 `buildChatModel`，不要依赖它开关推理输出 |
| 关联工具 `mcpToolIds` | 给 `WebSearchAgent` 提供工具 | 选择的是工具管理记录 ID；SQL 子 Agent 的三个 Java 工具不受此列表控制 |
| 关联技能 `skillNames` | 保存磁盘技能名称 | 普通 Supervisor 当前不会装配旧版 Skills，见[技能边界](#skills) |
| 关联知识库 `knowledgeIds` | 对当前问题检索增强 | 支持多选；先确保文档已解析、向量化且可检索 |
| 自定义提示词 `systemPrompt` | 前置到 Supervisor 输入 | 写角色、业务口径、调用要求、输出和失败策略；不是 Java 权限控制 |
| 状态 `status` | `0` 正常、`1` 停用 | 正常记录进入用户端选项；修正后的聊天入口也拒绝停用记录 |
| 备注 `remark` | 管理说明 | 可以记录维护人、用途、验收问题和变更原因 |

基础测试提示词：

```text
你是团队的问答助手。用中文简洁回答。
用户只是打招呼时直接回应，不查询数据库或外部工具。
涉及真实业务数据时必须以工具结果为依据；无法取得数据时说明原因，不编造。
```

![智能体新增与编辑配置示意](/images/agent/runtime-config.png)

点击保存后，重新编辑一次，核对模型和各关联选项能正确回显。`mcpToolIds`、`skillNames`、`knowledgeIds` 在数据库中是 JSON 字符串，在 API 请求和响应中是数组；自己接管理接口时不要再次把数组序列化成字符串。

![智能体管理列表](/images/agent/runtime-list.png)

### 3.2 在用户端选中应用

1. 打开实际的 `ruoyi-web` 地址并登录。
2. 进入 **应用市场**，找到智能体，点击 **开始使用**。
3. 在聊天输入区域确认当前选中的是目标智能体。
4. 新建会话，发送“你好，请用一句话介绍你自己”。
5. 在浏览器开发者工具的 Network 中查看 `/chat/send`，确认请求带有正确的 `agentId` 和当前用户的 `sessionId`。需要通过接口获取 ID 时，见[接口联调](#api)。

![应用市场中的智能体入口](/images/agent/runtime-market.png)

![已有本地基础对话验证截图](/images/agent/runtime-chat-success.png)

验收重点是请求确实进入 `handleAgentChat()`，收到非空回复，并在刷新会话后仍能看到消息。模型会自由组织介绍文字，不要把某一句固定自我介绍作为唯一成功标准。上图证明的是已有基础对话场景，不是 SQL 或图表验收截图。

### 3.3 提示词怎样写才便于维护

把业务规则写成模型可以执行的具体约束。例如“销售额只统计支付成功订单，币种人民币，单位元，按支付时间过滤；不包含取消订单”，比“你是专业的数据分析师”更有用。

可以按下面的结构维护：

```text
职责：你能解决哪类问题，哪些问题应要求用户补充条件。
数据来源：哪些问题必须查数据库，哪些可以使用知识库或用户提供的数据。
业务口径：统计字段、状态、时间范围、单位、时区及排序规则。
执行方式：先确认表和字段，再查询；只根据真实结果回答。
输出约定：需要文字、结果表，还是一个 echarts JSON 代码块。
失败策略：权限不足、工具错误、空结果或结果截断时如何说明。
```

后台提示词被拼入 Supervisor 的输入字符串，不会自动覆盖各子 Agent 的 `@SystemMessage`。出现稳定的角色冲突时，需要同时核对路由上下文和子 Agent 的说明，不能无限叠加后台提示词。

### 3.4 编辑、停用与会话历史

模型、提示词和关联资源在后续请求中重新读取；通常无需重启后端。已经开始的请求继续使用本次装配的配置。修改 Java 代码、数据源或环境变量则需要重新构建或重启相应进程。

调试新提示词时使用新会话，避免旧答案和旧业务口径影响结果。当前历史通过 `MessageWindowChatMemory` / `PersistentChatMemoryStore` 读取，再转成文字传给 Supervisor；默认窗口为 20 条消息，不是 20 轮对话。它不等于子 Agent 的工具执行状态跨请求永久保存，详见[上下文管理](./context.md)和[记忆机制](./memory.md)。

停用后应同时验证应用市场选项消失、旧会话再次发送被拒绝。删除或修改绑定模型前，先检查有哪些智能体依赖它。当前保存接口不会帮你完成模型连通性和工具能力验收。

## 4. 接入知识库、MCP 与技能 {#resources}

### 4.1 知识库负责补充资料与业务口径

智能体绑定知识库后，后端在执行 Supervisor 前检索一次，增强当前问题：

- `knowledgeIds` 非空时优先使用智能体配置，否则回退到请求的单个 `knowledgeId`。
- 多库并发检索，合并时按知识库、文档和分段标识去重。
- 合并内容最多 20 个片段、24000 个字符。
- 检索异常会记录 `chat_rag operation=AUGMENT status=FALLBACK` 并回退原始问题，不保证整次聊天报错。
- 最终输入为自定义提示词、历史对话和增强后的当前问题。

报表场景可以把“已支付订单定义、地区映射、退款口径、字段说明”放入知识库；实时销售额仍应通过 SQL 或业务工具获取。上传一份订单 CSV 到知识库，不等于建立了可精确聚合的关系数据库。

先在[知识管理](./knowledge.md)独立检索一个能命中文档的问题，再在智能体中验证。涉及必须依据资料回答的场景，要明确要求“没有检索依据就说明资料不足”；若业务要求检索失败即终止，需要开发失败处理逻辑，不能依靠默认回退行为。

### 4.2 MCP 负责接入外部能力

1. 在 **MCP 管理 → MCP 工具管理** 新增或选择工具并测试。
2. 核对后端能连接远端服务，或能启动本地命令。
3. 编辑智能体，勾选需要的工具记录并保存。
4. 选中智能体，用一个明确要求调用该工具的问题验证。

只装配显式选择的记录，且工具提供者会过滤不可用/未启用的配置。一个 MCP Server 记录可能提供多个函数；当前没有在智能体表单中逐个勾选 Server 内函数的配置。

**绑定成功不保证模型会调用。** `WebSearchAgent` 的现有角色说明偏向浏览器和搜索；接入库存、文件或业务 API 时，还要确保它的职责和 Supervisor 路由能覆盖任务，具体改法见 [MCP 业务工具路由扩展](./mcp.md#agent-routing)。测试按钮也不能替代真实业务调用，分层验收见 [MCP 管理](./mcp.md#verification)。

### 4.3 普通智能体的 Skills 边界 {#skills}

管理端会列出磁盘技能并保存选择，但 `ChatServiceFacade` 已禁用旧的 Shell-backed Skills，运行时只记录：

```text
Legacy shell-backed skills are disabled; use the coding Harness skill runtime
```

因此，勾选 Word、PDF、Excel 等技能不会让普通 Supervisor 自动生成文件。需要编码技能、执行租约和审批机制时，使用 Coding Harness，对应目录、接口和策略见 [Skills 能力](./skills.md)。本页的“报表”指聊天中的数据可视化，不包含自动生成 Excel 文件或持久化 BI 仪表盘。

## 5. SQL 智能体：先把数据访问配置正确 {#sql-config}

### 5.1 三个 SQL 工具与数据源

`SqlAgent` 和 `EchartsAgent` 已在 Java 中固定绑定三个工具，**不需要在后台再勾选 SQL MCP 工具**：

| 模型调用名称 | Java 类 | 返回内容 |
| --- | --- | --- |
| `queryAllTables` | `QueryAllTablesTool` | 配置允许且成功加载到缓存的表名、类型和注释 |
| `queryTableSchema` | `QueryTableSchemaTool` | 对允许的表执行 `SHOW CREATE TABLE`，获取字段定义 |
| `executeSql` | `ExecuteSqlQueryTool` | SELECT 结果的 Markdown 表格及行数/截断提示 |

工具管理中的注册名称分别为 `query_all_tables`、`query_table_schema`、`execute_sql_query`。注册名和模型函数名不同；前者用于管理记录，后者出现在工具调用中。

三个工具现在统一通过动态数据源名称 **`agent`** 访问数据库。`TableSchemaManager` 使用 `@DS("agent")`；两个直接使用 JDBC 的工具在获取连接前 `push("agent")`，结束时 `poll()` 恢复调用方路由。这里使用的是动态数据源配置，不是仅给任意 Bean 起名 `agentDataSource`。

::: warning 数据源必须显式配置
仓库的开发配置中，动态数据源 `agent` 示例默认被注释，且 `spring.datasource.dynamic.strict=true`。只设置表白名单仍不足以查数据库；缺少命名数据源会失败。不要关闭 strict 来让查询静默回退到业务主库。

`AgentMysqlConfig.java` 当前也是整段注释状态，单独添加 `agent.mysql.enabled=true` 不会启用它。请使用下面的 `spring.datasource.dynamic.datasource.agent` 配置。
:::

### 5.2 配置独立的只读连接

在现有配置的 `spring.datasource.dynamic.datasource` 下增加 `agent`，与 `master` 同级，保留已有主数据源。也可以下载 [agent-report-demo.yml](/files/agent-report-demo.yml)，用额外配置文件启动：

```yaml
spring:
  datasource:
    dynamic:
      strict: true
      datasource:
        agent:
          type: com.zaxxer.hikari.HikariDataSource
          driver-class-name: com.mysql.cj.jdbc.Driver
          url: ${AGENT_DB_URL}
          username: ${AGENT_DB_USERNAME}
          password: ${AGENT_DB_PASSWORD}

AGENT_ALLOWED_TABLES: demo_agent_sales_order
```

其中 `AGENT_DB_URL` 指向用于报表的 MySQL 库；账号只授予业务需要的 SELECT 权限，不使用应用主库的高权限账号。用相同只读账号在数据库客户端先验证：

```sql
SELECT DATABASE();
SHOW GRANTS FOR CURRENT_USER;
SHOW CREATE TABLE demo_agent_sales_order;
SELECT region, paid_amount FROM demo_agent_sales_order LIMIT 3;
```

数据库账户权限由管理员按实际来源主机和网络配置创建。首次配置时，在[演示表初始化](#report-demo)之后创建专用账号，再授权指定表的读取。下面的密码占位符必须替换为你设置的独立密码；在数据库管理工具中操作，不保存到项目 SQL 文件。

```sql
-- 由数据库管理员执行；账号已存在时先检查现有权限，不要重复创建。
CREATE USER 'agent_report_reader'@'localhost' IDENTIFIED BY '<替换为独立密码>';
GRANT SELECT ON ruoyi_agent_demo.demo_agent_sales_order
TO 'agent_report_reader'@'localhost';
```

这条授权适用于从数据库本机连接的账号示例。容器或远程后端应使用实际来源对应的账号 host；不要为了省事把生产数据库授权扩大到任意来源。

### 5.3 配置表白名单与启动进程

`AGENT_ALLOWED_TABLES` 是后端进程的全局配置，逗号分隔，只填当前报表库内的简单表名，例如 `demo_agent_sales_order,demo_agent_product`。不支持 `*`，本次校验不接受跨库限定名。表名应使用数据库中的实际大小写。

先用 `Ctrl+C` 停止原来的本地后端，再在**后端仓库根目录、启动 Java 的同一 PowerShell 终端**设置。下例接续本地安装教程，保留 `dev` profile 和 `.dev/application-local.yml`，再追加报表配置；使用其他启动配置时，保留自己的原参数并追加文件地址：

```powershell
$env:AGENT_DB_URL = 'jdbc:mysql://127.0.0.1:3306/ruoyi_agent_demo?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai'
$env:AGENT_DB_USERNAME = 'agent_report_reader'
# 本地交互式输入；服务部署时改用已有的密钥注入方式。
$agentDbSecret = Read-Host '请输入报表只读账号密码' -AsSecureString
$env:AGENT_DB_PASSWORD = [System.Net.NetworkCredential]::new('', $agentDbSecret).Password
$agentDbSecret.Dispose()
$env:AGENT_ALLOWED_TABLES = 'demo_agent_sales_order'

java "-Dfile.encoding=UTF-8" -jar .\ruoyi-admin\target\ruoyi-admin.jar `
  --spring.profiles.active=dev `
  "--spring.config.additional-location=file:./.dev/application-local.yml,file:./agent-report-demo.yml"
```

将 jar 路径换成实际构建产物，额外 YAML 文件放在当前启动目录。该输入方式不将明文密码写入命令历史，但会传入当前进程环境，不要输出它；Java 退出后可执行 `Remove-Item Env:AGENT_DB_PASSWORD` 清理当前终端变量。IDE 启动需要设置 Run Configuration 的环境变量；Docker 启动需要把变量传入后端容器。另一个终端设置环境变量不会改变已经运行的 Java 进程。

开发配置默认白名单为空；生产配置可能有项目示例值，上线前必须明确替换。更新白名单或连接后重启后端，确认实际启用的 profile 和外部配置。

### 5.4 当前执行限制和业务边界

| 约束 | 对使用者意味着什么 |
| --- | --- |
| 未配置白名单时拒绝查询 | 这是预期保护，不能让模型“忽略限制” |
| 必须为单条 SELECT；不接受 WITH、注释、跨库引用 | 使用普通聚合 SELECT；教程兼容 MySQL 5.7 风格 SQL |
| 通过语法树检查引用表 | JOIN、逗号连接、子查询和 UNION 中的表也需要在白名单内 |
| 拒绝 SELECT INTO、锁定查询及部分有副作用函数 | 查询工具用于读取报表数据，不用于写文件、改表或维护数据库 |
| 查询超时 30 秒 | 这是 JDBC 执行限制，不是整个 Supervisor 请求的总超时 |
| 最多保留 1000 行，额外探测一行判断截断 | 达到上限时显示至少读取 1000 行，不声称知道真实总行数 |
| 向模型最多展示 10 行、8 列 | 先在 SQL 中聚合；12 个月的结果不能直接当作完整的年度数据传给图表 Agent |
| 单个长值目前仍会缩略 | 长分类名、长文本或高精度数值场景，应扩展结构化结果协议后再使用 |

检查 SQL 结构使用项目已有的 JSQLParser，原理可参考其[语法树与表名提取说明](https://jsqlparser.github.io/JSqlParser/usage.html)。这层校验是额外防护，不是完整 SQL 沙箱。数据库只读权限、连接超时、可访问函数和数据库资源限制仍需配置。

::: danger 表白名单不是租户或行级权限
SQL 工具直接通过 JDBC 执行，不能假定会自动经过 MyBatis 的租户拦截器或数据权限插件。当前白名单也是所有使用这组工具的智能体共享的，并不是每个 `agentId` 单独一份。

多租户、部门隔离、个人数据场景，应使用固定业务查询工具，在服务端绑定当前登录身份和过滤条件；或为不同访问范围隔离数据库连接与授权。提示词中的“只能查本部门”不能代替这些控制。允许表内敏感字段也不会因为没有写入提示词就自动隐藏。
:::

## 6. 实战：自然语言生成销售报表 {#report-demo}

目标问题：**“统计 2026 年 8 月各地区已支付销售额，按金额降序生成柱状图，单位元。”**

这个例子使用 12 条合成订单，包含取消订单和月边界数据。先验证查询结果，再验证绘图，这样模型即使给出漂亮图表，你也能检查数据是否正确。

### 6.1 准备演示数据

下载 <a href="/files/agent-report-demo.sql" download>agent-report-demo.sql</a>，在独立测试 MySQL 中由数据库管理员执行。脚本创建 `ruoyi_agent_demo.demo_agent_sales_order`，不会删除已有表；表已存在时应先检查，不要直接反复执行整个脚本。

可在 MySQL 客户端中执行（路径换成文件所在位置）：

```sql
SOURCE D:/demo/agent-report-demo.sql;
```

不要让智能体执行这个初始化脚本：它包含 DDL 和 INSERT，`executeSql` 只接受受限 SELECT。初始化完成后，按上一节设置只读账号、命名数据源 `agent` 和 `AGENT_ALLOWED_TABLES=demo_agent_sales_order`。

| 字段 | 业务含义 |
| --- | --- |
| `id` | 演示订单 ID |
| `paid_at` | 业务时间，示例统一按 Asia/Shanghai 理解 |
| `region` | 华东、华南、华北、西部 |
| `paid_amount` | 金额，`DECIMAL(12,2)`，单位人民币元，不是分 |
| `order_status` | `PAID` 已支付，`CANCELLED` 已取消 |

数据中故意放入 2026-07-31、2026-09-01 和取消订单。它们都不应计入本次报表。用 `[2026-08-01, 2026-09-01)` 的左闭右开区间过滤，能避免遗漏 8 月 31 日晚间订单。

### 6.2 建立“销售报表助手”

在管理端创建智能体：名称填“销售报表助手”，描述填“查询演示销售数据并生成图表”，绑定已验证工具调用能力的聊天模型，状态正常。关联工具、技能、知识库先留空；数据库工具已经由代码装配。

把下面内容放入自定义提示词：

```text
你是销售报表助手。当前只使用允许访问的 demo_agent_sales_order 演示表。
真实数值必须来自 SQL 工具；先列出可用表，再读取所需表结构，再执行 SELECT。
销售额只统计 order_status='PAID'；按 paid_at 过滤；paid_amount 单位为人民币元。
时间按 Asia/Shanghai 业务时间解释，月份使用左闭右开区间。
查询时在 SQL 中聚合，保留列别名、单位、筛选条件、排序和结果是否截断的信息。
没有数据、权限不足、调用错误时说明原因；不要造数，不要将未知值填成 0。
用户只要求查数时返回执行 SQL 和结果表，不调用图表智能体。
用户要求先查询再绘图时，先由 SqlAgent 查询，再将完整结果交给 ChartGenerationAgent。
用户明确指定 EchartsAgent 时，由它在内部完成查询和绘图，不强制经过另两个角色。
已有完整数据的绘图请求直接使用 ChartGenerationAgent，不重复查库。
成功绘图时最终输出一个 echarts 代码块，内容必须是合法 JSON，不含函数或脚本。
图表标题/副标题包含统计月份、指标、单位和必要的筛选条件。
```

保存后，在用户端选中该智能体并新建会话。你不需要分别在后台创建一个“SqlAgent”和一个“ChartGenerationAgent”应用记录；这些是同一个 Supervisor 内部的角色。

### 6.3 第一步：只查数，不画图

发送：

```text
请由 SqlAgent 查询 demo_agent_sales_order：统计 2026 年 8 月各地区已支付订单的
销售额 paid_amount 和订单数 order_count，按销售额降序、地区名称升序排列。
金额单位人民币元。先检查允许的表和表结构，再执行 SQL。
只返回实际执行的 SQL、完整汇总结果和统计口径，不要生成图表。
```

预期执行顺序为 `queryAllTables → queryTableSchema → executeSql`。SQL 不要求每个字符一致，但统计语义应等价于：

```sql
SELECT region, SUM(paid_amount) AS paid_amount, COUNT(*) AS order_count
FROM demo_agent_sales_order
WHERE order_status = 'PAID'
  AND paid_at >= '2026-08-01 00:00:00'
  AND paid_at < '2026-09-01 00:00:00'
GROUP BY region
ORDER BY paid_amount DESC, region ASC
LIMIT 10;
```

结果必须为：

| region | paid_amount | order_count |
| --- | ---: | ---: |
| 华东 | 4000.00 | 3 |
| 华南 | 2400.00 | 2 |
| 华北 | 2000.00 | 2 |
| 西部 | 1200.00 | 2 |

四个地区合计 **9600.00 元、9 笔订单**。地区汇总只有 4 行，不触发 10 行展示上限。工具返回的是类似下面的 Markdown，而不是 `{"data":[...]}`：

```text
| region | paid_amount | order_count |
| --- | --- | --- |
| 华东 | 4000.00 | 3 |
| 华南 | 2400.00 | 2 |
| 华北 | 2000.00 | 2 |
| 西部 | 1200.00 | 2 |

Total: 4 rows
```

若数字不符，先停止绘图，检查取消订单是否被排除、月份边界是否正确、金额单位和连接库是否正确。不要让图表格式掩盖数据问题。

### 6.4 第二步：把准确结果交给图表智能体

在同一会话继续发送：

```text
请由 ChartGenerationAgent 将上一轮实际查询得到的四个地区销售额绘制成柱状图。
沿用上一轮完整数据、筛选条件和排序，不重新查询数据库，不修改或补造数值。
标题为“2026 年 8 月各地区已支付销售额”，纵轴单位为“元”。
最终只输出一个 echarts 代码块，内部是合法 JSON。
若无法从上下文取得完整结果，请明确要求补充，不要猜测。
```

这一轮验证的是 **SQL 结果 → 会话历史 → `ChartGenerationAgent` → 前端图表**。如果历史窗口已丢失数据，可以把上面的准确结果表及其统计口径一起粘贴给它；这时验证的是“对已提供数据绘图”，不要把它记成新的数据库查询成功。

模型样式可以变化，但数据应等价于下面的配置。外层四反引号仅用于文档展示，实际回复使用内部的三反引号：

````text
```echarts
{
  "title": {
    "text": "2026 年 8 月各地区已支付销售额",
    "subtext": "仅 PAID 订单 · 人民币元 · 2026-08-01 至 2026-09-01（不含）",
    "left": "center"
  },
  "tooltip": { "trigger": "axis", "renderMode": "richText" },
  "grid": { "top": 90, "left": 65, "right": 25, "bottom": 45 },
  "xAxis": { "type": "category", "data": ["华东", "华南", "华北", "西部"] },
  "yAxis": { "type": "value", "name": "元" },
  "series": [{
    "name": "已支付销售额",
    "type": "bar",
    "data": [4000, 2400, 2000, 1200],
    "label": { "show": true, "position": "top" }
  }]
}
```
````

横轴顺序应为华东、华南、华北、西部，四根柱子的值分别为 4000、2400、2000、1200。悬浮值应与结果表一致，不能出现人民币元被当作分、类目与数据错位或把订单数画成销售额。

下面用上述 JSON 绘制预期效果，供核对图表内容；这是固定示例数据的预览，不是模型调用截图。

![销售报表预期效果：华东4000元、华南2400元、华北2000元、西部1200元](/images/agent/report-demo-expected.svg)

### 6.5 一句话完成 SQL → 图表协作

前两步分别通过后，新建会话，验证 Supervisor 能在一次请求中完成协作：

```text
请生成 2026 年 8 月各地区已支付销售额柱状图，数据来自 demo_agent_sales_order，
按 paid_at 筛选整月，仅统计 PAID，金额单位元，按销售额降序。
先由 SqlAgent 检查表和字段并执行聚合 SQL，再把 SQL、统计口径、单位和完整结果行
交给 ChartGenerationAgent 生成图表。查询失败、空结果或截断时停止并说明。
最后保留 echarts JSON 代码块，不再用闲聊改写结果。
```

在 `MyAgentListener` 日志中确认 `SqlAgent` 执行后进入 `ChartGenerationAgent`。在工具断点中核对 SQL 和结果；最终图表应与上节一致。

这条路径是**模型根据说明执行的协作策略**，不是硬编码顺序。模型可能选择一个角色、补充查询或未正确转交数据。若业务要求“每次都必须严格先查再画”，按[确定性流程扩展](#deterministic-report)实现，不能仅把提示词当流程引擎。

### 6.6 使用自带的 EchartsAgent 直接查数画图

另建会话发送：

```text
请由 EchartsAgent 查询 demo_agent_sales_order，生成 2026 年 8 月各地区已支付
销售额柱状图。先列出允许表、读取结构，再执行聚合 SELECT；仅统计 PAID，
按 paid_at 使用 [2026-08-01, 2026-09-01) 区间，金额单位元，按销售额降序。
工具返回 Markdown 表格，只用实际返回的完整四行数据，最终返回 echarts JSON。
```

`EchartsAgent` 自己具备三个 SQL 工具，因此不要求先经过 `SqlAgent`。这是另一条内置路径：**`EchartsAgent` 内部查数 → 绘图**。如果日志只出现它，不能称为已经验证了两个不同子 Agent 的协作。

### 6.7 验收记录与追问

| 检查项 | 通过标准 |
| --- | --- |
| 请求模式 | Network 中 `agentId` 正确，没有同时启用工作流 |
| 数据访问 | 三个 SQL 工具使用同一命名数据源，只访问演示表 |
| 查询准确性 | 4 行地区汇总；9600 元、9 笔；取消订单和跨月订单被排除 |
| 协作路径 | 两 Agent 示例确实经过 SqlAgent 和 ChartGenerationAgent；直出示例经过 EchartsAgent |
| 图表协议 | 单个 `echarts` 代码块，合法 JSON，`series` 数值与类目对齐 |
| 页面展示 | 聊天中显示图表，刷新会话后仍能渲染，无图表相关控制台错误 |
| 空数据 | 改问没有订单的月份，说明无数据，不生成虚构销量 |
| 越权访问 | 请求未列入白名单的表，工具在获取查询连接前拒绝 |
| 上下文追问 | “改成折线图”沿用已核对的数据；“改为 9 月”必须重新查询 |

“没有记录”与“结果为 0”不同。若要给没有订单的月份补零，需要明确定义时间序列和补零规则。Top N 图表也应标明“前 N 名”，不能让读者把局部结果理解为全部。

## 7. 接口联调与二次接入 {#api}

### 7.1 管理接口

下表为后端原始路径；前端代理可能增加 `/api` 或 `/dev-api` 前缀，以本地代理配置为准。

| 方法 | 路径 | 权限 / 用途 |
| --- | --- | --- |
| GET | `/agent/agent/list` | `agent:agent:list`，分页列表 |
| GET | `/agent/agent/queryList` | `agent:agent:list`，非分页查询 |
| GET | `/agent/agent/{id}` | `agent:agent:query`，详情 |
| POST | `/agent/agent` | `agent:agent:add`，创建 |
| PUT | `/agent/agent` | `agent:agent:edit`，修改，携带 `id` |
| DELETE | `/agent/agent/{ids}` | `agent:agent:remove`，删除 |
| POST | `/agent/agent/export` | `agent:agent:export`，导出管理数据 |
| GET | `/agent/agent/agentOptions` | 登录后读取启用选项，方法无单独的管理权限注解 |
| GET | `/agent/agent/skillOptions` | `agent:agent:list`，磁盘技能选项 |

创建请求示例，`modelId` 替换成真实模型记录 ID：

```json
{
  "agentName": "销售报表助手",
  "agentDescribe": "查询演示销售数据并生成图表",
  "modelId": 123,
  "enableThinking": "0",
  "systemPrompt": "在此放入报表示例中的完整提示词",
  "mcpToolIds": [],
  "skillNames": [],
  "knowledgeIds": [],
  "status": "0"
}
```

`list` 使用分页结构 `rows` / `total`，详情和选项等接口使用 `R` 包装的 `data`。创建接口返回操作结果，不返回新智能体 ID；创建后查询列表获取 ID。不要从另一套项目复制解包方式，当前管理端封装见 `src/api/agent/agent/index.ts`。

### 7.2 聊天请求与 SSE

必须先有当前登录用户自己的会话。用户端新建聊天会完成这一步；自行接入时可调用 `POST /system/session`，请求 `{"sessionTitle":"销售报表验证"}`，从返回的 `data` 获取会话 ID，该接口需要 `system:session:add` 权限。

```http
POST /chat/send
Content-Type: application/json
Accept: text/event-stream
Authorization: Bearer <当前登录 Token>
```

```json
{
  "agentId": "123",
  "sessionId": "456",
  "content": "请统计演示表中 2026 年 8 月各地区已支付销售额",
  "enableWorkFlow": false
}
```

ID 示例必须替换为真实记录。用字符串传递长整型 ID 可以避免 JavaScript 数值精度问题。智能体绑定模型后可不传 `model`；即使传了其他 `model`，后端也会按智能体配置覆盖。当前服务仍有未绑定模型时使用请求模型的兼容分支，但管理表单和新增接口要求绑定模型，不应把该回退当正常用法。

在已登录浏览器中用 **Copy as cURL** 保留部署实际需要的认证头、客户端头和代理路径，再替换测试问题；不要把含 Token 的命令直接发到 issue。自建客户端需要处理 SSE 内容、完成和错误事件，而不是把响应整体按普通 JSON 解码。HTTP 200 也不能证明子 Agent 工具成功：工具可能将错误作为字符串交回模型。

## 8. 关键代码位置与阅读顺序 {#source-map}

路径均相对于对应仓库根目录。后端表中的 `org/ruoyi/` 位于 `ruoyi-modules/ruoyi-chat/src/main/java/`；可从[后端源码目录](https://github.com/ageerle/ruoyi-ai/tree/main/ruoyi-modules/ruoyi-chat/src/main/java/org/ruoyi)进入查找，未发布的修正以本地源码为准。

| 要理解或修改的行为 | 仓库与文件 | 优先阅读的方法 / 内容 |
| --- | --- | --- |
| 智能体表单字段和默认值 | `ruoyi-admin/apps/web-antd/src/views/agent/agent/data.tsx` | `drawerSchema()` |
| 保存与回显 | 同目录 `agent-drawer.vue`；`src/api/agent/agent/index.ts` | `handleConfirm()`、请求解包 |
| 应用市场选择智能体 | `ruoyi-web/src/pages/app-market/index.vue` | “开始使用”、智能体类型分支 |
| 前端选中状态与聊天参数 | `ruoyi-web/src/stores/modules/agent.ts`；`src/pages/chat/layouts/chatWithId/index.vue` | `currentAgentInfo`、构造 `agentId` |
| 管理 API | 后端 `org/ruoyi/controller/agent/AgentController.java` | CRUD、选项、权限注解 |
| 配置存取与资源关联 | `org/ruoyi/service/agent/impl/AgentServiceImpl.java` | `toVo()`、`queryEnabledOptions()`、JSON 数组转换 |
| 数据库记录和参数校验 | `org/ruoyi/domain/entity/agent/Agent.java`；`domain/bo/agent/AgentBo.java` | `agent_info`、字段和校验 |
| 聊天入口和模式判断 | `org/ruoyi/controller/chat/ChatController.java`；`service/chat/impl/ChatServiceFacade.java` | `sseChat()`、`handleAgentChat()` |
| 会话归属校验 | `org/ruoyi/service/chat/ChatSessionOwnershipGuard.java` | `requireOwned()` |
| 模型适配 | `org/ruoyi/factory/ChatServiceFactory.java`；`service/chat/AbstractChatService.java` | `getOriginalService()`、`buildChatModel()`，以及具体 provider 实现 |
| 子 Agent 职责和输出 | `org/ruoyi/agent/` 下五个接口 | `@SystemMessage`、`@Agent`、`@V("query")` |
| 数据库元数据与白名单 | `org/ruoyi/agent/manager/TableSchemaManager.java` | `getAllowedTableSchemas()`、`getAllowedTableNames()`、`refreshTableSchema()` |
| SQL 执行与限制 | `org/ruoyi/agent/tool/` | 三个工具及 `AgentSqlValidator.validate()` |
| MCP 装配 | `org/ruoyi/mcp/service/core/LangChain4jMcpToolProviderService.java` | `getToolProvider()` |
| 知识库与历史输入 | `ChatServiceFacade.java` | `augmentAgentInput()`、`buildMultiKnowledgeAugmentor()`、`formatHistoryMessages()` |
| 子 Agent 日志 | `org/ruoyi/observability/MyAgentListener.java` | 调用开始、完成、失败事件 |
| 图表代码块识别 | `ruoyi-web/src/utils/markdownRenderers.ts` | `codeXRender`，`echarts` / `json` 分支 |
| 图表配置解析与显示 | `ruoyi-web/src/components/EchartsRenderer/index.vue` | 配置解析、容器尺寸、`echarts.init()`、`setOption()` |
| ECharts 数据协议校验 | `ruoyi-web/src/utils/echartsOption.ts` | `parseEChartsOption()`，提取代码块、校验纯 JSON 和 series |

第一次读源码建议沿一次请求向下跟：前端请求参数 → `sseChat()` → `handleAgentChat()` → 实际被选择的 Agent → 工具 → 最终回复 → 图表渲染。不要从整个 LangChain4j 框架开始读。

## 9. 出了问题怎样排查 {#troubleshooting}

### 9.1 先固定一个最小复现

记录时间、智能体 ID、会话 ID、模型名称、是否绑定知识库/工具，以及一个不含敏感数据的最短问题。报表问题优先使用本页演示表。每次只改变一个条件，避免同时更换模型、提示词、数据库和 MCP 配置。

推荐检查顺序：**请求参数 → 应用配置 → 模型连接/能力 → 路由 → 工具 → 返回数据 → 图表渲染**。

| 现象 | 优先检查 | 具体位置或处理 |
| --- | --- | --- |
| 管理端没有菜单或按钮 | 角色菜单与权限 | `agent:agent:list/add/edit/query`；不是模型配置问题 |
| 应用市场看不到智能体 | 状态、租户、选项接口 | `GET /agent/agent/agentOptions` 是否返回该记录；重新加载选项 |
| 选中了却像普通聊天 | 请求是否带 `agentId` | Network `/chat/send`，随后确认进入 `handleAgentChat()` |
| “智能体不存在 / 已停用” | ID、状态和当前租户 | 刷新选项，检查是否仍使用旧记录或旧缓存 |
| “智能体绑定的模型不存在 / 模型不存在” | 模型记录和名称解析 | 检查 `modelId`，以及由名称再查询配置的结果；同名模型多配置时注意选中来源 |
| 会话不可用 | 会话归属与登录状态 | `requireOwned()`；不能随手编一个 `sessionId` 调聊天 |
| 模型说不支持 tools | 模型及适配器的工具协议 | 普通聊天成功不等于支持 Agent；独立验证 Function Calling |
| 勾选 MCP 却没调用 | 工具是否实际装配、角色是否匹配 | `getToolProvider()`、`WebSearchAgent` 说明、Supervisor 路由 |
| “当前未配置可查询的数据库表” | 白名单、数据源、表缓存 | 实际进程变量、profile、`agent` 连接、表是否存在 |
| 找不到 `agent` 数据源 | 命名动态数据源缺失 | 检查 YAML 缩进和额外配置加载，保留 strict=true |
| 工具返回 `Database schema query failed` | 表结构权限、路由、表名 | 用同一账号执行 `SHOW CREATE TABLE`，再看后端异常类型 |
| 工具返回 `Database query failed` | SQL、权限、超时、连接 | 在开发断点中查看 SQL，用相同只读账号复现；不要改用管理员权限绕过 |
| 只画出前 10 个类目 | SQL 工具展示上限 | 看 `displayed` / `Result truncated`，改成聚合、明确 Top N 或扩展结果协议 |
| 图表数据与查数不同 | 中间结果丢失、重新查询或单位误解 | 分别核对 SQL 结果、传给图表 Agent 的输入和最终 `series` |
| 只有 JSON 文字，没有图表 | 代码块语言和内容结构 | 统一 `echarts`，合法 JSON，检查 `codeXRender` 是否参与渲染 |
| 空白图表或解析报错 | JSON、series、容器尺寸 | `EchartsRenderer`，控制台错误，宽高必须非 0 |
| 修改成 12 个月后缺月份 | 结果超过 10 行或数据库无记录 | 不要直接补猜测值；明确缺失月规则并调整工具 |
| 勾选 Skills 没有文件 | 当前运行时边界 | 使用 Coding Harness；普通 Agent 保存配置但不装配旧 Skills |

### 9.2 日志看什么，断点打在哪里

可按下列关键字筛选自己的后端日志。文件路径换成实际日志文件；不要在公开工单中附上完整数据库结果和 Token。

```powershell
Select-String -LiteralPath .\logs\ruoyi-ai.log `
  -Pattern '处理智能体对话|agent_invocation|sql_tool|chat_operation|chat_rag'
```

| 日志/断点 | 你要核对的证据 |
| --- | --- |
| `sseChat()` 解析 Agent 后 | `agentId` 对应记录、状态、绑定模型、会话归属 |
| `agent_invocation ... status=STARTED/COMPLETED` | 实际运行了 SqlAgent、ChartGenerationAgent 还是 EchartsAgent |
| `QueryAllTablesTool.queryAllTables()` | 模型看到哪些可用表；空白名单与加载失败要区分 |
| `QueryTableSchemaTool.queryTableSchema()` | 表名正确、确实在白名单内、DDL 是否返回 |
| `ExecuteSqlQueryTool.executeSql()` | 真实 SQL、当前数据源路由、超时与工具结果 |
| `sql_tool ... status=FAILED errorType=...` | 工具异常类型；返回给模型的错误已做简化 |
| `chat_operation operation=SUPERVISOR status=FAILED` | Supervisor 整体失败，而不是单个图表样式问题 |
| `chat_rag ... status=FALLBACK` | 知识库失败后回退了普通问题输入 |
| `supervisor.invoke()` 返回后 | 最后结果是否为预期表格/图表，是否被后续角色覆盖 |

当前 `MyAgentListener` 主要记录 Agent 生命周期和计数，不完整打印工具参数和结果；工具自己返回 `Error:` 字符串时，Agent 生命周期也可能显示完成。**“COMPLETED”不等于查询业务成功。** 开发时配合断点或增加脱敏工具事件，并用实际返回行数和状态作为验收证据。

### 9.3 SQL 表列表为空或修改表结构后没生效

`TableSchemaManager` 按需初始化内存缓存，没有给管理端提供自动刷新表结构的按钮，也没有定时刷新。不要以为每次问答都会重新扫描数据库。

依次检查：启动进程实际读到了白名单 → 动态数据源 `agent` 已注册 → 用该账号能连接正确的库 → 表确实存在 → 初始化日志是否失败。开发中修改结构后，可调用现有 `refreshTableSchema(tableName)` 或重启服务；这不是对外可调用的 HTTP 接口，需要在受控代码中使用。

首次加载失败或表在服务启动后才创建时，缓存可能仍为空；修复数据库后优先重启验证。白名单里列出了表，并不意味着账号有权查看它或表结构已成功加载。

### 9.4 一直等待、代理断开或刷新后丢失

先直接测试模型，再检查后端是否已进入异步 `supervisor.invoke()`、是否卡在 MCP 建连、SQL 或模型请求。智能体当前不是 token 流式输出，应将模型多步执行时间、反向代理读超时和 SSE 连接超时一起考虑。

SQL 的 30 秒只限制一次查询，不限制多轮规划。对话断开也不代表模型或 SQL 已自动取消；生产部署需要补充执行预算、总超时和取消传播。当前助手消息在最终结果产生后保存，如果收到完成事件后立即刷新仍偶发缺记录，还应检查消息保存时序和数据库写入异常。

## 10. 如何扩展智能体能力 {#extension}

### 10.1 新增业务工具：优先复用已有服务

已有 Java 业务逻辑时，新增 `@Tool` 方法，调用 Service 层，校验参数并在服务端读取登录身份。返回内容包含执行状态、必要数据和失败原因，避免把异常堆栈或数据库凭据交给模型。

工具有两条接入路径：

- **通过管理端关联**：实现 `BuiltinToolProvider` 并注册，让工具出现在 MCP 工具管理中，再通过 `mcpToolIds` 装配到工具角色；完整可运行示例见[开发 Java 工具](./tools.md#java-tool)。
- **固定提供给某个子 Agent**：在 `AgenticServices.agentBuilder(...).tools(...)` 中明确装配，就像当前 SQL 子智能体。此时它不受后台 MCP 关联列表控制，权限检查需要在工具本身完成。

针对“查询当前用户订单”的场景，比任意 SQL 更合适的接口是 `queryMyOrderSummary(startDate, endDate)`：日期由模型提供，用户和租户由服务端绑定，SQL 和权限固定在业务代码里。不要提供一个让模型自行填写 `userId` 就能跨用户查询的工具。

### 10.2 新增子智能体并让 Supervisor 看得到

在后端 `org/ruoyi/agent/` 新增角色接口。例如对已经取得的数据做统计口径复核：

```java
package org.ruoyi.agent;

import dev.langchain4j.agentic.Agent;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

public interface ReportReviewAgent {
    @SystemMessage("""
        你负责核对已提供报表的统计口径。
        检查时间范围、单位、筛选条件与合计是否一致。
        没有原始依据时说明无法核对，不查询数据库，不补造数值。
        """)
    @UserMessage("请核对以下报表材料：{{query}}")
    @Agent("Review supplied report data, filters, units and totals. Does not fetch data or generate charts.")
    String review(@V("query") String query);
}
```

然后在 `ChatServiceFacade.handleAgentChat()` 中，使用已构建的模型装配：

```java
ReportReviewAgent reportReviewAgent = AgenticServices.agentBuilder(ReportReviewAgent.class)
    .chatModel(plannerModel)
    .listener(new MyAgentListener())
    .build();
```

在原有 `.subAgents(...)` 参数末尾添加 `reportReviewAgent`，并在 `.supervisorContext(...)` 中说明什么时候使用它。还需添加对应 import，再构建运行。只新增接口、只标注 `@Agent` 或只在后台创建同名记录，都不会让 Supervisor 自动发现这个角色。

考虑 `LAST` 的影响：如果复核角色在图表之后执行，用户最终可能只收到复核文字。可以先复核再绘图，或由确定性业务流程统一拼装答案。

### 10.3 把报表改成确定性流程 {#deterministic-report}

对需要稳定口径、可回溯或导出的业务报表，可以把“模型决定每一步”改成“后端明确执行步骤”：

```text
用户问题
  → 模型抽取指标、时间范围、维度（不接受模型决定用户/租户权限）
  → 服务端校验范围、身份和业务口径
  → 执行固定的参数化查询或受限查询计划
  → 产生结构化 ReportData，并校验是否为空或被截断
  → 服务端模板或 ChartGenerationAgent 生成图表
  → 校验 JSON 和数值，再返回图表、来源与摘要
```

上面是建议的扩展方案，当前后台没有切换到该模式的按钮。可在独立报表服务实现，或使用[流程编排](./orchestration.md)组织已有节点；使用工作流时遵守与 `agentId` 互斥的入口约定。

`ReportData` 至少应包含 `columns`、`rows`、单位、筛选条件、数据时间、行数和 `truncated` 标记。`SqlAgent → ChartGenerationAgent` 目前依靠文字转交结果；要求严格的数据一致性时，不应只依赖模型重新描述表格。

### 10.4 扩展查询结果与图表类型

需要展示 12 个月、多个维度或超过 10 行时，先修改 SQL 工具的结果协议，再修改相关 Agent 提示词和消费方，不能只调大 SQL 的 LIMIT。建议采用结构化 JSON、可配置的行数和字节上限、明确的截断标记；避免把大表明细全部塞进上下文。

增加饼图、折线图时，可先保持 `echarts` + 严格 JSON 约定，通过 `series.type` 和数据形状实现。新增前端没有打包的图表扩展时，再安装并注册对应 ECharts 模块。自定义 formatter 应由可信前端代码提供固定模板或字段映射，不执行模型输出的 JavaScript 函数。

当前解析器只接受 JSON 数据及合法的 `series` 结构，兼容 `echarts` / `json` 代码块。旧消息中含函数、单引号对象或无引号键名的 JavaScript 配置需要重新生成合法 JSON；不能通过 `eval` 或 `new Function` 恢复模型生成的代码。

若改造独立 SQL 数据源，必须同时检查元数据管理器、表结构查询和数据查询；三处使用不同库会出现“看得到表但执行时不存在”或误查主库的问题。

### 10.5 发布前建立回归集

至少保留问候、单次工具调用、空白名单、越权表、已知报表、空结果、超过展示上限、跨月边界、上下文改图和模型不支持工具这几类问题。固定数据的报表应断言数字和路由证据，不只断言“回复非空”。

当前 SQL 修正的回归测试位于后端 `src/test/java/org/ruoyi/agent/tool/`，可在 `ruoyi-ai` 根目录执行：

```powershell
mvn -pl ruoyi-modules/ruoyi-chat -am test `
  '-Dtest=AgentAvailabilityTest,AgentSqlValidatorTest,AgentDatabaseToolsTest,DatabaseToolLoggingBoundaryTest' `
  '-Dsurefire.failIfNoSpecifiedTests=false' '-DskipTests=false' '-Dgroups=dev'
```

这组测试验证停用拦截、SQL 结构、拒绝路径、数据源上下文、结果格式和错误日志边界。

在文档仓库执行 `python scripts/verify-agent-report.py`，可以核对示例中的 12 条数据、汇总 SQL 和图表数值是否一致。该脚本使用内存 SQLite 验证 INSERT/SELECT 的统计语义，不验证 MySQL 建表和账号权限。在用户端仓库执行 `node --test tests/agent-chart.test.mjs`（Node.js 22.18+ 或 24），验证纯 JSON 图表解析；启动 Vite 后打开 `/tests/fixtures/agent-chart.html`，可以人工检查柱状图、折线图及错误恢复。

本次已通过 34 项后端用例、7 项图表解析用例、用户端类型检查和构建、文档站构建，并在浏览器验证固定数据绘图和错误恢复。**尚未完成真实 MySQL 只读账号 + 真实模型 + Supervisor 的整条运行验收**；上线前仍按[报表验收表](#_6-7-验收记录与追问)验证，并保存真实调用证据。

## 11. 本页随附修正与上线注意事项 {#changes}

在核对教程时，对直接影响智能体使用的实现做了以下调整：

| 原问题 | 修正后的行为 |
| --- | --- |
| 表结构查询走 `agent`，SQL 执行却未切换路由 | SQL 统一走命名数据源 `agent`；用 `poll()` 恢复调用方上下文 |
| 表结构工具没有检查白名单 | 获取 DDL 前先校验 `AGENT_ALLOWED_TABLES` |
| FROM/JOIN 正则漏掉逗号连接等引用 | 使用语法树检查表引用，拒绝多语句和不支持的写入/锁定形式 |
| 查询结果使用原始列名，别名可能丢失 | 使用 JDBC `getColumnLabel()` 保留 SQL 输出别名 |
| 达到读取上限仍可能被理解为完整总数 | 增加截断说明、查询超时和 JDBC 行数限制 |
| 图表智能体假设 SQL 工具返回 JSON | 说明真实 Markdown 表格协议，要求保留口径并处理空结果/截断 |
| 查询角色与绘图角色职责重叠 | 明确 SqlAgent、ChartGenerationAgent、EchartsAgent 的分工和转交条件 |
| 停用仅影响选项列表 | 聊天入口也拒绝直接传入停用的智能体 ID |
| 图表代码块正则没有捕获正文，且会尝试构造模型生成的函数 | 统一纯 JSON 解析，正确提取代码块；普通 title JSON 不再误判成图表 |
| 更新图表时默认合并可能保留旧系列 | 使用 `notMerge` 替换旧配置，避免新报表混入旧数据 |

更新后先重新构建后端，再启用只读 `agent` 连接。旧版本如果依靠主数据源回退来查询，会需要补齐明确的数据源配置；不能仅更新文档后继续运行旧 jar。

上线时还应逐项确认：生产表和字段的最小权限、数据是否允许传给所选模型供应商、不同租户的隔离方式、模型多步调用预算、请求超时与取消、错误可观测性，以及提示词和代码变更后的回归结果。需要审计依据或固定统计口径时，优先落到受控业务查询和结构化结果中。
