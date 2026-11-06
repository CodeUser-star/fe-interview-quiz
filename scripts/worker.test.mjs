import worker from '../worker/feq-sync.js'

let seen = null
globalThis.fetch = async (url, init) => {
  seen = { url, method: init.method, auth: init.headers.get('Authorization') }
  return new Response('{"ok":1}', { status: 200, headers: { 'Content-Type': 'application/json' } })
}
const env = { DAV_USER: 'a@b.com', DAV_PASS: 'app-pass' }
let fail = 0
const eq = (n, a, b) => { if (a !== b) { fail++; console.log(`FAIL ${n}: ${a} !== ${b}`) } else console.log(`ok   ${n}`) }

let r = await worker.fetch(new Request('https://w.dev/fe-interview-quiz/backup.json', { method: 'OPTIONS' }), env)
eq('预检 204', r.status, 204)
eq('预检带 CORS', r.headers.get('Access-Control-Allow-Origin'), '*')

r = await worker.fetch(new Request('https://w.dev/other/x', { method: 'GET' }), env)
eq('越界路径 403', r.status, 403)

r = await worker.fetch(new Request('https://w.dev/fe-interview-quiz/backup.json', { method: 'PUT', body: '{}', headers: { 'Content-Type': 'application/json' } }), env)
eq('PUT 透传状态', r.status, 200)
eq('转发到坚果云', seen.url, 'https://dav.jianguoyun.com/dav/fe-interview-quiz/backup.json')
eq('注入 Basic 凭据', seen.auth, 'Basic ' + btoa('a@b.com:app-pass'))

r = await worker.fetch(new Request('https://w.dev/fe-interview-quiz/backup.json'), {})
eq('缺凭据 500', r.status, 500)

console.log(fail === 0 ? 'worker 全部通过' : `${fail} 项失败`)
process.exit(fail ? 1 : 0)
