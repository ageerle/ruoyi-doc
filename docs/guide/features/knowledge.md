---
outline: deep
pageClass: knowledge-guide
---

# 知识库使用指南

RuoYi AI 的知识库用于管理文档、检索相关内容，并为智能体问答和工作流提供参考资料。你可以上传业务文档，查看解析后的知识片段，测试检索效果，再将知识库关联到实际应用。

## 支持的能力 {#knowledge-capabilities}

| 能力 | 可以做什么 | 使用说明 |
| --- | --- | --- |
| **文档管理与解析** | 上传文档，自动或手动解析，查看知识片段，并在资料更新后重新解析。 | [上传与解析](#upload-and-parse)、[文档维护](#maintain-documents)。 |
| **检索测试** | 输入问题，检查命中的片段、来源文档和相关性得分，调整阈值与检索条数。 | [检索测试](#retrieval-test)。 |
| **检索效果优化** | 结合向量检索与关键词检索，或使用重排模型调整候选片段的顺序。 | [调整检索效果](#tune-retrieval)。 |
| **知识库问答** | 为智能体关联一个或多个知识库，让对话模型参考检索到的资料回答问题。 | [关联智能体](#use-in-chat)。 |
| **工作流与接口接入** | 在工作流中使用知识检索节点，或在自建聊天页面中传入知识库 ID。 | [接入说明](#use-in-chat)。 |

当前上传入口支持文本、Markdown、PDF、Word、Excel、CSV、JSON 及多种代码文件。现有用户端通过智能体使用知识库，普通聊天页尚未提供直接选择知识库的控件。

## 先理解知识库如何参与问答 {#knowledge-concepts}

知识库问答采用 **RAG（检索增强生成）**：先从资料中找到与问题相关的内容，再交给对话模型组织答案。理解下面几个概念，有助于区分文件解析、检索测试和最终问答三个环节。

| 概念 | 含义 |
| --- | --- |
| **知识库与知识片段** | 知识库组织一组文档及其检索配置；文档解析后会被切分为较小的知识片段，作为检索的基本内容。 |
| **向量模型与向量库** | 向量模型将文档片段和问题转换为表示语义的数值；向量库保存这些向量，供相似性检索使用。 |
| **检索与重排** | 检索负责找到相关片段；可选的重排模型对候选片段重新评分、排序。混合检索则结合语义相似性与关键词匹配。 |
| **对话模型** | 读取问题和检索到的片段，生成自然语言回答。检索测试用于检查片段，完整问答还需要调用对话模型。 |

文档需要先完成解析和向量化，才能参与检索。因此，使用时应先确认片段内容完整、检索能找到答案，再检查对话模型的回答。

下面按 **准备环境和模型 → 创建知识库 → 上传和解析文档 → 检索测试 → 在用户端提问** 介绍使用方法。首次使用可依次完成第 1～6 节，再按需要阅读检索优化和文档维护。各步骤附有代码说明，开发者可以据此查找对应接口；按页面操作时可以先跳过代码。

本次已核对页面入口和源码；解析、检索的成功截图沿用此前实测，本次环境未能重新完成端到端验证，详见页末[验证说明](#verification-notes)。

## 1. 打开管理端，准备好运行环境 {#start-admin}

先按[本地安装与启动](../getting-started/install.md)启动后端和管理端，然后登录管理端，进入 **对话管理 → 知识管理**。

本页使用的本地地址如下。端口被占用时，以启动日志中的实际地址为准；其中 `5173` 留给文档站点。

| 页面 | 本地地址 | 在本流程中做什么 |
| --- | --- | --- |
| 管理端 | [localhost:5666](http://localhost:5666) | 配置模型、管理文档、测试检索、关联智能体。 |
| 用户端 | [localhost:5180](http://localhost:5180) | 从应用市场选择智能体，提出问题。 |
| 后端 | `http://127.0.0.1:6039` | 接收上传、解析文件、检索片段并调用聊天模型。 |

如果前端还没启动，在两个终端分别执行，目录替换成你实际检出的项目路径：

```powershell
# 管理端
cd D:\Project\github\ruoyi-admin
pnpm run dev:antd
```

```powershell
# 用户端，避开文档站点的 5173 端口
cd D:\Project\github\ruoyi-web
pnpm run dev --port 5180
```

看到知识库列表后，先确认上传和解析依赖的服务已经可用：

| 依赖 | 要确认的事情 |
| --- | --- |
| MySQL | 已执行安装页中的数据库初始化和适用的增量 SQL，包含 `knowledge_attach.file_hash`、`knowledge_fragment.fid`。 |
| 对象存储 | 在 **系统管理 → 文件管理 → 文件配置管理** 中确认默认配置指向自己可用的存储。本地示例使用 MinIO。 |
| 向量库 | 本地示例使用 Weaviate，后端配置的地址为 `127.0.0.1:28080`。 |
| 向量模型 | 至少有一个能实际生成向量的模型，下一节说明如何选择。 |

对象存储保存原始文件，向量库保存便于检索的向量；二者都需要正常运行。可以按安装页检查服务健康状态。只打开管理端页面，并不能证明文件解析所需的服务已经启动。

## 2. 先准备向量模型，再准备回答问题的模型 {#prepare-models}

基础流程需要向量模型和对话模型；重排模型用于后续优化，可以暂不配置：

| 模型 | 作用 | 在哪里选择 |
| --- | --- | --- |
| 向量模型（`vector`） | 把文档和问题转换为向量，用来找到相关片段。 | 知识库的 **向量模型** 字段。 |
| 对话模型（`chat`） | 阅读检索到的片段，组织成自然语言答案。 | 第 6 节智能体的 **绑定模型** 字段。 |
| 重排模型（`rerank`，可选） | 对已经找到的候选片段重新排序。 | 先完成基础流程，再在检索测试中启用。 |

### 2.1 在模型管理中准备配置

先到 **厂商管理** 配置所用服务，再到 **模型管理** 新增或检查模型。厂商、请求地址、密钥的配置方法见[模型管理](./model.md)。**向量、对话、重排等模型分类由 `chat_model_category` 字典维护**，缺少选项时按[模型分类字典](./model.md#model-category-dict)补齐；不能把对话模型放进向量分类来使用。

本文保留的本地检索截图使用下列 Ollama 配置。它展示向量模型与知识库字段如何对应；其中 HTTP 地址是此前运行环境的地址，新增配置时还需要满足下面说明的当前保存规则。

| 字段 | 示例配置 |
| --- | --- |
| 供应商 | `ollama` |
| 模型分类 | 向量（`vector`） |
| 模型名称 | `all-minilm:v2` |
| 模型描述 | 例如 `Ollama 本地向量模型`，用于辨认下拉选项。 |
| 模型维度 | `384` |
| API Host | `http://127.0.0.1:11434`，适用于后端运行在宿主机的情况。 |
| 密钥 | 本地 Ollama 示例留空。 |

Ollama 的启动、模型下载步骤见[安装页的本地向量模型示例](../getting-started/install.md)。如果后端运行在容器里，应填写后端容器能够访问的地址；容器内的 `127.0.0.1` 指向容器自身。

::: warning 新配置需要先满足当前模型保存规则
本地 Ollama 可以使用后端可访问的 HTTP 或 HTTPS 地址，无需鉴权时密钥留空。Ollama 的向量适配器不读取 Key；需要认证的网关仍需适配器支持。千问等云端向量模型的真实 API Key 直接填写在 ruoyi-admin 的模型管理中，详见[模型管理](./model.md#configure-model)。

模型出现在下拉列表，只说明管理端查到了配置；本地模型仍需要服务已启动、模型已下载，云模型也需要凭据与实际调用适配器匹配。
:::

### 2.2 页面为什么只显示向量模型

新增知识库时，管理端按 `vector` 分类加载模型，显示模型描述，实际保存的是模型名称。对应代码在 `ruoyi-admin/apps/web-antd/src/views/knowledge/info/components/KnowledgeAddModal.vue`：

```ts
const response = await modelList({ category: 'vector', pageSize: 1000 });
const models = Array.isArray(response)
  ? response
  : (response.rows || response.records || []);
embeddingModelOptions.value = models.map((model: any) => ({
  label: model.modelDescribe || model.modelName,
  value: model.modelName,
}));
```

后端解析文件时会根据这个名称查找配置。以 `OllamaEmbeddingProvider.embedAll()` 为例，它使用配置中的地址和模型名调用 embedding 服务：

```java
EmbeddingModel model = OllamaEmbeddingModel.builder()
        .baseUrl(chatModelVo.getApiHost())
        .modelName(chatModelVo.getModelName())
        .build();

return model.embedAll(textSegments);
```

这里不调用聊天模型。同一知识库里的文档和查询必须使用同一个向量模型；即使两个模型的输出维度相同，也不应混用它们生成的向量。使用 Milvus 时，还需要让集合维度与模型实际输出一致。

## 3. 创建知识库，再设置文档如何分段 {#create-knowledge}

以下步骤使用一份<a href="/files/rag-verification-sample.md" download>项目说明样例</a>演示创建、上传、检索和问答。下载后可以直接上传：样例中北辰项目的后端端口是 **6039**，发布负责人是 **林小满**，便于核对检索结果和回答。首次使用建议先用这份小文件验证流程，再导入自己的业务资料。

### 3.1 填写新增弹窗

在 **对话管理 → 知识管理** 点击 **新增**，参考下表填写；知识库名称和描述可按实际用途调整：

| 字段 | 示例值 | 说明 |
| --- | --- | --- |
| 知识库名称 | `RAG 文档验证知识库` | 与正式业务资料区分，后面关联智能体时也用这个名称查找。 |
| 是否公开 | 否 | 本示例保持关闭，不需要为了关联智能体而打开。 |
| 向量库 | Weaviate | 要与已部署的存储服务对应。 |
| 向量模型 | 刚准备好的可用向量模型 | 下拉框可能默认选中第一项，提交前主动核对。 |
| 启用重排 | 关闭 | 先验证基础检索。 |
| 混合检索 | 关闭 | 先观察仅使用向量检索的结果。 |
| 检索条数 | `5` | 本页样例的起始值。 |
| 描述 | `用于验证北辰项目资料的检索和问答` | 便于后续识别用途。 |

![本次运行的新增知识库弹窗，展示名称、向量库、向量模型和检索条数等基础字段](/images/knowledge/create-knowledge-runtime.png)

上图是本次实际运行的新增表单，尚未提交；当前环境默认显示 `embedding-3`。操作时请改选第 2 节已验证可用的向量模型，下拉项存在本身不代表调用已通过。

点击 **确认** 后，回到列表找到新知识库，点击这一行的 **详情**。刚创建时文档数为 0，这是正常的。

### 3.2 到“知识库配置”设置分段参数

详情页有 **文件管理、检索测试、知识库配置** 三个页签。先打开 **知识库配置**，再设置下列参数，点击 **保存更新**。**新增弹窗里没有文本块大小和重叠字符数的输入项**，需要在这一步调整。

| 字段 | 示例值 | 设置说明 |
| --- | --- | --- |
| 文本块大小 | `300` | 将长文档拆成便于检索的小段，本页短样例从这个值开始。 |
| 重叠字符数 | `30` | 让相邻片段保留部分上下文，避免答案刚好被切断。 |
| 知识分隔符 | 保持现有换行配置 | 实际切分还取决于文件类型及对应分片器。 |
| 相似度阈值 | `0` | 第一次先确认有结果，再根据命中质量提高阈值。 |
| 检索条数 | `5` | 检查保存后的值与本页测试参数一致。 |

![此前本地验证中，知识库配置选择 Ollama 向量模型并设置分段和检索参数](/images/knowledge/config-ollama.png)

后端用 `DocumentSplitConfig` 校验分段参数，重叠字符数必须小于文本块大小：

```java
if (blockSize <= 0) {
    throw new ServiceException("文本块大小必须大于0");
}
if (overlap < 0 || overlap >= blockSize) {
    throw new ServiceException("重叠字符数必须大于等于0且小于文本块大小");
}
```

如果你在自己开发的页面中保存配置，对应接口为新增 `POST /system/info`、修改 `PUT /system/info`。下面是与示例相关的请求字段，修改时还需带上实际的 `id`：

```json
{
  "name": "RAG 文档验证知识库",
  "share": 0,
  "vectorModel": "weaviate",
  "embeddingModel": "all-minilm:v2",
  "textBlockSize": 300,
  "overlapChar": 30,
  "retrieveLimit": 5,
  "similarityThreshold": 0,
  "enableHybrid": 0,
  "enableRerank": 0
}
```

注意字段名称：`vectorModel` 保存的是 **向量库类型**，`embeddingModel` 才是 **向量模型名称**。新增接口当前返回操作成功状态，管理端通过刷新列表找到新记录；不要假定响应中直接返回知识库 ID。

## 4. 上传文档，确认文件已经解析为片段 {#upload-and-parse}

### 4.1 上传文件

回到详情页的 **文件管理**：

1. 点击 **上传文档**。
2. 保持 **自动解析** 开启。
3. 选择下载好的 `rag-verification-sample.md`。
4. 确认待上传列表里是这份文件，点击 **确定并保存**。

![此前本地运行中，在上传弹窗选择验证样例并开启自动解析](/images/knowledge/upload-ready.png)

前端在 `FileManagement.vue` 中为每个文件构造 `FormData`，上传文件时也一并提交知识库 ID 和自动解析开关：

```ts
const formData = new FormData();
const rawFile = file.originFileObj || file;
formData.append('file', rawFile);
formData.append('knowledgeId', String(props.knowledgeId));
formData.append('autoParse', String(autoParse.value));
await requestClient.post('/system/attach/upload', formData);
```

这里的 `requestClient` 已统一处理登录身份。自己接入上传接口时，也需要带上当前登录客户端的鉴权信息；不要把模型服务商的 API Key 当作上传接口的登录令牌。

后端会计算文件的 SHA-256，并按“知识库 ID + 文件摘要”判断重复。**同一内容改名后仍然是重复文件**，不需要为重新解析再上传一次；使用该文件行的解析按钮即可。已有数据要具备对应的增量列和唯一索引，见安装页。

### 4.2 等待解析完成

上传成功后文件会出现在列表中，解析在后台继续。稍后点击 **刷新** 查看状态：

| 文件状态 | 此时发生了什么 | 你需要做什么 |
| --- | --- | --- |
| 待解析 | 文件已保存，还未执行解析。 | 如果上传时关闭了自动解析，点击这一行的 **解析**。 |
| 解析中 | 后端正在读取、切分、向量化和保存。 | 等待后再刷新。 |
| 已解析 | 该次解析已完成。 | 检查分块数，再打开 **知识片段**。 |
| 解析失败 | 解析链路中发生错误。 | 悬停状态查看错误原因，并对照后端日志排查。 |

![此前实测中，样例文档已解析且分块数大于零](/images/knowledge/file-parsed.png)

上传提示“成功”与解析状态“已解析”是两件事。`KnowledgeAttachServiceImpl.upload()` 先保存附件，再通过 Spring 代理异步启动解析：

```java
baseMapper.insert(knowledgeAttach);

if (Boolean.TRUE.equals(bo.getAutoParse())) {
    SpringUtils.getBean(IKnowledgeAttachService.class)
        .parse(knowledgeAttach.getId());
}
```

`parse()` 使用 `@Async("knowledgeParseExecutor")`。其主要步骤是读取对象存储中的源文件，按文件类型选择 loader，用当前知识库配置分段，再写入向量和片段记录。下面节选写入部分；其余配置组装和失败清理逻辑见原方法：

```java
vectorStoreService.removeByDocId(docId, String.valueOf(knowledgeId));
vectorStoreService.storeEmbeddings(storeEmbeddingBo);

// 向量写入成功后，替换该文件的片段记录。
knowledgeFragmentMapper.delete(Wrappers.<KnowledgeFragment>lambdaQuery()
    .eq(KnowledgeFragment::getDocId, docId));
knowledgeFragmentMapper.insertBatch(knowledgeFragmentList);
knowledgeRetrievalService.invalidateKnowledge(String.valueOf(knowledgeId));

attach.setStatus(KnowledgeAttachStatus.COMPLETED.getCode());
baseMapper.updateById(attach);
```

### 4.3 打开“知识片段”核对内容

点击样例文件这一行的 **知识片段**，找到包含“北辰项目”的片段，确认能读到 `6039` 和 `林小满`。如果一段显示不全，打开详情查看完整内容。

![此前实测中，知识片段包含样例文件中的项目事实](/images/knowledge/fragments.png)

继续检索测试前，应同时满足：**文件已解析、分块数大于 0、片段里有原文**。如果尚未满足这些条件，先排查文件解析，确认原文已正确写入知识库。

当前上传入口可选择文本、Markdown、PDF、Word、Excel、CSV、JSON 及多种代码文件。首次验证建议使用本页的小型 Markdown 样例；遇到扫描件或复杂排版文件，先检查解析出的文本是否完整。后端虽然还有文件夹和 GitHub 来源的 loader，但当前上传弹窗没有对应导入入口。

## 5. 先做检索测试，确认答案能被找到 {#retrieval-test}

### 5.1 用一个有明确答案的问题测试

打开 **检索测试**，输入：

```text
北辰项目的后端服务端口和发布负责人分别是什么？
```

在本页重新确认参数：阈值 `0`、Top K `5`、混合检索关闭、重排关闭，然后点击 **开始检索测试**。

::: tip 测试页参数需要单独核对
当前 `RetrievalTest.vue` 首次挂载时使用阈值 `0.5`、Top K `10` 等本地初始值，并不会自动把知识库已保存的检索参数全部载入。因此，即使你在上一节保存过参数，进入测试页后仍要检查。
:::

检索测试返回的是 **相关片段**，不会直接生成聊天答案。检查三个位置：

1. **片段内容**：是否同时包含正确端口和负责人。
2. **来源文档**：是否为 `rag-verification-sample.md`。
3. **得分与排序**：相关片段是否排在前面；点击片段可查看完整内容。

![此前本地检索命中样例文档，片段中包含 6039 和林小满](/images/knowledge/retrieval-result.png)

这张此前实测截图使用 `all-minilm:v2`，阈值为 `0`，Top K 为 `5`，命中分数约为 `48.7%`。**分数是当前检索方式下的相关性度量，不是答案正确率**，也不应直接作为其他向量模型的阈值。

### 5.2 测试按钮发送了什么

`RetrievalTest.vue` 中的请求对应 `POST /system/fragment/retrieval`，核心字段如下：

```ts
const res = await knowledgeRetrieval({
  knowledgeId: props.knowledgeId,
  query: query.value,
  topK: config.value.topK,
  threshold: config.value.similarityThreshold,
  enableRerank: config.value.enableRerank,
  rerankModel: config.value.rerankModelName,
  enableHybrid: config.value.enableHybridSearch,
  hybridAlpha: config.value.hybridAlpha,
});
```

后端 `KnowledgeFragmentServiceImpl.retrieval()` 根据 `knowledgeId` 读取知识库与向量模型配置，再调用统一检索服务。测试请求提供的参数优先，没有提供的参数才回退到知识库配置，例如：

```java
queryVectorBo.setMaxResults(bo.getTopK() != null
    ? bo.getTopK() : knowledgeInfoVo.getRetrieveLimit());
queryVectorBo.setSimilarityThreshold(bo.getThreshold() != null
    ? bo.getThreshold() : knowledgeInfoVo.getSimilarityThreshold());

return knowledgeRetrievalService.retrieve(queryVectorBo);
```

### 5.3 将有效参数应用到知识库

找到合适参数后，点击 **应用至知识库配置**，在确认框中点击 **确定应用**，再到 **知识库配置** 核对保存结果。只调整滑块、点击检索按钮，不会改变后续问答使用的全局配置。

应用按钮先读取最新知识库记录，再合并参数并调用 `infoUpdate()`。以下为 `handleApplyConfig()` 的字段合并代码：

```ts
const updatedData = {
  ...record,
  retrieveLimit: config.value.topK,
  similarityThreshold: config.value.similarityThreshold,
  enableHybrid: config.value.enableHybridSearch ? 1 : 0,
  hybridAlpha: config.value.hybridAlpha,
  enableRerank: config.value.enableRerank ? 1 : 0,
  rerankModel: config.value.rerankModelName,
};
await infoUpdate(updatedData);
```

若启用重排，还要留意：测试接口会把 Top K、阈值同时用于重排数量和重排分数过滤，但应用按钮目前没有同步写入独立的 `rerankTopN`、`rerankScoreThreshold`。调整重排后应在实际问答路径复测，不能只凭测试页结果判断两条路径完全一致。

## 6. 关联智能体，在用户端提出同一个问题 {#use-in-chat}

### 6.1 在管理端关联知识库

当前 `ruoyi-web` 的普通聊天页没有知识库选择控件。要从现有页面完成使用流程，可以通过智能体关联知识库：

1. 进入 **智能体管理 → 智能体列表**，新增一个用于验证的智能体。
2. **智能体名称**填写 `项目资料助手`，**智能体描述**填写 `项目资料问答`；用户端卡片会用描述作为展示信息。
3. **绑定模型**选择已验证可用的对话模型。这里需要聊天能力，不是知识库使用的 `all-minilm:v2` 向量模型。
4. 在 **关联知识库** 中选择 `RAG 文档验证知识库`。如果关联多个库，后端会分别检索并合并结果。
5. 验证知识库问答时，先不关联额外 MCP 工具和技能，**状态**选择正常，填写提示词并保存。

提示词可以从下面这段开始：

```text
你是项目资料助手。根据当前问题附带的知识库资料回答，
保留端口号、人名和时间等事实。资料中没有答案时，明确说明未找到，
不要猜测，也不要为了补充答案调用无关工具。
```

完整的智能体配置入口见[智能体管理](./agent.md)。关联知识库选择器在 `ruoyi-admin/apps/web-antd/src/views/agent/agent/data.tsx` 中定义；下面节选配置字段：

```ts
component: 'ApiSelect',
componentProps: {
  api: agentKnowledgeOptions,
  resultField: 'rows',
  labelField: 'name',
  valueField: 'id',
  mode: 'multiple',
  placeholder: '请选择关联的知识库',
},
fieldName: 'knowledgeIds',
label: '关联知识库',
```

这说明关联时保存的是知识库 **ID 数组**，不是知识库名称。

### 6.2 到用户端验证回答

1. 打开并登录[用户端](http://localhost:5180)。
2. 点击左侧 **应用市场**，找到刚保存的 `项目资料问答`，点击 **开始使用**。
3. 进入新的对话，确认输入框附近显示所选智能体；不要只选了一个普通聊天模型。
4. 输入第 5 节的同一个问题并发送。
5. 核对回答是否包含 `6039` 和 `林小满`，且没有改变项目名称或补造负责人。

再问一个样例没有提供的问题，例如“北辰项目的生产数据库密码是什么”。期望回答应说明资料没有提供；这能帮助你检查模型是否在没有依据时猜测。提示词只能表达要求，实际表现仍需测试。

如果回答不正确，先回到检索测试：找不到正确片段，就检查分段、向量模型和检索参数；片段正确但回答错误，再检查智能体选择、关联关系和对话模型对上下文的使用。

### 6.3 知识库内容怎样进入聊天请求

用户端发送当前问题与 `agentId`，由后端检索相关资料并补充到模型输入中。对应代码位于 `ruoyi-web/src/pages/chat/layouts/chatWithId/index.vue`：

```ts
const payload: SendDTO = {
  model: modelStore.currentModelInfo.modelName ?? '',
  agentId: agentStore.currentAgentInfo?.id || undefined,
  content: lastUserMessage?.content ?? '',
  sessionId: route.params?.id !== 'not_login'
    ? String(route.params?.id)
    : undefined,
};
```

后端 `ChatServiceFacade` 读取智能体的绑定模型和 `knowledgeIds`，在交给 Supervisor 前执行检索。`augmentAgentInput()` 的关键代码如下：

```java
RetrievalAugmentor augmentor = buildMultiKnowledgeAugmentor(knowledgeIds);
UserMessage userMessage = UserMessage.userMessage(content);
Metadata metadata = Metadata.from(
    userMessage, chatRequest.getSessionId(), new ArrayList<>());
AugmentationResult result = augmentor.augment(
    new AugmentationRequest(userMessage, metadata));
ChatMessage augmented = result.chatMessage();
return augmented instanceof UserMessage
    ? ((UserMessage) augmented).singleText() : content;
```

`CustomVectorRetriever.retrieve()` 负责读取知识库保存的阈值、检索条数、混合检索和重排配置，并复用第 5 节的 `KnowledgeRetrievalService`。因此，**将检索测试参数应用至知识库配置**，才会影响这里读取的参数。

::: info 回答出现了，不等于知识库检索成功
当前 RAG 增强失败时，后端会记录 `chat_rag operation=AUGMENT status=FALLBACK` 并回退到原始问题；部分知识库不可用时也可能被跳过。聊天仍可能返回答案。联调时要结合检索结果、后端日志或 RAG 链路追踪判断，不能只看模型有没有回复。
:::

### 6.4 自己开发聊天页或工作流时怎么接

如果你开发自己的聊天页面，后端普通模型对话也支持 `knowledgeId`：在 `/chat/send` 的请求中携带实际知识库 ID 和可用聊天模型，`buildModelChatMessages()` 会增强当前用户消息。这里是字段示意，替换模型名和 ID，并沿用项目的流式请求与登录处理：

```json
{
  "model": "你的可用聊天模型名",
  "content": "北辰项目的后端服务端口和发布负责人分别是什么？",
  "knowledgeId": "你的知识库ID"
}
```

智能体已经绑定 `knowledgeIds` 时优先使用这些绑定；没有绑定时才回退到请求中的单个 `knowledgeId`。当前用户端标准发送代码没有填写该字段，接口能力不等于页面已经提供选择入口。

工作流可以使用 **知识检索** 节点，选择知识库，将用户问题作为查询输入，再将检索片段传给后续大模型节点。节点实现位于 `ruoyi-aiflow/.../node/knowledgeRetrieval/KnowledgeRetrievalNode.java`，同样调用统一检索服务；画布操作见[工作流](./orchestration.md)。

## 7. 基础流程通过后，再调整检索效果 {#tune-retrieval}

每次只改一组参数，用相同的问题比较结果。先保留第 5 节已经通过的参数，方便调整后退回。

### 7.1 阈值和检索条数

阈值过高可能没有匹配片段，过低则可能带入无关内容。先确认能检索到包含答案的片段，再逐步提高阈值。增加检索条数会给聊天模型提供更多材料，也会增加上下文长度，应结合资料相关性调整。

### 7.2 型号、错误码等关键词不好找时，尝试混合检索

在 **检索测试** 打开 **混合检索**，从权重 `0.5` 开始比较同一组问题。后端并行执行向量检索和 MySQL 关键词检索，再用 RRF 合并排名。

`KnowledgeRetrievalServiceImpl.calculateRRF()` 中的实际权重公式是：

```java
double finalScore = (1 - alpha) * vectorScores.getOrDefault(id, 0.0)
                  + alpha * keywordScores.getOrDefault(id, 0.0);
vo.setScore(finalScore * 60.0);
```

`alpha` 越大越偏关键词，越小越偏向量。它作用于两路结果的排名分；切换检索方式后，页面分数的含义也会变化，不宜直接与纯向量得分比较。对概念、同义表达，可以先偏向量；对型号、错误码、精确字段名，可以尝试提高关键词权重。

### 7.3 候选片段找到了，但排序不好时，再启用重排

先在模型管理中配置可用的 `rerank` 模型，然后在检索测试打开 **重排** 并主动选择对应模型。

后端会把粗召回数量扩大为检索条数的 3 倍，让重排模型重新评分，再按目标数量截取。重排调用失败会回退到粗召回结果；之后仍可能经过重排阈值过滤。若打开重排后反而没有结果，需要同时检查模型调用和阈值。

确认改善后再应用配置，并重新测试用户端问答。当前 **查询改写** 是禁用态展示，还不能通过该页面启用。

## 8. 文档更新后，怎样让知识库使用新内容 {#maintain-documents}

| 你的改动 | 接下来怎么操作 |
| --- | --- |
| 只改了检索阈值、检索条数、混合检索参数 | 保存或应用配置后重新测试，不必重传文件。 |
| 改了文本块大小、重叠字符数或分隔符 | 保存配置，回到 **文件管理 → 全部重新解析**，等待文件完成后再测试。 |
| 某个文件解析失败 | 修复存储、模型或文件问题，再触发这一行的解析并刷新状态。 |
| 更新了原始文件的内容 | 建议先在验证库测试新版，确认后在目标库删除旧附件、上传新版并解析，避免同时命中新旧内容。 |
| 更换向量模型或向量库 | 建议新建知识库完整导入和验证，通过后再切换智能体关联。不要让旧文档向量与新查询向量混用。 |

**全部重新解析** 对应 `POST /system/attach/reparse/knowledge/{knowledgeId}`，返回提交数、跳过数和总数；处于解析中的文件会被跳过。接口返回只代表任务已提交，仍需刷新文件列表确认状态。

重新解析会先删除该文件的旧向量，再写新向量，不是无缝替换。业务正在使用的知识库应安排合适的更新时间；不要把“任务已提交”当作更新已完成。

从文件管理删除附件时，后端会清理对应的片段、向量和源文件。删除知识库会清理库内数据，执行前先检查关联智能体和工作流。也不要通过直接修改数据库中的片段文字来更新知识：片段修改接口当前没有同步重新生成向量，应从源文档重新解析。

## 9. 需要继续开发时，从这些文件入手 {#code-reference}

上文代码以当前工作区源码为准，省略的部分请在对应方法中查看。管理端路径以 `ruoyi-admin/apps/web-antd/src` 为起点，后端主要位于 `ruoyi-ai/ruoyi-modules/ruoyi-chat/src/main/java/org/ruoyi`。

| 操作 | 关键接口 | 代码入口 |
| --- | --- | --- |
| 新增、配置知识库 | `POST /system/info`、`PUT /system/info` | 前端 `KnowledgeAddModal.vue`、`KnowledgeConfig.vue`；后端 `KnowledgeInfoServiceImpl`。 |
| 上传文件 | `POST /system/attach/upload` | 前端 `FileManagement.vue`；后端 `KnowledgeAttachServiceImpl.upload()`。 |
| 解析、重新解析 | `POST /system/attach/parse/{id}`、`POST /system/attach/reparse/knowledge/{knowledgeId}` | `KnowledgeAttachServiceImpl.parse()`、`reparseKnowledge()`。 |
| 查看知识片段 | `GET /system/fragment/list` | `KnowledgeFragmentServiceImpl`，按 `docId` 过滤文件片段。 |
| 检索测试 | `POST /system/fragment/retrieval` | `KnowledgeFragmentServiceImpl.retrieval()` → `KnowledgeRetrievalServiceImpl`。 |
| 按厂商生成向量 | 随解析、查询流程调用 | `EmbeddingModelFactory` → `service/embed/impl` 中的厂商实现。 |
| 写入和查询向量库 | 随解析、查询流程调用 | `VectorStoreService` 及 `service/vector/impl`。 |
| 将知识用于回答 | `POST /chat/send` | `ChatServiceFacade` → `CustomVectorRetriever`。 |

想增加文件格式时，看 `ResourceLoaderFactory` 和 `service/knowledge/impl`；想调整分段规则，看 `service/knowledge/impl/split`。如果增加新的 embedding 厂商，需要同时处理厂商配置、模型配置和 `EmbeddingModelFactory` 的实现路由，不能只添加一个下拉选项。

## 10. 跟着流程排查常见问题 {#troubleshooting}

| 你看到的现象 | 先检查哪里 |
| --- | --- |
| 找不到菜单或操作按钮 | 检查当前账号的菜单和操作权限，例如知识库的 `system:info:*`、附件的 `system:attach:*`；检索测试需要 `system:fragment:list`。 |
| 向量模型下拉框没有目标模型 | 在模型管理检查分类是否为 `vector`，确认当前账号能查询该模型。 |
| 模型有选项，但解析时调用失败 | 检查厂商状态、服务地址、凭据规则及模型是否真实可用；存在配置不等于调用成功。 |
| 上传提示重复 | 同库文件内容摘要重复；重新解析用解析按钮，内容更新则按第 8 节处理。 |
| 上传长时间不结束或失败 | 检查默认 OSS、存储连接及上传响应；本地配置不应仍指向外部示例存储。 |
| `Unknown column 'file_hash'` 或缺少 `fid` | 按安装页执行适用的 RAG 增量 SQL。 |
| 文件一直待解析 | 查看自动解析是否开启，手动触发解析后刷新列表。 |
| 解析失败或没有有效片段 | 依次检查源文件能否读取、loader、分片配置、embedding 服务和向量库连接。 |
| 检索结果为空 | 在测试页将阈值暂设为 `0`，关闭混合检索和重排，核对知识库、向量模型与片段内容。 |
| 测试页有效，问答仍不对 | 检查是否应用了参数、是否选中正确智能体、是否绑定正确知识库，再看 RAG 日志和实际上下文。 |
| 用户端普通聊天里找不到知识库 | 当前页面没有直接选择入口；按第 6 节关联智能体，或在自建页面中传 `knowledgeId`。 |
| 应用市场找不到智能体 | 检查智能体是否保存、状态是否正常，以及用户端的登录身份和列表响应。 |
| 修改资料后仍检索到旧内容 | 检查旧文件是否仍在库中、是否完成重新解析；修改配置不会自动重建文件。 |

<details id="verification-notes">
<summary>本页截图与验证说明</summary>

本页新增的创建弹窗截图来自本次真实页面，未提交创建请求。其余 5 张配置、上传、片段和检索截图来自此前的本地真实运行，使用 `all-minilm:v2` 和 Weaviate；没有用模拟响应制作成功结果。

2026-09-08 本次修订重新检查了管理端的知识管理入口、新增弹窗、模型选择，以及当前前后端代码。复测环境的 Docker Desktop 在启动阶段出现 `dockerInference` 监听错误，未能恢复本地向量库等依赖，因此此次没有重新完成解析、检索及知识库问答的端到端验证。第 6 节给出的是当前页面与代码支持的使用步骤和验收方法，并非本次问答成功记录。

</details>

<style>
.knowledge-guide .vp-doc td,
.knowledge-guide .vp-doc th { overflow-wrap: anywhere; }
.knowledge-guide .vp-doc img { border: 1px solid var(--vp-c-divider); border-radius: 8px; }
@media (max-width: 640px) {
  .knowledge-guide .vp-doc table { display: block; width: 100%; max-width: 100%; overflow-x: auto; }
}
</style>
