/**
 * feq-sync：给「前端面试刷题」PWA 用的坚果云 WebDAV 代理
 *
 * 为什么需要它：坚果云官方 dav.jianguoyun.com 不返回 CORS 头，浏览器直连会被拦截。
 * 这个 Worker 做三件事：注入坚果云凭据、转发 WebDAV 请求、补上 CORS 头。
 *
 * 部署：Cloudflare Dashboard → Workers & Pages → 创建 Worker → 粘贴本文件
 * 环境变量（Settings → Variables）：DAV_USER = 坚果云账号，DAV_PASS = 应用密码
 * 可选：ALLOWED_ORIGIN = https://codeuser-star.github.io（默认 *）
 */

const DAV_BASE = 'https://dav.jianguoyun.com/dav'
const PATH_PREFIX = '/fe-interview-quiz' // 只允许访问本应用的同步目录

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, PUT, OPTIONS, MKCOL',
      'Access-Control-Allow-Headers': 'authorization, content-type',
      'Access-Control-Max-Age': '86400',
    }

    // 浏览器预检：直接放行，不打到坚果云（那边会回 401，导致预检失败）
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

    const url = new URL(request.url)
    if (!url.pathname.startsWith(PATH_PREFIX)) {
      return json({ error: `只允许 ${PATH_PREFIX} 下的路径` }, 403, cors)
    }
    if (!env.DAV_USER || !env.DAV_PASS) {
      return json({ error: 'Worker 缺少 DAV_USER / DAV_PASS 环境变量' }, 500, cors)
    }

    const headers = new Headers()
    headers.set('Authorization', 'Basic ' + btoa(`${env.DAV_USER}:${env.DAV_PASS}`))
    const contentType = request.headers.get('Content-Type')
    if (contentType) headers.set('Content-Type', contentType)

    const init = { method: request.method, headers }
    // GET/HEAD 不能带 body；PUT 直接把流透传
    if (request.method !== 'GET' && request.method !== 'HEAD') init.body = request.body

    const upstream = await fetch(DAV_BASE + url.pathname + url.search, init)

    const out = new Headers(cors)
    const keep = upstream.headers.get('Content-Type')
    if (keep) out.set('Content-Type', keep)

    // MKCOL 已存在返回 405，交给客户端按「目录已存在」处理
    return new Response(upstream.body, { status: upstream.status, headers: out })
  },
}

function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
