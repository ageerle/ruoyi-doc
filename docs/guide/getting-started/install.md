---
outline: [2, 3]
pageClass: install-guide
---

# 本地安装与启动

这套教程面向第一次运行 RuoYi AI 的开发者。你可以使用熟悉的编辑器和终端，完成数据库初始化、Java 后端编译，以及管理端和用户端启动。基础环境运行后，再配置模型进行对话，或增加知识库所需的服务。

下文以 **Windows 11 + PowerShell** 为主，源码目录使用 `D:/Project/github`。Linux、macOS 可以沿用相同的项目结构和服务配置，命令中的本地路径需要替换；不要把 PowerShell 的环境变量写法直接复制到 Bash 中。

## 1. 先了解要启动哪些程序 {#components}

### 1.1 三个仓库，各自负责什么

| 仓库 | 作用 | 主要配置与启动方式 |
| --- | --- | --- |
| `ruoyi-ai` | Java 后端，负责登录、数据库读写和模型调用。 | `application*.yml`；用 Maven 构建，再用 `java -jar` 启动。 |
| `ruoyi-admin` | 管理端网页，用来维护模型、知识库、智能体等配置。 | `apps/web-antd`；用 `pnpm run dev:antd` 启动。 |
| `ruoyi-web` | 用户端网页，用来选择模型、发起对话和使用应用。 | `.env.development`；用 `pnpm run dev` 启动。 |

**后端仓库内部也有一个名为 `ruoyi-admin` 的目录**，它是 Java 的启动模块，与单独克隆的管理端前端仓库不同。后文每组命令都会先写出所在目录。

```text
D:/Project/github/
├─ ruoyi-ai/                    Java 后端仓库
│  ├─ pom.xml                   后端的构建入口
│  ├─ ruoyi-admin/              Java 启动模块
│  │  └─ src/main/resources/    后端配置文件
│  ├─ ruoyi-common/             公共模块
│  ├─ ruoyi-modules/            业务模块
│  └─ docs/script/sql/          数据库脚本
├─ ruoyi-admin/                 管理端前端仓库
│  └─ apps/web-antd/
└─ ruoyi-web/                   用户端前端仓库
```

### 1.2 必需服务和可选服务

| 程序或服务 | 是否必需 | 本教程使用的地址 |
| --- | --- | --- |
| MySQL 8 | 必需，保存账号、配置和业务数据。 | `127.0.0.1:3306` |
| Redis | 必需，提供缓存、登录会话等能力。 | `127.0.0.1:6379` |
| Java 后端 | 必需，两个前端共同连接它。 | `http://127.0.0.1:6039` |
| 管理端 | 配置系统时使用。 | `http://localhost:5666` |
| 用户端 | 使用对话和应用时使用。 | `http://localhost:5180` |
| Weaviate | 使用本地知识库检索时需要。 | `http://127.0.0.1:28080` |
| MinIO | 使用本地文件对象存储时需要。 | API 为 `9000`，控制台为 `9090`。 |

先完成 MySQL、Redis、后端和两个前端的启动，即可验证账号登录与配置页面。**模型服务另行配置**：没有模型 Key 不影响基础页面启动，但不能据此验证云模型回答。首次运行不需要同时配置邮件、联网搜索、媒体生成等所有外部服务。

本教程给用户端指定 `5180`，将 `5173` 留给文档站。若本机已有服务占用这些端口，请使用其他空闲端口，并同步修改连接配置。

## 2. 安装开发工具 {#prerequisites}

### 2.1 工具版本与下载

所需工具的下载入口如下。Git、JDK、Maven、Node.js 和 pnpm 用于源码启动；数据库与缓存可选择本机安装或 Docker，编辑器及其他可选工具按需准备。

| 工具 | 用途 | 版本或选择说明 | 下载或安装地址 |
| --- | --- | --- | --- |
| Git | 下载源码。 | 当前稳定版。 | [官网下载](https://git-scm.com/downloads) |
| JDK | 编译和运行 Java。 | **JDK 21**；项目源码目标为 Java 17。 | [Temurin JDK 下载](https://adoptium.net/temurin/releases/?version=21) |
| Apache Maven | 下载 Java 依赖并打包。 | **3.9.x**，选择 Binary zip archive。 | [官网下载](https://maven.apache.org/download.cgi) |
| Node.js | 运行前端开发工具。 | **24 LTS**。 | [官网下载](https://nodejs.org/en/download) |
| pnpm | 安装前端依赖、执行脚本。 | **10.14.0**，与管理端锁定版本一致。 | [官方安装说明](https://pnpm.io/installation)，安装命令见第 2.4 节。 |
| MySQL | 保存账号、配置和业务数据。 | **8.0**；使用 Docker 时无需另装本机 Server。 | [Windows 安装包](https://dev.mysql.com/downloads/windows/installer/8.0.html) |
| Redis | 提供缓存和登录会话。 | Compose 使用 **6.2**；本机实测使用 **8.2.3 Windows 社区移植版**。 | [Windows 社区版下载](https://github.com/redis-windows/redis-windows/releases)；Docker 安装见第 4.1 节。 |
| Docker Desktop / Engine | 运行数据库等基础服务。 | 支持 `docker compose`，使用 Linux 容器。 | [Windows 下载与安装](https://docs.docker.com/desktop/setup/install/windows-install/) / [Linux Engine 安装](https://docs.docker.com/engine/install/) |
| IntelliJ IDEA | Java 开发工具，可选。 | 与 VS Code 等编辑器按需选择。 | [官网下载](https://www.jetbrains.com/idea/download/) |
| VS Code | 编辑源码和配置，可选。 | 当前稳定版。 | [官网下载](https://code.visualstudio.com/Download) |
| Navicat for MySQL | 图形化管理数据库，可选。 | 商业软件，可使用官网试用版。 | [官网下载](https://www.navicat.com.cn/download/navicat-for-mysql) |
| MySQL Workbench | 图形化管理数据库，可选。 | 也可直接使用 MySQL 命令行客户端。 | [官网下载](https://dev.mysql.com/downloads/workbench/) |
| Ollama | 运行本地模型，可选。 | 使用本地 embedding 时按需安装。 | [Windows 下载](https://ollama.com/download/windows) / [其他系统](https://ollama.com/download) |

Weaviate、MinIO 的获取方式见第 11.1 节，MinIO `mc` 客户端的下载链接见第 11.2 节。按教程使用 Compose 时，镜像会自动下载。

新安装可以统一使用 pnpm 10.14.0。Node.js 的选择同时要满足仓库中 Vite 等工具的要求，不宜只依据旧文档中的最低版本。

### 2.2 安装 JDK，并确认终端能找到它

1. 打开 [Eclipse Temurin 下载页](https://adoptium.net/temurin/releases)，选择 **Windows、x64、JDK、21**，下载安装包。ARM 设备应选择与设备匹配的架构。
2. 安装时保留 **Add to PATH**，并选中 **Set JAVA_HOME / 更新 JAVA_HOME**。`JAVA_HOME` 指向 JDK 安装目录，例如 `C:/Program Files/Eclipse Adoptium/jdk-21...`，不包含末尾的 `/bin`。
3. 安装完成后，关闭旧终端，重新打开 PowerShell，再执行下列命令。

```powershell
java -version
javac -version
$env:JAVA_HOME
```

`java` 用来运行程序，`javac` 用来编译源码。两条版本命令都应显示所安装的 JDK 版本；如果只有 `java` 可用，检查是否安装了 JRE，或 PATH 是否指向其他 Java 安装目录。安装选项参考 [Temurin Windows 安装说明](https://adoptium.net/installation/windows)。

若仍提示“无法将 java 识别为命令”，在 Windows 搜索中打开 **编辑系统环境变量 → 环境变量**，检查 `JAVA_HOME`，并确认 Path 中有 `%JAVA_HOME%\bin`。修改后重新打开终端；不要清空 Path 中已有的内容。

### 2.3 安装 Maven

1. 从 [Maven 下载页](https://maven.apache.org/download.cgi)下载 **3.9.x 的 Binary zip archive**。选择二进制包，不要下载 Source 源码包。
2. 解压到固定目录，例如 `D:/dev/apache-maven-3.9.12`，确认其中存在 `bin/mvn.cmd`。
3. 在 Windows 的 Path 中新增该目录的 `bin` 路径，重新打开 PowerShell。
4. 执行版本检查，确认输出中的 **Java version / runtime** 指向刚安装的 JDK。

```powershell
mvn -version
```

尚未设置 Path 时，也可以直接使用完整路径。PowerShell 中，执行带空格或引号包围的程序路径需要在前面加 `&`：

```powershell
& 'D:\dev\apache-maven-3.9.12\bin\mvn.cmd' -version
```

Maven 相当于 Java 项目的依赖管理和构建工具：`pom.xml` 描述依赖和模块，下载的依赖通常缓存在用户目录下的 `.m2/repository`，编译结果放在各模块的 `target` 中。详细安装规则见 [Maven 官方说明](https://maven.apache.org/install.html)。

### 2.4 安装 Node.js、pnpm 和 Git

从 [Node.js 官网](https://nodejs.org/en/download)安装 Node.js 24 LTS，从 [Git 官网](https://git-scm.com/downloads)安装 Git。重新打开终端后执行：

```powershell
node -v
npm -v
git --version
npm install -g pnpm@10.14.0
pnpm -v
```

已有 pnpm 时先检查版本。管理端 `package.json` 中的 `packageManager` 当前为 `pnpm@10.14.0`，进入该仓库后 pnpm 可能自动切换版本，因此**仓库内外的 `pnpm -v` 可以不同**。安装方式参考 [pnpm 官方说明](https://pnpm.io/installation)。

如果 PowerShell 提示 `pnpm.ps1` 或 `npm.ps1` 无法运行，先使用 `pnpm.cmd`、`npm.cmd` 执行同一命令；无需为此修改系统脚本执行策略。

![本次开发工具版本检查的实际输出，经过排版展示](/images/install/environment-check.png)

上图是本次终端输出的排版展示。全局 pnpm 为 11.0.9，进入管理端仓库后实测版本为 10.14.0。

### 2.5 准备终端和编辑器

[VS Code](https://code.visualstudio.com/Download)、[IntelliJ IDEA](https://www.jetbrains.com/idea/download/) 或其他文本编辑器均可。首次启动可以全部使用命令行，IDEA 的可选操作见[用 IDEA 打开后端](#idea)。

建议开三个 PowerShell 标签页，分别保留给**后端、管理端、用户端**。启动服务后，终端会一直显示日志，不返回输入提示符是正常现象；关闭终端或按 `Ctrl+C` 会停止该服务。

## 3. 下载源码 {#clone}

在 PowerShell 中执行。若没有 D 盘，可改为 `C:/Project/github`，后续命令同步替换：

```powershell
New-Item -ItemType Directory -Force D:\Project\github | Out-Null
Set-Location D:\Project\github

git clone https://gitee.com/ageerle/ruoyi-ai.git
git clone https://gitee.com/ageerle/ruoyi-admin.git
git clone https://gitee.com/ageerle/ruoyi-web.git
```

已有仓库时使用现有目录，不需要重复克隆。首次下载建议将三个仓库保持在配套的版本上；从其他版本升级时，还要检查数据库增量脚本。

检查下载是否完整：

```powershell
Test-Path D:\Project\github\ruoyi-ai\pom.xml
Test-Path D:\Project\github\ruoyi-admin\package.json
Test-Path D:\Project\github\ruoyi-web\package.json
```

预期三项都是 `True`。如果下载的是 ZIP，注意解压后可能多了一层同名目录，后续命令应进入真正包含 `pom.xml` 或 `package.json` 的目录。

## 4. 准备 MySQL 和 Redis {#infrastructure}

### 4.1 用 Docker 运行基础服务

没有安装 MySQL、Redis 时，可以使用 Docker。从 [Docker Desktop 下载与安装页](https://docs.docker.com/desktop/setup/install/windows-install/)获取 Windows 安装包，按向导准备 [WSL 2](https://learn.microsoft.com/zh-cn/windows/wsl/install)，启动 Desktop 并等待引擎就绪。

```powershell
docker version
docker compose version
docker info --format '{{.OSType}}'
```

`docker version` 应同时返回 **Client 和 Server**，最后一条应返回 `linux`。只有客户端版本、命令长时间无响应，或提示无法连接引擎时，先处理 Docker 的启动问题，再运行容器。

在 **后端仓库根目录**创建本地配置目录：

```powershell
Set-Location D:\Project\github\ruoyi-ai
New-Item -ItemType Directory -Force .dev | Out-Null
```

下载<a href="/files/local-install.compose.yml" download="compose.yml">本教程的基础设施 Compose 文件</a>，保存为 `ruoyi-ai/.dev/compose.yml`。它只包含 MySQL、Redis 和可选的 Weaviate、MinIO，后端与前端仍由源码启动。不要与[完整镜像部署](./docker.md)的端口和数据库配置混用。

在同一个 `.dev` 目录新建名为 **`.env`** 的文件，填写下面两项。值替换为你自己设置的本地密码；MinIO 密码至少 8 个字符：

```dotenv
LOCAL_MYSQL_PASSWORD=替换为你的本地数据库密码
LOCAL_MINIO_PASSWORD=替换为你的本地存储密码
```

文件名是 `.env`，不要保存成 `.env.txt`。`.dev` 中会存放本地配置，将它加入本地 Git 忽略即可：

```powershell
Add-Content .git/info/exclude "`n.dev/"
```

先检查配置，再只启动必需的两个服务：

```powershell
docker compose --env-file .dev/.env -f .dev/compose.yml config --quiet
docker compose --env-file .dev/.env -f .dev/compose.yml up -d mysql redis
docker compose --env-file .dev/.env -f .dev/compose.yml ps
docker exec ruoyi-local-redis redis-cli ping
```

第一条成功时没有输出；首次启动会下载镜像。等待 MySQL、Redis 显示 `Up` / `healthy`，最后一条返回 `PONG`。这时只启动了数据库和缓存，Java 后端还没有运行。

需要查看初始化进度时执行：

```powershell
docker compose --env-file .dev/.env -f .dev/compose.yml logs --tail=80 mysql redis
```

该 Compose 使用独立的数据卷保存数据，后续 `stop`、`start` 会保留它们。修改 `.env` 中的 MySQL 初始密码**不会修改已有数据卷中的账号密码**，已有实例继续使用原密码。

### 4.2 本机已经安装 MySQL、Redis 时

可以直接使用已有服务。先确认服务正常运行，并记下 MySQL 的端口、用户名和密码，以及 Redis 是否要求密码；跳过已经具备的容器服务。例如只缺 Redis 时，第 4.1 节的启动命令改为 `up -d redis`。

Windows 的 MySQL 8.0 可通过 [官方安装包](https://dev.mysql.com/downloads/windows/installer/8.0.html)安装。配置时启用 TCP/IP，记下所选端口与 root 密码，并将 MySQL 配置为 Windows 服务。安装 [MySQL Workbench](https://dev.mysql.com/downloads/workbench/) 只提供图形客户端，仍需安装并启动 MySQL Server。

需要在 Windows 上直接运行 Redis 时，可从 [redis-windows 发布页](https://github.com/redis-windows/redis-windows/releases)下载社区移植版，按该版本附带的说明解压并启动；本次使用的是 8.2.3。也可以按第 4.1 节通过 Docker 运行 Redis。

本机 MySQL 客户端不在 Path 中时，用完整路径进入：

```powershell
& 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe' --protocol=TCP -h 127.0.0.1 -P 3306 -u root -p --default-character-set=utf8mb4
```

`-P` 后是端口，`-p` 表示交互输入密码；输入密码时终端不显示字符是正常的。看到 `mysql>` 提示符就表示已连接数据库。

本次实测使用本机 MySQL 8.0.45 和 Redis 8.2.3 的独立进程，分别监听 `13306`、`16379`，以免影响已经运行的服务。你在空闲环境按教程使用 `3306`、`6379` 即可。

### 4.3 端口被占用时怎么处理

在 PowerShell 中检查已有监听：

```powershell
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $_.LocalPort -in 3306,6379,6039,5666,5180 } |
  Select-Object LocalAddress,LocalPort,OwningProcess
```

端口已有服务时，先确认是否就是准备使用的实例。另开 Docker 实例可以将 Compose 中左侧的 `3306` 改为 `13306`，例如 `127.0.0.1:13306:3306`，然后把后端数据库端口也改为 `13306`。Redis、前端和后端端口同理；不需要结束其他项目的进程。

## 5. 初始化数据库 {#database}

### 5.1 全新安装：导入全量 SQL

本次核对的脚本是：

```text
ruoyi-ai/docs/script/sql/ruoyi-ai.sql
```

**这份全量脚本会创建 `ruoyi-ai` 和 `snail_job` 数据库，并包含 `DROP TABLE`。仅用于新的空实例，或确认可以重建的环境。已有业务数据请直接阅读[增量升级](#database-upgrade)。** 在客户端命令后另加数据库名，不会覆盖脚本内部的 `USE`，不能据此将导入隔离到另一个库。

**使用第 4.1 节 Docker MySQL：** 在后端仓库根目录执行，将 SQL 复制进容器，再打开 MySQL 客户端：

```powershell
docker cp .\docs\script\sql\ruoyi-ai.sql ruoyi-local-mysql:/tmp/ruoyi-ai.sql
docker exec -it ruoyi-local-mysql mysql -u root -p --default-character-set=utf8mb4
```

输入 `.dev/.env` 中设置的 MySQL 密码。看到 `mysql>` 后执行下面的 **SQL 客户端命令**：

```sql
source /tmp/ruoyi-ai.sql
```

**使用本机 MySQL：** 按第 4.2 节进入客户端，然后执行：

```sql
source D:/Project/github/ruoyi-ai/docs/script/sql/ruoyi-ai.sql
```

`source` 后使用 SQL 所在机器的实际路径。Docker 客户端读取容器中的 `/tmp/ruoyi-ai.sql`，本机客户端读取本机的 `D:/...`；两者不要混用。MySQL 批量执行说明见[官方文档](https://dev.mysql.com/doc/refman/8.0/en/mysql-batch-commands.html)。

导入过程中会连续出现 `Query OK`，结束后回到 `mysql>`。如果出现 `ERROR`，记录第一条错误及行号，先处理原因，不要直接进入后端启动步骤。PowerShell 中也不要照搬 Bash 的 `mysql < file.sql` 输入重定向写法。

### 5.2 检查数据库和关键字段

继续在 `mysql>` 中执行：

```sql
SHOW DATABASES;
USE `ruoyi-ai`;
SHOW TABLES;
SELECT user_id, user_name, status FROM sys_user WHERE user_name = 'admin';
SHOW COLUMNS FROM knowledge_attach LIKE 'file_hash';
SHOW COLUMNS FROM knowledge_fragment LIKE 'fid';
```

应能看到业务表、`admin` 账号，以及 `file_hash`、`fid` 两个字段。数据库名包含连字符，在 SQL 中用反引号包围，例如上面的 `USE` 语句。

![独立 MySQL 实例导入全量 SQL 后，检查数据库与关键字段的实际输出](/images/install/database-check.png)

本次全量脚本导入成功，`ruoyi-ai` 有 85 张表，`snail_job` 有 23 张表。这是本次版本的结果，后续版本表数可能变化；应结合账号、关键字段和所用功能检查。全量数据中包含示例记录，首次登录看到已有模型或演示会话属于正常现象。

检查完成，输入 `exit` 返回 PowerShell。

### 5.3 已有数据库：按版本执行增量 {#database-upgrade}

升级前备份当前数据库，保留正在运行的代码版本和配置，再查看后端仓库中的增量脚本：

```powershell
Set-Location D:\Project\github\ruoyi-ai
Get-ChildItem .\docs\script\sql\update\*.sql | Sort-Object Name
```

先看脚本头部的适用范围，再执行尚未应用的脚本。**不要把目录中全部 SQL 无条件重放**：本次全量脚本已合并部分历史迁移，新安装不必再次执行这些内容；后续新增功能仍需检查对应迁移。

例如，旧库缺少 RAG 元数据时，在本机 MySQL 客户端执行：

```sql
USE `ruoyi-ai`;
source D:/Project/github/ruoyi-ai/docs/script/sql/update/2026-07-20-knowledge-fragment-fid.sql
```

Docker 中先用 `docker cp` 复制该增量文件，再 `source` 容器内的路径。执行后重新检查字段。`Unknown column 'file_hash'` 是表结构缺失，重新编译 Java 或重启前端都不能补齐它。

## 6. 配置后端连接 {#backend-config}

### 6.1 配置文件在哪里

打开 **后端仓库**中的：

```text
ruoyi-ai/ruoyi-admin/src/main/resources/application.yml
ruoyi-ai/ruoyi-admin/src/main/resources/application-dev.yml
```

`application.yml` 保存公共配置；`application-dev.yml` 保存开发环境配置。Spring Boot 启动时会将两者合并。`dev` 是环境名称，后文启动命令会明确指定它。

首次配置主要关心 MySQL、Redis 和端口。监控中心、SnailJob、邮件等服务不必同时搭建；本地基础启动保持对应开关关闭即可。

### 6.2 新建一份本地覆盖配置

为便于后续重启，在后端仓库的 `.dev` 目录新建 **`application-local.yml`**。如果跳过了 Docker 配置，先执行 `New-Item -ItemType Directory -Force .dev` 创建目录。写入以下内容；这里是通过启动参数加载的外部文件，不需要把运行环境切换为 `local`。

```yaml
server:
  port: 6039

spring:
  datasource:
    dynamic:
      datasource:
        master:
          url: jdbc:mysql://127.0.0.1:3306/ruoyi-ai?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia%2FShanghai&allowPublicKeyRetrieval=true&nullCatalogMeansCurrent=true
          username: root
          password: "替换为你的本地数据库密码"
  data:
    redis:
      host: 127.0.0.1
      port: 6379
      database: 0

spring.boot.admin.client:
  enabled: false

snail-job:
  enabled: false

sys:
  upload:
    path: D:/Project/github/ruoyi-ai/.dev/uploads
```

注意以下填写规则：

- MySQL 密码与实际实例一致。使用教程 Compose 时，与 `.dev/.env` 中的 `LOCAL_MYSQL_PASSWORD` 一致；后端不会自动读取那份 Compose `.env`。
- YAML 使用空格缩进，保持同级对齐。示例密码必须替换，路径改为你的实际目录；Windows 路径使用 `/` 更方便。
- Redis 未设置密码时，省略 `password`。**不要填 `password: ""`**，本次实测这种写法会触发空密码认证并导致后端启动失败。
- Redis 已设置密码时，在 `spring.data.redis` 下增加正确的 `password`；同时检查原 `application-dev.yml` 或环境变量中是否已有旧密码。
- 本教程让 Java 运行在宿主机，因此用 `127.0.0.1` 连接映射端口。若把 Java 也放进 Docker，连接地址应改用容器网络中的服务名，详见 [Docker 部署](./docker.md)。

可以先确认文件没有被保存为 `.yml.txt`：

```powershell
Get-Item .\.dev\application-local.yml
```

`.dev` 中的密码配置应加入本地忽略，方法见第 4.1 节。如果选择直接编辑 `src/main/resources/application-dev.yml`，修改后需要重新打包；使用上述外部文件时，修改配置后只需重启 Java 进程。

## 7. 编译并启动 Java 后端 {#start-backend}

### 7.1 在后端根目录编译

打开给后端使用的 PowerShell，执行：

```powershell
Set-Location D:\Project\github\ruoyi-ai
mvn -pl ruoyi-admin -am "-Dmaven.test.skip=true" package
```

| 参数 | 含义 |
| --- | --- |
| `-pl ruoyi-admin` | 构建后端的启动模块。 |
| `-am` | 同时构建它依赖的其他模块。 |
| `-Dmaven.test.skip=true` | 本次安装先跳过测试代码编译和执行。开发修改仍需单独运行相关测试。 |
| `package` | 编译并生成打包文件。 |

第一次构建需要下载较多依赖，耗时取决于网络和缓存。终端不断出现 `Downloading` 并不表示卡住。成功时末尾出现 **`BUILD SUCCESS`**，再检查产物：

```powershell
Get-Item .\ruoyi-admin\target\ruoyi-admin.jar
```

这个 JAR 已包含启动所需的依赖，不需要另外安装 Tomcat。不要运行 `.jar.original`，也不要把源码 ZIP 当成 JAR。

如果结果为 `BUILD FAILURE`，先处理第一个 `[ERROR]`。没有成功产物时，继续执行 `java -jar` 只会得到“无法访问 JAR”等后续错误。依赖下载问题见[故障排查](#troubleshooting)。

### 7.2 启动 JAR

仍在**后端仓库根目录**执行。保持这个终端运行：

```powershell
java "-Dfile.encoding=UTF-8" -jar .\ruoyi-admin\target\ruoyi-admin.jar --spring.profiles.active=dev --spring.config.additional-location=file:./.dev/application-local.yml
```

`--spring.profiles.active=dev` 选择开发配置；`--spring.config.additional-location=...` 再加载刚创建的本地配置。文件路径相对于当前目录，因此不要切到 `target` 后直接照抄这条命令。

启动会依次连接数据库和 Redis，加载业务模块。看到 **`Started RuoYiAIApplication`**、`RuoYi-AI启动成功`，且进程持续运行，才进入下一步。若日志出现 `APPLICATION FAILED TO START` 或 `Error starting ApplicationContext`，先看后面的原因。

### 7.3 在另一个终端确认接口可访问

```powershell
$result = Invoke-RestMethod http://127.0.0.1:6039/auth/tenant/list
$result | ConvertTo-Json -Depth 6
```

也可以直接用浏览器打开 [租户列表接口](http://127.0.0.1:6039/auth/tenant/list)。预期是包含 `code: 200`、`data` 等字段的 JSON。这个地址是登录前读取租户的业务接口，用于检查后端响应；它不是完整的系统健康检查。

![本次 Maven 构建成功、Java 应用启动以及租户接口返回结果](/images/install/backend-check.png)

上图来自本次实际构建与启动日志的排版展示，后端使用隔离端口 `16039`。实测 Maven 构建成功，应用启动后接口返回正常业务结果；这还不代表外部模型已经配置完成。

## 8. 启动并登录管理端 {#start-admin}

### 8.1 安装前端依赖

另开 PowerShell，进入**单独的管理端前端仓库**，执行：

```powershell
Set-Location D:\Project\github\ruoyi-admin
pnpm -v
pnpm install --frozen-lockfile
```

管理端是多包项目，必须在包含根 `package.json` 和 `pnpm-workspace.yaml` 的目录安装，不能只复制 `apps/web-antd` 后独立安装。`--frozen-lockfile` 按仓库锁定的依赖版本安装；若提示锁文件不匹配，先检查代码与锁文件是否来自同一版本。

等待安装命令正常结束。以后启动时只需运行开发命令；更新代码后如果依赖有变化，再执行安装。

### 8.2 确认后端地址和端口

打开 `ruoyi-admin/apps/web-antd/.env.development`，检查：

```dotenv
VITE_PORT=5666
VITE_GLOB_API_URL=/api
```

然后打开同目录的 `vite.config.mts`，在已有 `server.proxy` 中检查后端目标地址：

```ts
server: {
  proxy: {
    '/api': {
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
      target: 'http://127.0.0.1:6039',
      ws: true,
    },
  },
},
```

这里只展示需要核对的配置片段，保留文件中其他内容。浏览器请求 `/api/...`，Vite 去掉 `/api` 前缀后转发给 Java。后端端口变更时修改 `target`，不要只改管理端自己的 `VITE_PORT`。

### 8.3 启动并登录

```powershell
pnpm run dev:antd
```

打开终端显示的地址，默认是 [http://localhost:5666](http://localhost:5666)。本次管理端开发服务启动约需 1 分钟；首次访问还可能继续编译页面，等待终端完成后再判断是否有异常。

![本次启动的管理端登录页，租户信息来自新初始化的数据库](/images/install/admin-login.png)

1. 在租户下拉框中选择初始化数据对应的租户。截图中为“熊猫科技有限公司”。
2. 用户名填写 **`admin`**，密码填写 **`admin123`**。
3. 若你的版本启用了验证码，按页面要求输入验证码。
4. 点击登录，确认进入后台并能展开左侧菜单。

这里的 `admin / admin123` 是应用账号，与 MySQL 的 `root` 账号、MinIO 账号不同。

![管理端使用初始化账号登录成功，左侧可见业务管理菜单](/images/install/admin-ready.png)

首页中的图表可能包含模板演示数据。判断基础连接是否正常，可进一步打开 **对话管理 → 模型管理**，确认列表可以加载。

## 9. 启动并登录用户端 {#start-web}

### 9.1 安装依赖，配置接口地址

再开一个 PowerShell：

```powershell
Set-Location D:\Project\github\ruoyi-web
pnpm install --frozen-lockfile
```

打开该仓库的 `.env.development`，将现有 `VITE_API_URL` 改为后端地址，其余配置保留：

```dotenv
VITE_API_URL=http://127.0.0.1:6039
```

当前用户端直接使用这个地址调用后端。不要填管理端 `5666`、文档站 `5173` 或完整的 `/chat/send` 路径。修改环境文件后需要重新启动前端开发进程。

### 9.2 指定端口启动

```powershell
pnpm run dev --port 5180 --strictPort
```

`--strictPort` 让端口被占用时明确报错，避免自动切换端口后仍访问旧地址。打开 [http://localhost:5180/chat](http://localhost:5180/chat)。

![本次启动的用户端，未登录时显示登录入口和模型提示](/images/install/user-start.png)

点击页面的 **登录**，选择账号登录，填写 `admin / admin123`：

![用户端的账号登录弹窗](/images/install/user-login.png)

登录后，确认弹窗关闭，输入框下方的提示变为 **选择模型**，已有会话列表可以加载。

![用户端账号登录成功，可进入对话和应用市场](/images/install/user-ready.png)

管理端和用户端分别登录是正常的，它们运行在不同前端地址上，但账号和配置来自同一个后端。

![本次管理端与用户端启动命令的实际输出](/images/install/frontend-check.png)

本次为避免占用已有服务，截图使用管理端 `15666`、用户端 `15180`，并将两端 API 都指向后端 `16039`。按本文在空闲环境安装时，使用 `5666`、`5180`、`6039` 即可。

## 10. 配置模型，验证第一条对话 {#first-chat}

### 10.1 先确认模型服务信息

准备一个当前代码支持的模型服务，取得有效 Key、模型名称和接口地址。下面以项目已有的 DeepSeek 接入为例；其他服务的完整配置见[模型管理](../features/model.md)。

当前工作区使用 **环境变量引用**保存模型凭据。在启动 Java 的终端中设置真实 Key，再重启 Java 进程：

```powershell
$env:DEEPSEEK_API_KEY='替换为你自己的有效Key'
java "-Dfile.encoding=UTF-8" -jar .\ruoyi-admin\target\ruoyi-admin.jar --spring.profiles.active=dev --spring.config.additional-location=file:./.dev/application-local.yml
```

若后端已经在该终端运行，先按 `Ctrl+C` 停止，再设置变量并启动。环境变量只对当前终端及其启动的进程生效；换终端、改用 IDE 或重启电脑后，需要在新的启动环境中重新配置。模型 Key 应提供给 Java 后端，不要填到前端的 `.env`。

### 10.2 在管理端检查厂商和模型

1. 打开 **对话管理 → 厂商管理**，确认 DeepSeek 厂商存在且已启用，编码为 `deepseek`。
2. 打开 **对话管理 → 模型管理**，搜索目标模型。初始化 SQL 可能已经包含记录，已有时编辑检查即可。
3. 确认模型分类为 **对话（`chat`）**，模型名称与服务端及当前适配器要求一致。
4. 按当前凭据规则保存密钥引用，并确认地址正确。其他厂商不要直接复用 DeepSeek 的引用。

![本次新数据库初始化后，管理端模型列表正常加载](/images/install/model-list.png)

| 配置项 | DeepSeek 示例 |
| --- | --- |
| 供应商 | 深度求索，对应 `deepseek`。 |
| 模型分类 | 对话，保存值为 `chat`。 |
| 模型名称 | `deepseek-v4-flash`；需确认你的服务权限与当前接入版本支持它。 |
| 模型描述 | 例如 `DeepSeek V4 Flash`，用于用户端展示。 |
| 服务地址 | `https://api.deepseek.com`，按厂商与模型配置核对。 |
| 密钥 | `env:DEEPSEEK_API_KEY`。真正的 Key 已配置在后端启动环境中。 |

![本次打开已有模型编辑表单，查看供应商、分类、名称和密钥字段](/images/install/model-form.png)

图中仅展示配置入口，本次没有填入真实 Key 或提交模型修改。列表里有模型、表单保存成功，都不能单独证明模型可调用。

### 10.3 在用户端发起一次普通对话

1. 在用户端点击 **新对话**。
2. 点击输入框下方的 **选择模型**，选择刚配置的对话模型。
3. 输入“你好，请用一句话介绍你的用途”，点击发送。
4. 等待回答正常结束，再追问一句“请再简短一些”。
5. 刷新页面，从左侧重新打开这个会话，确认已完成的问答仍然存在。

![本次用户端可以加载模型下拉列表](/images/install/user-model-select.png)

预期应同时具备：能收到实际回答、回答正常结束、会话可以重新打开。只有 HTTP 200、只有创建出的会话或只有模型下拉选项，都不等同于模型调用成功。

本次环境未配置可用的模型 Key，因此实际验证到账号登录和模型列表加载，未发起外部模型对话。配置你自己的模型后，按上面五步完成最后的问答检查。

## 11. 增加文件上传和知识库服务（可选） {#knowledge-services}

### 11.1 启动 Weaviate 和 MinIO

Weaviate 的镜像获取方式见[官方 Docker 安装说明](https://docs.weaviate.io/deploy/installation-guides/docker-installation)，MinIO 社区版的源码与发布记录见[项目发布页](https://github.com/minio/minio/releases)。按本教程使用 Compose 时，会自动拉取配置中指定的镜像，无需另下载 Windows 安装包。

回到后端仓库根目录，使用第 4.1 节的 Compose：

```powershell
docker compose --env-file .dev/.env -f .dev/compose.yml up -d weaviate minio
docker compose --env-file .dev/.env -f .dev/compose.yml ps
(Invoke-WebRequest http://127.0.0.1:28080/v1/.well-known/ready).StatusCode
(Invoke-WebRequest http://127.0.0.1:9000/minio/health/live).StatusCode
```

后两项预期为 `200`。后端的 `vector-store.type` 应为 `weaviate`，`vector-store.weaviate.protocol` 为 `http`，`vector-store.weaviate.host` 为 `127.0.0.1:28080`。向量库保存检索向量，MinIO 保存原始文件，它们承担不同职责。

### 11.2 将 MinIO 配置为默认对象存储

打开 [MinIO 控制台](http://127.0.0.1:9090)，使用账号 `ruoyi` 和 `.dev/.env` 中的 `LOCAL_MINIO_PASSWORD` 登录，准备名为 `ruoyi` 的桶。不同 MinIO 版本的控制台能力不同，也可以使用该版本支持的 `mc` 客户端创建桶；Windows x64 客户端可从 [MinIO 官方下载目录](https://dl.min.io/client/mc/release/windows-amd64/)获取 `mc.exe`。

在 RuoYi AI 管理端进入 **系统管理 → 文件管理 → 文件配置管理**，编辑 MinIO 记录：

| 字段 | 本地填写方式 |
| --- | --- |
| 服务地址 | `127.0.0.1:9000`，使用对象存储 API 端口，不是控制台端口 `9090`。 |
| Access Key / 访问密钥 | 本教程为 `ruoyi`。 |
| Secret Key / 秘密密钥 | 与 `LOCAL_MINIO_PASSWORD` 一致。 |
| 桶名称 | `ruoyi`。 |
| 是否 HTTPS | 否，对应本地 HTTP 服务。 |
| 是否默认 | 是。 |

![此前本地运行时，将 MinIO 设为默认对象存储的管理页面](/images/runtime/oss-minio-default.png)

上图沿用此前实测截图。本次基础环境验证没有启动 MinIO。配置保存后上传一份小文件，确认列表有记录且文件可打开；不要只检查“默认”开关。若原 qcloud 等外部存储仍为默认配置，上传可能一直等待或返回鉴权失败。

### 11.3 无 Key 的本地 embedding（可选）

向量模型将文本转换为检索用的数值向量，与生成回答的对话模型不同。Ollama 可以提供本地 embedding 服务，从 [Windows 下载页](https://ollama.com/download/windows)或[其他系统下载页](https://ollama.com/download)安装后，在新打开的终端执行：

```powershell
ollama pull all-minilm:v2
```

若没有安装，也可以在 Docker 可用时运行：

```powershell
docker run -d --name ruoyi-ai-ollama -p 127.0.0.1:11434:11434 -v ruoyi-ai-ollama:/root/.ollama ollama/ollama:latest
docker exec ruoyi-ai-ollama ollama pull all-minilm:v2
```

验证 Ollama 本身能否生成向量：

```powershell
$body = @{ model = 'all-minilm:v2'; input = 'RuoYi AI RAG test' } | ConvertTo-Json
$embedding = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:11434/api/embed -ContentType 'application/json' -Body $body
$embedding.embeddings[0].Count
```

该样例预期输出 `384`，对应模型维度。安装及接口说明见 [Ollama 官方文档](https://docs.ollama.com/api/embed)。

**Ollama 接口成功，还需要满足 RuoYi AI 的模型保存规则。** 当前工作区新建模型统一校验 HTTPS，不能直接保存 `http://127.0.0.1:11434`。无需鉴权的 Ollama 需提供后端可访问的 HTTPS 地址，并保持密钥字段未填写；通过 API 创建时省略 `apiKey` 或传 `null`，不要传空字符串。若网关要求认证，还需扩展适配器的认证支持。详见[知识库的模型准备](../features/knowledge.md#prepare-models)与[模型凭据说明](../features/model.md#provider-extension)。这条 HTTP 自检只验证 Ollama 本身。

向量模型接入后，继续按[知识库使用指南](../features/knowledge.md)完成：创建知识库、上传小文件、核对片段、检索测试，再关联智能体问答。混合检索、重排等参数可以在基础检索通过后调整。

## 12. 用 IntelliJ IDEA 打开后端（可选） {#idea}

### 12.1 打开整个后端仓库

在 IDEA 欢迎页点击 **Open / 打开**，选择 `ruoyi-ai` 根目录，确认目录中有 `pom.xml`。等待 Maven 项目导入和依赖索引完成；也可直接选择根 `pom.xml`，按 [IDEA 的 Maven 导入说明](https://www.jetbrains.com/help/idea/maven-support.html)打开项目。

![已有教程中的 IDEA 打开项目示意，应选择整个 ruoyi-ai 后端仓库](/images/install/install-01.webp)

这两张 IDEA 图片沿用仓库已有的操作示意，界面版本和目录与本次命令行环境不同。选择你自己的后端根目录即可。

### 12.2 设置 JDK 和 Maven

1. 在 **File → Project Structure → Project SDK** 中选择已经安装的 JDK 21。
2. 在 **Settings → Build, Execution, Deployment → Build Tools → Maven** 中选择 Maven 3.9.x 安装目录，路径不包含最后的 `bin`。
3. 检查 Maven Importer / Runner 使用的 JDK 与项目一致，重新加载 Maven 项目。

![已有教程中的 IDEA Maven 路径设置示意，选择自己的 Maven 安装目录](/images/install/install-02.webp)

终端 `mvn -version` 正常而 IDEA 构建失败时，优先核对这几处版本，不要只修改系统 Path。

### 12.3 运行入口类

打开：

```text
ruoyi-admin/src/main/java/org/ruoyi/RuoYiAIApplication.java
```

为它创建 Java Application 运行配置：

| 配置 | 填写方式 |
| --- | --- |
| Main class | `org.ruoyi.RuoYiAIApplication`。 |
| Module / classpath | 后端的 `ruoyi-admin` 模块。 |
| JRE / JDK | 项目使用的 JDK 21。 |
| Working directory | `D:/Project/github/ruoyi-ai`，替换为你的后端根目录。 |
| Program arguments | `--spring.profiles.active=dev --spring.config.additional-location=file:./.dev/application-local.yml`。 |
| Environment variables | 按需配置模型服务变量，如 `DEEPSEEK_API_KEY`。 |

先停止命令行中同端口的后端，再点击 Run，避免两个进程争用 `6039`。IDE 启动成功后仍按第 7.3 节检查接口；使用 IDE 不会替代数据库初始化，也不会自动启动两个前端。字段位置参考 [IDEA Application 运行配置](https://www.jetbrains.com/help/idea/run-debug-configuration-java-application.html)。

## 13. 停止、再次启动和更新代码 {#restart}

### 13.1 暂时停止服务

在后端、管理端、用户端各自的终端按 `Ctrl+C`。使用本教程 Compose 时，回到后端根目录停止基础设施：

```powershell
docker compose --env-file .dev/.env -f .dev/compose.yml stop
```

这会保留数据卷。日常停止不需要删除数据库或卷，也不需要重新导入 SQL。

### 13.2 下次启动

先启动 Docker Desktop 和所需基础设施，再在三个终端中分别启动应用：

```powershell
# 基础设施，在后端根目录执行
docker compose --env-file .dev/.env -f .dev/compose.yml up -d mysql redis
```

```powershell
# 终端 A：后端。使用模型时，先在此终端设置所需环境变量。
Set-Location D:\Project\github\ruoyi-ai
java "-Dfile.encoding=UTF-8" -jar .\ruoyi-admin\target\ruoyi-admin.jar --spring.profiles.active=dev --spring.config.additional-location=file:./.dev/application-local.yml
```

```powershell
# 终端 B：管理端
Set-Location D:\Project\github\ruoyi-admin
pnpm run dev:antd
```

```powershell
# 终端 C：用户端
Set-Location D:\Project\github\ruoyi-web
pnpm run dev --port 5180 --strictPort
```

要使用知识库时，将基础设施命令的服务列表补上 `weaviate minio`。如果 MySQL、Redis 安装为本机服务，确认服务正在运行即可。

### 13.3 哪些修改需要重新构建

| 改了什么 | 接下来做什么 |
| --- | --- |
| Java 代码，或打包在 JAR 中的 `application*.yml` | 重新执行 Maven 构建，再重启后端。 |
| `.dev/application-local.yml`、后端环境变量 | 重启后端；环境变量必须提供给新的 Java 进程。 |
| 前端 `.vue`、普通样式等源码 | 开发模式通常自动更新；异常时检查终端日志。 |
| 前端 `.env` 或 Vite 配置 | 重启对应前端。 |
| `package.json` / 锁文件 | 按配套锁文件重新安装依赖，再启动。 |
| 更新了数据库结构相关代码 | 备份数据库，检查并执行适用增量 SQL，再启动。 |

## 14. 按现象排查常见问题 {#troubleshooting}

| 现象 | 优先检查与处理 |
| --- | --- |
| `java`、`javac` 或 `mvn` 无法识别 | 检查安装目录和 Path，重新打开终端；用完整可执行文件路径验证。 |
| `release version 17 not supported`、`invalid target release` | Maven 实际使用了旧 JDK；查看 `mvn -version` 的 Java runtime，并检查 IDEA 的 Maven JDK。 |
| PowerShell 拒绝运行 `pnpm.ps1` | 使用 `pnpm.cmd`，安装 pnpm 时同理使用 `npm.cmd`。 |
| Maven 长时间 `Downloading` 或依赖下载失败 | 确认能访问报错中的依赖仓库，检查本机代理和 Maven `settings.xml`。缓存命中情况会影响耗时；不要一次性删除整个 `.m2`。 |
| Maven 提示找不到项目、模块或 POM | 确认当前目录为后端仓库根目录，并且源码下载完整。 |
| `Unable to access jarfile` | 确认先看到 `BUILD SUCCESS`，JAR 路径正确，当前目录是后端根目录。 |
| Docker 命令只有 Client、无法连接引擎 | 启动 Docker Desktop，检查 WSL 2、Linux 容器与引擎状态；这是容器环境问题，不是 Java 编译问题。 |
| Docker Desktop 提示 `dockerInference` 监听错误 | 本次环境遇到了这一启动失败，未完成容器实测。保留现有数据，按 Docker 官方排障流程处理；已有本机 MySQL、Redis 时可先验证基础启动。 |
| MySQL `Access denied` | 核对连接的是哪个实例、端口、账号和密码。Compose `.env` 中的新密码不会改写已有卷中的数据库密码。 |
| `Unknown database 'ruoyi-ai'` | SQL 没有导入到后端所连接的实例，或后端库名不一致。先用同一地址、端口登录 MySQL 检查。 |
| 导入 SQL 提示已有表或数据库 | 确认是否误将全量初始化当成升级；已有环境使用增量脚本，先备份再处理。 |
| MySQL `Communications link failure` | 数据库未就绪、地址或端口错误；先单独验证 MySQL 连接。 |
| Redis `Connection refused` | Redis 未运行，或端口与后端配置不一致。先用 `redis-cli ping` 验证。 |
| Redis `ERR AUTH ... without any password configured` | 无密码 Redis 收到了 AUTH；检查后端是否填写了空字符串、旧密码或继承了环境变量。无密码时省略该项。 |
| 后端配置未生效 | 检查启动命令是否加载 `.dev/application-local.yml`，以及是否有同名环境变量或命令行参数覆盖。 |
| `Port 6039 was already in use` | 已有后端占用端口。停止你之前启动的同一实例，或换端口并同步修改两个前端。 |
| 管理端登录页没有租户、出现 502 | 先访问后端租户接口，再检查管理端 `/api` 代理；页面能打开不代表 Java 正常。 |
| 用户端接口报错，管理端却正常 | 两端配置入口不同；检查用户端 `VITE_API_URL`，修改后重启。 |
| 用户端首次短暂空白 | 等待 Vite 首次编译，使用终端给出的地址；若一直空白，再检查浏览器 Console 和前端日志。 |
| pnpm 提示 `ERR_PNPM_OUTDATED_LOCKFILE` 或 workspace 包缺失 | 确认在仓库根目录安装，使用配套 pnpm 版本，代码与锁文件来自同一版本。不要混用 npm 安装管理端。 |
| 模型可以选择，但没有回答 | 检查后端进程的 Key、模型名称、厂商状态和接口响应；初始化记录不代表已获得服务权限。 |
| 新建 Ollama 模型时报 HTTPS 校验错误 | 当前保存规则要求 HTTPS，参照第 11.3 节处理地址；Ollama HTTP 自检成功不等于已接入。 |
| 上传一直等待或鉴权失败 | 检查默认对象存储是否仍指向外部示例服务，以及 MinIO 地址、桶名和凭据。 |
| `Unknown column 'file_hash'` 或缺少 `fid` | 数据库缺少适用的 RAG 迁移；按第 5 节检查脚本与关键字段。 |
| SQL 智能体没有可查询表 | 属于后续功能配置；按[智能体教程](../features/agent.md#sql-config)配置允许访问的业务表，基础登录不依赖此项。 |

## 15. 确认安装完成 {#verification}

| 检查项 | 通过标准 |
| --- | --- |
| MySQL | 可登录正确的实例，存在 `ruoyi-ai` 业务表和 `admin` 账号。 |
| Redis | 对后端使用的地址执行 `PING` 返回 `PONG`。 |
| 后端构建 | Maven 显示 `BUILD SUCCESS`，生成 `ruoyi-admin.jar`。 |
| 后端运行 | 应用启动完成，租户列表接口返回正常 JSON 和业务 `code: 200`。 |
| 管理端 | 可以用初始化账号登录，模型列表可以加载。 |
| 用户端 | 可以登录，打开新对话并加载模型选项。 |
| 模型对话 | 配置有效模型后，能够收到完整回答，并重新打开已保存的会话。 |
| 知识库（按需） | Weaviate、MinIO 可访问，上传文件可解析，检索测试能命中资料。 |

<style>
.install-guide .vp-doc img { border: 1px solid var(--vp-c-divider); border-radius: 8px; }
.install-guide .vp-doc td, .install-guide .vp-doc th { overflow-wrap: anywhere; }
.install-guide .vp-doc p code, .install-guide .vp-doc li code { overflow-wrap: anywhere; }
@media (max-width: 640px) {
  .install-guide .vp-doc table { display: block; max-width: 100%; overflow-x: auto; }
}
</style>
