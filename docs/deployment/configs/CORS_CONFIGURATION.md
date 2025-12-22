# 🌍 CORS 配置完全指南

**概览**：跨源资源共享 (CORS) 配置，让前端应用能正确调用 API

---

## 问题背景

**CORS 错误示例：**
```
Access to XMLHttpRequest has been blocked by CORS policy:
The value of the 'Access-Control-Allow-Credentials' header in the response is '' 
which must be 'true' when the request's credentials mode (include) is 'credentials'.
```

**原因：**
- 配置 `credentials: true` + `CORS_ORIGIN: *` 互不兼容
- 浏览器安全政策要求：如果需要发送 cookie，则不能使用通配符 `*`

---

## CORS 配置方式

### 方案 1️⃣：生产环境（推荐）

**适用场景**：
- 有固定的前端域名
- 需要安全和精准的跨域控制

**配置步骤：**
```bash
# 编辑 .env
nano /opt/dailyuse/.env
```

```env
# 设置具体的前端域名
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# 允许发送 cookie 和认证信息
CORS_CREDENTIALS=true

# 可选：允许特定请求头
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-Requested-With
```

**重启服务：**
```bash
docker-compose restart api
```

**验证：**
```bash
curl -i -H "Origin: https://yourdomain.com" \
  http://localhost:3000/api/health
  
# 查看响应头中：
# Access-Control-Allow-Origin: https://yourdomain.com
# Access-Control-Allow-Credentials: true
```

---

### 方案 2️⃣：开发环境（不安全，仅本地）

**⚠️ 警告**：此方式仅用于开发，生产环境禁止使用

**配置步骤：**
```bash
# 编辑 .env
nano /opt/dailyuse/.env
```

```env
# 允许所有来源
CORS_ORIGIN=*

# 不需要凭证（重要！）
CORS_CREDENTIALS=false
```

**重启服务：**
```bash
docker-compose restart api
```

**前端请求示例：**
```javascript
// ✅ 正确（不包含 credentials）
fetch('http://localhost:3000/api/data')
  .then(r => r.json())

// ❌ 错误（包含 credentials）
fetch('http://localhost:3000/api/data', {
  credentials: 'include'
})
```

---

### 方案 3️⃣：动态环境（多个域名）

**适用场景**：
- 有多个前端应用（不同域名）
- 生产和预发环境地址不同

**配置步骤：**
```bash
# 编辑 .env
nano /opt/digitalyse/.env
```

```env
# 列出所有允许的域名（逗号分隔）
CORS_ORIGIN=\
https://app.yourdomain.com,\
https://admin.yourdomain.com,\
https://yourdomain.com,\
https://www.yourdomain.com,\
http://localhost:5173,\
http://localhost:3000

# 允许凭证
CORS_CREDENTIALS=true
```

**重启服务：**
```bash
docker-compose restart api
```

---

## 常见情况对应方案

| 场景 | 前端地址 | 推荐方案 | CORS_ORIGIN | CORS_CREDENTIALS |
|------|--------|--------|------------|-----------------|
| 本地开发 | `http://localhost:5173` | 方案 2 | `*` | `false` |
| 同域部署 | `https://yourdomain.com` | 方案 1 | `https://yourdomain.com` | `true` |
| 多个域名 | 多个 | 方案 3 | 用逗号列表 | `true` |
| 移动应用 | 无浏览器限制 | N/A | N/A | N/A |

---

## CORS 请求头参考

### 请求头（浏览器自动发送）
```http
Origin: https://yourdomain.com
```

### 响应头（API 返回）
```http
# 允许的源
Access-Control-Allow-Origin: https://yourdomain.com

# 允许的方法
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS

# 允许的请求头
Access-Control-Allow-Headers: Content-Type, Authorization

# 允许凭证
Access-Control-Allow-Credentials: true

# 预检缓存时间（秒）
Access-Control-Max-Age: 86400
```

---

## 前端代码示例

### React / Vue 中的请求

```javascript
// 登录请求（需要发送 cookie）
const login = async (email, password) => {
  const response = await fetch(
    `${API_URL}/api/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',  // 重要：发送 cookie
      body: JSON.stringify({ email, password })
    }
  )
  return response.json()
}

// 获取用户数据（使用已登录的 session）
const getUserData = async () => {
  const response = await fetch(
    `${API_URL}/api/user`,
    {
      credentials: 'include',  // 发送 cookie
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  )
  return response.json()
}
```

### Axios 配置

```javascript
import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.VITE_API_URL,
  withCredentials: true,  // 等同于 credentials: 'include'
  headers: {
    'Content-Type': 'application/json'
  }
})

// 在请求和响应中处理 token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient
```

---

## 调试 CORS 问题

### 1. 检查浏览器控制台
```javascript
// 在浏览器控制台打开网络标签 (Network)，找到失败的请求：
// 1. 查看请求头中的 Origin
// 2. 查看响应头中的 Access-Control-* 字段
// 3. 查看是否有 CORS 错误提示
```

### 2. 使用 curl 测试

```bash
# 测试 CORS 预检请求
curl -i -X OPTIONS \
  -H "Origin: https://yourdomain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  http://localhost:3000/api/health

# 查看响应头
# 应该看到：
# Access-Control-Allow-Origin: https://yourdomain.com
# Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
# Access-Control-Allow-Credentials: true
```

### 3. 查看服务器日志

```bash
# 查看 API 日志
docker-compose logs api | grep -i cors

# 或查看完整日志
docker-compose logs api | tail -50
```

---

## 特殊情况处理

### 同站点 iframe

```html
<!-- 父页面和 iframe 在同一域名下 -->
<iframe src="https://yourdomain.com/dashboard" 
        allow="credential"></iframe>
```

### 跨域文件上传

```javascript
// 需要在 FormData 中发送文件
const uploadFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(
    `${API_URL}/api/upload`,
    {
      method: 'POST',
      credentials: 'include',
      body: formData
      // ⚠️ 不要设置 Content-Type 头，让浏览器自动设置
    }
  )
  return response.json()
}
```

### 预检请求超时

```bash
# 如果预检请求 (OPTIONS) 超时，检查：
curl -i -X OPTIONS http://localhost:3000/api/health

# 如果返回 404，说明 OPTIONS 方法未启用
# 解决：在 API 服务器配置中启用 OPTIONS

# Express 示例
app.use(cors({
  origin: 'https://yourdomain.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // 包含 OPTIONS
  optionsSuccessStatus: 200
}))
```

---

## 环境变量完整参考

```env
# CORS 基础配置
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
CORS_CREDENTIALS=true

# CORS 方法（可选）
CORS_METHODS=GET,POST,PUT,DELETE,PATCH,OPTIONS

# CORS 请求头（可选）
CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-Requested-With

# CORS 响应头（可选）
CORS_EXPOSED_HEADERS=X-Total-Count,X-Page-Number

# CORS 预检缓存（秒）
CORS_MAX_AGE=86400

# 其他安全头
CORS_CREDENTIALS_SAME_SITE=strict
```

---

## 验证清单

- [ ] 前端域名已添加到 `CORS_ORIGIN`
- [ ] 如需 cookie，`CORS_CREDENTIALS` 已设为 `true`
- [ ] 如果使用通配符 `*`，`CORS_CREDENTIALS` 已设为 `false`
- [ ] 已重启 API 服务
- [ ] 前端请求中的 `credentials` 配置与后端一致
- [ ] 浏览器控制台无 CORS 错误
- [ ] curl 测试显示正确的 CORS 响应头

---

**还有问题？** 见 [../05-troubleshooting.md](../05-troubleshooting.md) 的 "CORS 错误" 部分。
