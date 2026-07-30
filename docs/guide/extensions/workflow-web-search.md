---
outline: deep
---

# 工作流网络搜索

“网络搜索”是流程编排的扩展示例。它通过智谱官方 Java SDK 调用 Web Search API，并把第三方响应转换为稳定的工作流 JSON，供后续 AI 回答节点使用。

## 能力说明

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

## 配置 API Key

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

## 节点参数

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

## 编排一个搜索问答流程

### 1. 添加节点

按以下顺序连接：

```text
开始 → 网络搜索 → AI 回答 → 结束
```

### 2. 配置开始节点

添加必填文本字段 `question`。

### 3. 配置网络搜索

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

### 4. 配置 AI 回答

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

### 5. 运行验证

进入“运行工作流”，提交一个不超过 70 个字符的问题。成功时，网络搜索节点会显示返回条数，并在执行详情中输出结构化结果。

## 输出结构

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

## 实现位置

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

## 为什么这是一个扩展示例

该节点展示了外部工具接入工作流时需要处理的完整边界：

1. 密钥保存在服务端，不进入流程 JSON。
2. 节点配置使用受校验的枚举和范围。
3. SDK 调用被独立客户端封装。
4. 第三方响应转换为稳定的内部输出。
5. 前端属性面板与后端配置字段一一对应。
6. 异常转为可读的节点错误，不输出密钥。

接入其他搜索服务时，可以复用这套结构，只替换客户端和供应商特有参数。

## 常见错误

### 未配置智谱 Web Search API Key

先检查 `ZAI_API_KEY`，再检查模型管理中是否存在 `providerCode=zhipu` 且 API Key 有效的记录。修改环境变量后需要重启服务。

### 搜索内容超过 70 个字符

缩短搜索词。不要把完整提示词或大段文档直接作为 `query`。

### HTTP 401 或 403

检查 API Key、账号权限和服务开通状态。不要在日志或问题截图中公开完整密钥。

### 请求超时

先降低返回数量、使用 `medium` 内容深度；如网络本身较慢，再适当提高读取超时。

### AI 回答没有引用链接

确认 AI 回答节点引用了网络搜索节点输出，并在提示词中明确要求保留 `link` 字段。
