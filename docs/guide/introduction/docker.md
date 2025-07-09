# Docker 部署

::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai)的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。

:::

## 部署方式概览

RuoYi AI 提供两种 Docker 部署方式：

1. **快速启动（推荐）** - 直接拉取预构建镜像，最低配置要求：2H2G
2. **脚本启动** - 通过一键部署脚本，支持自定义构建，最低配置要求：4H4G

## 方式一：快速启动（镜像部署）

### 系统要求
- **最低配置**：2核CPU，2GB内存
- **推荐配置**：4核CPU，4GB内存
- **存储空间**：至少10GB可用空间

### 前置条件
确保系统已安装：
- Docker
- Docker Compose

### 部署步骤

1. **下载部署文件**
   ```bash
   git clone https://github.com/ageerle/ruoyi-ai
   cd ruoyi-ai/script/deploy/deploy
   ```

2. **启动服务**
   ```bash
   docker-compose up -d
   ```

3. **验证部署**
   ```bash
   # 查看容器状态
   docker-compose ps

   # 查看日志
   docker-compose logs -f
   ```

## 方式二：脚本启动（一键部署）

### 系统要求
- **最低配置**：4核CPU，4GB内存
- **推荐配置**：8核CPU，8GB内存
- **存储空间**：至少20GB可用空间

### 前置条件
确保系统已安装以下软件：
- docker
- docker-compose
- git
- unzip

### 部署步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/ageerle/ruoyi-ai
   cd ruoyi-ai/script/deploy/one-step-script
   ```

2. **选择部署脚本**

   **中文界面部署脚本**（拉取gitee仓库）：
   ```bash
   ./deploy-cn.sh
   ```

   **英文界面部署脚本**（拉取github仓库）：
   ```bash
   ./deploy-en.sh
   ```

3. **按照脚本提示操作**

   如果是一台新服务器，选择默认配置，直接回车即可。

   ![alt text](/images/docker/deploy-01.png)
4. **选择部署模式**

   在脚本执行过程中，会出现以下选择：
   ```
   已将模板文件复制到部署目录。
   正在使用您的配置更新 .env 文件...
   已使用您的配置更新 .env 文件。
   正在使用您的配置更新 docker-compose.yaml 文件...
   已使用您的配置更新 docker-compose.yaml 文件。

   === 构建或部署选项 ===
   您想构建新镜像 (B) 还是直接使用现有镜像部署 (D)？[B/d]:
   ```

   **选择说明**：
   - **选择 D（推荐）**：直接使用现有镜像部署，速度快
   - **选择 B**：重新构建编译服务软件包及容器镜像，耗时较长

5. **等待部署完成**

   耐心等待安装完成，脚本会自动处理所有依赖和配置。

## 访问应用

部署完成后，可以通过以下地址访问：

- **用户界面**：`http://your-server-ip:8081`
- **管理员界面**：`http://your-server-ip:8082`

::: tip 提示
请将 `your-server-ip` 替换为您的实际服务器IP地址。
:::

## 常用命令

### 查看服务状态
```bash
# 查看所有容器状态
docker-compose ps

# 查看特定服务日志
docker-compose logs -f [service-name]

# 查看所有服务日志
docker-compose logs -f
```

### 服务管理
```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 更新服务
docker-compose pull
docker-compose up -d
```

### 数据备份
```bash
# 备份数据库
docker-compose exec mysql mysqldump -u root -p ruoyi_ai > backup.sql

# 备份整个数据目录
docker-compose down
tar -czf ruoyi-ai-backup.tar.gz ./data
docker-compose up -d
```

## 配置说明

### 环境变量配置

主要配置文件：`.env`

```bash
# 数据库配置
MYSQL_ROOT_PASSWORD=your_password
MYSQL_DATABASE=ruoyi_ai
MYSQL_USER=ruoyi
MYSQL_PASSWORD=your_password

# Redis配置
REDIS_PASSWORD=your_redis_password

# 应用配置
APP_PORT_USER=8081
APP_PORT_ADMIN=8082
API_PORT=6039

# 向量数据库配置
WEAVIATE_PORT=6038
```

### 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| 用户界面 | 8081 | 用户端Web界面 |
| 管理界面 | 8082 | 管理员Web界面 |
| API服务 | 6039 | 后端API接口 |
| MySQL | 3306 | 数据库服务 |
| Redis | 6379 | 缓存服务 |
| Weaviate | 6038 | 向量数据库 |

## 故障排除

### 常见问题

1. **容器启动失败**
   ```bash
   # 查看详细错误信息
   docker-compose logs [service-name]

   # 检查端口占用
   netstat -tlnp | grep [port]
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库容器状态
   docker-compose ps mysql

   # 查看数据库日志
   docker-compose logs mysql
   ```

3. **内存不足**
   ```bash
   # 查看系统资源使用情况
   docker stats

   # 清理未使用的镜像和容器
   docker system prune -a
   ```

### 性能优化

1. **调整内存限制**
   ```yaml
   # 在 docker-compose.yml 中添加
   services:
     app:
       deploy:
         resources:
           limits:
             memory: 2G
           reservations:
             memory: 1G
   ```

2. **启用日志轮转**
   ```yaml
   # 在 docker-compose.yml 中添加
   services:
     app:
       logging:
         driver: "json-file"
         options:
           max-size: "10m"
           max-file: "3"
   ```

## 安全建议

1. **修改默认密码**
   - 数据库root密码
   - Redis密码
   - 应用管理员密码

2. **配置防火墙**
   ```bash
   # 只开放必要端口
   ufw allow 8081
   ufw allow 8082
   ufw enable
   ```

3. **启用HTTPS**
   - 配置SSL证书
   - 使用反向代理（如Nginx）

4. **定期备份**
   - 设置自动备份脚本
   - 定期测试备份恢复

## 更新升级

### 更新到最新版本
```bash
# 停止服务
docker-compose down

# 拉取最新镜像
docker-compose pull

# 启动服务
docker-compose up -d

# 清理旧镜像
docker image prune -f
```

### 版本回滚
```bash
# 查看镜像历史
docker images

# 修改 docker-compose.yml 中的镜像标签
# 然后重新部署
docker-compose up -d
```
