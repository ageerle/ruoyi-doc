---
outline: [2, 3]
---

# Docker 部署

本页按照[后端项目 README 的 Docker 部署说明](https://github.com/ageerle/ruoyi-ai/blob/main/README_ZH.md)更新，并逐项核对 `docs/docker/ruoyi-ai` 中的 Compose、Dockerfile 和镜像发布配置。目标是启动 MySQL、Redis、Weaviate、MinIO、后端、管理端和用户端，再完成第一次可用的对话。

**首次部署推荐使用完整镜像方式**：只需要克隆后端仓库，不需要在宿主机安装 Java、Maven、Node.js，也不需要分别下载两个前端仓库。需要修改代码时，再使用[源码构建](#source-build)或[本地安装](./install.md)。

::: info 版本与命令约定
本页于 **2026-09-08** 核对。当前项目 README 以 `v3.1.0` 为部署示例，下面固定使用同一标签；这不表示 `latest` 永远等于它。源码标签与镜像标签应配套使用。

除明确说明切换目录的段落外，命令都在**后端仓库 `ruoyi-ai` 根目录**执行。命令使用 Compose V2 风格的 `docker compose`；多行 Bash 命令中的 `\` 不能直接复制到 PowerShell，Windows 用户使用对应代码块或写成一行。
:::

## 一、运行前准备

### 1.1 本机资源

| 项目 | 要求 |
| --- | --- |
| Git | 用于克隆源码；[官网下载](https://git-scm.com/downloads)，安装后确认 `git --version` 可用 |
| Docker | 可正常运行的 Docker Engine，或已启动的 Docker Desktop；[Windows 下载与安装](https://docs.docker.com/desktop/setup/install/windows-install/) / [Linux Engine 安装](https://docs.docker.com/engine/install/) |
| Compose | Docker Compose V2 或兼容版本，命令为 `docker compose` |
| 容器类型 | Linux containers |
| 架构 | 当前镜像发布工作流构建 `linux/amd64`；部署前检查目标标签的镜像清单 |
| 内存 | 入门环境建议给 Docker 至少 8 GB；源码构建、本地模型与并发请求需要更多 |
| 磁盘 | 建议预留 15 GB 以上；模型、构建缓存和业务文件另算 |
| 网络 | 能访问 GitHub、`ghcr.io` 和 Docker Hub；源码构建还需访问 Maven、npm 等依赖仓库 |

~~~bash
docker version
docker compose version
docker info --format '{{.OSType}}/{{.Architecture}}'
docker buildx imagetools inspect ghcr.io/ageerle/ruoyi-ai-backend:v3.1.0
~~~

ARM64 主机如果在镜像清单中看不到 `linux/arm64`，不要强行在生产环境模拟运行；改用[源码启动](./install.md)，或自行构建对应架构镜像。

### 1.2 端口

完整镜像编排默认暴露：

| 服务 | 宿主机端口 | 容器端口 | 用途 |
| --- | ---: | ---: | --- |
| MySQL | `23306` | `3306` | 业务数据库 |
| Redis | `26379` | `6379` | 缓存和会话 |
| Weaviate | `28080` | `8080` | RAG 向量库 |
| MinIO API | `29000` | `9000` | 文件对象存储 |
| MinIO Console | `29090` | `9090` | MinIO 管理页 |
| 后端 | `26039` | `6039` | REST/SSE 接口 |
| 管理端 | `25666` | `5666` | 配置模型、知识库、智能体等 |
| 用户端 | `25137` | `5137` | 对话和智能体入口 |

先确认端口没有被占用。若修改端口，只改冒号左侧的宿主机端口；容器之间仍使用服务名和容器端口。

### 1.3 功能所需外部资源

基础页面启动不要求云模型 Key，但启动容器不会自动开通模型服务。按需要准备：

| 要运行的能力 | 需要准备 |
| --- | --- |
| 本地普通聊天 | 一个 Ollama 聊天模型，例如 `qwen2.5:1.5b`；这个轻量示例不代表复杂智能体效果 |
| 智能体工具调用 | 支持工具调用且已验证兼容的聊天模型，按[智能体管理](/guide/features/agent#prerequisites)检查 |
| 本地 RAG | Ollama Embedding 模型，例如 `all-minilm:v2`，并保证维度与知识库配置一致 |
| DeepSeek、智谱、百炼、OpenAI 等 | 对应供应商 API Key |
| 外部应用、搜索、邮件、多模态 | 对应服务的地址、账号及凭证，按所用模块的文档配置 |

没有这些信息不会妨碍系统启动，但相应功能调用会失败。模型 API Key 统一在 **ruoyi-admin → 对话管理 → 模型管理** 中直接填写，不需要写入 Compose 环境变量。其他模块的凭据按对应功能文档配置，不要提交到 Git。

## 二、方式一：完整镜像部署（推荐） {#image-deploy}

### 2.1 准备配置

首次安装，在准备存放项目的目录执行（Bash、PowerShell 均适用）：

~~~bash
git clone --depth 1 --branch v3.1.0 https://github.com/ageerle/ruoyi-ai.git
cd ruoyi-ai
~~~

复制配置模板。已有部署请保留原 `.env`，直接阅读[升级与回滚](#upgrade)，不要覆盖现有配置。

::: code-group

~~~bash [Linux / macOS]
cp docs/docker/ruoyi-ai/.env.example docs/docker/ruoyi-ai/.env
~~~

~~~powershell [PowerShell]
Copy-Item docs/docker/ruoyi-ai/.env.example docs/docker/ruoyi-ai/.env
~~~

:::

用编辑器打开 `docs/docker/ruoyi-ai/.env`，把默认的 `latest` 改为固定标签，保存为：

~~~dotenv
IMAGE_OWNER=ageerle
RUIYI_VERSION=v3.1.0
~~~

| 变量 | 含义与注意事项 |
| --- | --- |
| `IMAGE_OWNER` | GHCR 镜像所属账号；官方镜像使用 `ageerle`。只有在自己的账号下发布了所需镜像后才改为 fork 账号 |
| `RUIYI_VERSION` | 同时选择 MySQL 初始化镜像、后端、管理端、用户端四个项目镜像的标签；拼写就是 `RUIYI`，不要改成 `RUOYI` |

官方 GHCR 镜像已公开，正常拉取**无需 `docker login`**。`RUIYI_VERSION` 不控制 Redis、Weaviate 或 MinIO 的版本；特别是编排中的 MinIO 使用 `latest`，正式环境还应单独固定这些依赖的已验证版本或 digest。

::: warning v3.1.0 的向量库地址需要补齐
标签 `v3.1.0` 的完整 Compose 尚未给后端覆盖 Weaviate 地址，镜像内默认配置为 `127.0.0.1:28080`，在容器中会指向后端自己。启动前编辑 `docs/docker/ruoyi-ai/docker-compose-all.yaml`，在现有的 `services.backend.environment` 下追加以下三个键，保留原有数据库、Redis 等配置：

~~~yaml
      VECTOR_STORE_TYPE: weaviate
      VECTOR_STORE_WEAVIATE_PROTOCOL: http
      VECTOR_STORE_WEAVIATE_HOST: weaviate:8080
~~~

当前主分支的完整 Compose 已包含这些键；若所用文件已经存在，不要重复添加。这是 Compose 配置补充，不需要重新构建后端镜像。
:::

### 2.2 检查配置并启动

先检查 Compose 能否解析、实际会拉取哪些镜像，再启动：

::: code-group

~~~bash [Linux / macOS]
docker compose --env-file docs/docker/ruoyi-ai/.env \
  -f docs/docker/ruoyi-ai/docker-compose-all.yaml config --quiet
docker compose --env-file docs/docker/ruoyi-ai/.env \
  -f docs/docker/ruoyi-ai/docker-compose-all.yaml config --images
docker compose --env-file docs/docker/ruoyi-ai/.env \
  -f docs/docker/ruoyi-ai/docker-compose-all.yaml pull
docker compose --env-file docs/docker/ruoyi-ai/.env \
  -f docs/docker/ruoyi-ai/docker-compose-all.yaml up -d
~~~

~~~powershell [PowerShell]
docker compose --env-file docs/docker/ruoyi-ai/.env -f docs/docker/ruoyi-ai/docker-compose-all.yaml config --quiet
docker compose --env-file docs/docker/ruoyi-ai/.env -f docs/docker/ruoyi-ai/docker-compose-all.yaml config --images
docker compose --env-file docs/docker/ruoyi-ai/.env -f docs/docker/ruoyi-ai/docker-compose-all.yaml pull
docker compose --env-file docs/docker/ruoyi-ai/.env -f docs/docker/ruoyi-ai/docker-compose-all.yaml up -d
~~~

:::

`config --quiet` 成功时没有输出，`config --images` 中四个 `ghcr.io/ageerle/ruoyi-ai-*` 镜像应以 `:v3.1.0` 结尾。若仍然是 `latest`，先检查 `.env` 路径、变量拼写，以及终端是否设置了同名环境变量；Shell 环境变量可以覆盖 `.env` 中的值，规则见 [Docker 官方说明](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)。

首次启动 MySQL 会导入镜像内的初始化 SQL，通常比后续启动慢。后端会等待 MySQL 的 TCP 健康检查通过；前端仅等待后端容器启动，不保证 Java 应用已就绪，因此刚启动时短暂出现 502 应先观察后端日志。

### 2.3 检查启动状态

后文运维命令写成单行，Bash 和 PowerShell 均可执行：

~~~bash
docker compose --env-file docs/docker/ruoyi-ai/.env -f docs/docker/ruoyi-ai/docker-compose-all.yaml ps -a
docker compose --env-file docs/docker/ruoyi-ai/.env -f docs/docker/ruoyi-ai/docker-compose-all.yaml logs --tail=200 mysql backend
~~~

预期结果：

- `mysql` 和 `redis` 显示健康；
- `backend` 没有持续重启，日志中出现应用启动完成信息；
- 两个前端容器保持 `Up`；
- 后端租户列表接口可以返回正常响应。

`Up` 只表示容器进程存活。下面分别检查后端接口、Weaviate 就绪状态和 MinIO 存活状态；租户列表接口不是专门的健康检查，HTTP 200 后还应确认响应是正常业务结果。

PowerShell：

~~~powershell
$tenantResponse = Invoke-WebRequest http://127.0.0.1:26039/auth/tenant/list
$tenantResponse.StatusCode
$tenantResponse.Content
(Invoke-WebRequest http://127.0.0.1:28080/v1/.well-known/ready).StatusCode
(Invoke-WebRequest http://127.0.0.1:29000/minio/health/live).StatusCode
~~~

Linux/macOS：

~~~bash
curl -fsS http://127.0.0.1:26039/auth/tenant/list
curl -fsS http://127.0.0.1:28080/v1/.well-known/ready
curl -fsS http://127.0.0.1:29000/minio/health/live
~~~

### 2.4 登录与访问

本机部署使用下面的地址；远程服务器部署时，把 `127.0.0.1` 换成服务器 IP 或域名，并确认服务器防火墙和云安全组允许访问应用端口。

| 入口 | 地址 | 初始化账号 |
| --- | --- | --- |
| 管理端 | http://127.0.0.1:25666 | `admin / admin123` |
| 用户端 | http://127.0.0.1:25137 | `admin / admin123` |
| MinIO Console | http://127.0.0.1:29090 | `ruoyi / ruoyi123` |

![管理端登录页示例](/images/runtime/admin-login.png)

![管理端首页示例](/images/runtime/admin-home.png)

![用户端首页示例](/images/runtime/user-home.png)

以上为界面示例，菜单和样式以所部署版本为准。初始化账号仅用于首次登录，请及时修改密码。访问后端根路径没有首页，并不代表后端启动失败。

## 三、首次配置

容器部署只完成基础设施准备。模型、文件存储和智能体需要在后台配置；先验证普通聊天，再增加知识检索和工具调用，便于判断问题发生在哪一层。

### 3.1 把 MinIO 设为默认对象存储

登录管理端，进入“系统管理 → 文件配置管理”，新增或修改 MinIO：

| 字段 | 后端在容器中时的值 |
| --- | --- |
| endpoint | 后端上传可使用 `http://minio:9000` |
| accessKey | `ruoyi` |
| secretKey | `ruoyi123` |
| bucket | 例如 `ruoyi` |
| 是否默认 | 是 |

![MinIO 默认文件存储配置示例](/images/runtime/oss-minio-default.png)

`minio:9000` 是 Docker 网络内部地址，浏览器不能直接访问。若文件下载地址由 endpoint 直接生成，应改成浏览器和后端都能访问的域名，例如通过反向代理暴露的 `https://files.example.com`。不要在容器内配置 `127.0.0.1:29000`：容器中的 `127.0.0.1` 指向后端容器自己。

若已修改 MinIO 登录凭证，这里的 Key 也要同步更新。上传一个小文件，再从浏览器打开生成的链接；“上传成功”并不等于返回的文件地址可访问。

### 3.2 配置本地 Ollama

完整编排没有内置 Ollama。可以在宿主机安装，也可以让 Ollama 加入 Compose 网络。先查实际网络名：

~~~bash
docker network ls
~~~

假设网络名为 `ruoyi-ai_ruoyi-net`：

~~~bash
docker run -d --name ruoyi-ai-ollama --restart unless-stopped --network ruoyi-ai_ruoyi-net -v ollama-data:/root/.ollama ollama/ollama:latest
docker exec ruoyi-ai-ollama ollama pull qwen2.5:1.5b
docker exec ruoyi-ai-ollama ollama pull all-minilm:v2
~~~

后端可通过 `http://ruoyi-ai-ollama:11434` 访问同网络的 Ollama，并将此地址填写到模型配置中。无需鉴权的 Ollama 模型密钥留空，带认证的网关还需适配器支持。聊天模型和向量模型的完整配置分别见[模型管理](/guide/features/model#provider-extension)与[知识管理](/guide/features/knowledge)。

如果 Ollama 安装在宿主机：

- Docker Desktop 可尝试 `http://host.docker.internal:11434`；
- Linux Engine 需要显式配置宿主机网关，或把 Ollama 放进同一 Docker 网络；
- 不要填 `http://127.0.0.1:11434`。

### 3.3 验证一条完整链路

按顺序完成：

1. 在厂商管理和模型管理中新增一个可调用的聊天模型，并测试成功。
2. 新增一个向量模型，记录真实维度。
3. 新建 Weaviate 知识库，向量维度必须与模型输出一致。
4. 上传小型 TXT 或 Markdown 文件，等待解析状态完成。
5. 在知识库“检索测试”中输入原文中的专有句子。
6. 新建智能体，选择聊天模型；需要知识问答时再绑定已验证知识库。
7. 从用户端进入该智能体，发送一句最小测试问题。

各模块页面给出了实际运行截图和故障判断，不要同时从智能体、知识库和工作流开始排错。

### 3.4 环境变量怎样生效

`.env` 首先用于 **Compose 变量替换**，不会自动把所有键注入后端容器。当前模板只声明镜像所属账号和版本；仅在 `.env` 加上数据库密码、`AGENT_ALLOWED_TABLES` 或云模型 Key，不代表应用已经收到配置。

例如需要给后端传递 SQL 表白名单，应在 `.env` 设置该变量，并在 `services.backend.environment` 显式引用：

~~~yaml
      AGENT_ALLOWED_TABLES: ${AGENT_ALLOWED_TABLES:-}
~~~

修改 Compose 的环境变量后，执行同一套参数的 `docker compose ... up -d backend` 使容器按新配置重建；仅执行 `restart backend` 不会加载新的容器环境。完整的 SQL 数据源与白名单配置见[智能体管理](/guide/features/agent#sql-config)。不要把带有密钥的完整 `docker compose config` 输出贴到公开问题中。

## 四、方式二：源码构建与分步部署 {#source-build}

README 同时介绍了分步构建方式。实际操作需要指定各仓库的 Compose 路径，并处理构建上下文与 Docker 网络，不能在任意仓库根目录直接执行不带 `-f` 的命令。

::: warning 与完整镜像部署二选一
两套编排复用了 `ruoyi-ai-*` 容器名、部分端口以及默认数据卷。不要并行启动，也不要把切换方式当作创建隔离测试环境，尤其不要让不同 MySQL 版本复用原数据卷。已有部署先备份，再规划容器、网络、卷和端口的迁移。
:::

### 4.1 准备源码与构建后端

从需要构建的、前后端兼容的源码版本开始。复现某次正式发布时，按发布工作流使用三个仓库中对应的同名标签；自行开发时记录三端的 commit，不要默认把旧后端与最新前端混用。若前端仓库没有目标标签，先确认项目提供的兼容版本，不要自行把分支名当成发布标签。

后端 Dockerfile 在容器中使用 Maven 和 JDK 17 编译，以 `prod` 配置运行；管理端和用户端在各自 Dockerfile 中构建。宿主机不必另外安装这些编译工具，但必须能访问依赖源。

当前 `docs/docker/ruoyi-ai/docker-compose.yaml` 的 `backend.build.context` 是 `.`，解析后指向 Compose 所在目录，而 Dockerfile 要读取后端仓库根目录的 `pom.xml`。在该 Compose 同目录下新建 `docker-compose.source.override.yaml`：

~~~yaml
services:
  backend:
    build:
      context: ../../..
      dockerfile: docs/docker/ruoyi-ai/Dockerfile.backend
    environment:
      VECTOR_STORE_TYPE: weaviate
      VECTOR_STORE_WEAVIATE_PROTOCOL: http
      VECTOR_STORE_WEAVIATE_HOST: weaviate:8080
~~~

回到后端仓库根目录执行：

~~~bash
docker compose -f docs/docker/ruoyi-ai/docker-compose.yaml -f docs/docker/ruoyi-ai/docker-compose.source.override.yaml config --quiet
docker compose -f docs/docker/ruoyi-ai/docker-compose.yaml -f docs/docker/ruoyi-ai/docker-compose.source.override.yaml up -d --build
docker compose -f docs/docker/ruoyi-ai/docker-compose.yaml -f docs/docker/ruoyi-ai/docker-compose.source.override.yaml logs --tail=200 backend
~~~

这个文件会构建后端并启动四项依赖。后续对这套部署执行 `up`、`logs`、`down` 等操作时，都保留同样的两个 `-f` 参数。相对路径按第一个 Compose 文件所在目录解析，不是按当前终端目录解析。

### 4.2 构建管理端

准备独立的[管理端仓库](https://github.com/ageerle/ruoyi-admin)，在 **`ruoyi-admin` 仓库根目录**执行：

~~~bash
docker compose -f apps/web-antd/docker-compose.yml config --quiet
docker compose -f apps/web-antd/docker-compose.yml up -d --build
~~~

管理端的 Compose 会加入外部网络 `ruoyi-ai_ruoyi-net`，默认代理到 `ruoyi-ai-backend:6039`，因此先完成后端部署。如果实际后端网络名不同，先调整此文件的 `networks.ruoyi-net.name`，不要另建一个同名但没有后端的网络。

构建完成后访问 `http://服务器IP:5666`。若依赖安装失败，先看最早的构建错误、仓库要求的包管理器版本和锁文件；公开镜像的构建步骤还可对照后端仓库 `.github/workflows/publish-images.yml`。当前发布工作流会在安装依赖前调整两个前端 Dockerfile 的构建脚本许可，直接本地构建不会自动执行这一步。若日志提示依赖的构建脚本被忽略，应核对该版本实际需要执行的脚本及许可配置。不要通过删除锁文件掩盖版本问题。

### 4.3 构建用户端（可选）

准备独立的[用户端仓库](https://github.com/ageerle/ruoyi-web)。它的独立 Compose 默认通过 `host.docker.internal:26039` 访问宿主机后端。为了与本节的后端容器直接通信，编辑 **`ruoyi-web` 仓库根目录**的 `docker-compose.yml`：

1. 把 `services.frontend.environment.UPSTREAM_URL` 改为 `http://ruoyi-ai-backend:6039`。
2. 将文件底部的 `networks.ruoyi-net` 整段替换为下面的外部网络配置，移除原来的 `driver: bridge`。

~~~yaml
networks:
  ruoyi-net:
    external: true
    name: ruoyi-ai_ruoyi-net
~~~

保留其他配置，网络名与实际后端一致。在用户端仓库根目录执行：

~~~bash
docker compose -f docker-compose.yml config --quiet
docker compose -f docker-compose.yml up -d --build
~~~

构建完成后访问 `http://服务器IP:5137`。本节给出的是依据仓库配置核对的构建方法；本次文档校验没有执行三个项目的完整镜像构建。

### 4.4 两种方式的端口不能混用

| 服务 | 完整镜像方式：宿主机端口 | 本节源码 Compose：宿主机端口 |
| --- | ---: | ---: |
| 管理端 | `25666` | `5666` |
| 用户端 | `25137` | `5137` |
| 后端 | `26039` | `26039` |
| MySQL | `23306` | `23306` |
| Redis | `26379` | `6379` |
| Weaviate | `28080` | `28080` |
| MinIO API / Console | `29000` / `29090` | `9000` / `9090` |

后端 Java 服务的容器内端口是 `6039`，但源码 Compose 仍映射为 `26039:6039`。README 的分步端口表写的是 `6039`，本页以实际 Compose 映射为准。

### 4.5 只用容器启动基础设施

如果需要在 IDE 中断点调试，在**后端仓库根目录**只启动所需依赖：

~~~bash
docker compose -f docs/docker/ruoyi-ai/docker-compose.yaml up -d redis weaviate minio
~~~

然后按[本地安装](./install.md)配置宿主机 MySQL、后端、管理端和用户端。此时后端运行在宿主机，应连接上表源码方式的宿主机端口，例如 `127.0.0.1:6379` 和 `127.0.0.1:28080`。它不能通过 Docker 专用的 `redis`、`weaviate` 服务名连接容器。

## 五、数据库初始化与增量脚本

完整镜像方式使用自带初始化脚本的 `ruoyi-ai-mysql` 镜像；源码方式通过文件挂载提供脚本。两者首次初始化都会使用 `docs/script/sql/ruoyi-ai.sql` 与 `snail_job_mysql.sql`，分别准备业务库和任务调度库。

MySQL 的 `/docker-entrypoint-initdb.d` **只在数据目录为空时执行**。已有 `mysql-data` 卷时，重启或更新镜像不会自动补跑 `docs/script/sql/update` 中的增量 SQL，也不会重新设置已有账号的密码。

更新项目前：

1. 阅读目标版本更新日志。
2. 在维护窗口停止业务写入，备份 `ruoyi-ai-agent`；如使用调度功能，也备份 `snail_job`。
3. 按版本顺序执行缺失的增量 SQL。
4. 再启动新版本后端并检查日志。

下面是完整镜像方式的备份示例，在**后端仓库根目录**执行。先让容器内的 `mysqldump` 写带时间戳的文件，成功后再复制到宿主机，避免 Windows PowerShell 重定向 SQL 文本时改变编码：

::: code-group

~~~bash [Linux / macOS]
docker_backup_name="ruoyi-ai-$(date +%Y%m%d-%H%M%S).sql"
if docker compose --env-file docs/docker/ruoyi-ai/.env -f docs/docker/ruoyi-ai/docker-compose-all.yaml exec -T mysql sh -c 'MYSQL_PWD=$MYSQL_ROOT_PASSWORD exec mysqldump -uroot --single-transaction --routines --events --databases ruoyi-ai-agent snail_job --result-file="$1"' sh "/tmp/$docker_backup_name"; then
  docker compose --env-file docs/docker/ruoyi-ai/.env -f docs/docker/ruoyi-ai/docker-compose-all.yaml cp "mysql:/tmp/$docker_backup_name" "./$docker_backup_name"
else
  printf '%s\n' '数据库导出失败，未复制备份' >&2
fi
~~~

~~~powershell [PowerShell]
$dockerBackupName = "ruoyi-ai-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"
docker compose --env-file docs/docker/ruoyi-ai/.env -f docs/docker/ruoyi-ai/docker-compose-all.yaml exec -T mysql sh -c 'MYSQL_PWD=$MYSQL_ROOT_PASSWORD exec mysqldump -uroot --single-transaction --routines --events --databases ruoyi-ai-agent snail_job --result-file="$1"' sh "/tmp/$dockerBackupName"
if ($LASTEXITCODE -ne 0) { throw '数据库导出失败，未复制备份' }
docker compose --env-file docs/docker/ruoyi-ai/.env -f docs/docker/ruoyi-ai/docker-compose-all.yaml cp "mysql:/tmp/$dockerBackupName" "./$dockerBackupName"
if ($LASTEXITCODE -ne 0) { throw '备份复制失败，请检查目标路径和磁盘空间' }
~~~

:::

确认导出和复制均成功，且宿主机备份文件非空。示例要求容器中的 `MYSQL_ROOT_PASSWORD` 与数据库实际 root 密码一致；自行部署且未创建 `snail_job` 时，去掉该数据库名。妥善存放备份，避免覆盖唯一备份或提交含业务数据的 SQL 到 Git。

增量脚本应按**源版本到目标版本的差异**选择，在数据库客户端连接 `服务器IP:23306` 后执行并记录结果。不要重复导入整库初始化 SQL；例如 `snail_job_mysql.sql` 含有删除并重建数据库的语句，不能当作日常升级脚本使用。

还原前先在隔离环境验证备份可读、表数和关键业务数据正确。数据库备份不包含 MinIO 中的附件或 Weaviate 中的向量数据，还需保护下一节列出的持久卷。

## 六、停止、升级与回滚 {#upgrade}

### 6.1 数据保存在哪里

| Compose 卷名 | 保存内容 |
| --- | --- |
| `mysql-data` | MySQL 数据目录 `/var/lib/mysql` |
| `redis-data` | Redis 持久化文件 `/data` |
| `weaviate-data` | 向量与索引目录 `/var/lib/weaviate` |
| `minio-data` | MinIO 对象文件 `/data` |
| `logs-data` | 后端日志 `/ruoyi/server/logs` |
| `upload-data` | 上传文件 `/ruoyi/upload` |

Docker 中的实际卷名通常带 Compose 项目前缀，例如 `ruoyi-ai_mysql-data`。使用 `docker volume ls` 查看实际名称；备份文件和服务配置应存放到独立位置。自行新增的挂载或模型数据卷也要纳入备份。

### 6.2 停止和恢复

停止但保留数据：

~~~bash
docker compose --env-file docs/docker/ruoyi-ai/.env -f docs/docker/ruoyi-ai/docker-compose-all.yaml down
~~~

恢复运行使用相同参数执行 `up -d`。仅临时暂停可用 `stop`，再用 `start` 恢复已有容器。

::: danger 不要把删除卷当作重启
普通停止、重启和升级都不需要 `docker compose down -v`。该选项会删除本编排的数据卷，可能同时丢失数据库、向量、附件、上传文件和日志。也不要通过 `docker volume prune` 处理不明原因的启动故障。
:::

### 6.3 升级固定版本

1. 阅读目标版本 README、更新日志和增量 SQL。保留当前 `.env`、Compose、自定义配置及镜像版本信息。
2. 在维护窗口备份数据库、向量库和重要对象文件，并确认备份能够恢复。
3. 合并目标版本的 Compose 配置变化，保留自己的密码、端口、网络和挂载；把 `.env` 中的 `RUIYI_VERSION` 改为已发布的目标标签。
4. 用 `config --images` 检查最终镜像名与版本，再按第一节的 `docker buildx imagetools inspect` 方法检查目标镜像架构。按版本要求处理数据库增量脚本，再更新服务。

~~~bash
docker compose --env-file docs/docker/ruoyi-ai/.env -f docs/docker/ruoyi-ai/docker-compose-all.yaml config --images
docker compose --env-file docs/docker/ruoyi-ai/.env -f docs/docker/ruoyi-ai/docker-compose-all.yaml pull
docker compose --env-file docs/docker/ruoyi-ai/.env -f docs/docker/ruoyi-ai/docker-compose-all.yaml up -d
docker compose --env-file docs/docker/ruoyi-ai/.env -f docs/docker/ruoyi-ai/docker-compose-all.yaml ps -a
docker compose --env-file docs/docker/ruoyi-ai/.env -f docs/docker/ruoyi-ai/docker-compose-all.yaml logs --tail=200 backend
~~~

更新后至少验证登录、普通聊天、文件上传，以及实际使用的知识库或智能体功能。`pull` 只下载镜像，执行 `up -d` 后才会按配置更新容器。

**回滚要同时考虑代码和数据。** 如果只是应用配置或镜像问题，且数据库仍兼容，可以恢复原标签和配置再执行 `up -d`。如果已经执行了不兼容的数据库迁移，仅改回旧镜像不够，需要按预先验证的恢复方案处理数据库及关联数据；MySQL 数据目录也不能随意交给更旧的版本。

## 七、常见问题

### 7.1 MySQL 容器持续重启

先看日志：

~~~bash
docker logs --tail=200 ruoyi-ai-mysql
~~~

若出现 `Cannot start server: cannot load from data dictionary built by a newer version` 或“不支持降级”，说明数据卷由更高 MySQL 版本创建，而当前镜像更旧。优先使用不低于数据卷版本的 MySQL 镜像；需要降级时应先用原版本导出逻辑备份，再在新的空数据卷中导入。不要直接删卷碰运气。

### 7.2 修改 SQL 后数据库没有变化

初始化 SQL 只对空数据卷执行。对已有库手动执行对应增量脚本，并记录已执行版本。

### 7.3 后端连不上 MySQL、Redis 或 Weaviate

容器间地址必须使用 Compose 服务名：

| 服务 | 正确容器内地址 |
| --- | --- |
| MySQL | `mysql:3306` |
| Redis | `redis:6379` |
| Weaviate | `http://weaviate:8080` |
| MinIO | `http://minio:9000` |

`localhost` 和 `127.0.0.1` 只代表当前容器。

### 7.4 后端已启动，但前端报 502

完整镜像方式中，Compose 服务名是 `admin-frontend` / `web-frontend`，容器名是 `ruoyi-ai-admin` / `ruoyi-ai-web`。`docker compose logs` 使用服务名，`docker logs` 使用容器名，不要混用。

~~~bash
docker compose --env-file docs/docker/ruoyi-ai/.env -f docs/docker/ruoyi-ai/docker-compose-all.yaml logs --tail=200 backend admin-frontend web-frontend
docker exec ruoyi-ai-admin wget -qO- http://backend:6039/auth/tenant/list
~~~

后端未就绪时先修数据库或 Redis 连接。后端可访问后，再检查代理目标：管理端使用 `UPSTREAM_HOST: backend:6039`（不加协议），用户端使用 `UPSTREAM_URL: http://backend:6039`（包含协议）。修改宿主机后端端口不需要修改这两个容器内目标。

### 7.5 文档上传成功但解析或检索失败

按顺序确认：

1. 文件配置管理中只有一个可用的默认 OSS。
2. 后端能访问 MinIO endpoint。
3. Weaviate ready 接口返回 200。
4. 向量模型实际可调用。
5. 知识库维度与 Embedding 输出维度一致。
6. 文件解析状态已完成，再执行检索测试。

### 7.6 智能体 SQL 工具不工作

检查实际运行版本、SQL 数据源配置及 `AGENT_ALLOWED_TABLES` 是否已传入后端容器，并给数据库账号限制只读权限。没有白名单时，SQL Agent 会拒绝查询；不要直接开放所有系统表。

[智能体管理](/guide/features/agent#sql-config)中的配套修正还要求独立的 `agent` 数据源。该页标注了本地待发布代码的边界，拉取公开 `v3.1.0` 镜像不会自动包含你工作区的修改；需要这些修正时，应先构建包含它们的后端和前端镜像，再按该页验证。

### 7.7 拉取失败：`denied`、`manifest unknown` 或超时

先执行第二节的 `config --images`，确认所属账号、镜像名和标签。区分以下情况：

| 现象 | 检查方向 |
| --- | --- |
| `manifest unknown` / `not found` | 目标标签是否已发布；四个项目镜像是否齐全；是否把版本误写成源码分支名 |
| `denied` / `unauthorized` | 是否误用了自己的 `IMAGE_OWNER` 或私有包；官方公开镜像通常无需登录，只有私有镜像才需要具备拉取权限的凭证 |
| `no matching manifest` | 目标镜像是否支持宿主机架构，检查第一节的镜像清单 |
| 连接超时、TLS 或 DNS 错误 | Docker daemon 的网络、代理、DNS 和到 GHCR / Docker Hub 的连通性；浏览器能访问不等于 daemon 能拉取 |
| `Cannot connect to the Docker daemon` | Docker Engine / Desktop 是否启动，以及当前终端是否连接了正确的 Docker context |

### 7.8 端口占用、容器名冲突或数据突然变空

用 `docker ps -a` 找到现有容器，确认是否已运行另一套部署。端口冲突时，在 Compose 中修改发布端口左侧的数字，并同步浏览器地址、防火墙和外部文件域名。

编排使用了固定 `container_name`，仅增加 `-p` 不会消除容器名冲突。修改 Compose 项目名还会改变默认卷名，可能连接到新建的空卷；先核对旧容器的挂载和 `docker volume ls`，不要把它误判为原数据已经丢失，也不要立即删卷重装。

### 7.9 改了密码或配置，却仍然使用旧值

先检查配置是否在 Compose 的 `environment` 中引用，再用相同 `--env-file`、`-f` 参数执行 `up -d`。若只有 `restart`，已有容器的环境变量不会更新。

MySQL 还需额外注意：`MYSQL_ROOT_PASSWORD` 只负责初始化空库。已有数据卷时，修改该环境变量不会修改数据库中的实际密码，必须先按数据库的账号管理流程更新密码，再同步后端连接密码和健康检查。MinIO 凭证变化后，也要同步后台文件配置。

### 7.10 文件超过大小限制，或模型回复一次性出现

上传返回 413 时，依次检查外层反向代理、前端 Nginx 和后端 multipart 限制；只调整其中一层可能仍然失败。当前主分支完整 Compose 为后端设置了 `600MB` 单文件和 `620MB` 请求上限，`v3.1.0` 标签文件没有这两项，升级或自定义时应按资源能力明确配置。

聊天接口有持续响应但界面迟迟不显示内容时，检查自建反向代理是否缓冲 SSE，以及读取超时是否过短。先从浏览器网络面板确认请求状态与响应类型，再判断是代理转发问题还是模型本身未返回。

## 八、生产环境最低安全项

演示 Compose 便于启动，默认密码和依赖端口需要按实际部署调整：

| 调整项 | 必须同步的位置 |
| --- | --- |
| MySQL 密码 | 数据库实际账号、`mysql.environment.MYSQL_ROOT_PASSWORD`、后端 `SPRING_DATASOURCE_DYNAMIC_DATASOURCE_MASTER_PASSWORD`、MySQL 健康检查中的 `-proot` |
| MinIO 凭证 | `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`，以及后台默认 OSS 的 accessKey / secretKey |
| 管理员密码 | 首次登录后在系统中修改，不是修改 `.env` |
| 依赖端口 | 不需要宿主机访问的服务可移除 `ports`；仅本机运维可绑定回环地址，例如 MySQL 使用 `127.0.0.1:23306:3306`，容器内连接仍用 `mysql:3306` |

同时完成：

- 不把 MySQL、Redis、Weaviate、MinIO Console 直接暴露到公网。
- Weaviate 示例启用了匿名访问，生产环境应加认证和网络隔离。
- 通过 HTTPS 反向代理暴露管理端、用户端、后端和文件域名。
- 云 Key、SMTP 密码和数据库密码使用 Secret/环境变量管理，不写入 Compose 仓库。
- 给 `AGENT_ALLOWED_TABLES` 配最小 SQL 白名单。
- 定期备份 MySQL、MinIO、Weaviate 和上传卷，并做恢复演练。
- 升级前固定镜像版本、执行增量 SQL，并保留可回滚备份。

## 九、关键配置在哪里

下面的路径相对于各自仓库根目录。排查时以实际部署标签的文件为准，避免拿主分支配置推断旧镜像行为。

| 仓库 / 文件 | 用途 |
| --- | --- |
| `ruoyi-ai/README_ZH.md` | 项目维护的部署入口与推荐版本示例 |
| `ruoyi-ai/docs/docker/ruoyi-ai/.env.example` | 镜像账号、标签变量模板 |
| `ruoyi-ai/docs/docker/ruoyi-ai/docker-compose-all.yaml` | 完整预构建镜像、端口、环境变量、卷与依赖关系 |
| `ruoyi-ai/docs/docker/ruoyi-ai/docker-compose.yaml` | 后端源码编排、基础设施与初始化 SQL 挂载 |
| `ruoyi-ai/docs/docker/ruoyi-ai/Dockerfile.backend` | 后端 Maven 构建、JDK 运行时、启动参数 |
| `ruoyi-ai/docs/docker/ruoyi-ai/Dockerfile.mysql` | MySQL 基础版本及镜像内的初始化脚本 |
| `ruoyi-ai/docs/script/sql/`、`docs/script/sql/update/` | 初始化 SQL 与版本增量 SQL |
| `ruoyi-ai/ruoyi-admin/src/main/resources/application.yml`、`application-prod.yml` | 后端默认配置与生产 profile；容器环境变量可覆盖对应配置 |
| `ruoyi-ai/.github/workflows/publish-images.yml` | 四个 GHCR 镜像的构建上下文、标签与支持架构 |
| `ruoyi-admin/apps/web-antd/docker-compose.yml`、`Dockerfile` | 管理端独立构建与 Nginx 代理配置入口 |
| `ruoyi-web/docker-compose.yml`、`Dockerfile.frontend` | 用户端独立构建与 `UPSTREAM_URL` 配置入口 |

完成容器启动后，继续阅读[模型管理](/guide/features/model)、[知识管理](/guide/features/knowledge)、[工具管理](/guide/features/tools)、[流程编排](/guide/features/orchestration)和[智能体管理](/guide/features/agent)。
