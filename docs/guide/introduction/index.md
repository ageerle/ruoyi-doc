# 关于 RuoYi AI

::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai)的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。


:::

## 项目环境
- jdk 17
- mysql 5.7、8.0
- redis 版本必须 >= 5.X
- maven 3.8+
- nodejs 20+ & pnpm

## 安装后端
1. 下载项目
- https://gitee.com/ageerle/ruoyi-ai

2. idea 导入项目
![01](/guide/image/01.png)

3. 配置maven
文件 - 设置 - 左上角搜索框输入maven - 选择maven安装目录
![02](/guide/image/02.png)

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
![03](/guide/image/03.png)
![04](/guide/image/04.png)
5. 启动redis
- 下载地址：https://github.com/tporadowski/redis/releases
![06](/guide/image/06.png)
6. 启动项目
![05](/guide/image/05.png)

## 安装管理端

1. 下载项目
- https://gitee.com/ageerle/ruoyi-admin
2. 安装依赖
```javascript
pnpm install
```
3. 运行项目
```javascript
pnpm dev
```
4. 打包
```javascript
pnpm build
```
5. 修改配置项
- 后台接口：/apps/web-antd/vite.config.mts
![07](/guide/image/07.png)
- 其他配置：/apps/web-antd/.env.development

## 安装用户端
1. 下载项目
- https://gitee.com/ageerle/ruoyi-web
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

## 修改配置
1. 申请API KEY: https://api.pandarobot.chat
- 注册API KEY
成功注册账号后点击添加令牌,参数可以全部默认,然后点击复制按钮可以获取API KEY
![08](/guide/image/08.png)
2. 进入后台管理配置
- 默认账号 admin/admin123
3. 进入运营管理-系统模型-新增模型,在请求密钥处填写上一步申请到的key信息,请求地址默认：https://api.pandarobot.chat/
![09](/guide/image/09.png)

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
解决方式二：
进入 nginx 下的mime.types文件, 将application/javascript js; 修改为 application/javascript js mjs;

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
