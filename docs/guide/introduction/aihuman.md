# AI数字人集成

::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai)的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。


:::

## 配置步骤

### 1. 如何上架卡通数字人

#### 1.1 下载Live2D模型

进入 `https://www.live2d.com/zh-CHS/learn/sample/` 点击红色的下载按钮

![alt text](/images/aihuman/ah-01.png)

得到下载文件后，解压并打开：

![alt text](/images/aihuman/ah-02.png)

将文件压缩包里面的人物模型导入到 `ruoyi-admin` 工程下的 `apps/web-antd/public/Live2D/models`

![alt text](/images/aihuman/ah-03.png)

![alt text](/images/aihuman/ah-04.png)

::: warning 
注意这里是导入到后台管理系统的前端工程 ruoyi-admin
:::

#### 1.2 进入到ruoyi-admin后台管理系统的【交互数字人配置】

![alt text](/images/aihuman/ah-05.png)

点击右侧的新增按钮：

![alt text](/images/aihuman/ah-06.png)

::: warning 
这里说下填写的规则，务必要填写正确，否则无法上架数字人模型
:::

::: info

- 场景名称：可以随便填

- 模型名称：最好和导入到 ruoyi-admin 工程下的 apps/web-antd/public/Live2D/models 的文件保持，一致，刚才导入的是 kei_zh，因此这里也需要填写 kei_zh

![alt text](/images/aihuman/ah-07.png)

- 模型路径：需要填写 .model3.json 所在的路径，这个我们可以在 ruoyi-admin 工程下的 apps/web-antd/public/Live2D/models/kei_zh/kei_basic_free/runtime/kei_basic_free.model3.json 找到，然后将 public 下面的相对路径 /Live2D/models/kei_zh/kei_basic_free/runtime/kei_basic_free.model3.json 填写到这里

![alt text](/images/aihuman/ah-08.png)

![alt text](/images/aihuman/ah-09.png)

- 模型参数：将  .model3.json 里面的具体内容复制进来

![alt text](/images/aihuman/ah-10.png)

- 智能体参数：需要填写以下 json，这里对每个参数进行详细解答
  - agent：可以填写 coze / dify / fastgpt【目前只对接了coze，后续会把剩下两个补上】
  - agentConfig：如果是 coze
    - apiUrl：coze的接口地址
    - authorizationToken：coze的密钥
![alt text](/images/aihuman/ah-11.png)
    - botId：coze的机器人id
![alt text](/images/aihuman/ah-12.png)
    - userId：可以随便填
  - voice：可以填写 volcengine-tts / egde-tts / GPT-SoVITS
  - voiceConfig：如果是 volcengine-tts
    - ENDPOINT：填写volcengine-tts接口的url，这里固定是wss://openspeech.bytedance.com/api/v3/tts/bidirection
    - appId：接口的appid，从图中位置获取
![alt text](/images/aihuman/ah-13.png)
    - accessToken：接口token，从图中位置获取
![alt text](/images/aihuman/ah-14.png)
    - resourceId：固定填写 seed-tts-2.0
    - voice：音色，从图中位置获取
![alt text](/images/aihuman/ah-15.png)
    - text：先填写 "" ，不要填写内容
    - encoding：固定填写 wav
  - voiceConfig：如果是 GPT-SoVITS
    - apiUrl：固定填写http://127.0.0.1:9880，需要你的本地部署GPT-SoVITS
    - textLang：如果是中文，就填写 zh
    - refAudioPath： 被克隆的音色文件
    - promptLang：如果是中文，就填写 zh
    - promptText：填写提示词的位置，可以空着
    - textSplitMethod：默认 cut5，人物在朗读时停顿较多
    - batchSize：默认10
    - mediaType：默认 wav
    - speedFactor：朗读速度默认1.0

- 智能体参数组合如下：

``` json
- # 参数组合1：对接的coze智能体，对接的火山引擎语音
{
    "agent": "coze",
    "agentConfig": {
        "apiUrl": "https://api.coze.cn/v3/chat",
        "authorizationToken": "sat_********************************YAn",
        "botId": "7506335095931338792",
        "userId": "7376476310010937396"
    },
    "voice": "volcengine-tts",
    "voiceConfig": {
        "ENDPOINT": "wss://openspeech.bytedance.com/api/v3/tts/bidirection",
        "appId": "10******34",
        "accessToken": "fO******************KVW",
        "resourceId": "seed-tts-2.0",
        "voice": "saturn_zh_female_tiaopigongzhu_tob",
        "text": "",
        "encoding": "wav"
    }
}

- # 参数组合2：对接的coze智能体，对接的GPT-SoVITS语音
{
    "agent": "coze",
    "agentConfig": {
        "apiUrl": "https://api.coze.cn/v3/chat",
        "authorizationToken": "sat_********************************YAn",
        "botId": "7506335095931338792",
        "userId": "7376476310010937396"
    },
    "voice": "GPT-SoVITS",
    "voiceConfig": {
        "apiUrl": "http://127.0.0.1:9880",
        "textLang": "zh",
        "refAudioPath": "./meiduo.wav",
        "promptLang": "zh",
        "promptText": "",
        "textSplitMethod": "cut5",
        "batchSize": 10,
        "mediaType": "wav",
        "speedFactor": "1.0"
    }
}
```

- 创建时间：不管
- 更新时间：不管
- 状态：选正常
- 发布状态：选已发布
:::

![alt text](/images/aihuman/ah-16.png)

做完上述操作，这里就成功上架了新的卡通数字人：

![alt text](/images/aihuman/ah-17.png)

#### 1.3 进入到ruoyi-admin后台管理系统的【Libe2D数字人体验】对上架的数字人进行体验

![alt text](/images/aihuman/ah-18.png)

下拉列表选择刚才上架的数字人，就可以开始体验啦。

![alt text](/images/aihuman/ah-19.png)

## 效果展示

<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=115495613235601&bvid=BV1f91pBCErz&cid=33715847706&p=1" width="100%" height="400px" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>