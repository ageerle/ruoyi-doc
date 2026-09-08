# BaoTa Panel Deployment {#宝塔部署}

::: info RuoYi AI documentation
This guide covers [RuoYi AI](https://gitee.com/ageerle/ruoyi-ai). Report documentation problems through an [issue](https://gitee.com/ageerle/ruoyi-ai/issues).
:::

## Deploy the backend {#部署后端项目}

1. Use the Maven tool window in IntelliJ IDEA to package the backend as a jar.

![Package the backend with Maven](/images/baota/bt-01.webp)

2. Create a server directory and upload the jar.

![Upload the backend jar](/images/baota/bt-02.webp)

3. Add a Java project in BaoTa Panel.

![Add the Java application](/images/baota/bt-03.webp)

4. Start the application.

![Start the backend](/images/baota/bt-04.webp)

## Deploy the admin app {#部署后台管理项目}

1. Build with `pnpm run build:antd`.

![Build the admin app](/images/baota/bt-05.webp)

2. Upload the generated `dist` directory to the server.

![Upload the admin build output](/images/baota/bt-06.webp)

3. Add a website pointing to the uploaded build directory.

![Create the admin website](/images/baota/bt-07.webp)

4. Configure Nginx:

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

## Deploy the user app {#部署用户端项目}

1. Build with `npm run build`.

![Build the user app](/images/baota/bt-08.webp)

2. Upload the generated `dist` directory.

![Upload the user build output](/images/baota/bt-09.webp)

3. Add a website for the user app.

![Create the user website](/images/baota/bt-10.webp)

4. Configure Nginx:

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

## Configure firewall rules {#配置安全规则}

Allow the application ports required by your deployment in the panel and server firewall.

![Server firewall configuration](/images/baota/bt-11.webp)

## Configure Tencent Cloud object storage {#腾讯云oss配置}

1. In the Tencent Cloud console, open Object Storage and create a bucket.

![Create an object-storage bucket](/images/baota/bt-12.webp)

2. Configure the bucket information.

![Bucket settings](/images/baota/bt-13.webp)

![Additional bucket configuration](/images/baota/bt-14.webp)

![Bucket access configuration](/images/baota/bt-15.webp)

3. Obtain the API credentials.

![Object-storage API credentials](/images/baota/bt-16.webp)

4. Enter the storage credentials in the admin app.

![Admin storage configuration](/images/baota/bt-17.webp)

5. Enable the configuration.

![Enable object storage](/images/baota/bt-18.webp)

6. Upload a file to verify the configuration.

![Verify a file upload](/images/baota/bt-19.webp)

## Configure email {#邮箱配置}

1. Obtain a mailbox authorization code. This example uses a 163 mailbox.

![Mailbox authorization settings](/images/baota/bt-20.webp)

2. Enable POP3/SMTP, complete the provider's verification, and retain the generated authorization code.

![Enable SMTP and obtain the authorization code](/images/baota/bt-21.webp)

3. Configure the mailbox in the application.

![Application email configuration](/images/baota/bt-22.webp)

## Install Weaviate {#安装向量库-weaviate}

1. Upload the Weaviate Compose YAML to the server. The screenshots show the older `script/docker/weaviate` layout; use the matching file from your checked-out version. For the current Compose setup, see [Docker Deployment](./docker.md).

![Upload the Weaviate Compose file](/images/baota/bt-23.webp)

2. From the file's directory, run `docker compose up -d` with Compose V2. Older installations may use `docker-compose up -d`.
3. If pulling images times out, check Docker's network and proxy configuration.

![Docker proxy configuration](/images/baota/bt-24.webp)

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
