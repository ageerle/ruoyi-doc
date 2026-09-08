---
outline: deep
---

# Skills 能力

Skills 用于复用任务方法和项目规范，帮助模型按约定完成仓库调查、代码修改和结果验证等工作。当前可实际加载技能的是 Coding Harness（项目中的编码任务执行模块）；普通智能体表单中的文档技能目前仅保存关联配置。

本页先说明两条链路的支持情况，再介绍技能组成、目录规则、创建方法和 API 验证步骤。

## 1. 当前状态

| 链路 | 技能来源 | 当前状态 |
| --- | --- | --- |
| 智能体表单 | `ruoyi-admin/src/main/resources/skills` | 管理端可列出并保存 `docx/pdf/xlsx`，但 Supervisor 当前不会装载旧的 shell-backed Skills。 |
| Coding Harness | classpath 的 `coding-harness/skills`，以及 workspace 内的技能目录 | 通过 `activate_skill`、`read_skill_resource` 加载技能说明和资源，受 workspace、权限、计划和审批策略控制。 |

::: warning 不要按旧文档判断功能已接通
`SkillsAgent` 接口和智能体的 `skillNames` 字段仍在代码中，但 `ChatServiceFacade` 会输出“Legacy shell-backed skills are disabled”，且构建 Supervisor 时没有加入 `SkillsAgent`。因此，在普通智能体表单勾选 `docx/pdf/xlsx` 目前只会保存配置，不会让普通对话执行这些技能。
:::

项目当前没有独立的 Skills CRUD、启停和执行日志页面。管理端只有智能体表单中的技能下拉框。

一个 **Skill** 是以 `SKILL.md` 为入口的任务说明包，也可以包含脚本、模板和参考资源。`SKILL.md` 描述适用场景与执行步骤；**workspace** 指一次 Harness 会话所使用的工作目录，项目专属技能放在该目录下。加载技能会为模型提供任务指引，后续文件操作和命令执行仍由 Harness 的工具与权限策略控制。

## 2. 管理端可见的文档技能

源目录内置：

| 名称 | 内容 |
| --- | --- |
| `docx` | Word 创建、编辑、抽取与格式化说明、脚本和模板。 |
| `pdf` | PDF 读取、生成、合并拆分、表格与表单处理。 |
| `xlsx` | Excel/CSV 创建、编辑、公式、分析和重算。 |

进入 **智能体管理 → 智能体列表 → 新增 → 关联技能** 可以看到三个选项。本地实测 `GET /agent/agent/skillOptions` 返回 `docx`、`pdf`、`xlsx`，无 4xx/5xx 或控制台错误。下拉框当前以 description 作为展示文本，所以页面显示的是三段英文描述，保存值才是技能名。

![智能体表单读取磁盘技能](/images/skills/agent-skill-options.png)

该接口从以下路径读取：

```text
${user.dir}/ruoyi-admin/src/main/resources/skills
```

所以源代码方式必须从 `ruoyi-ai` 根目录启动后端。若只复制 JAR 到其他目录运行，该磁盘路径通常不存在；即使下拉接口恢复，普通 Supervisor 仍受上一节的禁用逻辑限制。

## 3. Coding Harness 的技能目录

Harness 随包内置：

| 名称 | 用途 |
| --- | --- |
| `repository-investigation` | 在修改前调查陌生仓库和真实实现边界。 |
| `safe-refactoring` | 执行保留行为、避免覆盖并发改动的重构。 |
| `verification` | 用构建、测试和运行证据验证任务完成。 |

每次运行还会按顺序扫描 workspace 内：

```text
.agents/skills
.claude/skills
.codex/skills
```

同名技能以先加载者为准，因此 classpath 内置技能优先。目录扫描跳过 `.git`、`.idea`、`node_modules`、`target`、`dist` 和 `build`。

Harness 在计划阶段只把技能名称、描述和来源提供给模型。模型明确调用后才加载完整内容：

```text
技能元数据 -> activate_skill(name) -> SKILL.md 正文
                             -> read_skill_resource(name, path)
```

这样可以避免把全部技能正文一次性塞入上下文。`read_skill_resource` 只允许技能目录内的相对路径，并拒绝 `../`、符号链接逃逸和超过 1 MiB 的资源。

## 4. 创建 workspace Skill

以仓库根目录为 Harness workspace，在其中创建：

```text
.agents/
  skills/
    release-check/
      SKILL.md
      checklist.md
```

`SKILL.md` 必须包含闭合的 YAML frontmatter：

```markdown
---
name: release-check
description: Check whether this repository is ready for a release.
---

# Release check

1. Read the repository build instructions.
2. Run only checks allowed by the current Harness phase.
3. Summarize failures with exact file or command evidence.
```

约束：

| 项目 | 当前限制 |
| --- | --- |
| 名称 | `[a-z0-9][a-z0-9-]{0,63}` |
| description | 必填，最多 1000 字符。 |
| `SKILL.md` | 最大 256 KiB。 |
| 单次目录扫描 | 最多 100 个技能，最大深度 6。 |
| 资源读取 | 单文件最大 1 MiB。 |
| 符号链接 | 不跟随。 |

新建或修改 workspace Skill 后，新建一次 Harness 运行；目录按运行加载，不需要重启后端。

## 5. 通过 Harness API 验证

目前前端仓库没有 Coding Harness 页面，需要使用受认证 API。普通账号必须拥有 `coding:harness:use`；写模式还需要 `coding:harness:write`，审批接口需要 `coding:harness:approve`。超级管理员用于本地验证时会绕过普通角色权限检查。

### 5.1 准备模型

`model` 必须与 **模型管理** 中一个真实可用的聊天模型名称完全一致，并支持多轮工具调用。Embedding 模型不能用于 Harness。

下面只展示请求结构，不要把登录令牌写进脚本或文档：

```powershell
$headers = @{
  Authorization = '<登录后取得的令牌>'
  clientid = '<管理端登录使用的 client id>'
  'Content-Type' = 'application/json'
}
```

### 5.2 创建只读会话

```powershell
$sessionBody = @{
  workspacePath = 'D:\Project\github\ruoyi-ai'
  model = '<模型管理中的模型名称>'
  permissionMode = 'READ_ONLY'
  approvalPolicy = 'ON_REQUEST'
  title = 'Skills 只读验证'
  idempotencyKey = [guid]::NewGuid().ToString()
} | ConvertTo-Json

$session = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:6039/coding/harness/sessions' -Headers $headers -Body $sessionBody
```

### 5.3 创建运行

用一个必须激活技能才能回答的问题：

```powershell
$runBody = @{
  requirement = '请激活 repository-investigation 技能，说明调查陌生仓库的第一步；不要修改任何文件。'
  idempotencyKey = [guid]::NewGuid().ToString()
  images = @()
} | ConvertTo-Json

$run = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:6039/coding/harness/sessions/$($session.data.sessionId)/runs" -Headers $headers -Body $runBody
```

轮询运行和消息：

```powershell
$sessionId = $session.data.sessionId
$runId = $run.data.runId

Invoke-RestMethod -Uri "http://127.0.0.1:6039/coding/harness/sessions/$sessionId/runs/$runId" -Headers $headers
Invoke-RestMethod -Uri "http://127.0.0.1:6039/coding/harness/sessions/$sessionId/messages?afterSequence=0&limit=500" -Headers $headers
```

也可以订阅：

```text
GET /coding/harness/sessions/{sessionId}/runs/{runId}/events/stream
```

验收标准：

- 工具消息中出现 `activate_skill`，参数名与技能名完全一致；
- 返回内容能对应 `SKILL.md`，不是模型凭空概括；
- `READ_ONLY` 会话没有写文件或执行变更命令；
- 运行进入 `COMPLETED`，或在需要计划/审批时进入明确的等待状态；
- 无未处理的 4xx/5xx 和后端异常。

## 6. 选择哪条能力

| 需求 | 当前建议 |
| --- | --- |
| 普通智能体调用 Java/MCP 函数 | 使用[工具管理](./tools.md)，在智能体中绑定 MCP 工具。 |
| 仓库调查、受控修改、验证 | 使用 Coding Harness 和其技能目录。 |
| 在普通对话直接生成 DOCX/PDF/XLSX | 当前普通 Supervisor 未接通这些磁盘技能；需要先完成安全运行时集成，不应只勾选表单。 |
| 给 Harness 添加项目规范 | 在 workspace 的 `.agents/skills` 等目录增加 Skill。 |

## 7. 代码定位

| 职责 | 代码 |
| --- | --- |
| 管理端技能选项 | `AgentServiceImpl#listSkillOptions`、`SkillsPathResolver` |
| 普通 Supervisor 禁用旧技能 | `ChatServiceFacade#handleAgentChat` |
| Harness 技能发现 | `HarnessSkillCatalogFactory` |
| 技能激活与资源读取 | `HarnessSkillTools`、`HarnessSkillCatalog` |
| Harness 工具装配 | `DefaultHarnessToolRuntimeFactory` |
| Harness API | `CodingHarnessController` |

## 8. 排障

| 现象 | 原因与处理 |
| --- | --- |
| 智能体技能下拉为空 | 从项目根目录启动；检查 `ruoyi-admin/src/main/resources/skills` 和后端日志。 |
| 已勾选 docx/pdf/xlsx 但对话不执行 | 当前普通 Supervisor 明确禁用旧技能，这是已知边界，不是提示词问题。 |
| Harness 报“模型未配置或已删除” | `model` 必须等于模型管理中的真实模型名称。 |
| API 返回 403 | 给角色增加 `coding:harness:use`，写/审批按需增加对应权限。 |
| 找不到 workspace Skill | 检查目录名、`SKILL.md` 大小、frontmatter、名称正则和扫描深度。 |
| 资源路径被拒绝 | 使用技能目录内的相对路径，不能包含 `../`，不能指向符号链接。 |
| 启动日志反复出现旧 Harness task 认领错误 | Harness 会在启动时恢复未结束的 durable run。先列出原 session/run 并调用受认证的取消接口；清理或迁移状态库前必须备份。 |

本轮在一个已有状态库中实际遇到过旧 run 每隔数秒重试，并输出 `Cannot claim terminal non-execution for uncertain tool effect`。它不会阻止模型、RAG、MCP、AI Flow 和普通 Supervisor 启动，但会持续制造错误日志。处理顺序：

1. 用 `GET /coding/harness/sessions` 找到当前登录用户的历史 session。
2. 用 `GET /coding/harness/sessions/{sessionId}/runs` 检查非终态 run。
3. 调用 `POST /coding/harness/sessions/{sessionId}/runs/{runId}/cancel`。
4. 若 run 涉及“结果不确定的外部副作用”，取消后仍不能终态化，不要直接删除几张表中的单条记录；先停止 Harness 写入、备份完整 Harness 状态，再按同一代码版本的数据模型做恢复或迁移。
