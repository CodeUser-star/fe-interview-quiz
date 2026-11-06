# feq-sync · 坚果云同步代理

「前端面试刷题」PWA 的同步后端。坚果云官方 `dav.jianguoyun.com` **不返回 CORS 头**，浏览器直连必被拦截，所以用这个 Cloudflare Worker 做转发：注入凭据 → 转发 WebDAV → 补 CORS 头。

## 一、准备坚果云应用密码

1. 电脑浏览器打开 https://www.jianguoyun.com 登录
2. 右上角头像 → **账户信息** → 左侧 **安全选项**
3. 下方 **第三方应用管理** → **添加应用**
4. 名称随便填（如 `feq-sync`），点 **生成密码**
5. 把弹出的一串密码**立刻复制**（只显示一次）；登录密码**不能用**

## 二、部署 Worker（网页版，推荐）

1. https://dash.cloudflare.com 登录（没有账号就注册，免费）
2. 左侧 **Workers & Pages**（新界面可能叫 **Compute (Workers)**）→ **Create / 创建**
3. 选 **Workers** → **Start with Hello World! / 从 Hello World 开始** → **Deploy**
4. 名字填 `feq-sync` → **Deploy**
5. 如果提示创建 `workers.dev` 子域，填一个自己用的前缀（如 `你的名字`），保存
6. 部署成功后点 **Edit code / 编辑代码**，进入在线编辑器
7. 编辑器里全选（Ctrl+A）删掉模板，粘贴 `worker/feq-sync.js` 全文 → 右上 **Deploy**

> 命令行方式：`npx wrangler deploy --config worker/wrangler.toml`

## 三、填两个变量

Worker 页面 → **Settings / 设置** → **Variables and Secrets / 变量和机密** → **Add / 添加**

| 名称 | 值 | 类型 |
|---|---|---|
| `DAV_USER` | 坚果云登录邮箱 | Secret（加密） |
| `DAV_PASS` | 上一步生成的应用密码 | Secret（加密） |
| `ALLOWED_ORIGIN`（可选） | `https://codeuser-star.github.io` | Text |

保存后如果提示需要重新部署，点 **Deploy** 让变量生效。

> 命令行：`npx wrangler secret put DAV_USER` / `npx wrangler secret put DAV_PASS`

## 四、拿到地址并自检

Worker 概览页顶部的地址形如 `https://feq-sync.xxx.workers.dev`，**不要带结尾斜杠、不要加 `/dav`**。

```bash
node scripts/worker-live-check.mjs https://feq-sync.xxx.workers.dev
```

只读检查，不写入任何数据。全绿就可以回 App 配置了。

## 五、App 内配置

设置 → 同步：

- 服务器地址：`https://feq-sync.xxx.workers.dev`
- 账号 / 密码：**留空**（凭据在 Worker 里）
- 点 **测试连接** → 应显示「连接成功，云端暂无备份」
- 点 **立即同步** → 坚果云根目录出现 `fe-interview-quiz/backup.json`

之后打开 App 自动拉取，答题等改动 3 秒后自动推送；失败 30 秒静默重试，不影响本地使用。

## 排错

| 现象 | 原因 | 处理 |
|---|---|---|
| 测试连接提示「跨域被拦截」 | 地址填成了坚果云官方 DAV | 改填 Worker 地址 |
| 提示「账号或应用密码不正确」 | 用了登录密码 / 变量没生效 | 改用应用密码；改完变量要重新 Deploy |
| 页面返回 403 且 JSON 提示「只允许 /fe-interview-quiz」 | 地址后面多了 `/dav` 或路径 | 只填 Worker 根地址 |
| 返回 500「缺少 DAV_USER / DAV_PASS」 | 变量没建或没生效 | Settings → Variables 补上并 Deploy |
| 同步成功但坚果云看不到文件 | 看错目录 | 文件在根目录 `fe-interview-quiz/backup.json` |
| 一段时间后同步变慢/失败 | 坚果云免费户 WebDAV 有 30 分钟 600 次请求上限 | 正常使用远低于上限；异常时等 30 分钟 |

## 说明

- Worker 只放行 `/fe-interview-quiz*` 路径，别的路径一律 403，凭据不会暴露给前端
- 密码保存在 Worker 的加密变量里，不进代码、不进仓库
- 换设备只需要重新填同一个 Worker 地址
