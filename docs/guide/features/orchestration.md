---
outline: deep
---

# 流程编排

流程编排用于把输入、模型调用、条件判断和外部能力组织为可复用的工作流。RuoYi AI 的设计器基于 Vue Flow，运行引擎基于 LangGraph4j，节点执行过程通过 SSE 实时返回到测试页面。

## 当前可用节点

设计器中的节点列表与数据库组件保持一致：

| 节点 | 后端实现 | 用途 |
| --- | --- | --- |
| 开始 | `StartNode` | 定义流程入口和用户输入 |
| AI 回答 | `LLMAnswerNode` | 调用已配置的大模型生成回答 |
| 条件分支 | `SwitcherNode` | 根据上游字段选择一条执行路径 |
| 网络搜索 | `GoogleSearchNode` | 调用智谱 Web Search，作为外部能力扩展示例 |
| 结束 | `EndNode` | 汇总流程结果并结束执行 |

::: tip
`GoogleSearchNode` 是为兼容已有流程保留的内部组件名，设计器中统一显示为“网络搜索”。它不再调用 Google，也不是占位节点。
:::

## 画布如何工作

### 前端设计器

画布位于 `ruoyi-admin/apps/web-antd/src/packages/workflow-designer`，主要由以下部分组成：

| 部分 | 职责 |
| --- | --- |
| Vue Flow 画布 | 渲染节点、连线、拖拽、缩放和视口 |
| 节点组件 | 展示节点名称、图标和关键参数摘要 |
| 属性面板 | 编辑当前节点的 `nodeConfig`、输入和输出配置 |
| 设计器状态 | 在前端维护节点坐标、边关系和当前选中项 |
| 保存接口 | 把节点、边和画布信息提交到后端 |

节点之间的连线只表达执行关系，真正参与运行的参数保存在节点配置中。引用上游结果时，应通过变量选择器建立明确的数据依赖。

### 持久化

保存流程时，后端将设计数据拆分到流程、节点和边相关表中。节点的业务参数以 JSON 形式保存，因此添加一个新参数通常不需要修改表结构，但前后端配置字段必须保持一致。

### 运行引擎

运行时的核心链路如下：

```text
测试页面提交输入
  → WorkflowStarter 创建 SSE 连接
  → WorkflowEngine 读取流程
  → WorkflowGraphBuilder 将节点和边编译为 LangGraph4j StateGraph
  → WorkflowNodeRunner 执行节点
  → 节点输出写入 WfState
  → SSE 推送节点状态和结果
  → 测试页面在流程执行详情卡片内渲染
```

条件分支由 `SwitcherNode` 在运行时选择目标节点；未命中的路径不会执行。节点运行记录会单独保存，便于测试页面回放输入、输出和错误信息。

## 创建第一个工作流

下面以“接收问题并生成回答”为例。

### 1. 新建流程

进入“流程编排”，创建一个工作流并进入设计页面。画布至少需要一个开始节点和一个结束节点。

### 2. 配置开始节点

在开始节点添加用户输入，例如：

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `question` | 文本 | 是 | 用户提出的问题 |

字段名会成为后续节点可引用的变量。

### 3. 添加 AI 回答节点

从左侧节点列表拖入“AI 回答”，选择模型，并填写提示词：

```text
请准确回答用户问题：
{question}
```

通过变量选择器引用开始节点的 `question`，避免手工填写不存在的字段。

### 4. 连接并保存

按以下顺序连接：

```text
开始 → AI 回答 → 结束
```

保存后，设计器会提交节点坐标、节点配置和边关系。

### 5. 运行测试

点击“运行工作流”进入测试页面，填写 `question` 并提交。执行详情会在页面内按节点展示：

- 当前节点状态
- 节点输入
- 节点输出
- 失败原因

页面本身保持固定，较长的执行记录在详情区域内部滚动，不会产生额外的整页滚动容器。点击“返回设计”回到画布；设计页面的返回按钮会回到流程列表。

## 使用条件分支

条件分支适合根据确定字段选择执行路径。例如，将问题分为“需要搜索”和“直接回答”：

```text
                     ┌→ 网络搜索 → AI 回答 ┐
开始 → 条件分支 ─────┤                    ├→ 结束
                     └→ AI 回答 ──────────┘
```

每个分支由一组条件组成：

| 配置 | 说明 |
| --- | --- |
| 条件关系 | `AND` 表示全部满足，`OR` 表示满足任意一条 |
| 来源节点 | 提供判断字段的上游节点 |
| 字段 | 参与比较的输出字段 |
| 运算符 | 等于、不等于、包含、不包含、为空等 |
| 目标节点 | 条件命中后执行的节点 |
| 默认分支 | 所有条件都不命中时的去向 |

建议始终配置默认分支，避免输入未覆盖时流程提前结束。

## 节点数据传递

节点数据分为三类：

| 类型 | 用途 |
| --- | --- |
| 用户输入 | 流程运行时由用户提交 |
| 引用输入 | 从上游节点输出中选择字段 |
| 节点配置 | 模型、提示词、搜索参数等静态配置 |

下游节点不要依赖画布上的展示文字。展示摘要只用于设计时查看，运行时以节点 JSON 配置和 `WfState` 中的数据为准。

## 工作流网络搜索

“网络搜索”是流程编排的扩展示例。它通过智谱官方 Java SDK 调用 Web Search API，并把第三方响应转换为稳定的工作流 JSON，供后续 AI 回答节点使用。

### 能力说明

接口地址：

```text
POST https://open.bigmodel.cn/api/paas/v4/web_search
```

项目使用官方依赖：

```xml
<dependency>
  <groupId>ai.z.openapi</groupId>
  <artifactId>zai-sdk</artifactId>
  <version>0.3.5</version>
</dependency>
```

相关官方资料：

- [智谱 Web Search 使用指南](https://docs.bigmodel.cn/cn/guide/tools/web-search)
- [智谱 Web Search API 参考](https://docs.bigmodel.cn/api-reference/%E5%B7%A5%E5%85%B7-api/%E7%BD%91%E7%BB%9C%E6%90%9C%E7%B4%A2)
- [智谱 Java SDK](https://github.com/zai-org/z-ai-sdk-java)

### 配置 API Key

推荐通过环境变量配置：

```powershell
$env:ZAI_API_KEY='你的智谱 API Key'
```

Linux 或容器环境：

```bash
export ZAI_API_KEY='你的智谱 API Key'
```

如果没有配置 `ZAI_API_KEY`，搜索客户端会尝试读取“模型管理”中 `providerCode` 为 `zhipu` 的有效 API Key。

可选配置：

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `ZHIPU_WEB_SEARCH_BASE_URL` | `https://open.bigmodel.cn/api/paas/v4/` | 智谱 API 基础地址 |
| `ZHIPU_WEB_SEARCH_CONNECT_TIMEOUT` | `10` | 连接超时，单位秒 |
| `ZHIPU_WEB_SEARCH_READ_TIMEOUT` | `30` | 读取超时，单位秒 |

对应的服务端配置位于：

```yaml
workflow:
  web-search:
    zhipu:
      api-key: ${ZAI_API_KEY:}
      base-url: ${ZHIPU_WEB_SEARCH_BASE_URL:https://open.bigmodel.cn/api/paas/v4/}
      connect-timeout: ${ZHIPU_WEB_SEARCH_CONNECT_TIMEOUT:10}
      read-timeout: ${ZHIPU_WEB_SEARCH_READ_TIMEOUT:30}
```

::: warning
API Key 只保存在服务端。不要把密钥填写到网络搜索节点的“搜索内容”或其他节点字段中。
:::

### 节点参数

网络搜索节点的配置示例：

```json
{
  "query": "{question}",
  "search_engine": "search_std",
  "result_count": 10,
  "search_domain_filter": "",
  "search_recency_filter": "noLimit",
  "content_size": "medium",
  "include_image": false
}
```

| 字段 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `query` | 否 | 空 | 搜索词，最多 70 个字符；为空时使用上游节点的第一段文本 |
| `search_engine` | 是 | `search_std` | 搜索引擎类型 |
| `result_count` | 是 | `10` | 返回数量，范围 1–50 |
| `search_domain_filter` | 否 | 空 | 限定域名，例如 `docs.bigmodel.cn` |
| `search_recency_filter` | 是 | `noLimit` | 搜索结果的时间范围 |
| `content_size` | 是 | `medium` | 返回标准摘要或更完整正文 |
| `include_image` | 是 | `false` | 是否返回相关图片信息 |

搜索引擎取值：

| 值 | 设计器名称 |
| --- | --- |
| `search_std` | 基础搜索 |
| `search_pro` | 高阶搜索 |
| `search_pro_sogou` | 高阶搜索 · 搜狗 |
| `search_pro_quark` | 高阶搜索 · 夸克 |

时间范围取值：

| 值 | 含义 |
| --- | --- |
| `noLimit` | 不限时间 |
| `oneDay` | 一天内 |
| `oneWeek` | 一周内 |
| `oneMonth` | 一个月内 |
| `oneYear` | 一年内 |

内容深度取值：

| 值 | 含义 |
| --- | --- |
| `medium` | 标准摘要，适合大多数问答流程 |
| `high` | 更完整的网页内容，输出更长 |

::: info
不同搜索引擎、结果数量和内容深度可能影响调用费用与延迟，具体以智谱官方控制台和计费说明为准。
:::

### 编排一个搜索问答流程

#### 1. 添加节点

按以下顺序连接：

```text
开始 → 网络搜索 → AI 回答 → 结束
```

#### 2. 配置开始节点

添加必填文本字段 `question`。

#### 3. 配置网络搜索

在“搜索内容”中选择开始节点的 `question`，或填写：

```text
{question}
```

首次测试建议使用：

- 搜索引擎：基础搜索
- 返回数量：5
- 时间范围：不限时间
- 内容深度：标准摘要
- 返回图片信息：关闭

#### 4. 配置 AI 回答

提示词可以写成：

```text
请仅依据网络搜索节点返回的结果回答用户问题。

要求：
1. 无法从结果确认的信息要明确说明。
2. 在关键结论后保留对应来源链接。
3. 不要编造搜索结果中不存在的事实。

用户问题：
{question}
```

同时通过变量选择器把网络搜索节点的输出添加为 AI 回答节点的引用输入。

#### 5. 运行验证

进入“运行工作流”，提交一个不超过 70 个字符的问题。成功时，网络搜索节点会显示返回条数，并在执行详情中输出结构化结果。

### 输出结构

工作流不会把 SDK 对象直接传给下游，而是输出稳定 JSON：

```json
{
  "requestId": "e79d7f8e...",
  "searchEngine": "search_std",
  "query": "RuoYi AI 流程编排",
  "count": 2,
  "results": [
    {
      "title": "页面标题",
      "content": "页面摘要或正文",
      "link": "https://example.com/article",
      "media": "来源站点",
      "icon": "https://example.com/favicon.ico",
      "refer": "ref_1",
      "publishDate": "2026-07-29"
    }
  ]
}
```

第三方没有返回的字段会保留为空，不应由下游节点自行猜测。

### 实现位置

后端：

| 文件 | 职责 |
| --- | --- |
| `GoogleSearchNode.java` | 读取节点输入、调用搜索客户端并生成工作流输出 |
| `GoogleSearchNodeConfig.java` | 定义和校验节点参数 |
| `ZhipuWebSearchClient.java` | 封装官方 SDK、凭据获取和响应转换 |
| `ZhipuWebSearchProperties.java` | 读取服务端配置和环境变量 |

前端：

| 文件 | 职责 |
| --- | --- |
| `GoogleNode.vue` | 展示画布上的搜索参数摘要 |
| `GoogleNodeProperty.vue` | 提供网络搜索专用配置面板 |
| `defaults.ts` | 新建搜索节点时生成默认配置 |

内部名称继续使用 `Google` / `GoogleSearchNode` 是为了兼容已经保存的流程 UUID 和组件映射。面向用户的名称、图标和文案均为中性的“网络搜索”。

### 为什么这是一个扩展示例

该节点展示了外部工具接入工作流时需要处理的完整边界：

1. 密钥保存在服务端，不进入流程 JSON。
2. 节点配置使用受校验的枚举和范围。
3. SDK 调用被独立客户端封装。
4. 第三方响应转换为稳定的内部输出。
5. 前端属性面板与后端配置字段一一对应。
6. 异常转为可读的节点错误，不输出密钥。

接入其他搜索服务时，可以复用这套结构，只替换客户端和供应商特有参数。

### 常见错误

#### 未配置智谱 Web Search API Key

先检查 `ZAI_API_KEY`，再检查模型管理中是否存在 `providerCode=zhipu` 且 API Key 有效的记录。修改环境变量后需要重启服务。

#### 搜索内容超过 70 个字符

缩短搜索词。不要把完整提示词或大段文档直接作为 `query`。

#### HTTP 401 或 403

检查 API Key、账号权限和服务开通状态。不要在日志或问题截图中公开完整密钥。

#### 请求超时

先降低返回数量、使用 `medium` 内容深度；如网络本身较慢，再适当提高读取超时。

#### AI 回答没有引用链接

确认 AI 回答节点引用了网络搜索节点输出，并在提示词中明确要求保留 `link` 字段。

## 添加新节点

网络搜索节点展示了一条完整的扩展路径。新增节点时至少要同步以下层次：

1. 在后端实现节点配置类和节点执行类。
2. 将节点执行类注册到工作流组件。
3. 在数据库组件表中添加唯一的组件记录。
4. 在前端添加画布节点、默认配置和专用属性面板。
5. 保证前端字段名与后端配置类完全一致。
6. 为输出定义稳定结构，避免下游节点依赖第三方原始响应。
7. 补充配置说明、错误处理和最小验证流程。

::: warning 密钥安全
第三方 API Key 必须由服务端环境变量或统一配置中心提供，不要写入节点配置、流程 JSON、前端代码或运行日志。
:::

## 常见问题

### 节点没有出现在列表中

检查数据库组件记录是否启用、组件名是否与前端组件映射一致，并重新加载组件列表。只删除前端图标不会删除节点；节点下线时需要同时清理数据库记录和前后端源码。

### 流程保存后无法运行

依次检查：

1. 是否同时存在开始和结束节点。
2. 节点之间是否完整连接。
3. 条件分支是否配置目标节点和默认分支。
4. 引用变量是否来自可达的上游节点。
5. 模型或第三方服务凭据是否有效。

### 页面显示的结果与运行结果不同

画布卡片只展示参数摘要。实际输出以测试页面中的节点执行详情为准。
