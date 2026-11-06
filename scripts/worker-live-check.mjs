/**
 * Worker 部署后的只读自检（不会写入任何数据）
 *
 * 用法：node scripts/worker-live-check.mjs https://feq-sync.xxx.workers.dev
 *
 * 检查项：
 *   1. OPTIONS 预检 → 应有 Access-Control-Allow-Origin
 *   2. GET 备份文件 → 404 表示链路通、云端还没有备份（正常首次状态）
 *   3. GET 越界路径 → 应 403（证明路径白名单生效）
 */

const raw = (process.argv[2] || '').trim()
if (!raw) {
  console.error('用法：node scripts/worker-live-check.mjs https://feq-sync.xxx.workers.dev')
  process.exit(2)
}
const base = raw.replace(/\/+$/, '')
const fileUrl = `${base}/fe-interview-quiz/backup.json`

let failed = 0
const ok = (name, pass, detail = '') => {
  if (!pass) failed++
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`)
}

console.log(`\n目标：${base}\n`)

try {
  // 1. 预检
  const pre = await fetch(fileUrl, { method: 'OPTIONS' })
  const acao = pre.headers.get('Access-Control-Allow-Origin')
  ok('预检返回 204', pre.status === 204, `实际 ${pre.status}`)
  ok('预检带 CORS 头', !!acao, acao ? `Access-Control-Allow-Origin: ${acao}` : '缺失')
  const methods = pre.headers.get('Access-Control-Allow-Methods') || ''
  ok('允许 MKCOL', methods.includes('MKCOL'), methods || '缺失')

  // 2. 读取备份（只读）
  const get = await fetch(fileUrl)
  const body = get.status === 200 ? await get.text() : ''
  let parsed = null
  try {
    parsed = body ? JSON.parse(body) : null
  } catch {
    /* 非 JSON 也算失败 */
  }
  if (get.status === 404) {
    ok('Worker 已连上坚果云', true, '云端暂无备份（首次同步会上传）')
  } else if (get.status === 401 || get.status === 403) {
    ok('坚果云鉴权', false, `${get.status} — DAV_USER / DAV_PASS 不对，或需用「应用密码」`)
  } else if (get.status === 500) {
    const msg = parsed?.error ?? body.slice(0, 80)
    ok('Worker 环境变量', false, `${msg}`)
  } else if (get.status === 200) {
    ok('读取云端备份', parsed?.app === 'fe-interview-quiz', parsed ? `app=${parsed.app}` : '内容不是 JSON')
    if (parsed?.progress) {
      const n = Object.keys(parsed.progress.records ?? {}).length
      console.log(`     云端记录数 ${n}，更新时间 ${new Date(parsed.updatedAt).toLocaleString('zh-CN')}`)
    }
  } else {
    ok('读取云端备份', false, `HTTP ${get.status}`)
  }

  // 3. 路径白名单
  const guard = await fetch(`${base}/other/whatever`)
  ok('越界路径被拒', guard.status === 403, `实际 ${guard.status}`)
} catch (e) {
  console.log(`FAIL 网络请求失败 — ${e.message}`)
  console.log('     常见原因：地址拼错、Worker 未部署、或本机网络无法访问 workers.dev')
  failed++
}

console.log(failed === 0 ? '\n全部通过，回 App 点「测试连接」即可\n' : `\n${failed} 项未通过，按上面提示修\n`)
process.exit(failed === 0 ? 0 : 1)
