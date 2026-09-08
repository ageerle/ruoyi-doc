# WeCom Integration {#企微集成}

::: info RuoYi AI documentation
This guide covers [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai). Report documentation problems through an [issue](https://gitee.com/ageerle/ruoyi-ai/issues).
:::

## Configure a WeCom application {#如何使用企业微信}

::: warning Enterprise edition
WeCom integration is available in the enterprise edition. Contact the project author for purchasing information.
:::

#### Create an application {#创建企微应用}

In the WeCom administration console, open Application Management and create an application.

![Create a WeCom application](/images/weixin/wx-01.webp)

#### Find the enterprise ID {#获取-企业id}

Open My Enterprise and find the enterprise ID at the bottom of the page.

![Find the enterprise ID](/images/weixin/wx-02.webp)

#### Obtain AgentId and Secret {#获取-agentid-和-secret}

Open the application you created and obtain its AgentId and Secret.

![Application AgentId and Secret](/images/weixin/wx-03.webp)

#### Obtain Token and EncodingAESKey {#获取-token-和-encodingaeskey}

Open Receive Messages → API Receiving in the application's settings. For a new application, use the random-generation controls if Token and EncodingAESKey are empty.

![Message-receiving credentials](/images/weixin/wx-04.webp)

#### Save the application configuration {#填写配置}

Enter the collected values in the project's WeCom configuration form and save.

![WeCom configuration](/images/weixin/wx-05.webp)
