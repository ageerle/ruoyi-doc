---
outline: deep
---

# 流程编排

流程编排把用户输入、模型、知识库和外部服务连接成可复用的 AI 工作流（AI Flow）。你可以在管理端画布上定义处理步骤和执行顺序，调试通过后交给用户端使用，也可以通过 API 接入自己的业务页面。

当前默认提供**开始、结束、生成回答、条件分支和网络搜索**节点，可用于接收输入、生成内容、搜索资料和按条件选择执行路径。**知识检索、图片生成、邮件发送和 HTTP 请求**也已有实现，需先初始化对应节点并配置依赖，具体条件见[当前版本的真实能力](#当前版本的真实能力)。

本页先解释节点、连线和变量等概念，再介绍管理端搭建与测试、Web 用户端使用和 API 接入。发布检查助手作为完整示例，演示输入如何经过条件分支生成结果；后续各节分别介绍模型问答、知识检索等节点的配置。

| 你要完成的事情 | 从这里开始 |
| --- | --- |
| 搞清楚节点、连线、变量、运行之间的关系 | [先理解 6 个概念](#先理解-6-个概念) |
| 从零搭建、测试一条完整业务流程 | [实操：北辰项目发布检查助手](#实操-北辰项目发布检查助手) |
| 让普通用户在聊天页使用流程 | [交付到 Web 用户端](#交付到-web-用户端) |
| 把流程嵌入自己的业务页面 | [开发者接入：两种调用方式](#开发者接入-两种调用方式) |
| 接入模型、知识库、HTTP 等节点 | [当前版本的真实能力](#当前版本的真实能力)及后面的节点说明 |

## 先理解 6 个概念

管理端画布基于 Vue Flow，后端将节点和连线编译为 LangGraph4j `StateGraph` 执行图，并通过 SSE 将运行状态推送到调试页。搭建流程前，先了解以下概念：

| 概念 | 在页面中对应什么 | 开发时怎么理解 |
| --- | --- | --- |
| 流程定义 Workflow | 名称、画布上的全部节点和连线 | 一份可保存的执行配置，用 `uuid` 标识 |
| 节点 Node | 开始、条件分支、生成回答、结束等卡片 | 一步操作，包含输入和 `nodeConfig`；节点也有自己的 UUID |
| 连线 Edge | 节点之间的线 | 决定下一步执行谁；**连上线不等于配置好变量** |
| 用户输入 | 开始节点的“输入”表格 | 流程对外的参数协议，定义名称、标题、类型、必填性 |
| 引用变量 | 下游节点属性面板中的“输入” | 从已执行节点取一个字段，并取本节点使用的别名 |
| 运行实例 Runtime | 管理端“运行与调试”的一次提交 | 同一流程可执行多次；每次有独立 runtime UUID、节点输入输出和状态 |

例如，用户输入的参数叫 `question`，页面标题可以叫“本次变更”；结束节点引用条件分支的 `output`，在本节点命名为 `question`，结果模板就使用 `{question}`。**字段的显示标题、原字段名和本节点别名是三件事。**

```json
{
  "inputConfig": {
    "user_inputs": [],
    "ref_inputs": [
      {
        "name": "question",
        "node_uuid": "替换为条件分支节点UUID",
        "node_param_name": "output"
      }
    ]
  },
  "nodeConfig": {
    "result": "本次变更：{question}"
  }
}
```

读法：从 `node_uuid` 对应节点取得 `output` → 放入结束节点的 `question` → 替换模板里的 `{question}`。占位符使用单层花括号，名称必须与引用变量别名一致。

::: tip 保存、公开、启用分别解决不同问题
**保存**更新当前流程定义；**公开**决定是否进入其他用户的应用列表；**启用**决定是否允许运行。新建流程默认启用。本版本没有独立的“发布版本快照”：修改并保存公开流程，会影响后续运行。要试验新配置，先新建一条测试流程。
:::

## 实操：北辰项目发布检查助手

场景：开发者准备发布一个版本，需要根据目标环境生成检查清单。输入“变更内容、发布环境、发布版本”；环境为 `prod` 时输出生产清单，其他值走常规验证清单。

这个案例使用真实节点和后端执行链路，不调用外部模型、不发送邮件、不执行部署。“北辰项目”、负责人和检查项是教程演练资料，接入业务时替换成团队自己的发布规范。

完成后你会得到下图的 4 个节点、3 条连线。每次运行只经过一个结束节点，因此执行详情里应出现 **3 个节点**。

![发布检查助手完整画布：开始、判断发布环境、两个结束节点](/images/workflow/tutorial-canvas.png)

*左侧为组件库，中间为执行路径，右上角为保存与运行。条件分支的“分支 1”和“默认分支”分别连接不同的结束节点。*

### 1. 创建流程

先按[本地安装](../getting-started/install.md)启动服务。本地默认：文档 `5173`、Web 用户端 `5174`、管理端 `5666`、后端 `6039`；以各项目启动日志为准。

1. 登录管理端，进入 **对话管理 → 编排管理**。不要进入侧边栏的“工作流 / 我的任务”，那是业务审批模块。
2. 点击 **新建工作流**，名称填写 `北辰项目 · 发布检查助手`。
3. 备注说明它需要什么输入、返回什么结果；“是否公开”先关闭。
4. 确认后进入设计器，保留自动生成的开始节点。

![管理端新建工作流，填写名称和用途](/images/workflow/tutorial-create.png)

### 2. 定义开始节点的输入

点击画布上的 **开始**，将“开场白”留空，依次通过“+新增”创建三个变量：

| 名称 | 标题（显示名称） | 类型 | 必填 | 测试值 |
| --- | --- | --- | --- | --- |
| `question` | 本次变更 | 文本 | 是 | 优化知识检索超时处理 |
| `environment` | 发布环境 | 文本 | 是 | `prod` |
| `version` | 发布版本 | 文本 | 是 | `v1.8.0` |

**保持 `question` 是第一个文本字段。** 现有 Web 聊天接入会把每轮消息填入第一个文本输入，其余字段使用进入对话前填写的值。

![开始节点：开场白留空，定义三个必填文本参数](/images/workflow/tutorial-inputs.png)

*名称是 API 参数键；标题用于生成管理端和用户端表单。开场白不是输入框提示语，填写后会覆盖开始节点的正常输出。*

::: tip 默认 output 与跨节点引用
开始节点会为后续执行提供默认 `output`。当前实现还会在向下一节点传递时将默认输出转为 `input`，所以跨多步重复引用开始节点的 `output` 可能取不到值。本例让变更内容沿“开始 → 条件分支”传递，再由结束节点引用**条件分支的 `output`**；环境和版本仍引用开始节点的具名字段。
:::

### 3. 配置条件分支与连线

从组件库拖入 **条件分支**，命名为 `判断发布环境`；再拖入两个 **结束**，分别命名为 `生产发布清单` 和 `常规验证清单`。

1. 从开始节点右侧连接点连接到条件分支左侧。
2. 点击条件分支，在规则中新增一条条件：来源 **开始**，字段 **发布环境 / environment**，运算符 **等于**，比较值 `prod`。
3. 本条规则的目标选择 **生产发布清单**；多条件运算保持“全部满足”（`and`）。
4. 默认目标选择 **常规验证清单**。
5. 将分支 1 的连接点连接到生产发布清单；默认分支连接点连接到常规验证清单。

![条件分支属性：环境等于 prod 时走生产清单，否则走默认分支](/images/workflow/tutorial-branch.png)

*规则中的目标节点与画布连线要一致。`prod` 是精确匹配，`PROD`、`test`、其他字符串都走默认分支；本例只生成清单，不据此执行真实部署。*

### 4. 配置两个结束节点

点击 **生产发布清单**，在“输入”里新增三个引用变量。**先选择来源，再将左侧变量名改为下表中的别名。**

| 本节点变量名 | 来源节点 | 来源字段 | 模板用法 |
| --- | --- | --- | --- |
| `question` | 判断发布环境 | `output`（节点的输出） | `{question}` |
| `environment` | 开始 | 发布环境 `environment` | `{environment}` |
| `version` | 开始 | 发布版本 `version` | `{version}` |

在“最终结果模板”粘贴：

```markdown
# 北辰项目 · 生产发布检查单

- 发布环境：{environment}
- 发布版本：{version}
- 本次变更：{question}

1. 发布前确认数据库备份与回滚版本。
2. 联系发布负责人林小满，确认维护窗口。
3. 检查后端 6039 端口与健康检查结果。
4. 发布后验证登录、对话和知识检索。
5. 记录验证结果，再通知业务方。

> 此流程只生成检查单，审批与部署由现有发布制度执行。
```

![结束节点：配置引用变量，并用别名编辑最终结果模板](/images/workflow/tutorial-variables.png)

*上半部分定义“从哪里取值”，下半部分定义“怎样返回”。如果没有看到变量选择器和多行模板框，请更新管理端的流程设计器代码。*

点击 **常规验证清单**，配置同样的三个引用变量，模板改为：

```markdown
# 北辰项目 · 常规验证检查单

- 发布环境：{environment}
- 发布版本：{version}
- 本次变更：{question}

1. 确认这是非生产环境；生产发布请将环境填写为 prod。
2. 检查后端 6039 端口与健康检查结果。
3. 回归本次变更，并保存测试记录。
4. 验证通过后，再准备生产发布检查单。

> 示例项目资料用于教程演练，此流程不会执行部署。
```

### 5. 在管理端运行并检查结果

点击右上角 **保存 → 运行**。若出现提示，选择“保存并运行”。运行页会根据开始节点定义生成三个输入框。

先填写 `优化知识检索超时处理`、`prod`、`v1.8.0`，点击 **提交**。展开“流程执行详情”，向下找到结束节点：

- 开始节点的输入应包含三个实际值。
- 条件分支输出的 `matched_case` 应为 `1`，`target_node` 指向生产发布清单。
- 执行节点依次为“开始 → 判断发布环境 → 生产发布清单”。
- 结束节点 `output` 包含完整检查单，三个占位符都已替换。

![管理端生产分支实际运行结果：结束节点输出完整发布检查单](/images/workflow/tutorial-admin-prod.png)

*“执行成功”说明图执行结束，还要检查业务结果。只看到“流程已执行完毕”之类提示，不等于已取得结束节点输出。*

再运行一次，将环境改为 `test`。当前运行页执行完成后会清空表单，需要重新填入其他参数。

![管理端默认分支实际运行结果：返回常规验证检查单](/images/workflow/tutorial-admin-test.png)

用下面的表格验收，而不是只点击一次“运行”：

| 输入变化 | 预期结果 |
| --- | --- |
| `environment=prod` | 生产发布清单；`matched_case=1` |
| `environment=test` | 常规验证清单；`matched_case=default` |
| `environment=PROD` | 默认分支，验证大小写与精确匹配 |
| 修改本次变更、版本 | 最终结果同步变化，没有上次运行内容 |
| API 请求中省略必填 `version` | 返回 `[ERROR]`，不能当作成功 |

::: details 使用代码创建同一案例
下载 [流程创建脚本](/files/create-release-workflow.mjs)。它通过现有接口创建一条新的非公开流程，并根据组件名查找组件 ID；不会覆盖已有流程。每次调用都会新建一条记录。

在管理端项目中可这样使用（将下载文件放到调用文件同级）：

```ts
import { requestClient } from '#/api/request'
import { createReleaseWorkflow } from './create-release-workflow.mjs'

const workflow = await createReleaseWorkflow((method, path, body) =>
  method === 'GET'
    ? requestClient.get(path)
    : requestClient.post(path, body),
)
console.log(workflow.uuid) // 打开 /aiflow/edit/<uuid> 检查并运行
```

这是开发辅助代码，不是现有设计器的“JSON 导入”按钮。本版本没有对应的导入入口。脚本创建后的节点仍可在画布上编辑。
:::

## 交付到 Web 用户端

### 1. 公开已验证的流程

回到管理端 **编排管理** 列表，找到本例，点击 **编辑**，开启“是否公开”，确认保存。公开列表只返回**公开、启用且未删除**的流程；这不等于允许匿名调用，用户端仍需登录。

![管理端编辑流程基本信息，开启是否公开](/images/workflow/tutorial-public.png)

### 2. 从应用市场进入

登录 Web 用户端，进入左侧 **应用市场**，切到 **工作流**；可以按流程名称搜索 `北辰`。点击对应卡片“开始使用”。

![Web 应用市场：工作流筛选、搜索和发布检查助手卡片](/images/workflow/tutorial-web-market.png)

单个文本输入的流程会直接进入对话；本例有多个字段，因此先出现参数表单。填入 **发布环境 `prod`、发布版本 `v1.8.0`**，点击“进入对话”。“本次变更”留给聊天框填写。

![Web 参数表单：预填环境和版本，本次变更由聊天框提供](/images/workflow/tutorial-web-inputs.png)

### 3. 发送消息并获得结果

确认输入框附近显示 **工作流 · 北辰项目 · 发布检查助手**，输入 `优化知识检索超时处理` 并发送。一次消息触发一次完整流程运行。

![Web 聊天页实际返回发布检查单与执行完成状态](/images/workflow/tutorial-web-result.png)

*流程完成后，回答区展示结束节点的最终结果；状态行显示实际执行的节点数量。中间过程文本可能先出现，完成时会替换为最终检查单。*

需要注意以下使用约定：

- 后续消息会替换第一个文本输入，环境和版本沿用预填值。要更换预填参数，重新从应用市场打开该流程。
- 选择智能体或“切换到模型”会退出工作流模式。流程内的模型由生成回答节点配置，聊天页选中的模型不会替换它。
- 当前应用市场支持文本、数字和布尔输入；文件等其他类型会提示到管理端运行，不能直接在此表单上传。
- “停止”终止浏览器接收，不保证后端已取消正在执行的外部操作。
- 当前后端部分工作流消息保存逻辑尚未实现，刷新后不应依赖完整聊天记录恢复本次运行。需要审计或恢复业务状态时，由业务层保存 runtime UUID、输入和最终结果。

## 开发者接入：两种调用方式

### 接入现有聊天页：POST /chat/send

现有 Web 项目已经封装这条链路：`src/api/chat/index.ts` 获取流程，`src/pages/app-market` 读取开始节点定义并选择流程，`src/pages/chat/layouts/chatWithId/index.vue` 提交并消费 SSE。

```json
{
  "model": "",
  "content": "优化知识检索超时处理",
  "sessionId": "替换为当前会话ID",
  "enableWorkFlow": true,
  "workFlowRunner": {
    "uuid": "替换为流程UUID",
    "inputs": [
      { "name": "question", "content": { "title": "本次变更", "type": 1, "value": "优化知识检索超时处理" } },
      { "name": "environment", "content": { "title": "发布环境", "type": 1, "value": "prod" } },
      { "name": "version", "content": { "title": "发布版本", "type": 1, "value": "v1.8.0" } }
    ]
  }
}
```

注意字段大小写：`enableWorkFlow`、`workFlowRunner`，以及内部的 `uuid`。`content` 是聊天消息；实际流程输入仍来自 `workFlowRunner.inputs`，只传 `content` 不会自动得到全部参数。工作流模式不同时传 `agentId`。

### 嵌入独立业务页：POST /workflow/run

独立表单、工具页或后端集成可以直接运行流程，不需要先创建聊天会话：

```json
{
  "uuid": "替换为流程UUID",
  "inputs": [
    { "name": "question", "content": { "title": "本次变更", "type": 1, "value": "优化知识检索超时处理" } },
    { "name": "environment", "content": { "title": "发布环境", "type": 1, "value": "prod" } },
    { "name": "version", "content": { "title": "发布版本", "type": 1, "value": "v1.8.0" } }
  ]
}
```

`name` 来自开始节点，`content.type` 使用数字：`1` 文本、`2` 数字、`4` 文件、`5` 布尔。数字和布尔的 `value` 应为 JSON 数字和布尔值，不要统一转成字符串；`title` 也要提供，服务端会读取它。`sessionId` 可省略，提供时应对应合法会话。

这是 **POST + SSE**，不能用只发 GET 的原生 `EventSource` 替代。请求需带登录态 `Authorization: Bearer …` 和项目 `ClientID`；不要把模型 Key 放进浏览器代码。

下载 [零依赖 SSE 客户端](/files/workflow-client.mjs)，复制到业务前端后调用：

```ts
import { runWorkflow } from './workflow-client.mjs'

const controller = new AbortController()
// 为自建页面设置适合业务的超时，避免异常连接无限等待。
const timeout = setTimeout(() => controller.abort(), 60_000)
try {
  const result = await runWorkflow({
    baseUrl: '/api', // 管理端代理；自建应用改为自己的同源代理地址
    token: userToken, // 从当前登录状态读取
    clientId: appClientId, // 与登录时的客户端配置一致
    uuid: workflowUuid,
    inputs: [
      { name: 'question', content: { title: '本次变更', type: 1, value: '优化知识检索超时处理' } },
      { name: 'environment', content: { title: '发布环境', type: 1, value: 'prod' } },
      { name: 'version', content: { title: '发布版本', type: 1, value: 'v1.8.0' } },
    ],
    signal: controller.signal,
    onEvent({ event, data }) {
      if (event === '[START]') console.log('runtime UUID:', data.uuid)
      if (event.startsWith('[NODE_RUN_')) console.log('开始执行节点:', event)
    },
  })
  console.log(result.output.value) // 已替换变量的最终检查单
} finally {
  clearTimeout(timeout)
}
// 页面销毁或停止接收时：controller.abort()
// 调用方用 try/catch 展示错误；不要在中断后自动重试有副作用的流程。
```

客户端处理了网络分包、UTF-8 跨块、多行 data、HTTP/业务错误以及未收到完成事件就断流的情况。不要把每次 `reader.read()` 当成一条完整 SSE 消息。

| SSE 事件 | 数据含义 | 建议处理 |
| --- | --- | --- |
| `[START]` | 运行实例 JSON，包括 runtime UUID | 建立本次运行状态，保留 UUID |
| `[NODE_RUN_<节点UUID>]` | 节点运行实例 | 标记节点开始执行 |
| `[NODE_INPUT_<节点UUID>]` | 单个 `{name, content}` 输入 | 加入调试详情 |
| `[NODE_OUTPUT_<节点UUID>]` | 单个 `{name, content}` 输出 | 按字段名更新输出 |
| `[NODE_CHUNK_<节点UUID>]` | 增量文本或节点提示，未必是 JSON | 按节点累加；`-_wrap_-` 表示换行 |
| `[DONE]` | 最终输出，例如 `{ "output": { "type": 1, "value": "检查单…" } }` | 用 `output.value` 展示最终结果，不再重复拼接 |
| `[ERROR]` | 可读错误文本 | 标记失败，结束等待 |

::: warning 不要混淆提示文本与结构化输出
`NODE_CHUNK` 可能只是“开始检索”“流程已结束”等过程提示。调试页应保留独立的 `chunks`，不能把它直接拼到 `output.output` 对象上；用户端即使没收到模型增量，也要读取 `[DONE]` 的最终结果。本次教程对应的管理端和 Web 端已修正这两处展示问题。
:::

### 常用接口与权限语义

| 接口 | 用途 |
| --- | --- |
| `POST /workflow/add`、`POST /workflow/update` | 新建、保存节点与边 |
| `GET /workflow/{uuid}` | 管理侧详情，受归属权限检查 |
| `POST /workflow/base-info/update` | 更新名称、备注、是否公开 |
| `POST /workflow/set-public/{uuid}?isPublic=true` | 调整公开状态 |
| `GET /workflow/public/search?currentPage=1&pageSize=12&keyword=北辰` | 用户侧公开、启用流程列表 |
| `GET /workflow/public/{uuid}` | 用户侧公开详情，读取 `nodes` / `edges` 和输入定义 |
| `POST /workflow/run` | 直接运行，返回 SSE |
| `GET /workflow/runtime/page?wfUuid=…&currentPage=1&pageSize=10` | 查询运行记录 |
| `GET /workflow/runtime/nodes/{runtimeUuid}` | 查询某次运行的节点记录 |

普通 JSON 接口一般返回 `R<T>`：`{code,msg,data}`；公开分页记录位于 `data.records`，总数位于 `data.total`。管理端 `requestClient` 已解包，Web 端 `hook-fetch` 的 `.json()` 返回原响应体，不能混用这两个返回结构。接口分页要求 `pageSize >= 10`。

当前本地运行环境中，历史运行查询的部分 `input/output` 返回空对象；因此本页截图和案例验收以实时 SSE 的输入、输出、分支和最终结果为准。需要历史回放时，应先验证运行表落库与 DTO 转换，不要仅凭 `status=3` 认定历史数据完整。

## 当前版本的真实能力

### 基线 SQL 默认可见的节点

导入当前 `docs/script/sql/ruoyi-ai.sql` 后，组件表默认只有以下 5 个启用节点：

| 设计器名称 | 组件名 | 执行类 | 运行前提 |
| --- | --- | --- | --- |
| 开始 | `Start` | `StartNode` | 无 |
| 结束 | `End` | `EndNode` | 无 |
| 生成回答 | `Answer` | `LLMAnswerNode` | 已配置可用的对话模型 |
| 条件分支 | `Switcher` | `SwitcherNode` | 已正确配置条件和目标节点 |
| 网络搜索 | `Google` | `GoogleSearchNode` | 智谱 Web Search API Key |

真实运行环境中的默认组件库如下。节点内部名仍是 `Google`，但实际调用的是智谱 Web Search，不是 Google 搜索。

![基线 SQL 默认组件](/images/workflow/existing-workflow-designer.png)

### 代码已实现、但基线 SQL 未初始化的节点

下列节点的后端执行类、前端卡片和属性面板都已存在，但当前基线 SQL 没有对应的 `t_workflow_component` 记录，因此默认不会出现在左侧组件库：

| 设计器名称 | 必须使用的组件名 | 执行类 | 外部依赖 |
| --- | --- | --- | --- |
| 知识检索 | `KnowledgeRetrieval` | `KnowledgeRetrievalNode` | 已解析的知识库、Embedding 模型、向量库 |
| 通义万相 | `Tongyiwanx` | `ImageNode` | 百炼/通义万相 Key 与图片模型 |
| 邮件发送 | `MailSend` | `MailSendNode` | SMTP 主机、端口、邮箱和授权码 |
| HTTP 请求 | `HttpRequest` | `HttpRequestNode` | 可访问的目标 HTTP 服务 |

启用前先备份数据库，然后在 `ruoyi-ai` 数据库执行：

```text
mysql --host=127.0.0.1 --port=3306 --user=root --password ruoyi-ai
mysql> SOURCE D:/Project/github/ruoyi-doc/docs/public/files/enable-workflow-components.sql;
```

也可以直接下载<a href="/files/enable-workflow-components.sql" download>节点初始化 SQL</a>。脚本可重复执行：已有但停用的节点会重新启用，不存在时才插入。

执行后刷新设计器，并确认查询结果中 4 行的 `is_enable` 都为 `1`。这些节点虽然有代码实现，仍应先在测试环境逐个验收，再进入生产流程。

### 不要启用的残留定义

前端或枚举中还能看到 `Dalle3`、`FaqExtractor` 的部分定义，但当前 `WfNodeFactory` 没有创建它们的执行分支。仅向组件表插入记录会导致运行时无法得到节点实例，不能视为可用能力。

### “人工审核”不属于 AI Flow 节点

项目中的人工审批位于独立的 `ruoyi-workflow` 模块，使用 WarmFlow 处理业务流程；当前 AI Flow 画布没有人工审核节点，也没有把 AI Flow 暂停后交给审批人的连接器。两者不要混写：

```text
AI Flow：Vue Flow + LangGraph4j + SSE，处理模型、RAG 和工具链
业务审批：ruoyi-workflow + WarmFlow，处理表单、审批人和人工流转
```

如果业务要求“模型生成后必须人工确认再继续”，当前版本需要新增桥接节点和回调机制，不能只在画布上拖入现有节点完成。

## 运行前准备

按准备成本从低到高检查：

| 要验证的流程 | 必须准备 |
| --- | --- |
| 开始 → 结束 | 无外部 Key |
| 开始 → 生成回答 → 结束 | 一个有效对话模型；先在模型管理中测试通过 |
| 开始 → 知识检索 → 结束 | 已解析知识库、可用 Embedding 模型、对应向量库 |
| 开始 → 网络搜索 → 结束 | `ZAI_API_KEY`，或模型管理中有效的 `zhipu` Key |
| 开始 → 通义万相 → 结束 | `providerCode=Tongyiwanx` 的图片模型和百炼 Key |
| 开始 → 邮件发送 → 结束 | 专用测试邮箱、SMTP 授权码、可接收的测试地址 |
| 开始 → HTTP 请求 → 结束 | 测试 API；生产环境还需出站访问控制 |

模型、知识库和向量库的准备步骤分别见[模型管理](./model.md)和[知识管理](./knowledge.md)。

## 先跑通最小流程

这个流程不调用模型、不发送网络请求，适合验证画布保存、LangGraph4j 执行和 SSE 返回链路。

### 1. 创建并连接节点

1. 进入“对话管理 → 编排管理”，新建流程。
2. 保留自动创建的“开始”节点。
3. 拖入“结束”节点。
4. 连接“开始 → 结束”。
5. 在开始节点填写固定开场白，例如 `文档验证流程已执行`。
6. 在结束节点把结果设置为开始节点的 `output`，保存。

![最小工作流设计](/images/workflow/smoke-designer.png)

### 2. 运行并验收

点击“运行”，输入任意文本并提交。页面应同时满足：

- 顶部出现“执行成功”；
- 执行详情包含“开始”和“结束”；
- 最终输出为 `文档验证流程已执行`；
- 浏览器网络面板没有 4xx/5xx，后端没有节点异常。

下图来自本地真实运行，不是静态示意图。

![最小工作流运行成功](/images/workflow/smoke-success.png)

如果此流程失败，先检查流程保存、节点连线、字段引用、SSE 和服务端日志；这个流程不依赖模型 Key。

## 模型问答流程

确认最小流程成功后，再创建：

```text
开始 → 生成回答 → 结束
```

### 开始节点

保留一个必填文本输入，例如 `question`。不要填写固定开场白，否则开始节点会输出开场白而不是用户输入。

### 生成回答节点

选择已经在“模型管理”中测试成功的对话模型。提示词示例：

```text
请准确、简洁地回答下面的问题：
{question}
```

通过变量选择器引用开始节点字段；不要只在提示词里手写一个并不存在的变量名。生成回答节点的模型名必须与数据库中的 `model_name` 完全一致。

### 结束节点

引用生成回答节点的 `output`，结果模板填写 `{output}`。运行时确认生成回答节点出现流式内容，结束节点得到完整文本。

## 知识检索流程

本节使用[知识管理](./knowledge.md)中的本地验证知识库，流程为：

```text
开始 → 知识检索 → 结束
```

### 1. 启用并添加节点

先执行前面的[节点初始化 SQL](#代码已实现、但基线-sql-未初始化的节点)，刷新设计器，将“知识检索”拖入画布。

### 2. 配置参数

| 参数 | 首次验证值 | 说明 |
| --- | --- | --- |
| 知识库 | 已完成解析的知识库 | 节点保存知识库 ID，不是名称 |
| 数量 | `5` | 对应 `top_n` |
| 分数 | `0` | 首次验证先不过滤；确认召回后再提高 |
| 检索模式 | `vector` | `hybrid` 可用；`graph` 当前会抛出不支持异常 |
| 查询改写提示词 | 留空 | 非空会额外调用对话模型，首次验证不要增加依赖 |
| 返回来源 | 开启 | 结果中附带文件名和相关度，便于验收 |

把开始节点的 `output` 作为知识检索节点的引用输入，再把知识检索的 `output` 传给结束节点。

![知识检索流程设计](/images/workflow/rag-designer.png)

### 3. 运行验证

使用验证文档中的明确事实提问：

```text
北辰项目的后端服务端口和发布负责人分别是什么？
```

已有知识库验证环境的实测截图返回了端口 `6039`、负责人“林小满”、源文件 `rag-verification-sample.md` 和相关度 `0.487`。这同时验证了开始节点输入、工作流参数引用、Ollama Embedding、Weaviate 检索、节点输出和 SSE 展示。

![知识检索工作流运行成功](/images/workflow/rag-success.png)

如果知识管理页能召回而工作流结果为空，依次检查：

1. 节点保存的是知识库数值 ID，而不是显示名称。
2. `score` 是否高于实际召回分数。
3. 开始节点是否把问题传给知识节点，而不是输出了固定开场白。
4. 查询改写提示词是否误触发了一个不可用的对话模型。
5. 知识库绑定的 Embedding 模型名称、维度和向量库是否仍一致。

## 条件分支

条件分支按上游字段选择一个目标节点。典型结构：

```text
                     ┌→ 网络搜索 → 生成回答 ┐
开始 → 条件分支 ─────┤                     ├→ 结束
                     └→ 生成回答 ──────────┘
```

每条规则需要设置来源节点、字段、运算符、比较值和目标节点。多条件可使用 `AND` 或 `OR`。始终配置默认目标，否则所有条件都未命中时，流程可能没有后续节点。

条件分支只决定执行路径，不会自动合并多个分支输出。结束节点应引用实际可达分支的结果，复杂流程应分别测试每一条路径。

## 网络搜索

“网络搜索”通过智谱 Java SDK 调用 Web Search。推荐把 Key 放在后端环境变量：

```powershell
$env:ZAI_API_KEY='你的智谱 API Key'
java -jar .\ruoyi-admin\target\ruoyi-admin.jar
```

未设置环境变量时，后端会尝试读取模型管理中 `providerCode=zhipu` 的有效 Key。Key 不应写入节点查询、提示词或截图。

首次验证参数：

```json
{
  "query": "{question}",
  "search_engine": "search_std",
  "result_count": 5,
  "search_domain_filter": "",
  "search_recency_filter": "noLimit",
  "content_size": "medium",
  "include_image": false
}
```

`query` 最多 70 个字符。节点输出是稳定 JSON，包含 `query`、`count` 和 `results`；每条结果提供标题、正文或摘要、链接、来源和发布时间。下游生成回答节点要显式引用该输出，并在提示词中要求保留来源链接。

常用服务端配置：

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `ZAI_API_KEY` | 空 | 智谱 API Key |
| `ZHIPU_WEB_SEARCH_BASE_URL` | `https://open.bigmodel.cn/api/paas/v4/` | API 基础地址 |
| `ZHIPU_WEB_SEARCH_CONNECT_TIMEOUT` | `10` | 连接超时，秒 |
| `ZHIPU_WEB_SEARCH_READ_TIMEOUT` | `30` | 读取超时，秒 |

## 通义万相

图片节点只在组件名为 `Tongyiwanx` 时进入 `ImageNode`。运行前需要在模型管理中新增图片模型，并满足：

- `providerCode` 为 `Tongyiwanx`，大小写必须一致；
- 模型名是百炼账户已开通的万相模型；
- API Key 有图片生成权限；
- 节点选择的模型名与模型管理记录完全一致。

节点支持提示词、尺寸和随机种子。当前实现直接返回供应商图片 URL，并未自动把图片转存到项目 OSS；供应商 URL 过期后，历史运行记录中的图片可能无法继续访问。

## 邮件发送

邮件节点支持 SMTP 主机、端口、发件邮箱、发件人名称、授权码、收件人、抄送、主题和 HTML 内容。多个收件人使用英文逗号分隔。当前实现固定启用 SMTP SSL，更适合先用 465 端口验证。

::: danger 当前凭据存储风险
当前代码把邮箱授权码保存在节点 `node_config` JSON 中，保存与读取处的 AES 加解密代码被注释，不能把它视为密文。不要在共享测试库或生产库直接保存个人邮箱主密码。应使用权限受限的专用邮箱授权码，并在上线前恢复服务端加密或改为密钥引用。
:::

邮件发送失败时，节点会把错误写入 `error` 输出。验收时不要只看流程顶部状态，还要查看邮件节点输出，并确认测试收件箱实际收到邮件。

## HTTP 请求

HTTP 节点支持 GET、POST 等方法、Header、Query 参数、文本/JSON/Form 请求体、超时、重试和清理 HTML。URL、Header 与请求体可以引用上游变量。

首次测试建议调用团队自有的回显接口，检查：

- 请求方法和 Content-Type 正确；
- Header、Query 和 Body 中的变量已被替换；
- 节点 `output` 是真实响应；
- 超时或 4xx/5xx 时，节点 `error` 中有可读信息。

::: danger 出站请求安全
当前节点没有目标主机白名单、内网地址阻断或完整的 SSRF 防护。不要让不受信任的用户控制 URL，也不要在无网络边界的生产环境直接启用。至少应通过网关限制协议、域名、端口和可访问网段。
:::

## 节点数据如何传递

| 数据类型 | 保存位置 | 用途 |
| --- | --- | --- |
| 用户输入 | 开始节点 `input_config.user_inputs` | 运行页生成输入框 |
| 引用输入 | 节点 `input_config.ref_inputs` | 从指定上游节点读取字段 |
| 节点参数 | 节点 `node_config` | 模型、提示词、检索和外部服务设置 |
| 执行关系 | `t_workflow_edge` | 决定图中的可达路径 |
| 运行结果 | runtime 与 runtime node 表 | 保存每次输入、输出和状态 |

画布连线只表达执行关系，不等于已经建立字段引用。下游需要某个明确字段时，仍要在属性面板中选择上游输出。节点卡片上的文字只是摘要，真实运行以 JSON 配置和 `WfState` 为准。

后端执行链路：

```text
运行页提交输入
  → WorkflowController 建立 SSE
  → WorkflowStarter 读取流程和启用组件
  → WorkflowGraphBuilder 构建 LangGraph4j StateGraph
  → WorkflowNodeRunner 逐节点执行
  → WfState 保存输入与输出
  → SSE 推送节点状态
  → 运行页渲染并持久化运行记录
```

## 添加自定义节点

新增节点至少要同步 4 层：

1. 后端配置类和 `AbstractWfNode` 执行类；
2. `WfComponentNameEnum` 与 `WfNodeFactory` 分支；
3. `t_workflow_component` 初始化或版本迁移 SQL；
4. 前端画布节点、默认配置、属性面板和图标映射。

组件 `name` 是跨层协议，必须完全一致。新增节点时还应定义稳定输出、异常行为、密钥存储方式、网络边界和最小端到端验收用例。只有前端卡片或枚举、没有工厂执行分支的节点不能发布。

## 常见问题

### 代码里有节点，设计器却没有

先查询：

```sql
SELECT id, name, title, is_enable, is_deleted
FROM t_workflow_component
ORDER BY display_order, id;
```

当前基线缺少知识检索、通义万相、邮件和 HTTP 节点是已知的初始化差异，执行本页提供的 SQL 后刷新页面。不要用相近但错误的组件名。

### 点击运行后一直没有结果

1. 在浏览器网络面板确认 `/workflow/run` 的 SSE 请求没有 401、404 或 502。
2. 直接访问后端 `6039` 端口，确认服务仍在运行。
3. 查看后端日志中最后一个开始执行的节点。
4. 检查所有边是否形成从开始到结束的可达路径。
5. 检查下游引用的节点 UUID 和输出字段是否仍存在。

如果省略必填参数后只收到 `[START]`，后端日志出现 `WorkflowMessageUtil.saveWorkflowMessage` 的空指针异常，说明参数校验失败时运行状态尚未创建，异常处理又访问了空状态。本次后端代码已增加空状态保护；运行旧进程时需重新构建并重启后端才能生效。客户端仍应设置超时并把中断标记为失败或停止，不能显示执行完成。

生产代理需要允许长连接并关闭会缓存 SSE 的响应缓冲；开发环境先使用项目自带代理排除网关问题。

### 流程显示成功，但邮件或 HTTP 实际失败

这两个节点会把部分异常转换为 `error` 输出，而不是继续向外抛出。展开节点运行详情检查 `error`，并验证外部副作用，不要只依赖顶部状态。

### 知识检索报 GraphRAG 不支持

当前节点只实现向量和混合检索。把 `retrieval_mode` 改为 `vector` 或 `hybrid`；知识管理中的图谱相关配置不能让此节点自动获得 GraphRAG 能力。

## 验收清单

- [ ] 基线组件库能看到开始、结束、生成回答、条件分支和网络搜索。
- [ ] “开始 → 结束”流程真实运行并通过 SSE 显示输出。
- [ ] 对话模型在模型管理中先测试成功，再运行生成回答节点。
- [ ] 知识管理页先召回测试文档，再运行知识检索节点。
- [ ] 每个条件分支及默认分支都单独运行过。
- [ ] 搜索、图片、邮件和 HTTP 使用测试凭据或测试服务验收。
- [ ] 日志、截图、流程 JSON 中没有公开 API Key、SMTP 授权码或访问令牌。
- [ ] 生产启用邮件与 HTTP 前，已补齐凭据加密和出站访问控制。
