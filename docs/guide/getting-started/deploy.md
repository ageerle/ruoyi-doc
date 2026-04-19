# 宝塔部署

::: info 你正在阅读的是 [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai)的文档！

- 如发现文档有误，欢迎提交 [issue](https://gitee.com/ageerle/ruoyi-ai/issues) 帮助我们改进。


:::

## 部署后端项目
1. 使用idea的maven工具，把项目打成jar包
![alt text](/images/baota/bt-01.webp)

2. 创建目录并且上传.jar文件

![alt text](/images/baota/bt-02.webp)

3. 添加java项目

![alt text](/images/baota/bt-03.webp)

4. 启动项目

![alt text](/images/baota/bt-04.webp)



## 部署后台管理项目
1. 执行打包命令： pnpm run build:antd

![alt text](/images/baota/bt-05.webp)

2. 将dict文件上传至服务器

![alt text](/images/baota/bt-06.webp)

3. 添加站点

![alt text](/images/baota/bt-07.webp)

4. 配置nginx

```yaml

    location /prod-api/{
        proxy_pass http://127.0.0.1:6039/; 
        # 避免出现反代https域名出现502错误
        proxy_ssl_server_name on;
        # 设置原始的Host头信息
        proxy_set_header Host $http_host;
    }
    
    # 解决刷新404问题
    #vue-router配置
    location / {
        try_files $uri $uri/ @router;
        index index.html;
    }
    location @router {
        rewrite ^.*$ /index.html last;
    }

```

## 部署用户端项目
1. 执行打包命令：npm run build

![alt text](/images/baota/bt-08.webp)

2. 将dict文件上传至服务器
![alt text](/images/baota/bt-09.webp)

3. 添加站点
![alt text](/images/baota/bt-10.webp)

4. 配置nginx

```yaml
    location /api/{
        proxy_pass http://127.0.0.1:6039/; 
        # 避免出现反代https域名出现502错误
        proxy_ssl_server_name on;
        # 关闭缓存实现打字机效果
        proxy_buffering off;
        # 设置原始的Host头信息
        proxy_set_header Host $http_host;
    }
```

## 配置安全规则
![alt text](/images/baota/bt-11.webp)

## 腾讯云oss配置
1. 控制台-对象存储-创建存储桶
![alt text](/images/baota/bt-12.webp)

2. 配置存储桶信息

![alt text](/images/baota/bt-13.webp)

![alt text](/images/baota/bt-14.webp)

![alt text](/images/baota/bt-15.webp)
3. 获取API管密钥

![alt text](/images/baota/bt-16.webp)

4. 后台管理配置密钥信息

![alt text](/images/baota/bt-17.webp)
5. 启用配置

![alt text](/images/baota/bt-18.webp)

6. 上传文件验证是否配置成功

![alt text](/images/baota/bt-19.webp)

## 邮箱配置
1. <font style="color:rgb(37, 41, 51);">申请邮箱授权码（使用163邮箱）</font>

![alt text](/images/baota/bt-20.webp)

2. <font style="color:rgb(37, 41, 51);">点击开启POP3/SMTP服务，扫码发送短信，记住授权码。</font>

![alt text](/images/baota/bt-21.webp)

3. 配置邮箱信息

![alt text](/images/baota/bt-22.webp)

## 安装向量库(weaviate)
1. 将script/docker/weaviate 目录下的yml文件上传至服务器

![alt text](/images/baota/bt-23.webp)

2. 同级目录下执行<font style="color:rgb(64, 72, 91);">docker-compose up -d </font>
3. <font style="color:rgb(64, 72, 91);">如果出现连接超时可以配置代理</font>

![alt text](/images/baota/bt-24.webp)




```java
{
  "registry-mirrors": [
    "https://mirror.aliyuncs.com",
    "https://docker.registry.cyou",
    "https://docker-cf.registry.cyou",
    "https://dockercf.jsdelivr.fyi",
    "https://docker.jsdelivr.fyi",
    "https://dockertest.jsdelivr.fyi",
    "https://mirror.baidubce.com",
    "https://docker.m.daocloud.io",
    "https://docker.mirrors.ustc.edu.cn",
    "https://mirror.iscas.ac.cn",
    "https://docker.nju.edu.cn",
    "https://docker.rainbond.cc",
    "https://docker.mirrors.sjtug.sjtu.edu.cn",
    "https://b9pmyelo.mirror.aliyuncs.com",
    "https://do.nark.eu.org",
    "https://dc.j8.work",
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://docker.nju.edu.cn",
    "https://noohub.ru",
    "https://huecker.io",
    "https://dockerhub.timeweb.cloud",
    "https://registry.dockermirror.com"
  ]
}
```







