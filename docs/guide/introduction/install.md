# 本地安装
::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai)的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。

:::

## 系统要求
| 序号 | 软件名称            | 版本/备注                                | 下载地址                                                                                     |
|------|---------------------|-----------------------------------------|----------------------------------------------------------------------------------------------|
| 1    | IntelliJ IDEA       | 社区版/旗舰版                           | [官网下载](https://www.jetbrains.com/idea/)                                                  |
| 2    | VS Code             | 最新稳定版                              | [官网下载](https://code.visualstudio.com/)                                                   |
| 3    | Navicat             | MySQL 版                                | [中文下载](https://www.navicat.com.cn/download/navicat-for-mysql)                           |
| 4    | Git                 | Windows 客户端                          | [中文下载站](https://git-scm.cn/downloads)                                                   |
| 5    | JDK                 | 17 (OpenJDK)                            | [清华镜像](https://mirrors.tuna.tsinghua.edu.cn/Adoptium/OpenJDK17U-jdk_x64_linux_hotspot_17.0.7_7.tar.gz) |
| 6    | MySQL               | 5.7 (Windows Installer)                 | [官网下载](https://dev.mysql.com/downloads/windows/installer/5.7.html)                      |
| 7    | Node.js             | 20.18.0 (LTS)                           | [中文下载](https://nodejs.cn/en/download)                                                    |
| 8    | Redis               | 5.0.7 (Windows 移植版)                  | [GitHub Releases](https://github.com/redis-windows/redis-windows/releases?page=4)           |
| 9    | Apache Maven        | 3.9.9                                   | [中文镜像站](https://maven.org.cn/download.html)                                             |

## 安装后端
1. 下载项目
```
git clone https://gitee.com/ageerle/ruoyi-ai
```

2. idea 导入项目
![01](/images/install/install-01.png)

3. 配置maven
文件 - 设置 - 左上角搜索框输入maven - 选择maven安装目录
![02](/images/install/install-02.png)

xml配置
```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.2.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.2.0 https://maven.apache.org/xsd/settings-1.2.0.xsd">
  <localRepository>D:/dev/apache-maven-3.9.9/repository</localRepository>
  <mirrors>
 <mirror>
   <id>aliyunmaven</id>
   <mirrorOf>*</mirrorOf>
   <name>阿里云公共仓库</name>
   <url>https://maven.aliyun.com/repository/public</url>
 </mirror>
  </mirrors>
  <profiles>
 <profile>
  <id>jdk-17</id>
  <activation>
   <activeByDefault>true</activeByDefault>
   <jdk>17</jdk>
  </activation>
  <properties>
   <maven.compiler.source>17</maven.compiler.source>
   <maven.compiler.target>17</maven.compiler.target>
   <maven.compiler.compilerVersion>17</maven.compiler.compilerVersion>
  </properties>
     </profile>
  </profiles>
</settings>
```

4. 初始化数据库
![03](/images/install/install-03.png)
![04](/images/install/install-04.png)
5. 启动redis
- 下载地址：https://github.com/tporadowski/redis/releases
![06](/images/install/install-06.png)
6. 启动项目
![05](/images/install/install-05.png)

## 安装管理端

1. 下载项目
 ```
 git clone https://gitee.com/ageerle/ruoyi-admin
```
2. 安装依赖
```javascript
pnpm install
```
3. 运行项目
```javascript
pnpm run dev:antd
```
4. 打包
```javascript
 pnpm run build:antd
```
5. 修改配置项
- 后台接口：/apps/web-antd/vite.config.mts
![07](/images/install/install-07.png)
- 其他配置：/apps/web-antd/.env.development

## 安装用户端
1. 下载项目
```
git clone https://gitee.com/ageerle/ruoyi-web
```
2. 安装依赖
```javascript
npm install
```
3. 运行项目
```javascript
npm run dev
```
4. 打包
```javascript
npm run build
```

## nginx 部署
部署到 nginx后，可能会出现以下错误：
```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "application/octet-stream". Strict MIME type checking is enforced for module scripts per HTML spec.
```
解决方式一：
```
http {
    #如果有此项配置需要注释掉
    #include       mime.types;

    types {
      application/javascript js mjs;
    }
}
```

## vscode 插件推荐
| 插件名 | 功能描述 |
| --- | --- |
| Vue-Official | Vue 官方插件 | 
| Prettier | 代码格式化 |
| ESLint | 	代码检查 |
| Code Spell Checker | 英文拼写检查 |
| EditorConfig | 	统一代码风格 |
| Iconify IntelliSense | 	图标提示 |
| stylelint | 样式检查 | 
| Tailwind CSS IntelliSense | tailwind 类名提示 |
| json2ts | 	json 转 ts interface |
| DotENV| 	env 高亮 |
| Color Highlight | 	可高亮颜色值 显示对应颜色 |
| One Dark Pro | 	主题, 原版不支持组件高亮 |
## 贡献

- [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai) 还在持续更新中，本项目欢迎您的参与，共同维护，逐步完善.
- 如果你有兴趣加入我们，可以通过以下方式开始，我们会根据你的活跃度邀请你加入。

::: info 加入我们

- 长期提交 `PR`。
- 提供有价值的建议。
- 参与讨论，帮助解决 `issue`。
- 共同维护文档。

:::
