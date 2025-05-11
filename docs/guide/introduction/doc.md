# 关于 RuoYi AI

::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai)的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。


:::

## 接口文档使用说明

### 项目使用spring doc管理接口
- 项目启动后可以访问localhost:6039/v3/api-docs查看接口信息
- 由于没有引用starter-webmvc-ui,所以看到的是一串json数据。

### 使用Apifox管理接口
1. 打开Apifox 新建一个项目
![doc-01](/guide/image/doc-01.png)

2. 项目设置 - 导入数据 - URL方式导入 输入localhost:6039/v3/api-docs
![doc-02](/guide/image/doc-02.png)

3. 确认导入
![doc-03](/guide/image/doc-03.png)

4. 查看接口信息
![doc-04](/guide/image/doc-04.png)