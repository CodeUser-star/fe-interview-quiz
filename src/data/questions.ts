import type { Question } from '../types'
import { codeBlock } from '../lib/md'

/**
 * 内置样张题库（阶段一验收用 40 题）
 * 基础 20：JS 6 / CSS 4 / Vue 4 / 浏览器 3 / 计网 3
 * 简答 10（八股）
 * 手撕 10：算法 6 / JS 手写 4
 */
export const SEED_QUESTIONS: Question[] = [
  // ============ JavaScript 6 ============
  {
    id: 'q-js-001',
    type: 'single',
    subject: 'js',
    difficulty: 1,
    tags: ['must-know', 'nowcoder-hot'],
    title: '`typeof null` 的结果是什么？',
    options: ["'null'", "'object'", "'undefined'", "'boolean'"],
    answer: [1],
    analysis:
      "历史遗留问题：JS 早期用低位标记类型，对象的标记是 `000`，而 `null` 的机器表示是全 0，于是被误判为 `object`。这个 bug 因为兼容性一直保留。\n\n判断 null 只能用 `value === null`；判断「是对象」要写 `value !== null && typeof value === 'object'`。",
  },
  {
    id: 'q-js-002',
    type: 'single',
    subject: 'js',
    difficulty: 2,
    tags: ['nowcoder-hot', 'must-know'],
    title: `以下代码的输出顺序是？\n\n${codeBlock(
      'js',
      `console.log('A')
setTimeout(() => console.log('B'), 0)
Promise.resolve().then(() => console.log('C'))
console.log('D')`,
    )}`,
    options: ['A D C B', 'A C D B', 'A D B C', 'A B C D'],
    answer: [0],
    analysis:
      '同步代码先跑完（A、D）→ 当前宏任务结束，清空微任务队列（C）→ 下一轮宏任务才执行 `setTimeout`（B）。\n\n关键点：微任务在每个宏任务结束后、浏览器渲染前被**一次性清空**，包括清空过程中新产生的微任务。',
  },
  {
    id: 'q-js-003',
    type: 'multi',
    subject: 'js',
    difficulty: 2,
    tags: ['must-know'],
    title: '以下哪些属于浅拷贝？',
    options: ['Object.assign({}, obj)', '[...arr]', 'structuredClone(obj)', '{ ...obj }'],
    answer: [0, 1, 3],
    analysis:
      '浅拷贝只复制第一层，嵌套的引用仍然共享。`Object.assign`、展开运算符、`Array.prototype.slice` 都是浅拷贝。\n\n`structuredClone` 是浏览器原生深拷贝，支持 Date / Map / Set / 循环引用，但遇到函数、Symbol、DOM 节点会直接抛错。',
  },
  {
    id: 'q-js-004',
    type: 'judge',
    subject: 'js',
    difficulty: 1,
    tags: ['must-know'],
    title: '用 const 声明的对象，其属性不能再被修改。',
    answer: false,
    analysis:
      '`const` 约束的是**绑定**不可重新赋值，不是值不可变。`const obj = { a: 1 }; obj.a = 2` 完全合法。\n\n要真正冻结需要 `Object.freeze(obj)`，且它是浅冻结；嵌套对象要递归冻结。',
  },
  {
    id: 'q-js-005',
    type: 'single',
    subject: 'js',
    difficulty: 2,
    tags: ['nowcoder-hot'],
    title: `下面代码打印什么？\n\n${codeBlock(
      'js',
      `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i))
}`,
    )}`,
    options: ['0 1 2', '3 3 3', 'undefined undefined undefined', '0 0 0'],
    answer: [1],
    analysis:
      '`var` 是函数作用域，循环结束时 `i` 已经是 3，三个回调共享同一个 `i`，且都在循环结束后才执行，所以输出 `3 3 3`。\n\n换成 `let` 会为每次迭代创建独立绑定，输出 `0 1 2`。也可以用 IIFE 或 `setTimeout(fn, 0, i)` 固化值。',
  },
  {
    id: 'q-js-006',
    type: 'single',
    subject: 'js',
    difficulty: 1,
    tags: ['must-know'],
    title: '箭头函数的 `this` 在什么时候确定？',
    options: [
      '定义时所在词法作用域的 this',
      '调用时由调用者决定',
      'new 时由实例决定',
      '总是指向 window',
    ],
    answer: [0],
    analysis:
      '箭头函数没有自己的 `this`、`arguments`、`prototype`，不能 `new`。它的 `this` 在定义时沿词法作用域向上查找，且 `call` / `apply` / `bind` 无法改变。\n\n所以「检测对象方法」这类场景不能用箭头函数，否则 `this` 会指向外层。',
  },

  // ============ CSS 4 ============
  {
    id: 'q-css-001',
    type: 'single',
    subject: 'css',
    difficulty: 2,
    tags: ['css-layout', 'must-know'],
    title: '`flex: 1` 展开后等价于？',
    options: [
      'flex-grow:1; flex-shrink:1; flex-basis:0%',
      'flex-grow:1; flex-shrink:0; flex-basis:auto',
      'flex-grow:1; flex-shrink:1; flex-basis:auto',
      'width:100%',
    ],
    answer: [0],
    analysis:
      '`flex` 是 `flex-grow / flex-shrink / flex-basis` 的简写。只写一个数字时，`flex-basis` 被设为 `0%`。\n\n`basis: 0%` + `grow: 1` 让各子项先归零再按比例分配剩余空间，这才是「等分」；若 `basis: auto`，会先按内容宽度占位再分配，宽窄不一。',
  },
  {
    id: 'q-css-002',
    type: 'single',
    subject: 'css',
    difficulty: 2,
    tags: ['css-layout'],
    title: '`#app .list li` 与 `.list .item.active` 哪个优先级更高？',
    options: ['#app .list li', '.list .item.active', '一样高', '取决于书写顺序'],
    answer: [0],
    analysis:
      '优先级按 (id, class/属性/伪类, 元素/伪元素) 三段比较：\n\n- `#app .list li` = (1, 1, 1)\n- `.list .item.active` = (0, 3, 0)\n\n先比 id 数量，后者为 0，所以前者胜出——class 再多也压不过一个 id。同权重时才看书写顺序，后写的覆盖先写的。',
  },
  {
    id: 'q-css-003',
    type: 'multi',
    subject: 'css',
    difficulty: 2,
    tags: ['css-layout'],
    title: '以下哪些**不会**创建新的 BFC？',
    options: ['display: block', 'overflow: visible', 'display: flow-root', 'position: fixed'],
    answer: [0, 1],
    analysis:
      'BFC 触发条件：`float` 非 none、`position` 为 absolute/fixed、`overflow` 非 visible、`display` 为 flow-root / inline-block / table-cell / flex / grid 等。\n\n`display:block` 和 `overflow:visible` 都是默认值，不触发。`flow-root` 是专为创建 BFC 设计的 display 值，无副作用，优于 `overflow:hidden`。',
  },
  {
    id: 'q-css-004',
    type: 'judge',
    subject: 'css',
    difficulty: 3,
    tags: ['css-layout'],
    title: '`position: fixed` 的元素，其包含块一定是浏览器视口。',
    answer: false,
    analysis:
      '只要祖先元素设置了 `transform` / `filter` / `perspective` / `will-change: transform` / `contain: paint`，该祖先就会成为 fixed 元素的包含块，导致「fixed 不相对视口」的经典 bug。\n\n排查思路：往上找有没有动画或 `will-change` 的容器。',
  },

  // ============ Vue 4 ============
  {
    id: 'q-vue-001',
    type: 'single',
    subject: 'vue',
    difficulty: 1,
    tags: ['vue-core', 'must-know'],
    title: '`v-if` 与 `v-show` 的核心区别是？',
    options: [
      'v-if 控制 DOM 是否存在，v-show 只切换 display',
      '两者都会销毁并重建组件实例',
      'v-show 支持 v-else',
      'v-if 不能作用于组件',
    ],
    answer: [0],
    analysis:
      '`v-if` 是真正的条件渲染，切换时销毁/重建组件、事件监听与子组件状态；`v-show` 始终渲染，只改 `display`。\n\n选型：频繁切换用 `v-show`（初始渲染开销大）；条件很少变为真用 `v-if`（切换开销大）。`v-else` 只能配 `v-if`。',
  },
  {
    id: 'q-vue-002',
    type: 'single',
    subject: 'vue',
    difficulty: 2,
    tags: ['vue-core', 'nowcoder-hot'],
    title:
      '`const { count } = reactive({ count: 0 })`，之后修改 `count`，视图会更新吗？',
    options: [
      '会，reactive 内部本来就是响应式的',
      '不会，解构出来的是普通值，已与代理断开',
      '会，但需要等 nextTick',
      '会，但必须用 toRef 包装一次',
    ],
    answer: [1],
    analysis:
      '解构的那一刻就把值「读」出来了，`count` 是个普通 number，与响应式对象再无关联。\n\n正确做法：用 `toRefs(state)` 解构得到 ref，或干脆不写解构、直接用 `state.count`。这是 Vue3 面试最高频的陷阱题。',
  },
  {
    id: 'q-vue-003',
    type: 'judge',
    subject: 'vue',
    difficulty: 2,
    tags: ['vue-core'],
    title: 'Vue3 的响应式基于 Proxy，因此 `arr[0] = 1` 与 `arr.length = 0` 都能触发更新。',
    answer: true,
    analysis:
      'Vue2 用 `defineProperty` 只能劫持已存在的属性，索引赋值和 `length` 修改都拦不到，只能靠 `$set` 与重写数组方法。\n\nVue3 用 Proxy 代理整个对象，新增属性、删除属性、索引赋值、`length` 都能追踪，所以不再需要 `$set`。注意 Proxy 只能代理对象，原始值要用 `ref` 包一层。',
  },
  {
    id: 'q-vue-004',
    type: 'single',
    subject: 'vue',
    difficulty: 2,
    tags: ['vue-core'],
    title: '父组件想调用子组件内部方法，`<script setup>` 下正确的做法是？',
    options: [
      '子组件用 defineExpose 暴露，父组件通过 ref 调用',
      '父组件 ref.value.method() 直接就能调到',
      '通过 $children 遍历查找',
      '通过 provide/inject 传函数',
    ],
    answer: [0],
    analysis:
      '`<script setup>` 默认是封闭的，组件实例不对外暴露任何内容，必须显式 `defineExpose({ reset })`。\n\n父组件 `const child = ref()` + `child.value.reset()`，且要确保子组件已挂载（`onMounted` 之后）。',
  },

  // ============ 浏览器 3 ============
  {
    id: 'q-browser-001',
    type: 'single',
    subject: 'browser',
    difficulty: 2,
    tags: ['browser-core'],
    title: '以下哪个响应头字段用于控制强缓存？',
    options: ['Cache-Control', 'ETag', 'Last-Modified', 'If-None-Match'],
    answer: [0],
    analysis:
      '强缓存命中时**不发起请求**，直接读本地副本，由 `Cache-Control`（`max-age` / `no-cache` / `no-store`）以及已过时的 `Expires` 控制。\n\n`ETag`、`Last-Modified` 是协商缓存的服务端标识；请求头带 `If-None-Match` / `If-Modified-Since` 去问，未变更返回 304。`no-cache` 是「可缓存但每次都要校验」，`no-store` 才是完全不缓存。',
  },
  {
    id: 'q-browser-002',
    type: 'multi',
    subject: 'browser',
    difficulty: 3,
    tags: ['browser-core'],
    title: '以下哪些操作会导致重排（reflow）？',
    options: ['修改元素 width', '修改元素 color', '修改 font-size', '读取 offsetHeight'],
    answer: [0, 2, 3],
    analysis:
      '重排要重新计算几何信息，代价远高于重绘。改 `color` 只触发重绘。\n\n读取 `offsetHeight` / `scrollTop` / `getComputedStyle` 会强制浏览器**立刻完成布局**来拿准确值（强制同步布局 / layout thrashing）。在循环里「读—写—读—写」混用是最典型的性能杀手，应批量读、批量写。动画优先用 `transform` / `opacity`，可走合成层不触发重排重绘。',
  },
  {
    id: 'q-browser-003',
    type: 'judge',
    subject: 'browser',
    difficulty: 3,
    tags: ['browser-core'],
    title: 'A 页面写入 localStorage 后，同源的 B 页面会收到 storage 事件，A 页面自身不会收到。',
    answer: true,
    analysis:
      '`storage` 事件只在**其他**同源窗口/标签页触发，用于多标签状态同步；可通过 `event.key` / `newValue` / `oldValue` 判断变化。\n\n注意：`sessionStorage` 不跨标签页；`storage` 事件不冒泡，只能在 window 上监听。',
  },

  // ============ 计网 3 ============
  {
    id: 'q-network-001',
    type: 'single',
    subject: 'network',
    difficulty: 1,
    tags: ['network-core', 'must-know'],
    title: 'HTTP 状态码 304 的含义是？',
    options: ['资源未修改，可直接使用本地缓存', '请求被永久重定向', '服务器内部错误', '请求需要身份认证'],
    answer: [0],
    analysis:
      '304 Not Modified 出现在协商缓存命中时：浏览器带 `If-None-Match` / `If-Modified-Since` 询问，服务端确认未变更，只返回响应头、不返回 body。\n\n对照记忆：301 永久重定向、302 临时重定向、401 未认证、403 禁止访问、500 服务端错误。',
  },
  {
    id: 'q-network-002',
    type: 'single',
    subject: 'network',
    difficulty: 2,
    tags: ['network-core', 'nowcoder-hot'],
    title: 'TCP 三次握手的核心目的是？',
    options: [
      '同步双方初始序列号，并确认彼此的收发能力都正常',
      '防止 SYN 洪泛攻击',
      '协商加密算法',
      '确认应用层协议版本',
    ],
    answer: [0],
    analysis:
      '两次握手只能确认「客户端 → 服务端」通，服务端无法确认自己发出的包能被收到，也无法让客户端确认自己的 ISN 已被接收；同时可避免历史重复连接请求造成的错误建连。\n\nSYN 洪泛要靠 SYN Cookie / 连接队列防护，加密协商在 TLS 层完成。',
  },
  {
    id: 'q-network-003',
    type: 'judge',
    subject: 'network',
    difficulty: 3,
    tags: ['network-core'],
    title: 'HTTP/1.1 默认开启持久连接（keep-alive），因此同一域名下的多个请求可以被真正并行处理。',
    answer: false,
    analysis:
      'keep-alive 只是**复用 TCP 连接**，HTTP/1.1 的请求仍然串行；pipelining 因队头阻塞默认关闭，浏览器基本不启用。\n\n真正的并行来自「每域名开多个连接」（约 6 个）或升级 HTTP/2 的多路复用：一条连接上并发多个 stream，消除了 HTTP 层队头阻塞，但仍有 TCP 层 HOL——这正是 HTTP/3 换 QUIC（UDP）的动机。',
  },

  // ============ 简答 10 ============
  {
    id: 'q-short-001',
    type: 'short',
    subject: 'js',
    difficulty: 2,
    tags: ['nowcoder-hot', 'must-know'],
    title: '讲讲 JavaScript 的事件循环（Event Loop），宏任务与微任务的执行顺序是怎样的？',
    points: [
      'JS 单线程 + 调用栈；任务队列由宿主环境（浏览器/Node）提供',
      '每轮循环：执行一个宏任务 → 清空全部微任务 → （可能需要）渲染 → 取下一个宏任务',
      '宏任务：整段 script、setTimeout/setInterval、I/O、UI 事件；微任务：Promise.then、queueMicrotask、MutationObserver、await 之后的代码',
      '微任务里再产生微任务会在本轮一并清空，可能饿死渲染；微任务先于 setTimeout 执行',
    ],
    followups: [
      'Promise 的 then 和 setTimeout 谁先执行？为什么？',
      'Vue 的 nextTick 为什么用微任务实现？',
      'requestAnimationFrame 属于宏任务还是微任务？',
    ],
    analysis:
      '`requestAnimationFrame` 既不是宏任务也不是微任务，它在渲染前的「动画回调」阶段执行，早于重绘。补充：Node 端有 timers → pending → poll → check → close 六个阶段，`process.nextTick` 的优先级高于 Promise 微任务。',
  },
  {
    id: 'q-short-002',
    type: 'short',
    subject: 'js',
    difficulty: 2,
    tags: ['must-know'],
    title: '什么是闭包？实际开发中有哪些使用场景，又可能带来什么问题？',
    points: [
      '函数与其词法环境的组合：内部函数持有外部作用域变量的引用，外部函数执行完后这些变量仍存活',
      '场景：防抖节流、柯里化、模块私有变量、memo 缓存、事件回调中保持状态',
      '副作用：被引用的变量无法回收，绑定大对象或 DOM 时容易泄漏；var 循环变量共享的经典坑',
      '排查：Chrome Memory 快照对比、避免在闭包里持有不必要的大对象、用完及时置 null',
    ],
    followups: [
      '闭包一定会造成内存泄漏吗？',
      'for 循环里把 var 换成 let 为什么能解决问题？',
      'V8 对闭包做过哪些优化？',
    ],
    analysis:
      '闭包本身不是内存泄漏，泄漏发生在「已经不再需要的引用仍被持有」。V8 会做上下文优化：未被内部函数引用的外层变量不会被保留。',
  },
  {
    id: 'q-short-003',
    type: 'short',
    subject: 'vue',
    difficulty: 3,
    tags: ['vue-core', 'nowcoder-hot'],
    title: 'Vue3 的响应式原理是什么？ref 与 reactive 有什么区别？',
    points: [
      'reactive 用 Proxy 代理对象：get 时 track 收集依赖，set 时 trigger 触发更新',
      '副作用通过 effect 包装，组件渲染函数就是一个 effect，配合 scheduler 进微任务队列批量更新',
      'ref 用 RefImpl 包装 value，靠 get value / set value 的 getter/setter 实现，可以包装原始值；模板中自动解包，JS 里要 .value',
      'reactive 只对对象有效，解构会丢响应式（需 toRefs）；ref 解构后仍是 ref，不会丢',
    ],
    followups: [
      '为什么 reactive 解构会失去响应式？',
      'shallowRef / markRaw 用在什么场景？',
      'Vue3 为什么不再需要 $set？',
    ],
    analysis:
      'Vue 3.4 之后重构了响应式实现（依赖改为双向链表 + 版本计数，减少内存与重算），但对外模型不变。回答时把「依赖收集—触发更新—调度」这条链路讲清楚，比背 API 更能得分。',
  },
  {
    id: 'q-short-004',
    type: 'short',
    subject: 'vue',
    difficulty: 2,
    tags: ['vue-core'],
    title: 'computed 和 watch 的区别？分别适用于什么场景？',
    points: [
      'computed 是「派生状态」：有缓存，依赖不变不重算，必须同步返回值，适合模板中的组合计算',
      'watch 是「副作用」：无缓存，可异步、可执行副作用（发请求、打点、操作 DOM），支持 deep / immediate',
      '实现上：computed 内部也是 effect，用 dirty 标记控制缓存；watch 基于 effect + scheduler',
      '反模式：用 watch 去同步一个本可以由其他状态推导出来的值，会让数据流变成环形',
    ],
    followups: [
      'computed 的缓存是怎么实现的？',
      'watch 和 watchEffect 的区别？',
      'computed 里做异步请求会有什么问题？',
    ],
    analysis:
      '一句话区分：computed 关心「结果」，watch 关心「动作」。能用 computed 表达的，不要用 watch 去手工同步。',
  },
  {
    id: 'q-short-005',
    type: 'short',
    subject: 'browser',
    difficulty: 3,
    tags: ['browser-core', 'nowcoder-hot'],
    title: '从输入 URL 到页面展示，中间发生了什么？',
    points: [
      'URL 解析 → 查缓存（强缓存命中直接返回）→ DNS 解析 → TCP 握手（HTTPS 再加 TLS 握手）',
      '发送 HTTP 请求，服务端返回 HTML；解析 HTML 构建 DOM，遇到 CSS 构建 CSSOM，遇到同步 script 会阻塞解析',
      'DOM + CSSOM → Render Tree → 布局 Layout → 分层 → 绘制 Paint → 合成 Composite',
      '可优化点：关键渲染路径、preload / preconnect、defer / async、SSR 或流式渲染',
    ],
    followups: [
      '哪些资源会阻塞渲染？',
      'DOMContentLoaded 和 load 的区别？',
      '为什么 CSS 放 head、JS 放 body 末尾？',
    ],
    analysis:
      '按「网络 → 解析 → 渲染」三段讲，每段补 1-2 个可优化点，比平铺直叙更容易拿分。',
  },
  {
    id: 'q-short-006',
    type: 'short',
    subject: 'browser',
    difficulty: 2,
    tags: ['browser-core'],
    title: '浏览器缓存机制是怎样的？强缓存与协商缓存如何配合？',
    points: [
      '强缓存：Cache-Control（max-age / no-cache / no-store）、Expires；命中不发请求',
      '协商缓存：ETag ↔ If-None-Match、Last-Modified ↔ If-Modified-Since；未变更返回 304',
      '优先级：Cache-Control > Expires；ETag > Last-Modified（时间精度只到秒，且文件内容可能秒内变更）',
      '实践：HTML 用 no-cache 每次校验；JS/CSS 文件名带 hash + max-age=31536000, immutable',
    ],
    followups: [
      'no-cache 和 no-store 的区别？',
      '有了 Last-Modified 为什么还要 ETag？',
      'F5 刷新和 Ctrl+F5 强制刷新分别走哪层缓存？',
    ],
    analysis:
      '核心组合拳是「文件名带 hash + 长缓存」：内容变则文件名变，天然绕过缓存失效问题。',
  },
  {
    id: 'q-short-007',
    type: 'short',
    subject: 'network',
    difficulty: 3,
    tags: ['network-core'],
    title: 'HTTP/1.1、HTTP/2、HTTP/3 的主要差异是什么？',
    points: [
      '1.1：持久连接 + 串行请求，存在队头阻塞；文本协议；每域名多用几个连接',
      '2：二进制分帧、多路复用（stream）、头部压缩 HPACK、服务端推送（已废弃）；解决 HTTP 层 HOL',
      '3：基于 QUIC（UDP），多路复用下沉到传输层，解决 TCP 层 HOL；0-RTT 建连、连接迁移',
      '取舍：QUIC 在弱网/移动端收益明显，但 UDP 在部分网络可能被限速或阻断',
    ],
    followups: [
      'HTTP/2 解决了队头阻塞吗？为什么 HTTP/3 还要换 UDP？',
      '同一条 TCP 连接上一个包丢了会怎样？',
      '0-RTT 有什么安全隐患？',
    ],
    analysis: '分层回答：协议格式 → 并发模型 → 建连与拥塞成本。三层讲完即可收，不必展开 QUIC 细节。',
  },
  {
    id: 'q-short-008',
    type: 'short',
    subject: 'js',
    difficulty: 2,
    tags: ['must-know'],
    title: '讲讲原型链与 ES6 class 的继承。',
    points: [
      '每个对象有 [[Prototype]]（__proto__），每个函数有 prototype；实例.__proto__ === 构造函数.prototype',
      '属性查找沿原型链向上，直到 null 为止',
      'class 是语法糖：extends 同时设置 Child.prototype.__proto__ = Parent.prototype 与 Child.__proto__ = Parent',
      'class 不提升（存在 TDZ）、必须用 new 调用、内部默认严格模式；super 必须在 this 之前调用',
    ],
    followups: ['instanceof 的判断依据是什么？', 'new 的过程做了什么？', '手写一个继承会怎么写？'],
    analysis:
      'new 四步：创建空对象 → 链接原型（obj.__proto__ = Fn.prototype）→ 执行构造函数并绑定 this → 若返回对象则用返回值，否则返回新对象。',
  },
  {
    id: 'q-short-009',
    type: 'short',
    subject: 'css',
    difficulty: 2,
    tags: ['css-layout'],
    title: '什么是 BFC？它能解决哪些问题？',
    points: [
      '块级格式化上下文：内部布局与外部完全隔离的独立渲染区域',
      '触发：float≠none、position 为 absolute/fixed、overflow≠visible、display 为 flow-root / inline-block / flex / grid / table-cell',
      '解决：清除浮动（父元素高度塌陷）、阻止相邻元素 margin 折叠、阻止被浮动元素覆盖（两栏自适应）',
      'flow-root 是专为创建 BFC 设计的 display 值，没有 overflow:hidden 的裁剪副作用',
    ],
    followups: ['margin 折叠的规则是什么？', '为什么 overflow:hidden 能清除浮动？有什么副作用？'],
    analysis: '回答时把「触发条件」和「解决什么问题」分开讲，不要背成一坨。',
  },
  {
    id: 'q-short-010',
    type: 'short',
    subject: 'js',
    difficulty: 3,
    tags: ['project'],
    title: '一个页面首屏加载很慢，你会从哪些方面排查和优化？',
    points: [
      '先度量：Lighthouse / Performance 面板看 FCP、LCP、TBT、CLS，判断瓶颈在资源、网络还是主线程',
      '资源层：按需引入 + tree-shaking、图片 WebP/AVIF + 响应式尺寸、字体子集化、gzip/brotli、CDN',
      '网络层：HTTP/2 多路复用、preconnect、preload 关键资源、非关键资源懒加载',
      '渲染层：SSR / 预渲染、首屏骨架、关键 CSS 内联、避免布局抖动',
      'JS 层：拆分 chunk、延后非关键脚本、拆解主线程长任务',
    ],
    followups: [
      'LCP 的判定标准是什么？',
      'preload 和 prefetch 的区别？',
      '图片懒加载会不会反而伤害 LCP？',
    ],
    analysis:
      '关键是讲成闭环：先度量定位 → 针对性优化 → 回到指标验证。只罗列手段容易被追问「你怎么知道是这个原因」。',
  },

  // ============ 手撕 · 算法 6 ============
  {
    id: 'q-code-001',
    type: 'code',
    subject: 'algo',
    difficulty: 1,
    tags: ['lc-hot100', 'must-know'],
    title: '两数之和：给定整数数组 `nums` 和整数目标值 `target`，返回和为 `target` 的两个数的下标。',
    approach:
      '暴力双循环是 O(n²)。用哈希表把「找 target - x」降为 O(1)：一次遍历，先查表再存自己，避免同一个元素被用两次。',
    analysis: `${codeBlock(
      'js',
      `function twoSum(nums, target) {
  // 哈希表：值 -> 下标，把「找搭档」从遍历降为 O(1)
  const seen = new Map()
  for (let i = 0; i < nums.length; i++) {
    // 当前元素还差多少才凑出 target
    const need = target - nums[i]
    // 先查表再写入，否则同一个下标可能跟自己配对
    if (seen.has(need)) return [seen.get(need), i]
    seen.set(nums[i], i)
  }
  return []
}`,
    )}\n\n面试加分点：说明「先查再存」保证不会返回 \`[i, i]\`；如果要求返回所有组合，则改成存下标数组。`,
    complexity: '时间 O(n) / 空间 O(n)',
    link: 'https://leetcode.cn/problems/two-sum/',
  },
  {
    id: 'q-code-002',
    type: 'code',
    subject: 'algo',
    difficulty: 1,
    tags: ['lc-hot100'],
    title: '反转链表：给你单链表的头节点 `head`，返回反转后的链表。',
    approach:
      '三指针迭代：prev 指向已反转部分的头，cur 为当前节点，每次先把 next 存下来再改指针。递归写法也可，但会占 O(n) 栈空间。',
    analysis: `${codeBlock(
      'js',
      `function reverseList(head) {
  let prev = null // 已反转部分的头节点
  let cur = head
  while (cur) {
    // 三指针：先存后继，否则改完指针就断链、找不到后面的节点
    const next = cur.next
    cur.next = prev // 让当前节点反向指回 prev
    // prev 与 cur 同步前移一位
    prev = cur
    cur = next
  }
  // 循环结束时 cur 为 null，prev 就是新链表的头
  return prev
}`,
    )}\n\n易错点：循环里必须先保存 \`cur.next\`，否则改完指针就找不到后续节点了。`,
    complexity: '时间 O(n) / 空间 O(1)',
    link: 'https://leetcode.cn/problems/reverse-linked-list/',
  },
  {
    id: 'q-code-003',
    type: 'code',
    subject: 'algo',
    difficulty: 1,
    tags: ['lc-hot100', 'nowcoder-hot'],
    title: '有效的括号：给定只包含 `()[]{}` 的字符串 `s`，判断括号是否有效闭合。',
    approach:
      '用栈匹配：左括号入栈，右括号则与栈顶比对。两个边界要处理——栈空时遇到右括号、遍历结束后栈非空。',
    analysis: `${codeBlock(
      'js',
      `function isValid(s) {
  const stack = []
  // 右括号 -> 它期望匹配的左括号
  const pairs = { ')': '(', ']': '[', '}': '{' }
  for (const ch of s) {
    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push(ch) // 左括号入栈，等待配对
    } else if (stack.pop() !== pairs[ch]) {
      // 栈空时 pop() 返回 undefined，与期望的左括号不等，
      // 顺带处理了「右括号多余」这种非法情况
      return false
    }
  }
  // 栈里还有剩，说明左括号没闭合
  return stack.length === 0
}`,
    )}\n\n技巧：\`stack.pop()\` 在空栈时返回 \`undefined\`，与 \`'('\` 不等，天然覆盖了「栈空遇右括号」的情况。`,
    complexity: '时间 O(n) / 空间 O(n)',
    link: 'https://leetcode.cn/problems/valid-parentheses/',
  },
  {
    id: 'q-code-004',
    type: 'code',
    subject: 'algo',
    difficulty: 3,
    tags: ['lc-hot100', 'bytedance-r1'],
    title: '无重复字符的最长子串：给定字符串 `s`，找出不含重复字符的最长子串的长度。',
    approach:
      '滑动窗口 + 哈希记录每个字符最后出现的位置。右指针扩张，遇到重复字符时把左指针跳到「上次出现位置 + 1」，注意左指针只能右移。',
    analysis: `${codeBlock(
      'js',
      `function lengthOfLongestSubstring(s) {
  const last = new Map() // 字符 -> 最后一次出现的下标
  let left = 0 // 窗口左边界
  let max = 0
  for (let right = 0; right < s.length; right++) {
    const ch = s[right]
    // 只有「上次出现的位置还在窗口内」才需要收缩；
    // last.get(ch) >= left 这个判断不能省，否则左边界会被
    // 已经滑出窗口的旧位置往回拉，窗口就失效了
    if (last.has(ch) && last.get(ch) >= left) {
      left = last.get(ch) + 1
    }
    last.set(ch, right) // 更新该字符的最新位置
    max = Math.max(max, right - left + 1) // 窗口长度 = 右 - 左 + 1
  }
  return max
}`,
    )}\n\n坑点：\`last.get(ch) >= left\` 这个判断不能省，否则左指针会被已经滑出窗口的旧位置往回拉。`,
    complexity: '时间 O(n) / 空间 O(min(n, 字符集大小))',
    link: 'https://leetcode.cn/problems/longest-substring-without-repeating-characters/',
  },
  {
    id: 'q-code-005',
    type: 'code',
    subject: 'algo',
    difficulty: 2,
    tags: ['lc-hot100', 'bytedance-r1'],
    title: '二叉树的层序遍历：返回其节点值的逐层遍历结果（二维数组）。',
    approach:
      'BFS：每轮先固定当前层的节点个数，再一次性出队这一层的全部节点并把子节点入队。用「下一层数组」写法比记录 size 更直观。',
    analysis: `${codeBlock(
      'js',
      `function levelOrder(root) {
  if (!root) return []
  const res = []
  let queue = [root] // 当前这一层的节点
  while (queue.length) {
    const level = [] // 收集当前层的值
    const next = [] // 收集下一层的节点
    for (const node of queue) {
      level.push(node.val)
      if (node.left) next.push(node.left)
      if (node.right) next.push(node.right)
    }
    res.push(level)
    // 整层处理完再整体换层，天然就是「按层输出」
    queue = next
  }
  return res
}`,
    )}\n\n变体：锯齿形遍历只需在奇数层对 level 做 reverse；右视图取每层最后一个。`,
    complexity: '时间 O(n) / 空间 O(n)',
    link: 'https://leetcode.cn/problems/binary-tree-level-order-traversal/',
  },
  {
    id: 'q-code-006',
    type: 'code',
    subject: 'algo',
    difficulty: 3,
    tags: ['nowcoder-hot'],
    title: '快速排序：手写快排，对数组原地升序排序。',
    approach:
      '选基准 → 双指针分区（小的往左、大的往右）→ 递归左右两段。基准取中间值可缓解近乎有序数组的退化。',
    analysis: `${codeBlock(
      'js',
      `function quickSort(arr, left = 0, right = arr.length - 1) {
  if (left >= right) return arr // 区间长度 <= 1，已经有序
  // 取中间元素作基准，避免近乎有序的数组退化成 O(n^2)
  const pivot = arr[(left + right) >> 1]
  let i = left
  let j = right
  while (i <= j) {
    // 内层判断必须是严格不等：写成 <= 会让等于 pivot 的元素互相卡住
    while (arr[i] < pivot) i++
    while (arr[j] > pivot) j--
    if (i <= j) {
      // 左边找到大的、右边找到小的，交换后两侧指针各走一步
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      i++
      j--
    }
  }
  // 此时 [left, j] 都 <= pivot，[i, right] 都 >= pivot
  quickSort(arr, left, j)
  quickSort(arr, i, right)
  return arr
}`,
    )}\n\n易错点：内层两个 while 不能用 \`<=\`，否则遇到与 pivot 相等的元素会死循环；递归边界要传 \`j\` 和 \`i\`，不是 \`pivotIndex ± 1\`。`,
    complexity: '平均 O(n log n)，最坏 O(n²)（已排序且取端点作基准）；空间 O(log n) 递归栈',
  },

  // ============ 手撕 · JS 手写 4 ============
  {
    id: 'q-code-007',
    type: 'code',
    subject: 'js',
    difficulty: 1,
    tags: ['js-handwrite', 'nowcoder-hot'],
    title: '手写防抖 `debounce(fn, wait, immediate)`：连续触发时只在停止后 wait 毫秒执行一次。',
    approach:
      '每次触发先清掉上一个定时器再重设。`immediate` 为 true 时先立即执行一次，之后进入冷却期。返回的函数要能取消防抖（`cancel`）。',
    analysis: `${codeBlock(
      'js',
      `function debounce(fn, wait = 300, immediate = false) {
  let timer = null // 冷却中的定时器句柄
  function debounced(...args) {
    // 每次触发都清掉上一轮，重新开始计时
    if (timer) clearTimeout(timer)
    // 立即执行模式：本轮冷却刚开始时先跑一次
    if (immediate && !timer) fn.apply(this, args)
    timer = setTimeout(() => {
      timer = null // 冷却结束，允许下一轮立即执行
      // 非立即模式：停止触发 wait 毫秒后才执行
      if (!immediate) fn.apply(this, args)
    }, wait)
  }
  // 组件卸载时调用，避免定时器残留
  debounced.cancel = () => {
    clearTimeout(timer)
    timer = null
  }
  return debounced
}`,
    )}\n\n追问点：\`apply(this, args)\` 保证 this 指向调用者；组件卸载时必须 \`cancel\`，否则定时器泄漏。`,
    complexity: '时间 O(1) / 空间 O(1)',
  },
  {
    id: 'q-code-008',
    type: 'code',
    subject: 'js',
    difficulty: 2,
    tags: ['js-handwrite'],
    title: '手写节流 `throttle(fn, wait)`：限制单位时间内最多执行一次（首尾都触发）。',
    approach:
      '记录上次执行时间，用「剩余等待时间」判断：已到点就直接执行；未到点且没有排队的定时器，就排一个定时器在剩余时间后补执行一次（trailing）。',
    analysis: `${codeBlock(
      'js',
      `function throttle(fn, wait = 300) {
  let last = 0 // 上次真正执行的时间
  let timer = null
  return function throttled(...args) {
    const now = Date.now()
    // 距离下次可以执行还差多少毫秒，<= 0 表示冷却已结束
    const remaining = wait - (now - last)
    if (remaining <= 0) {
      // 冷却结束：立即执行并重置计时
      last = now
      fn.apply(this, args)
    } else if (!timer) {
      // 冷却中：只排一个「补执行」，保证最后一次调用不被丢掉（trailing）
      timer = setTimeout(() => {
        last = Date.now()
        timer = null
        fn.apply(this, args)
      }, remaining)
    }
  }
}`,
    )}\n\n防抖 vs 节流：防抖「只认最后一次」，节流「固定频率执行」。搜索联想用防抖，滚动/resize 用节流。`,
    complexity: '时间 O(1) / 空间 O(1)',
  },
  {
    id: 'q-code-009',
    type: 'code',
    subject: 'js',
    difficulty: 3,
    tags: ['js-handwrite', 'bytedance-r1'],
    title: '手写 `Promise.all`：全部成功则按顺序返回结果数组，任一失败立即 reject。',
    approach:
      '用一个计数器记录完成数量，按索引写入结果数组保证顺序。空数组要立即 resolve；非 Promise 值用 `Promise.resolve` 包一层，同时兼容 thenable。',
    analysis: `${codeBlock(
      'js',
      `function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable) // 兼容 Set / 生成器等可迭代对象
    const results = new Array(items.length) // 按下标写入，保证输出顺序 = 输入顺序
    let count = 0
    if (items.length === 0) return resolve(results) // 空数组直接成功
    items.forEach((item, i) => {
      // 非 Promise 值先包一层，同时兼容 thenable
      Promise.resolve(item).then((value) => {
        results[i] = value
        // 全部完成才 resolve；不能用 push，完成顺序不等于输入顺序
        if (++count === items.length) resolve(results)
      }, reject) // 任何一个失败就整体失败，不再等其余任务
    })
  })
}`,
    )}\n\n追问点：\`Promise.allSettled\` 的区别是什么（不会短路）；为什么结果数组不能用 \`push\`（完成顺序不等于输入顺序）。`,
    complexity: '时间 O(n) / 空间 O(n)',
  },
  {
    id: 'q-code-010',
    type: 'code',
    subject: 'js',
    difficulty: 3,
    tags: ['js-handwrite', 'tencent-r1'],
    title: '手写深拷贝 `deepClone`，要求支持 Date / RegExp / Map / Set 与循环引用。',
    approach:
      '递归 + WeakMap 记录已拷贝对象来处理循环引用。先处理原始值与特殊内置类型，再按原型创建空壳，最后遍历自有属性（含 Symbol）。',
    analysis: `${codeBlock(
      'js',
      `function deepClone(value, map = new WeakMap()) {
  // 原始值直接返回；函数按引用共享，不做复制
  if (value === null || typeof value !== 'object') return value
  // 循环引用：命中缓存就返回同一个副本，避免无限递归
  if (map.has(value)) return map.get(value)

  // 内置类型要单独构造，否则会退化成空对象
  if (value instanceof Date) return new Date(value)
  if (value instanceof RegExp) return new RegExp(value.source, value.flags)

  if (value instanceof Map) {
    const copy = new Map()
    map.set(value, copy) // 先登记再递归，才能处理自引用
    value.forEach((v, k) => copy.set(deepClone(k, map), deepClone(v, map)))
    return copy
  }
  if (value instanceof Set) {
    const copy = new Set()
    map.set(value, copy)
    value.forEach((v) => copy.add(deepClone(v, map)))
    return copy
  }

  // 保留原型，class 实例不会退化成普通对象
  const copy = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value))
  map.set(value, copy)
  // Reflect.ownKeys 能取到 Symbol 键与非枚举属性
  for (const key of Reflect.ownKeys(value)) {
    copy[key] = deepClone(value[key], map)
  }
  return copy
}`,
    )}\n\n为什么用 WeakMap：不阻止垃圾回收；为什么用 \`Reflect.ownKeys\`：可以带上 Symbol 键与非枚举属性。生产环境优先用 \`structuredClone\`。`,
    complexity: '时间 O(n) / 空间 O(n)',
  },
]
