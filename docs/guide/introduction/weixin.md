---
outline: deep
---

# 快速开始 {#quick-start}

## 使用说明

1. 个人微信使用网页协议,有封号风险,不要使用大号尝试。
2. 使用注册满一年以上的小号，可以降低风控
3. 企业机器人放心使用不会封号

### 如何使用个人微信

1. 添加应用

```
INSERT INTO `ry-vue`.`chat_app_store` (`id`, `name`, `description`, `avatar`, `app_url`, `create_dept`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`) VALUES (7, '微信机器人', '微信机器人', 'https://panda-1253683406.cos.ap-guangzhou.myqcloud.com/panda/2025/04/02/0557a7d68fa842bba952ce0d6ef38a2e.png', '/wxbot', NULL, NULL, NULL, NULL, NULL, NULL);

```

2. 扫描登录
![14](/guide/image/14.png)

3. 后台生成二维码接口地址

```
http://localhost:6039/getQr

```


### 如何使用企业微信

#### 创建企微应用
首先在 企业微信管理后台，点击 "应用管理" 菜单，点击创建应用:
![16](/guide/image/16.png)
#### 获取 企业ID
点击 "我的企业" 菜单，在最下方可以看到 "企业ID"
![17](/guide/image/17.png)
#### 获取 AgentId 和 Secret
进入创建的应用主页，获取 AgentId 和 Secret：
![18](/guide/image/18.png)
#### 获取 Token 和 EncodingAESKey
进入企业微信应用设置的 "接受消息 - 设置API接收"，获取 Token 和 EncodingAESKey。（首次创建应用时，进入【设置API接收】后没有现成的Token 和 EncodingAESKey，点击右侧【随机获取】即可生成）：
![19](/guide/image/19.png)

#### 填写配置
![15](/guide/image/15.png)