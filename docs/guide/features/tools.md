---
outline: deep
---

# 工具管理

工具让智能体能够读取文件、查询数据或调用业务服务。

管理入口为 **MCP 管理 → MCP 工具管理**。以下行为以 `ruoyi-ai` 后端当前实现为准；模型配置见[模型管理](./model.md)，智能体创建见[智能体管理](./agent.md)。外部协议、连接生命周期和自建服务详解见 [MCP 管理](./mcp.md)，第三方平台操作见[魔搭 ModelScope 接入实战](./mcp.md#modelscope)。

## 1. 选择接入方式

| 你的需求 | 选择 | 需要做什么 |
| --- | --- | --- |
| 使用项目已有的文件、命令或数据库能力 | `BUILTIN` 内置工具 | 准备运行环境，在智能体中关联工具，参考[最小调用示例](#quick-start)。 |
| 将项目内的 Java 业务能力开放给模型 | 新增 `BUILTIN` | 编写带 `@Tool` 的类，实现 `BuiltinToolProvider`，参考[开发 Java 工具](#java-tool)。 |
| 接入由后端启动的 Node.js / Python MCP 服务 | `LOCAL` 本地工具 | 配置启动命令与参数，通过 STDIO 通信，参考[外部 MCP 接入](#external-mcp)。 |
| 接入已部署的 MCP 服务 | `REMOTE` 远程工具 | 配置后端可访问的 Streamable HTTP 地址，参考[外部 MCP 接入](#external-mcp)。 |

`BUILTIN` 在 Java 进程内执行，不需要启动 MCP Server。`LOCAL` 和 `REMOTE` 的一条管理记录代表一个 MCP Server，它可以提供多个模型可调用的函数；当前按管理记录关联，没有逐个选择该 Server 内函数的配置。

::: tip 区分管理名称和调用名称
内置工具的 `getToolName()` 用于注册和匹配 `mcp_tool.name`；模型看到的函数名由 `@Tool(name = "...")` 决定，未指定时使用 Java 方法名。例如，页面中关联 `read_file`，模型实际调用的是 `readFile`。完整对应关系见[内置工具参考](#builtin-reference)。

外部 MCP 记录的名称也只是管理标识，模型调用的函数名和参数由 MCP Server 提供。
:::

## 2. 先跑通一次工具调用 {#quick-start}

先使用已有的文件读取工具验证调用链，不需要安装外部 MCP 服务或配置数据库工具。

### 2.1 准备环境和测试文件

1. 按[本地安装与启动](../getting-started/install.md)运行后端、管理端和用户端。
2. 配置一个支持工具调用（Function Calling）的聊天模型。模型连接测试通过后，仍需验证它能生成工具调用。
3. 确认后端 Java 进程的工作目录。默认内置文件工具使用 `${user.dir}/workspace`，其中 `user.dir` 是后端启动时的工作目录，不是浏览器所在目录。

例如，从 `D:/Project/github/ruoyi-ai` 启动后端时，在该目录的 PowerShell 中准备文件：

```powershell
New-Item -ItemType Directory -Force .\workspace
Set-Content -LiteralPath .\workspace\tool-demo.txt -Value 'RUOYI_TOOL_DEMO_OK' -Encoding utf8
(Resolve-Path -LiteralPath .\workspace\tool-demo.txt).Path
```

后续使用最后一行输出的**绝对路径**。若通过 IDE 启动，检查 Run Configuration 的 Working directory；若通过容器启动，使用容器内的目录和路径。

### 2.2 关联到智能体

1. 打开 **MCP 工具管理**，找到启动时自动同步的 `read_file`。
2. 点击 **测试**，确认它已在后端注册。
3. 打开 **智能体管理 → 智能体列表 → 新增/编辑**，选择已配置的聊天模型。
4. 在 **关联工具** 中选择 `read_file`，保存智能体。
5. 在用户端选择该智能体，开启对话。只选择普通模型不会进入此处的智能体工具装配链路。

![MCP 工具管理中的内置工具和外部工具记录](/images/mcp/runtime/mcp-tool-overview.png)

### 2.3 发起调用并验证结果

将路径替换为上一步得到的绝对路径，再发送：

```text
请使用文件读取工具 readFile，读取 D:/Project/github/ruoyi-ai/workspace/tool-demo.txt，
只返回文件正文。如果工具执行失败，请说明失败原因，不要猜测文件内容。
```

预期回复包含 `RUOYI_TOOL_DEMO_OK`。开发联调时，在 `ReadFileTool#readFile` 设置断点，确认进入方法、`filePath` 正确、返回正文包含测试内容，才能确认实际执行了工具。已有的工具执行日志也可作为辅助证据，但不要仅凭模型回复判断调用成功。

::: info “测试”验证到哪一步
- **BUILTIN**：仅检查管理名称是否已注册，不检查能否创建执行实例，也不执行 `@Tool` 方法。
- **LOCAL / REMOTE**：尝试创建 MCP 客户端，验证连接；不执行具体业务函数。
- 测试接口的成功与否要看 `data.success` 和 `data.message`。失败结果也可能由 `R.ok(...)` 包装返回，HTTP 200 不代表工具可用。

当前测试响应中的 `toolCount` 在成功时固定为 `1`，`tools` 返回管理记录名，不能据此判断 MCP Server 实际提供了多少个函数。
:::

## 3. 开发一个 Java 内置工具 {#java-tool}

适合封装已有 Java 业务逻辑。下面以日期计算为例，不依赖第三方服务，可先验证注册、参数生成和执行流程。

### 3.1 创建工具类

在后端新增文件：

```text
ruoyi-modules/ruoyi-chat/src/main/java/org/ruoyi/mcp/tools/DateOffsetTool.java
```

```java
package org.ruoyi.mcp.tools;

import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import org.ruoyi.mcp.service.core.BuiltinToolProvider;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

@Component
public class DateOffsetTool implements BuiltinToolProvider {

    private static final String DESCRIPTION =
        "计算指定日期增加或减少若干天后的日期。输入和输出均为 yyyy-MM-dd。";

    // 注册表通过无参构造创建执行实例。
    public DateOffsetTool() {
    }

    @Tool(name = "add_days", value = DESCRIPTION)
    public String addDays(
            @P("起始日期，例如 2026-01-01") String date,
            @P("增减天数，正数向后、负数向前，范围 -3650 到 3650") int days) {
        if (date == null || date.isBlank()) {
            return "Error: date 不能为空";
        }
        if (days < -3650 || days > 3650) {
            return "Error: days 必须在 -3650 到 3650 之间";
        }
        try {
            return LocalDate.parse(date).plusDays(days).toString();
        } catch (DateTimeParseException e) {
            return "Error: date 必须是有效的 yyyy-MM-dd 日期";
        }
    }

    @Override
    public String getToolName() {
        return "add_days";
    }

    @Override
    public String getDisplayName() {
        return "日期偏移计算";
    }

    @Override
    public String getDescription() {
        return DESCRIPTION;
    }
}
```

这几个声明分别负责：

| 声明 | 用途 |
| --- | --- |
| `@Component` + `BuiltinToolProvider` | 让 Spring 发现工具，交给 `BuiltinToolRegistry` 注册。 |
| `getToolName()` | 内置工具登记名，必须唯一，并与数据库中的名称一致。 |
| `@Tool(name, value)` | 定义模型实际看到的函数名和用途。建议新工具显式指定 `name`，与登记名保持一致。 |
| `@P` | 说明参数的含义和格式，帮助模型构造参数；业务方法仍需校验输入。 |
| `getDisplayName()` / `getDescription()` | 提供元数据。模型函数描述来自 `@Tool`，不能只修改这两个方法。 |

当前注册表生成数据库同步定义时将 `description` 置为空字符串，初始化器也会同步该值。因此，`getDescription()` 的内容目前不会自动显示在工具管理的描述字段中。

### 3.2 注册和验证

1. 重新编译并启动后端，确保新类进入 Spring 扫描范围。
2. 在启动日志中确认 `注册内置工具: add_days`。`SystemToolInitializer` 会自动创建 `type=BUILTIN`、`status=ENABLED` 的记录，不需要手工插入 SQL。
3. 在工具管理中找到 `add_days` 并测试注册状态，再关联到智能体。
4. 发送“请调用 add_days，计算 2026-01-01 增加 7 天后的日期”。在 `addDays` 设置断点，预期参数为 `date="2026-01-01"`、`days=7`，结果为 `2026-01-08`。

也可以先直接调用 `new DateOffsetTool().addDays("2026-01-01", 7)` 验证方法逻辑，再进入模型联调。

内置工具由代码管理：当前管理 API 不允许新增、编辑、删除或切换其状态，也不允许把外部工具转换为 `BUILTIN`。控制某个智能体使用哪些普通内置工具，应调整其关联工具；SQL 子智能体的特殊行为见[代码装配](#tool-assembly)。

### 3.3 接入业务 Service 时的注意点

`BuiltinToolRegistry` 存储的是工具类，运行时调用 `getDeclaredConstructor().newInstance()` 创建新对象，**执行实例不是 Spring 注入的那个 Bean**。

- 保留可用的无参构造。只有带参构造时，可能注册测试成功，但实际装配失败。
- 不要依赖工具实例上的 `@Autowired` 字段、构造注入或 `@Transactional` 代理生效。现有 SQL 工具在方法执行时通过 `SpringUtils.getBean(...)` 延迟取得业务依赖，可参考这一方式。
- 将事务、当前用户的数据权限和业务校验放在实际调用的 Spring Service 中；工具参数中的用户 ID 不能代替服务端鉴权。
- 工具方法尽量保持无状态，返回模型能继续处理的结果或明确错误。描述中写明使用场景、参数单位和返回含义。

如果需要统一支持构造注入，应先扩展注册表的实例创建策略，再按新的策略编写工具类。

## 4. 接入外部 MCP 服务 {#external-mcp}

外部服务无需实现 Java 接口。在 **MCP 工具管理 → 新增** 中填写名称、描述、类型和配置信息，状态选择 **启用**；保存后测试连接，再按[前面的步骤](#quick-start)关联智能体。

### 4.1 LOCAL：由后端启动服务

配置信息填写单个 Server 的 JSON，不要在外层再包一层 `mcpServers`。例如，接入文件系统 MCP 服务：

```json
{
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "D:/Project/github/ruoyi-ai/workspace"
  ]
}
```

将目录替换为后端机器上的实际目录，并提前创建。这里的目录由 MCP Server 的参数决定，与 Java 内置文件工具的默认 workspace 分开配置。

| 字段 | 当前后端行为 |
| --- | --- |
| `command` | 必填，单独填写可执行命令，不把参数拼在这个字段中。 |
| `args` | 字符串数组，每个参数单独一项。 |
| `env`、`cwd` 等其他字段 | 当前解析代码不读取，填写也不会按通用 MCP 客户端配置生效。 |

在**运行后端的账户和环境**中先确认命令可执行，例如 `npx --version`。后端会执行 `command --version`，要求进程在 5 秒内退出，然后再用配置中的参数启动 MCP Server。服务应使用 STDIO 协议，普通日志输出到 stderr，避免污染 stdout 上的协议消息。

Windows 当前会把裸命令 `npx`、`npm`、`node`、`pnpm`、`yarn`、`uv`、`uvx` 追加 `.cmd`。若实际安装的是 `node.exe` 或 `uv.exe`，应填写实际可执行文件名或绝对路径，例如 `C:/Program Files/nodejs/node.exe`，避免被错误解析为 `.cmd`。

子进程环境会经过 `ChildProcessSecretSanitizer` 处理，其中后端的 `DEEPSEEK_API_KEY` 会被屏蔽。需要给 MCP 服务提供凭据时，应单独设计部署或凭据注入方式，不能假定配置 JSON 的 `env` 或后端模型 Key 会自动传入。

### 4.2 REMOTE：连接已部署的服务

类型选择 **远程工具**，配置信息示例：

```json
{
  "baseUrl": "https://mcp.example.com/mcp"
}
```

`mcp.example.com` 是格式示例，必须替换为自己的 MCP 端点。当前后端只读取 `baseUrl`，使用 `StreamableHttpMcpTransport`；只支持旧式 SSE 的服务不能直接视为兼容。

地址须从后端网络可达。配置中的 `headers`、`auth` 等字段目前不会被使用；有认证需求时，需要扩展 `createRemoteClient` 或由受控代理提供认证，不能仅靠表单新增字段完成接入。

### 4.3 修改配置与使用市场

连接配置 `configJson` 是**只写字段**：列表、详情和导出不返回原始连接 JSON。编辑时留空会保留已保存配置；需要修改时提交完整的新 JSON，不要把详情中的空值当作配置丢失，也不要依赖留空来清除配置。

外部工具保存修改、启停或删除时会移除已缓存的客户端引用，下次装配按数据库配置创建。连续创建或健康检查失败达到 3 次，会触发当前后端进程内 5 分钟的暂时停用；普通业务函数报错并不等同于这里的连接失败计数。修改配置不会清除这段停用时间，修复后可等待到期，或重启后端清理内存状态。

也可以从 **MCP 市场管理** 选择市场工具并加载，再到工具管理中检查运行配置、测试和关联。市场列表依赖已配置的市场源，不是使用 Java 工具或手工接入 MCP 的前置条件。

## 5. 在后端代码中装配工具 {#tool-assembly}

### 5.1 普通智能体的实际调用路径

`ChatServiceFacade#handleAgentChat` 读取智能体的 `mcpToolIds`，调用 `LangChain4jMcpToolProviderService#getToolProvider`。该服务按 ID 读取启用记录，并将 Java 工具和 MCP 客户端合并为 LangChain4j 的 `ToolProvider`。

| 层次 | 当前行为 |
| --- | --- |
| 管理数据 | `mcp_tool` 保存工具记录，智能体的 `mcpToolIds` 保存关联记录 ID。 |
| 工具装配 | `BUILTIN` 创建实例并用 `ToolService.findTools` 发现方法；`LOCAL / REMOTE` 创建或复用 MCP 客户端。 |
| 智能体执行 | 关联工具提供给 `WebSearchAgent`，Supervisor 决定是否调度它，再由子智能体调用具体函数。 |

::: info 关联工具的作用范围
当前 `SqlAgent` 和 `EchartsAgent` 通过 `.tools(new QueryAllTablesTool(), new QueryTableSchemaTool(), new ExecuteSqlQueryTool())` 直接装配 SQL 工具，独立于 `mcpToolIds`。取消关联 SQL 工具不会关闭这两个子智能体的 SQL 能力。

Coding Harness 另有工具注册与执行机制，本页的配置不会自动修改 Harness 的工具集。
:::

`WebSearchAgent` 的当前职责描述偏向搜索和浏览器。接入日期计算、订单查询等业务工具后，如果 Supervisor 没有调度它，需要同步调整该子智能体的 `@Agent` 职责描述、系统提示词，或在 `handleAgentChat` 中增加对应业务子智能体；单纯修改管理页的工具描述不会改变这层路由。

### 5.2 在自定义调用链中复用

业务服务中注入 `LangChain4jMcpToolProviderService`，取得 `ToolProvider` 后交给已有的 AI Service / Agent builder。下面是沿用当前 `WebSearchAgent` 的装配片段；`plannerModel` 为已构建的聊天模型，`agentVo` 为已加载且校验可访问的智能体配置：

```java
ToolProvider toolProvider = langChain4jMcpToolProviderService
    .getToolProvider(agentVo.getMcpToolIds());

WebSearchAgent searchAgent = AgenticServices.agentBuilder(WebSearchAgent.class)
    .chatModel(plannerModel)
    .toolProvider(toolProvider)
    .build();
```

| 获取方法 | 使用场景 |
| --- | --- |
| `getToolProvider(List<Long> toolIds)` | 按智能体绑定的记录 ID 装配，过滤禁用记录、空 ID 和重复 ID；空列表返回空工具集。 |
| `getToolProviderByNames(List<String> toolNames)` | 按数据库管理名称装配启用记录，例如 `read_file`。 |
| `getAllEnabledToolsProvider()` | 装配全部启用记录，仅用于确实需要全量工具的调用方。 |

`ToolProviderFactory#getAllEnabledMcpToolsProvider()` 委托给上面的全量方法；`getAllBuiltinToolObjects()` 则直接从注册表创建所有内置工具，不读取数据库启用状态。按智能体配置控制工具范围时，使用按 ID 装配的入口。

## 6. 内置工具参考 {#builtin-reference}

以下为当前通过 `BuiltinToolProvider` 注册的 9 个工具，不包含 Coding Harness 的独立工具集。

| 管理名称 | 模型函数与参数 | 行为 |
| --- | --- | --- |
| `read_file` | `readFile(filePath)` | 读取 UTF-8 文件，正文按 32 KiB 截断，并附加文件信息。 |
| `list_directory` | `listDirectory(filePath, recursive, maxDepth)` | 列出目录，递归深度允许 1～10。 |
| `write_file` | `writeFile(filePath, content)` | 新建或整体覆盖文件，会创建父目录。 |
| `edit_file` | `editFile(filePath, diff)` | 替换已有文件的完整内容，`diff` 不是补丁格式。 |
| `delete_file` | `deleteFile(filePath, recursive)` | 删除文件或目录，非空目录须传 `recursive=true`。 |
| `execute_command` | `executeCommand(command)` | 执行白名单命令，30 秒超时，返回 stdout/stderr 末尾 8 KiB。 |
| `query_all_tables` | `queryAllTables()` | 返回白名单中已加载的表结构摘要。 |
| `query_table_schema` | `queryTableSchema(tableName)` | 校验表名格式和白名单，执行 `SHOW CREATE TABLE` 返回 DDL。 |
| `execute_sql_query` | `executeSql(sql)` | 校验单条 SELECT 与语法树中的引用表，查询超时 30 秒，最多保留 1000 行，正文展示前 10 行、8 列并提示截断。 |

### 6.1 文件和命令工具

默认文件工具只接受 `${user.dir}/workspace` 内的绝对路径，并通过 `WorkspaceGuard` 检查路径范围。`executeCommand` 将工作目录设为该 workspace，但这只是进程工作目录，不是操作系统沙箱。

当前命令白名单：

```text
npm pnpm yarn git mvn gradle java javac python python3 pip
node tsc eslint prettier cat ls dir echo
```

命令使用 `ProcessBuilder(List)` 执行，不经过 shell；拒绝 `&`、`|`、`;`、反引号、`$`、`<`、`>`、换行和回车。当前按空白拆分参数，不解析引号，因此带空格路径、管道和重定向不能按终端命令直接照搬。白名单内的命令还必须是后端环境中可启动的程序，不能把 PowerShell / shell 内建命令当作已安装的可执行文件。

### 6.2 数据库工具

表白名单使用 `AGENT_ALLOWED_TABLES`，多个表名以英文逗号连接、不加空格，不支持 `*` 通配符。开发配置默认为空；例如在**启动后端的同一终端**设置：

```powershell
$env:AGENT_ALLOWED_TABLES = 'sys_dict_type,sys_dict_data'
```

随后按项目启动方式重启后端；IDE 启动时配置到对应 Run Configuration 的环境变量。目标表必须存在于实际使用的数据源中。

联调前还要检查数据源：`TableSchemaManager` 使用 `@DS("agent")`，配套修正后的 `queryTableSchema` 和 `executeSql` 也显式切换到 `agent`。开发配置中的 `agent` 数据源默认被注释，且 `strict=true`，因此必须显式配置只读的命名动态数据源；不能仅设置白名单或依赖主库回退。完整配置、版本边界与报表示例见[智能体 SQL 配置](./agent.md#sql-config)。

可以先调用 `queryAllTables` 查看可查询表，再用 `executeSql` 执行带明确列名和 `LIMIT` 的查询。

::: warning 当前白名单的边界
配套修正为 `queryTableSchema` 补齐了白名单检查，并使用 `AgentSqlValidator` 对 SQL 表引用进行语法树校验。旧版本若仍使用正则或未切换 SQL 数据源，需要先更新对应实现。这些检查仍不等于完整的数据库权限隔离：直接 JDBC 查询不自动应用 MyBatis 行级权限，白名单也由所有 SQL 子智能体共享。对业务用户开放前，必须由数据库只读账户限制表权限，并通过受控业务工具或隔离连接落实用户、部门和租户边界。
:::

## 7. 管理接口速查

以下路径相对于后端 API 地址，请复用项目现有的登录请求头。

| 功能 | 方法与路径 | 参数 / 权限 |
| --- | --- | --- |
| 分页列表 | `GET /mcp/tool/list` | `name`、`type`、`status`、分页参数；`mcp:tool:list`。 |
| 非分页列表 | `GET /mcp/tool/all` | `keyword`、`type`、`status`；`mcp:tool:list`。 |
| 智能体下拉选项 | `GET /mcp/tool/options` | 仅启用记录；具备 `agent:agent:list`、`agent:agent:add`、`agent:agent:edit` 中任一权限。 |
| 详情 | `GET /mcp/tool/{id}` | `mcp:tool:query`；不回显连接 JSON。 |
| 新增外部工具 | `POST /mcp/tool` | `McpToolBo` JSON；`mcp:tool:add`。 |
| 修改外部工具 | `PUT /mcp/tool` | 请求体包含 `id`；`mcp:tool:edit`。 |
| 启停外部工具 | `PUT /mcp/tool/{id}/status?status=ENABLED` | 状态为 `ENABLED` / `DISABLED`；`mcp:tool:edit`。 |
| 删除外部工具 | `DELETE /mcp/tool/{ids}` | 多个 ID 以逗号分隔；`mcp:tool:remove`。 |
| 测试注册 / 连接 | `POST /mcp/tool/{id}/test` | 检查 `data.success`；`mcp:tool:test`。 |
| 导出列表 | `POST /mcp/tool/export` | `mcp:tool:export`。 |

新增远程工具的请求体示例：`configJson` 是 **JSON 字符串**，不是嵌套对象。下面仅展示请求格式，地址需替换为真实端点。

```json
{
  "name": "business-mcp",
  "description": "业务查询服务",
  "type": "REMOTE",
  "status": "ENABLED",
  "configJson": "{\"baseUrl\":\"https://mcp.example.com/mcp\"}"
}
```

新增接口返回 `R<Void>`，不直接返回新 ID；保存后从列表中取得记录 ID，再测试和绑定。工具名称必填且不超过 200 字符，类型按上表使用大写值。

## 8. 按调用阶段排障

| 现象 | 优先检查 |
| --- | --- |
| 新写的 Java 工具不在管理列表中 | 类是否实现 `BuiltinToolProvider`、是否被 Spring 扫描、是否重新编译启动；检查注册与数据库同步日志。 |
| 内置工具测试成功，实际不可用 | 是否有可用的无参构造、是否包含 `@Tool` 方法、是否依赖未注入的字段；检查 `getBuiltinToolObject` 和 `ToolService.findTools`。 |
| 改了描述但模型行为没变 | 模型描述来自 `@Tool` 或 MCP Server；管理记录描述不会覆盖函数定义。 |
| 找不到工具 / 工具未被调用 | 核对管理名称与函数名、记录状态、智能体关联 ID；在 `handleAgentChat` 检查装配结果和 Supervisor 是否调度了 `WebSearchAgent`。 |
| LOCAL 报命令不可用 | 用后端账户运行 `command --version`；检查 PATH、5 秒退出限制、Windows `.cmd` 解析。 |
| LOCAL 连接失败或一直等待 | 命令参数是否分项、服务是否支持 STDIO、stdout 是否混入普通日志。 |
| REMOTE 连接失败 | 后端能否访问 `baseUrl`，服务是否支持 Streamable HTTP，是否缺少当前代码尚未接入的认证。 |
| 编辑表单的配置是空的 | 连接配置不回显；留空保留旧值，修改时提交完整新 JSON。 |
| 修复配置后仍被暂时停用 | 客户端缓存刷新不会清除 5 分钟停用计时；等待到期或重启后端。 |
| 文件读取失败 | 使用后端 workspace 内的绝对路径，确认 IDE 工作目录 / 容器路径和文件权限。 |
| 数据库为空、报错或查到不同库 | 检查白名单、`agent` 数据源、表结构缓存，以及 `executeSql` 的数据源路由。 |
| HTTP 200，但工具执行失败 | 查看测试响应的 `data.success`，或在工具方法断点检查实际返回值；方法返回 `Error: ...` 不一定触发 HTTP 异常。 |

当前通用 MCP 客户端创建代码没有挂载 `MyMcpClientListener`；该监听器即使在其他链路挂载，也主要推送状态，不提供完整参数和结果。联调本页链路时，以工具方法断点、实际返回值和已接入的日志为准，不把“必须收到 MCP SSE 明细”设为验收条件。

需要继续定位时，下表路径均相对于后端的 `ruoyi-modules/ruoyi-chat/src/main/java/org/ruoyi/`：

| 要修改或检查的行为 | 代码入口 |
| --- | --- |
| 工具接口与自动发现 | `mcp/service/core/BuiltinToolProvider.java`、`mcp/service/core/BuiltinToolRegistry.java` |
| 启动时同步内置记录 | `config/mcp/SystemToolInitializer.java` |
| 按 ID 装配、MCP 配置解析和客户端缓存 | `mcp/service/core/LangChain4jMcpToolProviderService.java` |
| 管理 API、只写配置和内置记录保护 | `controller/mcp/McpToolController.java`、`service/mcp/impl/McpToolServiceImpl.java` |
| 智能体绑定与子智能体装配 | `service/chat/impl/ChatServiceFacade.java`、`agent/WebSearchAgent.java` |
| 文件与命令实现 | `mcp/tools/` |
| SQL 查询和白名单 | `agent/tool/`、`agent/manager/TableSchemaManager.java` |
