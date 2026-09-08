# API Documentation {#接口文档}

::: info RuoYi AI documentation
This guide covers [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai). Report documentation problems through an [issue](https://gitee.com/ageerle/ruoyi-ai/issues).
:::

## Browse and import API definitions {#接口文档使用说明}

### Open the Springdoc definition {#项目使用spring-doc管理接口}

After starting the backend, open [the local OpenAPI definition](http://localhost:6039/v3/api-docs), using your actual port if different. The project uses Springdoc without `starter-webmvc-ui`, so this endpoint returns JSON rather than an interactive Swagger UI.

### Import into Apifox {#使用apifox管理接口}

1. Open Apifox and create a project.

![Create an Apifox project](/images/doc/doc-01.webp)

2. Open Project Settings → Import Data, select URL import, and enter `http://localhost:6039/v3/api-docs`.

![Import the OpenAPI URL](/images/doc/doc-02.webp)

3. Confirm the import.

![Confirm the API import](/images/doc/doc-03.webp)

4. Browse the imported endpoints.

![Browse API documentation](/images/doc/doc-04.webp)
