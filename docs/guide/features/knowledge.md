---
outline: deep
---

# 知识管理

::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai) 的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。

:::

## 概览

知识管理是 RuoYi AI 的 RAG 主链路，负责把外部资料解析、切块、向量化、入库，并在问答时完成召回、重排和上下文注入。

```text
文档解析 -> 知识分块 -> 向量化 -> 向量库操作 -> 召回 -> 重排 -> 混合检索 -> 生成回答
```

当前实现集中在 `ruoyi-chat`：

| 能力 | 主要实现 |
| --- | --- |
| 文档解析 | `service/knowledge/impl/loader` |
| 知识库管理 | `KnowledgeInfoServiceImpl`、`KnowledgeAttachServiceImpl`、`KnowledgeFragmentServiceImpl` |
| 向量化 | `service/embed/impl` |
| 向量库 | `MilvusVectorStoreStrategy`、`QdrantVectorStoreStrategy`、`WeaviateVectorStoreStrategy` |
| 召回 | `CustomVectorRetriever`、`KnowledgeRetrievalServiceImpl` |
| 重排 | `AliBaiLianRerankModelService`、`SiliconFlowRerankModelService`、`ZhiPuRerankModelService` |

## 文档解析

RuoYi AI 已预留多种 loader，用于从不同来源读取原始内容。

| Loader | 支持内容 |
| --- | --- |
| `PdfFileLoader` | PDF 文档。 |
| `WordLoader` | Word 文档。 |
| `ExcelFileLoader` | Excel 表格。 |
| `CsvFileLoader` | CSV 表格。 |
| `MarkDownFileLoader` | Markdown 文档。 |
| `TextFileLoader` | TXT 文本。 |
| `JsonFileLoader` | JSON 文件。 |
| `CodeFileLoader` | 代码文件。 |
| `FolderLoader` | 文件夹批量导入。 |
| `GithubLoader` | GitHub 仓库资料。 |

截图占位：文档上传和解析进度页，建议放置在 `/images/knowledge/knowledge-upload.webp`。

## 知识分块

知识库配置中与分块相关的字段包括：

| 字段 | 说明 |
| --- | --- |
| `separator` | 分隔符，适合 FAQ、章节、固定模板文档。 |
| `textBlockSize` | 文本块大小，控制每个片段的最大长度。 |
| `overlapChar` | 相邻片段重叠字符数，减少跨段语义丢失。 |
| `retrieveLimit` | 召回条数。 |
| `similarityThreshold` | 相似度阈值，过滤低相关片段。 |

建议：

| 场景 | 分块建议 |
| --- | --- |
| 产品文档 | 按标题和段落切分，保留章节路径。 |
| FAQ | 按问答对切分，避免多个问题混在同一块。 |
| 表格 | 按行组或业务主键切分，保留表头。 |
| 代码 | 按文件、类、函数切分，保留路径和语言。 |

## 向量化

向量模型用于把文本转换为向量。当前 provider 包括 OpenAI、Ollama、阿里百炼、智谱、MiniMax、SiliconFlow 等。

| 字段 | 说明 |
| --- | --- |
| `embeddingModel` | 知识库使用的向量模型。 |
| `vectorModel` | 使用的向量库策略。 |

::: tip
同一个知识库的文档向量和查询向量必须使用同一类 embedding 模型，否则相似度会失真。
:::

截图占位：向量模型选择页，建议放置在 `/images/knowledge/embedding-model.webp`。

## 向量库操作

当前支持 Milvus、Qdrant、Weaviate 三种策略。部署文件可参考 `ruoyi-ai/docs/docker` 下的对应目录。

| 向量库 | 适合场景 |
| --- | --- |
| Milvus | 大规模向量、高并发检索、生产环境。 |
| Qdrant | 部署轻量、过滤能力强、适合中小规模服务。 |
| Weaviate | 上手快，适合验证和轻量知识库。 |

已有截图：

![知识库执行原理图](/images/knowledge/kn-05.webp)

## 召回

召回阶段会将用户问题向量化，在向量库中检索相似片段，再按知识库配置返回前 N 条。

```text
query -> embedding -> vector search -> score filter -> fragments
```

建议在调试页展示：

| 调试项 | 说明 |
| --- | --- |
| 查询向量模型 | 排查模型配置是否正确。 |
| 命中文档 | 显示知识库、文件、片段 ID。 |
| 相似度分数 | 判断阈值是否过高或过低。 |
| 注入上下文 | 查看最终送入模型的片段内容。 |

截图占位：召回调试页，建议放置在 `/images/knowledge/retrieval-debug.webp`。

## 重排

重排模型会对初次召回结果进行二次排序。知识库字段包括：

| 字段 | 说明 |
| --- | --- |
| `enableRerank` | 是否启用重排。 |
| `rerankModel` | 重排模型名称。 |
| `rerankTopN` | 重排后保留数量。 |
| `rerankScoreThreshold` | 重排分数阈值。 |

推荐在以下场景启用重排：

- 文档数量多，初次召回噪声较高。
- 用户问题较短，向量召回容易命中泛化片段。
- 需要更高准确率，允许增加一次模型调用耗时。

## 混合检索

混合检索结合关键词检索和向量检索。知识库字段包括：

| 字段 | 说明 |
| --- | --- |
| `enableHybrid` | 是否启用混合检索。 |
| `hybridAlpha` | 向量结果与关键词结果的融合权重。 |

建议：

| 场景 | `hybridAlpha` |
| --- | --- |
| 概念问答、语义相近表达 | 偏高，优先向量。 |
| 型号、编号、字段名、错误码 | 偏低，保留关键词精确命中。 |

## 使用流程

1. 进入 **知识库管理**，创建知识库。
2. 选择向量库、向量模型、分块参数。
3. 上传文档或配置外部来源。
4. 等待解析、分块、向量化完成。
5. 在对话或智能体中选择知识库问答。

已有截图：

![创建知识库](/images/knowledge/kn-02.webp)

![知识库问答示例一](/images/knowledge/kn-14.webp)

![知识库问答示例二](/images/knowledge/kn-15.webp)

## 参考资料

- [LangChain4j RAG](https://docs.langchain4j.dev/tutorials/rag)
- [LangChain4j Embedding Stores](https://docs.langchain4j.dev/category/embedding-stores)
