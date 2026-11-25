# 实验 05：搭建私有容器镜像仓库

**时长：** 45 分钟  **前置条件：** 已安装 Docker。

## 目标

在本地运行 Docker Registry v2，向其中推送镜像并拉取镜像，随后添加基本身份验证与 TLS。

## 步骤

### 1. 运行不安全的本地镜像仓库
```bash
docker run -d -p 5000:5000 --name registry registry:2
docker tag iris-api:0.2 localhost:5000/iris-api:0.2
docker push localhost:5000/iris-api:0.2
docker pull localhost:5000/iris-api:0.2
```

### 2. 添加基本身份验证
```bash
mkdir auth
docker run --rm --entrypoint htpasswd httpd:2 -Bbn admin admin > auth/htpasswd

docker rm -f registry
docker run -d -p 5000:5000 \
  -v "$PWD/auth:/auth" \
  -e REGISTRY_AUTH=htpasswd \
  -e REGISTRY_AUTH_HTPASSWD_REALM='Registry Realm' \
  -e REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd \
  --name registry registry:2

docker logout localhost:5000
docker pull localhost:5000/iris-api:0.2     # 401
docker login localhost:5000                 # admin/admin
docker pull localhost:5000/iris-api:0.2     # 200
```

### 3. 添加 TLS
生成自签名证书：
```bash
mkdir certs
openssl req -newkey rsa:4096 -nodes -sha256 -x509 -days 365 \
  -subj '/CN=registry.local' \
  -addext 'subjectAltName=DNS:registry.local,DNS:localhost,IP:127.0.0.1' \
  -keyout certs/domain.key -out certs/domain.crt
```
在 Docker 宿主机上信任该证书（macOS：`security add-trusted-cert`；Linux：复制到 `/etc/docker/certs.d/registry.local:5000/ca.crt`）。

使用 TLS 重新启动镜像仓库：
```bash
docker rm -f registry
docker run -d -p 5000:5000 \
  -v "$PWD/auth:/auth" -v "$PWD/certs:/certs" \
  -e REGISTRY_AUTH=htpasswd -e REGISTRY_AUTH_HTPASSWD_REALM='Realm' \
  -e REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd \
  -e REGISTRY_HTTP_TLS_CERTIFICATE=/certs/domain.crt \
  -e REGISTRY_HTTP_TLS_KEY=/certs/domain.key \
  --name registry registry:2
```

### 4. 列出并检查
```bash
curl -u admin:admin -k https://localhost:5000/v2/_catalog
curl -u admin:admin -k https://localhost:5000/v2/iris-api/tags/list
```

## 验证
- [ ] 第二步之后，不经过身份验证的推送操作失败。
- [ ] 第三步之后，未建立 TLS 信任时的推送操作失败。
- [ ] `curl /v2/_catalog` 列出 `iris-api`。

## 清理
```bash
docker rm -f registry
rm -rf auth certs
```

## 故障排查
- **`http: server gave HTTP response to HTTPS client`** — Docker 守护进程期望使用 HTTPS，而你正在使用明文 HTTP。进行不安全模式测试时，在 daemon.json 的 `insecure-registries` 中添加 `localhost:5000`。
- **自签名证书被拒绝** — 在宿主机上信任 CA；安装完成后重启 Docker 守护进程。
