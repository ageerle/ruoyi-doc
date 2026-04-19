---
outline: deep
---

# 使用智能体

::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai)的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。

:::

## 什么是智能体

智能体（Agent）是使用大语言模型（LLM）执行特定任务的组件。与普通 AI 服务不同，智能体具备**自主决策能力**，能够通过"思考→行动→观察"的循环来完成复杂任务。

RuoYi AI v3.0 基于 LangChain4j Agentic 框架实现了智能体系统，支持以下核心能力：

- **ReAct 循环**：思考（Thought）→ 行动（Action）→ 观察（Observation），自主决策直到任务完成
- **工具调用**：通过 `@Tool` 注解将外部能力暴露给智能体使用
- **多智能体编排**：支持顺序、循环、并行、条件等多种工作流模式
- **监督者模式**：由 SupervisorAgent 统筹调度多个子智能体

## 核心概念

### ReAct 循环

智能体通过 ReAct（Reasoning + Acting）范式工作：

| 步骤 | 说明 | 示例 |
|------|------|------|
| **Thought（思考）** | 分析当前状态，决定下一步 | "用户要查询销售数据，我需要先获取表结构" |
| **Action（行动）** | 执行具体操作，如调用工具 | 调用 `queryTableSchema` 工具 |
| **Observation（观察）** | 获取行动结果反馈 | "表结构返回了，包含 sales_table" |
| **Final Answer** | 信息足够时给出最终输出 | 返回查询结果和图表 |

### 智能体定义

通过 `@Agent` 注解定义智能体，最佳实践是在注解中提供简短描述：

```java
public interface CreativeWriter {

    @UserMessage("""
        你是一个创意写手。
        根据给定主题生成一段不超过3句话的故事。
        只返回故事内容，不要其他内容。
        主题是 {{topic}}。
        """)
    @Agent("根据给定主题生成故事")
    String generateStory(@V("topic") String topic);
}
```

使用 `AgenticServices.agentBuilder()` 创建实例：

```java
CreativeWriter writer = AgenticServices
    .agentBuilder(CreativeWriter.class)
    .chatModel(myChatModel)
    .outputName("story")
    .build();
```

关键参数说明：

| 参数 | 说明 |
|------|------|
| `outputName` | 结果存储在共享变量中的名称，其他智能体可读取 |
| `chatModel` | 使用的大语言模型 |
| `tools` | 绑定的工具列表 |
| `chatMemoryProvider` | 对话记忆提供者，用于多轮对话 |
| `context` | 上下文提供者，可注入历史对话摘要 |

### 工具定义

工具是智能体能力的扩展，通过 `@Tool` 和 `@P` 注解定义：

```java
public class BankTool {

    @Tool("给指定用户账户存款并返回新余额")
    Double credit(@P("用户名") String user, @P("金额") Double amount) {
        // 业务逻辑
    }

    @Tool("从指定用户账户取款并返回新余额")
    Double withdraw(@P("用户名") String user, @P("金额") Double amount) {
        // 业务逻辑
    }
}
```

构建智能体时绑定工具：

```java
WithdrawAgent agent = AgenticServices
    .agentBuilder(WithdrawAgent.class)
    .chatModel(myChatModel)
    .tools(new BankTool())
    .build();
```

## 工作流模式

LangChain4j Agentic 框架提供了多种工作流编排模式：

### 顺序工作流

多个智能体依次执行，前一个的输出作为后一个的输入：

```java
UntypedAgent pipeline = AgenticServices
    .sequenceBuilder()
    .subAgents(writerAgent, editorAgent, formatterAgent)
    .outputName("result")
    .build();
```

### 循环工作流

智能体反复执行直到满足退出条件：

```java
UntypedAgent loop = AgenticServices
    .loopBuilder()
    .subAgents(scorerAgent, editorAgent)
    .maxIterations(5)
    .exitCondition(scope -> scope.readState("score", 0.0) >= 0.8)
    .build();
```

### 并行工作流

多个智能体独立处理相同输入，结果合并输出：

```java
EveningPlannerAgent planner = AgenticServices
    .parallelBuilder(EveningPlannerAgent.class)
    .subAgents(foodExpert, movieExpert)
    .executorService(Executors.newFixedThreadPool(2))
    .outputName("plans")
    .output(scope -> {
        // 合并多个子智能体的结果
        return combineResults(scope);
    })
    .build();
```

### 条件工作流

根据条件动态选择执行的智能体：

```java
UntypedAgent experts = AgenticServices.conditionalBuilder()
    .subAgents(scope -> scope.readState("category") == MEDICAL, medicalExpert)
    .subAgents(scope -> scope.readState("category") == LEGAL, legalExpert)
    .subAgents(scope -> scope.readState("category") == TECHNICAL, technicalExpert)
    .build();
```

## 监督者模式

当任务复杂度较高、难以预定义固定流程时，可以使用监督者（Supervisor）模式。由一个 SupervisorAgent 自主分析请求、制定计划、调度子智能体执行：

```java
SupervisorAgent supervisor = AgenticServices
    .supervisorBuilder()
    .chatModel(plannerModel)
    .subAgents(sqlAgent, chartAgent, skillsAgent)
    .responseStrategy(SupervisorResponseStrategy.LAST)
    .build();
```

监督者会自动分析用户请求，生成执行计划并依次调用合适的子智能体，直到任务完成。

### 响应策略

| 策略 | 说明 |
|------|------|
| `LAST`（默认） | 返回最后一个子智能体的响应 |
| `SUMMARY` | 返回所有执行步骤的总结 |
| `SCORED` | 对 LAST 和 SUMMARY 进行评分，返回得分更高的 |

## 实战案例

### 智能图表生成

用户请求："查询 chat_model 表格返回厂商模型统计图表"

执行过程：

```
[Thought] 用户需要数据统计和图表，先查询数据库
[Action]  调用 queryAllTables → 获取表列表
[Observation] 发现 chat_model 表存在

[Thought] 需要了解表结构才能写 SQL
[Action]  调用 queryTableSchema("chat_model")
[Observation] 获取到字段：vendor, model_type, model_name...

[Thought] 数据已获取，生成图表配置
[Action]  调用 ChartGenerationAgent
[Observation] 生成 ECharts 饼图 JSON 配置

[Final Answer] 返回图表给用户
```

![智能图表生成](/images/agent/agent-01.webp)

### Skills 创建 Excel 文件

用户请求："帮我创建一个员工工资 Excel 表格并且计算总额"

```java
public interface SkillsAgent {
    @SystemMessage("""
        你是一个文档处理技能助手。

        可用技能：
        - docx: Word文档处理
        - pdf: PDF文档处理
        - xlsx: Excel电子表格处理
        """)
    @UserMessage("{{query}}")
    @Agent("文档处理技能助手")
    String process(@V("query") String query);
}
```

Skills 通过 `SKILL.md` 文件定义，智能体按需通过 `activate_skill` 工具加载对应技能，完成文档处理任务。

![Excel 文件生成](/images/agent/agent-02.webp)

### 浏览器自动化

用户请求："访问系统页面，登录后打开模型管理，搜索指定模型并查看详情"

```
[Thought] 需要访问指定网页并进行登录操作
[Action]  调用 browser_navigate 访问页面
[Observation] 页面已加载

[Thought] 获取页面快照，识别登录元素
[Action]  调用 browser_snapshot
[Observation] 发现用户名/密码输入框

[Thought] 执行登录并导航到目标页面
[Action]  调用 browser_run_code 填写表单并提交
[Observation] 登录成功，进入目标页面

[Final Answer] 返回页面详情信息
```

![浏览器自动化](/images/agent/agent-03.webp)

![浏览器自动化-详情](/images/agent/agent-04.webp)

## 使用技巧

### 合理划分智能体职责

每个智能体应专注于单一职责，避免一个智能体承担过多任务。通过监督者模式组合多个专注的智能体，效果优于一个"全能"智能体。

### 善用共享变量

智能体之间通过 `AgenticScope` 共享数据。使用 `outputName` 声明输出变量，后续智能体通过 `@V` 注解读取，实现数据传递：

```java
// 智能体 A 输出结果到 "data"
AgenticServices.agentBuilder(AgentA.class)
    .outputName("data")
    .build();

// 智能体 B 从 "data" 读取输入
public interface AgentB {
    @Agent
    String process(@V("data") String data);
}
```

### 配置对话记忆

为需要多轮对话的智能体配置 `chatMemoryProvider`，使其能保持上下文：

```java
AgenticServices.agentBuilder(MyAgent.class)
    .chatModel(model)
    .chatMemoryProvider(memoryId -> MessageWindowChatMemory.withMaxMessages(10))
    .build();
```

### 上下文传递

当子智能体需要了解之前发生的事情时，可以使用上下文摘要：

```java
AgenticServices.agentBuilder(MyAgent.class)
    .chatModel(model)
    .chatMemoryProvider(memoryId -> MessageWindowChatMemory.withMaxMessages(10))
    .summarizedContext("otherAgent1", "otherAgent2")
    .build();
```

### 错误处理

配置 `errorHandler` 处理异常情况，支持重试、返回替代结果等策略：

```java
AgenticServices.sequenceBuilder()
    .subAgents(agent1, agent2, agent3)
    .errorHandler(errorContext -> {
        if (errorContext.exception() instanceof MissingArgumentException) {
            // 补充缺失参数后重试
            errorContext.agenticScope().writeState("topic", "默认主题");
            return ErrorRecoveryResult.retry();
        }
        return ErrorRecoveryResult.throwException();
    })
    .build();
```

### 设置最大循环次数

使用循环工作流时务必设置 `maxIterations`，防止智能体陷入无限循环：

```java
AgenticServices.loopBuilder()
    .subAgents(scorer, editor)
    .maxIterations(5)    // 最多执行 5 轮
    .exitCondition(scope -> scope.readState("score", 0.0) >= 0.8)
    .build();
```

## 注意事项

::: warning 安全提示
Shell 执行和浏览器自动化等工具本质上存在安全风险。命令直接在主机进程环境中运行，无需沙箱化或权限限制。生产环境应考虑沙箱隔离，仅在受信任的环境中使用。
:::

- 智能体的执行效果取决于模型能力和工具定义的质量，建议在 SystemMessage 中给出清晰的约束和指令
- 复杂任务建议拆分为多个简单智能体，通过工作流编排完成
- 监督者模式会产生多次 LLM 调用，注意控制成本和响应时间