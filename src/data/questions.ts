import type { Question } from '../types'
import { codeBlock } from '../lib/md'

/**
 * 内置题库（120 题）
 * 基础 70：JS 18 / CSS 12 / Vue 14 / 浏览器 10 / 计网 10 / OS 3 / DB 3
 * 简答 30（八股）
 * 手撕 20：算法 12 / JS 手写 8
 */
export const SEED_QUESTIONS: Question[] = [
  // ============ JavaScript 18 ============
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

  // ---- JS 补题 12 ----
  {
    id: 'q-js-007',
    type: 'single',
    subject: 'js',
    difficulty: 1,
    tags: ['must-know', 'nowcoder-hot'],
    title: '`[1, 2, 3].map(parseInt)` 的结果是？',
    options: ['[1, 2, 3]', '[1, NaN, NaN]', '[1, NaN, 3]', '抛出 TypeError'],
    answer: [1],
    analysis:
      '`map` 会把 `(元素, 下标, 数组)` 原样传给回调，而 `parseInt(str, radix)` 恰好只接收前两个参数，于是第二项的下标被当成了进制：\n\n- `parseInt(1, 0)` → 1（radix 为 0 时按十进制处理）\n- `parseInt(2, 1)` → NaN（1 不是合法进制）\n- `parseInt(3, 2)` → NaN（3 不是合法的二进制数字）\n\n正确写法是 `.map((v) => parseInt(v, 10))`，或者直接用 `.map(Number)`。',
  },
  {
    id: 'q-js-008',
    type: 'single',
    subject: 'js',
    difficulty: 1,
    tags: ['must-know'],
    title: '关于 `let`、`const` 与 `var`，下列说法正确的是？',
    options: [
      '`let` 声明的变量不存在变量提升',
      '全局作用域下 `var` 声明的变量会成为 window 的属性，`let` 不会',
      '`const` 声明的对象，其属性也不能再修改',
      '三者的区别只在于作用域写法，运行时行为完全一致',
    ],
    answer: [1],
    analysis:
      '`let`/`const` 同样会提升，但会进入**暂时性死区**（TDZ），声明前访问直接抛 `ReferenceError`——这常被误认为「没有提升」。\n\n三者真正的差别：\n\n- 作用域：`var` 是函数作用域，`let`/`const` 是块级作用域\n- 全局声明：`var` 会成为 `window` 属性，`let`/`const` 存在脚本作用域里\n- `const` 约束的是**绑定不可重新赋值**，对象内容照样能改（要冻结用 `Object.freeze`）',
  },
  {
    id: 'q-js-009',
    type: 'single',
    subject: 'js',
    difficulty: 2,
    tags: ['nowcoder-hot', 'must-know'],
    title: `严格模式下，下面代码输出什么？\n\n${codeBlock(
      'js',
      `'use strict'
const obj = { name: 'obj', fn() { return this?.name } }
const f = obj.fn
console.log(obj.fn(), f())`,
    )}`,
    options: ['obj undefined', 'obj obj', 'obj null', '抛出 TypeError'],
    answer: [0],
    analysis:
      '`this` 的指向在**调用时**决定，跟函数定义在哪无关：\n\n- `obj.fn()` 是方法调用，`this` 指向 `obj`，得到 `obj`\n- `f()` 是普通函数调用，严格模式下 `this` 为 `undefined`，`this?.name` 短路得到 `undefined`\n\n非严格模式里普通调用的 `this` 会被替换成全局对象，这正是不推荐隐式 this 的原因。',
  },
  {
    id: 'q-js-010',
    type: 'multi',
    subject: 'js',
    difficulty: 1,
    tags: ['must-know'],
    title: '以下哪些值放在 `if` 判断中会被当作 `false`？',
    options: ['0', "''", '[]', 'null', "'0'"],
    answer: [0, 1, 3],
    analysis:
      'JS 的假值只有 8 个：`false`、`0`、`-0`、`0n`、`""`、`null`、`undefined`、`NaN`。\n\n`[]` 是对象，对象恒为真；字符串 `"0"` 非空，同样为真——这两项是面试中最常设的坑。',
  },
  {
    id: 'q-js-011',
    type: 'judge',
    subject: 'js',
    difficulty: 2,
    tags: ['must-know'],
    title: '`0.1 + 0.2 === 0.3` 的结果是 `true`。',
    answer: false,
    analysis:
      '实际结果是 `0.30000000000000004`。原因是 IEEE 754 双精度浮点用二进制表示小数，0.1 与 0.2 都无法精确表示，相加后误差被放大。\n\n判断浮点相等要写成 `Math.abs(a - b) < Number.EPSILON`；涉及金额的场景直接用以分为单位的整数运算。',
  },
  {
    id: 'q-js-012',
    type: 'single',
    subject: 'js',
    difficulty: 2,
    tags: ['must-know', 'nowcoder-hot'],
    title: `以下代码中，\`p.__proto__\` 指向谁？\n\n${codeBlock(
      'js',
      `function Person(name) { this.name = name }
const p = new Person('Tom')`,
    )}`,
    options: ['Person', 'Person.prototype', 'Object.prototype', 'Function.prototype'],
    answer: [1],
    analysis:
      '`new` 会把实例的内部原型指针指向构造函数的 `prototype`，所以 `p.__proto__ === Person.prototype`。\n\n顺带记住两条链：`Person.prototype.__proto__` 才是 `Object.prototype`；而 `Person.__proto__` 指向 `Function.prototype`（构造函数本身也是函数）。规范写法是 `Object.getPrototypeOf(p)`。',
  },
  {
    id: 'q-js-013',
    type: 'single',
    subject: 'js',
    difficulty: 2,
    tags: ['browser-core'],
    title: '`el.addEventListener("click", fn, true)` 第三个参数 `true` 表示？',
    options: ['只触发一次', '在捕获阶段触发', '阻止默认行为', '改为被动监听'],
    answer: [1],
    analysis:
      '第三个参数 `true` 等价于 `{ capture: true }`，让回调在**捕获阶段**（由外向内）执行；默认 `false` 是冒泡阶段（由内向外）。\n\n只触发一次用 `{ once: true }`，滚动性能优化用 `{ passive: true }`。阻止冒泡是 `event.stopPropagation()`，与这个参数无关。',
  },
  {
    id: 'q-js-014',
    type: 'multi',
    subject: 'js',
    difficulty: 2,
    tags: ['must-know'],
    title: '以下哪些数组方法**不会**改变原数组？',
    options: ['push', 'slice', 'splice', 'concat'],
    answer: [1, 3],
    analysis:
      '会原地修改的有：`push`/`pop`/`shift`/`unshift`/`splice`/`sort`/`reverse`/`fill`。\n\n返回新数组的有：`slice`/`concat`/`map`/`filter`/`flat`。\n\n`splice` 最容易记混——名字只和 `slice` 差一个字母，但它既删又插，改的是原数组。',
  },
  {
    id: 'q-js-015',
    type: 'single',
    subject: 'js',
    difficulty: 3,
    tags: ['nowcoder-hot', 'must-know'],
    title: `下面代码输出什么？\n\n${codeBlock(
      'js',
      `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i))
}`,
    )}`,
    options: ['0 1 2', '3 3 3', '0 0 0', 'undefined undefined undefined'],
    answer: [1],
    analysis:
      '`var` 是函数作用域，三个箭头函数共享同一个 `i`。循环是同步跑完的，等定时器回调执行时 `i` 已经是 3。\n\n三种改法：\n\n1. 改成 `let`——每轮迭代创建独立绑定，输出 `0 1 2`\n2. 用 IIFE 把 `i` 作为参数传进去\n3. 用 `setTimeout(fn, 0, i)` 把值当参数传',
  },
  {
    id: 'q-js-016',
    type: 'single',
    subject: 'js',
    difficulty: 2,
    tags: ['must-know'],
    title: '关于 `new Foo()` 的执行过程，正确的顺序是？',
    options: [
      '先执行构造函数，再把实例的原型指向 `Foo.prototype`',
      '先创建空对象并把它的原型指向 `Foo.prototype`，再以它为 `this` 执行构造函数',
      '直接把 `Foo.prototype` 复制一份作为实例返回',
      '先调用 `Foo()`，再判断返回值是否为对象',
    ],
    answer: [1],
    analysis:
      '标准四步：\n\n1. 创建一个空对象\n2. 把它的 `[[Prototype]]` 指向 `Foo.prototype`\n3. 以该对象为 `this` 执行构造函数\n4. 构造函数返回的是对象就用它，否则返回第 1 步创建的对象\n\n第 4 步是很多人漏掉的细节——返回原始值会被忽略。',
  },
  {
    id: 'q-js-017',
    type: 'judge',
    subject: 'js',
    difficulty: 1,
    tags: ['must-know'],
    title: '`typeof [] === "array"` 的结果是 `true`。',
    answer: false,
    analysis:
      '`typeof` 对数组返回 `"object"`——它只能区分到「对象」这一层，无法识别具体类型。\n\n判断数组用 `Array.isArray()`；要更细地区分类型可以用 `Object.prototype.toString.call(v)`，返回 `[object Array]`。',
  },
  {
    id: 'q-js-018',
    type: 'single',
    subject: 'js',
    difficulty: 2,
    tags: ['must-know'],
    title: '`const a = 0` 时，`a || 10` 与 `a ?? 10` 的结果分别是？',
    options: ['10 10', '0 0', '10 0', '0 10'],
    answer: [2],
    analysis:
      '`||` 判断的是**真值**，`0` 是假值，所以取右边的 10；`??` 只在左侧为 `null` 或 `undefined` 时才兜底，`0` 被原样保留。\n\n所以处理「允许为 0 的数值配置」时必须用 `??`，否则用户填 0 会被默认值覆盖。',
  },

  // ============ CSS 12 ============
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

  // ---- CSS 补题 8 ----
  {
    id: 'q-css-005',
    type: 'single',
    subject: 'css',
    difficulty: 1,
    tags: ['css-layout', 'must-know'],
    title: '设置 `box-sizing: border-box` 后，`width: 200px` 表示的是？',
    options: [
      '内容区宽度为 200px',
      '内容 + padding + border 的合计宽度为 200px',
      '包含 margin 在内的总宽度为 200px',
      '仅 border 内的可绘制区域为 200px',
    ],
    answer: [1],
    analysis:
      '默认的 `content-box` 下，`width` 只指内容区，实际占位要再加上 padding 与 border，布局时经常算错。\n\n`border-box` 把 padding 和 border 算进 `width`，写「这列固定 200px」时所见即所得，所以几乎每个项目都会全局重置 `* { box-sizing: border-box }`。两种模式都**不包含 margin**。',
  },
  {
    id: 'q-css-006',
    type: 'single',
    subject: 'css',
    difficulty: 1,
    tags: ['css-layout', 'must-know'],
    title: '用 Flex 让子元素在容器内水平垂直居中，正确的写法是？',
    options: [
      'justify-content: center; align-items: center',
      'align-content: center; justify-items: center',
      'text-align: center; vertical-align: middle',
      'place-self: center',
    ],
    answer: [0],
    analysis:
      'Flex 里主轴方向的对齐用 `justify-content`，交叉轴用 `align-items`，两条都设 `center` 即可居中。\n\n常见混淆点：`align-content` 只在**多行**（`flex-wrap: wrap`）时才生效；`justify-items` 属于 Grid；`vertical-align` 只对行内元素或表格单元格有效。',
  },
  {
    id: 'q-css-007',
    type: 'multi',
    subject: 'css',
    difficulty: 2,
    tags: ['must-know'],
    title: '以下哪些 CSS 属性默认会被子元素**继承**？',
    options: ['color', 'font-size', 'margin', 'line-height'],
    answer: [0, 1, 3],
    analysis:
      '默认继承的大多是**文本相关**属性：`color`、`font-*`、`line-height`、`text-align`、`letter-spacing`、`visibility`、`cursor`。\n\n不继承的是**盒模型相关**属性：`margin`、`padding`、`border`、`width`、`height`、`background`。想强制继承可以显式写 `margin: inherit`。',
  },
  {
    id: 'q-css-008',
    type: 'single',
    subject: 'css',
    difficulty: 3,
    tags: ['css-layout'],
    title: '父元素加了 `transform: translateZ(0)` 后，子元素 `z-index: 9999` 仍被外部元素盖住，最可能的原因是？',
    options: [
      '子元素没有设置 position',
      '父元素因此创建了新的层叠上下文，子元素的 z-index 只在父级内部比较',
      'z-index 只对 fixed 定位生效',
      'transform 会把所有子元素的 z-index 重置为 0',
    ],
    answer: [1],
    analysis:
      '`transform`、`filter`、`opacity < 1`、`will-change`、`isolation: isolate` 等都会**创建层叠上下文**。一旦父元素成为层叠上下文，子元素的 `z-index` 就只在这个上下文内部排序，无法越过父级去和外部元素竞争。\n\n排查手段：看 DevTools 的 Layers 面板，或临时去掉父元素的 transform 验证。',
  },
  {
    id: 'q-css-009',
    type: 'judge',
    subject: 'css',
    difficulty: 2,
    tags: ['css-layout', 'must-know'],
    title: '`em` 与 `rem` 都是相对于根元素（html）的字体大小计算的。',
    answer: false,
    analysis:
      '只有 `rem` 相对根元素；`em` 相对**当前元素的 font-size**，而当 `em` 用在 `font-size` 本身时，则相对父元素的字体大小。\n\n这会导致 `em` 层层嵌套时不断放大，是移动端适配优先用 `rem` 或 `vw` 的原因。',
  },
  {
    id: 'q-css-010',
    type: 'single',
    subject: 'css',
    difficulty: 2,
    tags: ['css-layout'],
    title: '`grid-template-columns: repeat(3, 1fr)` 的含义是？',
    options: ['创建三行等高', '创建三列等宽，平分剩余空间', '每列固定 3px', '定义三个命名网格区域'],
    answer: [1],
    analysis:
      '`repeat(3, 1fr)` 等价于 `1fr 1fr 1fr`。`fr` 是「剩余空间的比例单位」，会先扣掉 `gap` 与固定宽度再按比例分配。\n\n三列等宽还能写 `grid-template-columns: repeat(3, minmax(0, 1fr))`，加上 `minmax(0, …)` 可以防止内容撑破列宽。',
  },
  {
    id: 'q-css-011',
    type: 'single',
    subject: 'css',
    difficulty: 1,
    tags: ['css-layout'],
    title: '`li:nth-child(2n + 1)` 会选中哪些元素？',
    options: ['第 2、4、6… 个', '第 1、3、5… 个', '只有第 2 个', '所有索引为偶数的子元素'],
    answer: [1],
    analysis:
      '`2n + 1` 从 `n = 0` 开始依次得到 1、3、5…，即奇数位，等价于 `nth-child(odd)`；偶数位是 `2n` 或 `nth-child(even)`。\n\n注意 `nth-child` 按**位置**计数，与元素类型无关；想只按同类元素计数要用 `nth-of-type`。',
  },
  {
    id: 'q-css-012',
    type: 'single',
    subject: 'css',
    difficulty: 3,
    tags: ['must-know', 'project'],
    title: '做位移或缩放动画时，推荐用 `transform` 而不是 `top / left`，主要原因是？',
    options: [
      '`transform` 不触发布局与重绘，可以直接在合成线程完成',
      '`transform` 的浏览器兼容性更好',
      '`transform` 不会影响文档流，所以不需要浏览器参与渲染',
      '`top / left` 只能用于定位元素，动画无效',
    ],
    answer: [0],
    analysis:
      '改 `top / left` 会走「布局（重排）→ 绘制（重绘）→ 合成」全流程，主线程压力大、容易掉帧。\n\n`transform` 与 `opacity` 只影响合成阶段，可以交给合成线程处理，配合 `will-change: transform` 提前提升为独立图层更稳（但别滥用，每个图层都占显存）。',
  },

  // ============ Vue 14 ============
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

  // ---- Vue 补题 10 ----
  {
    id: 'q-vue-005',
    type: 'single',
    subject: 'vue',
    difficulty: 1,
    tags: ['vue-core', 'must-know'],
    title: '`created` 与 `mounted` 的核心区别是？',
    options: [
      '`created` 时访问不到 DOM，`mounted` 时已经可以访问',
      '`created` 只执行一次，`mounted` 可能执行多次',
      '`created` 是 Vue2 的写法，Vue3 已移除',
      '`mounted` 在服务端渲染时也会执行',
    ],
    answer: [0],
    analysis:
      '`created` 时实例已创建、响应式数据可用，但模板还没挂载，拿不到 `$el`；`mounted` 在首次渲染成真实 DOM 之后触发，适合做需要 DOM 的初始化（图表、聚焦、测量尺寸）。\n\nVue3 的 `<script setup>` 里两者都不常用，`onMounted` 是最常用的挂载钩子；SSR 时 `mounted` 不会执行，只有 `setup` 与 `created` 之前的逻辑会跑。',
  },
  {
    id: 'q-vue-006',
    type: 'single',
    subject: 'vue',
    difficulty: 2,
    tags: ['vue-core', 'must-know'],
    title: '`v-for` 中加 `key` 的主要作用是？',
    options: [
      '防止组件内存泄漏',
      '帮助 diff 算法复用正确的节点，避免状态错位',
      '提高列表的渲染优先级',
      '让数组的响应式更新生效',
    ],
    answer: [1],
    analysis:
      'Vue 更新列表时会尽量复用已有节点，`key` 是判断「这是不是同一个节点」的唯一依据。\n\n用下标当 `key`，在插入或排序时节点会被错位复用——典型现象是输入框内容跟着行跑到了别的数据上。正确做法是用稳定的唯一 id。',
  },
  {
    id: 'q-vue-007',
    type: 'multi',
    subject: 'vue',
    difficulty: 2,
    tags: ['vue-core'],
    title: 'Vue3 中父子组件通信，以下哪些做法是合适的？',
    options: [
      '父传子用 props，子传父用 emit',
      '跨层级用 provide / inject',
      '父组件通过 ref 调用子组件 `defineExpose` 暴露的方法',
      '子组件直接修改父组件传入的对象内部字段',
    ],
    answer: [0, 1, 2],
    analysis:
      '前三项都是官方推荐方式，各有适用场景：\n\n- props / emit：最基础，单向数据流清晰\n- provide / inject：跨多层，避免 props 逐层透传\n- ref + defineExpose：父组件主动调用子组件方法，适合表单校验、聚焦等命令式操作\n\n第四项错误：直接改父组件的数据会破坏单向数据流，调试时很难追溯来源，应该 emit 事件让父级自己改。',
  },
  {
    id: 'q-vue-008',
    type: 'single',
    subject: 'vue',
    difficulty: 2,
    tags: ['vue-core', 'nowcoder-hot'],
    title: '`nextTick` 的作用是？',
    options: [
      '把回调推迟到下一个宏任务执行',
      '等待本次 DOM 更新完成后再执行回调',
      '强制同步刷新 DOM',
      '取消上一次尚未生效的响应式更新',
    ],
    answer: [1],
    analysis:
      'Vue 的 DOM 更新是**异步批处理**的：改完响应式数据后，DOM 并没有立刻变。`nextTick` 的回调会被排到本次更新队列刷完之后，因此能拿到最新的 DOM。\n\n最典型的用法是改完列表后立刻滚动到底部或测量高度。它内部用的是微任务（`Promise.then`），所以执行时机早于 `setTimeout`。',
  },
  {
    id: 'q-vue-009',
    type: 'single',
    subject: 'vue',
    difficulty: 2,
    tags: ['vue-core'],
    title: '`<keep-alive>` 的作用是？',
    options: [
      '缓存组件实例，切换时保留状态并避免重复创建',
      '缓存组件的接口请求结果',
      '阻止组件卸载时发生内存泄漏',
      '让组件只在首次渲染时执行一次',
    ],
    answer: [0],
    analysis:
      '被 `<keep-alive>` 包裹的组件失活时会触发 `deactivated` 而不是 `unmounted`，实例与状态被保留，重新进入触发 `activated`——常用于列表页 ↔ 详情页来回切换时保住滚动位置和筛选条件。\n\n用 `include` / `exclude` 指定要缓存的组件名；缓存本身占内存，不需要时应及时清理。',
  },
  {
    id: 'q-vue-010',
    type: 'judge',
    subject: 'vue',
    difficulty: 2,
    tags: ['vue-core', 'must-know'],
    title: '`ref` 在模板里可以直接使用，但在 `<script setup>` 中必须通过 `.value` 访问。',
    answer: true,
    analysis:
      '模板编译时会自动补上 `.value`，所以写 `{{ count }}` 就行；脚本里 `ref` 返回的是一个带 `.value` 的对象，不写就拿到整个 ref 对象。\n\n例外：`ref` 被放进 `reactive` 对象或是数组元素时也会自动解包，这点最容易被绕晕——不确定时直接 `.value` 最稳。',
  },
  {
    id: 'q-vue-011',
    type: 'single',
    subject: 'vue',
    difficulty: 2,
    tags: ['vue-core', 'project'],
    title: '路由写成 `component: () => import("./views/Detail.vue")` 的好处是？',
    options: [
      '代码分割，首屏只加载当前路由需要的 chunk',
      '自动开启服务端渲染',
      '避免组件重复渲染',
      '提前预加载所有路由组件',
    ],
    answer: [0],
    analysis:
      '动态 `import()` 会把该组件单独打成一个 chunk，首屏只下载当前路由的代码，其余按需加载——这是单页应用最基础的体积优化。\n\n代价是切换路由时多一次网络请求，交互频繁的路由可以配合预加载（如 hover 时 `import()`）或用打包工具的 `prefetch` 提示。',
  },
  {
    id: 'q-vue-012',
    type: 'single',
    subject: 'vue',
    difficulty: 3,
    tags: ['vue-core'],
    title: '以下哪一项**不属于** Vue3 在编译阶段做的优化？',
    options: [
      '静态提升（hoistStatic）',
      '补丁标记（patchFlag）',
      '事件缓存（cacheHandlers）',
      '自动把 `v-if` 转换成 `v-show`',
    ],
    answer: [3],
    analysis:
      'Vue3 的编译优化目标是「让运行时少做无用的比较」：\n\n- **静态提升**：把不会变的节点提到 render 函数外，只创建一次\n- **patchFlag**：给动态节点打标记，diff 时只比较真正会变的部分\n- **事件缓存**：内联事件不再每次渲染重建函数\n\n`v-if` 与 `v-show` 的语义完全不同（是否销毁 DOM），编译器不会也不能自动互换。',
  },
  {
    id: 'q-vue-013',
    type: 'multi',
    subject: 'vue',
    difficulty: 2,
    tags: ['vue-core', 'project'],
    title: 'Composition API 相比 Options API 的优势包括？',
    options: [
      '相关逻辑按功能聚合，而不是散落在 data / methods / watch 里',
      '对 TypeScript 的类型推导更友好',
      '可以用组合函数（composable）跨组件复用逻辑',
      '能让应用的运行时性能必然更高',
    ],
    answer: [0, 1, 2],
    analysis:
      '前三项是 Composition API 的核心价值：逻辑内聚、类型友好、可组合复用。\n\n第四项是常见误解——性能提升主要来自 Vue3 的响应式重写（Proxy）与编译优化，与用哪种 API 写法无关。同规模下两种写法的运行时开销基本一致。',
  },
  {
    id: 'q-vue-014',
    type: 'single',
    subject: 'vue',
    difficulty: 2,
    tags: ['vue-core'],
    title: '给自定义组件写 `<Child v-model="msg" />`，组件内部需要声明的 props 与事件是？',
    options: [
      '`value` 与 `input`',
      '`modelValue` 与 `update:modelValue`',
      '`msg` 与 `change`',
      '`v-model` 只能用于表单元素，不能用于组件',
    ],
    answer: [1],
    analysis:
      'Vue3 把 `v-model` 展开成 `:modelValue` 加 `@update:modelValue`，组件里写成 props 接收、`emit("update:modelValue", v)` 回传即可。\n\n支持具名双向绑定：`v-model:title` 对应 `title` 与 `update:title`，一个组件可以同时有多个 v-model。`value / input` 是 Vue2 的约定。',
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

  // ============ 浏览器 +7 ============
  {
    id: 'q-browser-004',
    type: 'single',
    subject: 'browser',
    difficulty: 1,
    tags: ['browser-core', 'must-know'],
    title: '浏览器渲染页面的正确顺序是？',
    options: [
      '解析 HTML 构建 DOM → 解析 CSS 构建 CSSOM → 合成 Render Tree → Layout → Paint → Composite',
      '解析 CSS → 解析 HTML → Paint → Layout',
      '解析 HTML → Layout → 解析 CSS → Paint',
      '构建 DOM → Paint → Layout → 构建 CSSOM',
    ],
    answer: [0],
    analysis:
      'HTML 解析为 DOM、CSS 解析为 CSSOM，二者合成 Render Tree（不含 `display:none`），再做 Layout（算几何）→ Paint（栅格化）→ Composite（合成层上屏）。JS 脚本会阻塞 DOM 解析（遇到同步 `<script>`）。',
  },
  {
    id: 'q-browser-005',
    type: 'single',
    subject: 'browser',
    difficulty: 2,
    tags: ['browser-core', 'nowcoder-hot'],
    title: '关于回流（reflow）与重绘（repaint），下列说法正确的是？',
    options: [
      '重绘一定触发回流',
      '回流一定触发重绘，重绘不一定触发回流',
      '二者互不相干',
      '修改 background-color 会触发回流',
    ],
    answer: [1],
    analysis:
      '回流是几何属性（宽高/位置）变化导致重新 Layout，代价高，且必然带来重绘；重绘只是外观（颜色等）变化，不重新布局。`transform` / `opacity` 走合成层，二者都不触发，是动画首选。',
  },
  {
    id: 'q-browser-006',
    type: 'judge',
    subject: 'browser',
    difficulty: 1,
    tags: ['browser-core'],
    title: '`<script defer>` 与 `<script async>` 都不阻塞 HTML 解析，但 defer 保证按声明顺序执行，async 不保证。',
    answer: true,
    analysis:
      'defer：并行下载，DOM 解析完成后按顺序执行，DOMContentLoaded 之前；async：并行下载，下载完立即执行（阻塞解析），顺序不定，适合无依赖的统计脚本。',
  },
  {
    id: 'q-browser-007',
    type: 'multi',
    subject: 'browser',
    difficulty: 2,
    tags: ['browser-core', 'nowcoder-hot'],
    title: '关于本地存储方案，下列说法正确的有？',
    options: [
      'localStorage 持久保存，同源共享，约 5MB',
      'sessionStorage 仅在当前标签页会话内有效',
      'cookie 每次请求都会自动携带到服务端',
      'IndexedDB 是同步 API，适合存小数据',
    ],
    answer: [0, 1, 2],
    analysis:
      'IndexedDB 是**异步**的事务型 NoSQL 数据库，适合存大结构数据，D 错。cookie 会自动随请求发送（受 SameSite 约束），容量仅约 4KB；localStorage 同源共享、sessionStorage 限当前标签页。',
  },
  {
    id: 'q-browser-008',
    type: 'single',
    subject: 'browser',
    difficulty: 2,
    tags: ['browser-core', 'bytedance-r1'],
    title: '事件循环中，一个宏任务执行完后接下来会发生什么？',
    options: [
      '直接执行下一个宏任务',
      '清空当前所有微任务，必要时进行渲染，再执行下一个宏任务',
      '先执行所有 setTimeout 回调',
      '随机选择任务执行',
    ],
    answer: [1],
    analysis:
      '每轮：执行一个宏任务 → 清空微任务队列（Promise.then / MutationObserver / queueMicrotask）→ 浏览器择机渲染 → 下一宏任务。所以微任务总是在渲染前执行完。',
  },
  {
    id: 'q-browser-009',
    type: 'single',
    subject: 'browser',
    difficulty: 3,
    tags: ['browser-core', 'bytedance-r2'],
    title: '关于 CORS 预检请求（preflight），下列说法正确的是？',
    options: [
      '所有跨域请求都会先发 OPTIONS 预检',
      '预检由浏览器自动发起，服务端需在响应头中允许对应方法与自定义头',
      '预检请求会携带请求 body',
      '只要服务端返回 200 就能通过预检',
    ],
    answer: [1],
    analysis:
      '只有「非简单请求」（如 PUT/DELETE、自定义头、Content-Type 为 application/json）才触发预检；预检是浏览器自动发的 OPTIONS，**不带 body**；服务端必须返回正确的 `Access-Control-Allow-*` 头，仅 200 不够。可用 `Access-Control-Max-Age` 缓存预检结果。',
  },
  {
    id: 'q-browser-010',
    type: 'judge',
    subject: 'browser',
    difficulty: 2,
    tags: ['browser-core', 'must-know'],
    title: '强缓存命中时浏览器不发请求；协商缓存命中（304）时需要发请求但不传输 body。',
    answer: true,
    analysis:
      '强缓存由 `Cache-Control: max-age` / `Expires` 控制，命中直接用本地副本（200 from disk/memory cache）；过期后走协商缓存：带 `If-None-Match`（ETag）/ `If-Modified-Since` 询问，未变则回 304，省流量。',
  },

  // ============ 计网 +7 ============
  {
    id: 'q-network-004',
    type: 'single',
    subject: 'network',
    difficulty: 1,
    tags: ['network-core', 'must-know'],
    title: 'HTTP 状态码 301 与 302 的区别是？',
    options: [
      '301 永久重定向，302 临时重定向',
      '301 临时重定向，302 永久重定向',
      '二者完全相同',
      '301 用于缓存，302 用于鉴权',
    ],
    answer: [0],
    analysis:
      '301 永久重定向：搜索引擎会转移权重，浏览器可能缓存该跳转；302 临时重定向：每次仍请求原地址。相关还有 304（协商缓存命中）与 307/308（更严格的重定向，保持方法与 body）。',
  },
  {
    id: 'q-network-005',
    type: 'single',
    subject: 'network',
    difficulty: 2,
    tags: ['network-core', 'nowcoder-hot'],
    title: 'TCP 三次握手为什么不能用两次？',
    options: [
      '两次握手速度太慢',
      '无法防止历史失效的连接请求到达服务端，造成资源浪费，且无法同步双方初始序列号',
      '协议规定必须三次，没有原因',
      '两次握手无法加密',
    ],
    answer: [1],
    analysis:
      '三次握手的核心：同步双方 ISN（初始序列号）并确认双方收发能力正常。若只有两次，客户端旧 SYN 延迟到达会让服务端白等一个已不存在的连接。简记：客户端知道「我发你收正常」，服务端也需要知道「你发我收正常」。',
  },
  {
    id: 'q-network-006',
    type: 'multi',
    subject: 'network',
    difficulty: 2,
    tags: ['network-core', 'must-know'],
    title: '关于 HTTPS，下列说法正确的有？',
    options: [
      '使用非对称加密交换会话密钥，之后用对称加密传输数据',
      '证书用于验证服务端身份，由 CA 签发',
      'HTTPS 完全无法被中间人攻击，无需校验证书',
      'TLS 握手发生在 TCP 握手之后',
    ],
    answer: [0, 1, 3],
    analysis:
      'HTTPS = HTTP over TLS：TCP 握手 → TLS 握手（验证证书、协商出对称会话密钥）→ 加密传输。混合加密兼顾安全与性能。若不校验/信任伪造证书，仍可能被中间人攻击，C 错。',
  },
  {
    id: 'q-network-007',
    type: 'judge',
    subject: 'network',
    difficulty: 1,
    tags: ['network-core'],
    title: 'HTTP/2 通过多路复用解决了应用层的队头阻塞，但 TCP 层的队头阻塞依然存在。',
    answer: true,
    analysis:
      'HTTP/2 把请求/响应拆成帧在同一个 TCP 连接上交错传输（多路复用），不再需要浏览器开 6 个并发连接；但丢包时 TCP 仍需按序交付，后面所有流都被卡住。HTTP/3 改用 QUIC（UDP）才解决传输层队头阻塞。',
  },
  {
    id: 'q-network-008',
    type: 'single',
    subject: 'network',
    difficulty: 2,
    tags: ['network-core', 'nowcoder-hot'],
    title: '关于 GET 与 POST，下列说法**错误**的是？',
    options: [
      'GET 参数在 URL 中，适合幂等的查询',
      'POST 语义上用于提交/创建，参数在 body 中',
      'GET 比 POST 更安全',
      'GET 会被浏览器主动缓存，POST 默认不会',
    ],
    answer: [2],
    analysis:
      '明文 HTTP 下二者都不安全，HTTPS 才是正道，C 错。语义差异：GET 幂等可缓存、长度受 URL 限制；POST 非幂等、body 承载数据。注意「GET 不能带 body」并非协议强制，只是惯例与实现差异。',
  },
  {
    id: 'q-network-009',
    type: 'single',
    subject: 'network',
    difficulty: 3,
    tags: ['network-core', 'bytedance-r2'],
    title: 'TCP 四次挥手中，主动关闭方最后进入 TIME_WAIT 状态，其等待时长与作用是？',
    options: [
      '等待 2MSL，确保最后一个 ACK 能到达对方，并让旧连接的报文在网络中消亡',
      '等待 1MSL，为了节省资源',
      '不等待，直接关闭',
      '等待 30 秒固定时长',
    ],
    answer: [0],
    analysis:
      'TIME_WAIT = 2MSL（最大报文生存时间的 2 倍）：①若最后的 ACK 丢失，还有时间重发 FIN 给对方重传；②让本连接的旧报文全部过期，避免污染下一个相同四元组的连接。高并发短连接下大量 TIME_WAIT 是常见性能问题。',
  },
  {
    id: 'q-network-010',
    type: 'judge',
    subject: 'network',
    difficulty: 2,
    tags: ['network-core'],
    title: 'DNS 解析一般按「浏览器缓存 → 系统缓存（hosts）→ 本地 DNS 服务器 → 根/顶级/权威服务器」的顺序进行，且默认使用 UDP 53 端口。',
    answer: true,
    analysis:
      '递归查询（客户端→本地 DNS）+ 迭代查询（本地 DNS→根→顶级域→权威）。默认 UDP 53，报文过大或区域传送时用 TCP。CDN 正是利用 DNS 解析返回离用户最近的节点 IP。',
  },

  // ============ 操作系统 +3 ============
  {
    id: 'q-os-001',
    type: 'single',
    subject: 'os',
    difficulty: 1,
    tags: ['must-know'],
    title: '进程与线程最核心的区别是？',
    options: [
      '进程是资源分配的最小单位，线程是 CPU 调度的最小单位',
      '线程比进程占用内存更多',
      '进程之间可以直接共享内存',
      '一个进程只能有一个线程',
    ],
    answer: [0],
    analysis:
      '进程拥有独立地址空间（资源分配单位），线程共享所属进程的内存与资源（调度单位），因此线程切换开销小、通信方便但互相影响。联系前端：浏览器是多进程架构，JS 引擎是渲染进程里的单线程。',
  },
  {
    id: 'q-os-002',
    type: 'judge',
    subject: 'os',
    difficulty: 2,
    tags: ['must-know'],
    title: '死锁产生的四个必要条件是：互斥、占有且等待、不可剥夺、循环等待；只要破坏其中一个即可避免死锁。',
    answer: true,
    analysis:
      '四条件缺一不可：互斥（资源独占）、占有且等待（拿着资源等新资源）、不可剥夺（不能被抢走）、循环等待（形成等待环）。常见解法：资源一次性申请、按序加锁、可剥夺、银行家算法。',
  },
  {
    id: 'q-os-003',
    type: 'single',
    subject: 'os',
    difficulty: 2,
    tags: ['must-know'],
    title: '虚拟内存中 LRU 页面置换算法的含义是？',
    options: [
      '淘汰最长时间未被访问的页面',
      '淘汰最先进内存的页面',
      '淘汰访问次数最少的页面',
      '随机淘汰一个页面',
    ],
    answer: [0],
    analysis:
      'LRU（最近最少使用）淘汰最久未访问页，利用时间局部性；FIFO 淘汰最早进入的；LFU 淘汰访问频次最低的。面试常联动：用「哈希表 + 双向链表」手写一个 O(1) 的 LRU 缓存。',
  },

  // ============ 数据库 +3 ============
  {
    id: 'q-db-001',
    type: 'single',
    subject: 'db',
    difficulty: 1,
    tags: ['must-know'],
    title: 'MySQL InnoDB 索引底层为什么选 B+ 树而不是二叉树或哈希？',
    options: [
      'B+ 树矮胖、磁盘 IO 次数少，叶子节点有序链表天然支持范围查询；哈希不支持范围与排序',
      'B+ 树实现最简单',
      '二叉树不支持等值查询',
      '哈希表查询最慢',
    ],
    answer: [0],
    analysis:
      'B+ 树非叶子节点只存键不存数据，单节点能容纳更多索引项 → 树高低（3 层可存千万级）→ 磁盘 IO 少；叶子节点双向链表相连，范围查询与排序高效。哈希等值 O(1) 但不支持范围/排序/模糊匹配；二叉树退化成链表时查询变 O(n)。',
  },
  {
    id: 'q-db-002',
    type: 'single',
    subject: 'db',
    difficulty: 2,
    tags: ['must-know'],
    title: '事务的 ACID 中，「多个并发事务互不干扰」指的是哪一项？其实现依赖？',
    options: [
      '隔离性，依赖锁与 MVCC',
      '原子性，依赖 undo log',
      '持久性，依赖 redo log',
      '一致性，依赖外键',
    ],
    answer: [0],
    analysis:
      'I（Isolation 隔离性）由锁和 MVCC（多版本并发控制）实现，隔离级别：读未提交 < 读已提交 < 可重复读（InnoDB 默认，MVCC 快照读解决不可重复读，间隙锁缓解幻读）< 串行化。顺带记：原子性靠 undo log，持久性靠 redo log。',
  },
  {
    id: 'q-db-003',
    type: 'judge',
    subject: 'db',
    difficulty: 2,
    tags: ['must-know'],
    title: '对索引列使用函数、隐式类型转换、以 `%` 开头的 LIKE、或不满足最左前缀，都可能导致索引失效。',
    answer: true,
    analysis:
      '索引失效常见场景：`WHERE DATE(create_time)=...`（函数）、字符串列用数字查询（隐式转换）、`LIKE "%abc"`（前缀通配）、联合索引跳过最左列、`OR` 连接无索引列。用 `EXPLAIN` 验证执行计划。',
  },

  // ============ 简答/八股 +20 ============
  {
    id: 'q-short-011',
    type: 'short',
    subject: 'js',
    difficulty: 2,
    tags: ['must-know', 'nowcoder-hot'],
    title: '什么是闭包？有什么用途？会造成什么问题？',
    points: [
      '定义：函数 + 其词法作用域的引用，内层函数能访问外层变量，外层变量不被回收',
      '用途：数据私有化（模块模式）、柯里化、防抖节流、回调中保存状态',
      '问题：变量常驻内存，误用导致内存泄漏；循环中共享变量陷阱（var + setTimeout）',
      '释放：将不再使用的引用置 null',
    ],
    analysis:
      '答题主线「定义 → 用途 → 代价」。闭包让外层函数执行完后其作用域仍被引用，所以变量不释放。经典追问：循环里 `var` 打 5 个 5 的修复（let 块级作用域 / 立即执行函数 / setTimeout 第三参数）。',
    followups: ['手写一个用闭包实现的计数器', '闭包与垃圾回收的关系？'],
  },
  {
    id: 'q-short-012',
    type: 'short',
    subject: 'js',
    difficulty: 1,
    tags: ['must-know'],
    title: '总结 JS 中 this 的指向规则。',
    points: [
      '默认绑定：独立调用指向全局（严格模式 undefined）',
      '隐式绑定：obj.fn() 指向 obj，注意赋值/回调会丢失',
      '显式绑定：call / apply / bind',
      'new 绑定：指向新创建的对象',
      '箭头函数无 this，沿词法作用域捕获外层 this',
      '优先级：new > 显式 > 隐式 > 默认',
    ],
    analysis:
      '按「绑定规则 + 优先级」作答最清晰。常考陷阱：对象方法赋值给变量后调用变默认绑定；回调（setTimeout、事件）丢失隐式绑定，可用箭头函数或 bind 固定。',
    followups: ['手写 bind', '箭头函数为什么不能当构造函数？'],
  },
  {
    id: 'q-short-013',
    type: 'short',
    subject: 'js',
    difficulty: 2,
    tags: ['must-know', 'bytedance-r1'],
    title: 'Promise 解决了什么问题？核心机制是什么？',
    points: [
      '解决回调地狱与信任问题（回调被调多次/不调/吞异常）',
      '三种状态 pending / fulfilled / rejected，状态不可逆',
      'then 链式调用：每次返回新 Promise，值穿透、异常冒泡',
      '微任务调度：回调进微任务队列，在当前宏任务后执行',
      '静态方法：all / race / allSettled / any',
    ],
    analysis:
      '先讲动机（回调问题），再讲状态机 + 链式 then + 微任务。进阶答手写要点：executor 同步执行、then 需处理返回 Promise 的展平（resolvePromise 递归）。',
    followups: ['手写 Promise.all', 'Promise 与 async/await 的关系？'],
  },
  {
    id: 'q-short-014',
    type: 'short',
    subject: 'js',
    difficulty: 1,
    tags: ['nowcoder-hot'],
    title: '什么是事件委托？为什么用它？',
    points: [
      '利用事件冒泡，把监听器绑在父元素上，通过 e.target 判断来源',
      '好处：减少监听器数量、动态新增子元素无需重新绑定',
      '注意：e.target 与 e.currentTarget 的区别；closest() 向上匹配',
      '不适用：不冒泡的事件（focus/blur 需用捕获或 focusin/focusout）',
    ],
    analysis:
      '「冒泡 + target 判断」一句话说清原理，再讲两个收益（性能、动态元素），最后提 currentTarget 区别与 stopPropagation 的影响，完整度就够了。',
  },
  {
    id: 'q-short-015',
    type: 'short',
    subject: 'vue',
    difficulty: 2,
    tags: ['vue-core', 'must-know'],
    title: '对比 Vue2 与 Vue3 的响应式原理。',
    points: [
      'Vue2：Object.defineProperty 递归劫持 getter/setter，初始化时全量转换',
      'Vue2 缺陷：无法检测新增/删除属性（需 Vue.set）、数组下标与 length 需 hack',
      'Vue3：Proxy 代理整个对象，按需代理（访问到才递归），支持新增/删除/数组下标',
      'Vue3 配套：ref（基本类型包 .value）/ reactive；effect 收集依赖、trigger 触发更新',
    ],
    analysis:
      '答「API 差异 → Vue2 两个缺陷 → Vue3 如何补上」。可延伸：Proxy 代理的是对象本身而非属性，所以天然支持动态增删；Vue3 响应式模块独立为 @vue/reactivity。',
    followups: ['为什么 ref 需要 .value？', 'Proxy 相比 defineProperty 还有什么优势？'],
  },
  {
    id: 'q-short-016',
    type: 'short',
    subject: 'vue',
    difficulty: 1,
    tags: ['vue-core'],
    title: 'Vue 生命周期各阶段分别适合做什么？',
    points: [
      'created：数据已响应式、DOM 未挂载 —— 发请求、初始化数据',
      'mounted：DOM 就绪 —— DOM 操作、初始化第三方库、定时器',
      'beforeUnmount / unmounted：清理定时器、解绑全局事件、销毁第三方实例',
      'keep-alive 组件额外有 activated / deactivated',
    ],
    analysis:
      '按「创建 → 挂载 → 更新 → 销毁」串一遍，重点答 created（最早能拿到数据，发请求）与 mounted（最早能操作 DOM），以及销毁阶段必须清理副作用。Vue3 组合式 API 对应 onMounted 等钩子。',
  },
  {
    id: 'q-short-017',
    type: 'short',
    subject: 'vue',
    difficulty: 2,
    tags: ['vue-core', 'must-know'],
    title: 'Vue 组件通信有哪些方式？各自适用场景？',
    points: [
      '父子：props 下传 / emits 上传（v-model = 语法糖）',
      '父访子：ref / expose；子访父：$parent（不推荐）',
      '跨层级：provide / inject',
      '任意组件：Pinia 状态管理、事件总线（Vue3 推荐 mitt）',
      'URL / localStorage：跨页面场景',
    ],
    analysis:
      '按「关系远近」分类作答：近（props/emits）、中（provide/inject）、远（Pinia）。追问常考 provide/inject 不是响应式的（需传 ref）以及 Pinia 相比事件总线的可维护性优势。',
  },
  {
    id: 'q-short-018',
    type: 'short',
    subject: 'vue',
    difficulty: 1,
    tags: ['vue-core'],
    title: 'v-if 与 v-show 的区别？如何选择？',
    points: [
      'v-if 是真正的条件渲染：不满足时不渲染，切换时销毁/重建组件',
      'v-show 只是切换 CSS display，组件始终渲染',
      'v-if 有更高切换开销，v-show 有更高初始渲染开销',
      '频繁切换用 v-show；条件很少变化或重型子树用 v-if；v-if 与 v-for 不要同用（Vue3 中 v-if 优先级更高）',
    ],
    analysis:
      '一句话：v-if 懒销毁、v-show 纯显隐。选择标准：切换频率。补充 key 与 template 包裹的用法即可。',
  },
  {
    id: 'q-short-019',
    type: 'short',
    subject: 'vue',
    difficulty: 2,
    tags: ['vue-core', 'bytedance-r1'],
    title: 'nextTick 是什么？为什么需要它？',
    points: [
      'Vue 更新 DOM 是异步的：数据变更后组件更新被推入微任务队列批量执行',
      'nextTick 返回 Promise，回调在 DOM 更新完成后执行',
      '场景：修改数据后立即操作更新后的 DOM（如获取高度、聚焦输入框）',
      '底层：优先 Promise.then，降级 MutationObserver / setTimeout',
    ],
    analysis:
      '核心句：「数据变更是同步的，DOM 更新是异步批量的」。好处是合并同一 tick 内的多次变更只渲染一次。答出微任务降级链是加分项。',
  },
  {
    id: 'q-short-020',
    type: 'short',
    subject: 'css',
    difficulty: 2,
    tags: ['css-layout', 'nowcoder-hot'],
    title: '什么是 BFC？如何触发？能解决什么问题？',
    points: [
      '块级格式化上下文：独立渲染区域，内部布局不受外部影响',
      '触发：overflow 非 visible、float、position absolute/fixed、display inline-block/flow-root/flex/grid 等',
      '应用：清除浮动（包含浮动子元素）、阻止 margin 重叠、两栏自适应布局',
    ],
    analysis:
      '定义一句话：「BFC 内部与外部互不影响的独立盒子」。三个经典应用必须脱口而出：高度塌陷、margin 穿透/重叠、自适应两栏。现代写法优先 `display: flow-root` 清除浮动。',
  },
  {
    id: 'q-short-021',
    type: 'short',
    subject: 'css',
    difficulty: 1,
    tags: ['css-layout', 'must-know'],
    title: '实现水平垂直居中的方案有哪些？',
    points: [
      'Flex：父级 display:flex; justify-content:center; align-items:center（首选）',
      'Grid：父级 display:grid; place-items:center',
      '绝对定位 + transform：left/top 50% + translate(-50%,-50%)，不定宽高也可用',
      '绝对定位 + margin:auto（需定宽高）',
      'table-cell：vertical-align:middle + text-align:center',
    ],
    analysis:
      '至少给出 Flex / Grid / 定位+transform 三种，并说明各自前提（是否需要固定宽高）。flex/grid 是现代首选，transform 方案兼容不定尺寸。',
  },
  {
    id: 'q-short-022',
    type: 'short',
    subject: 'css',
    difficulty: 1,
    tags: ['css-layout'],
    title: '标准盒模型与 IE（怪异）盒模型的区别？',
    points: [
      '标准（content-box）：width = 内容宽，padding/border 额外撑大',
      '怪异（border-box）：width = 内容 + padding + border',
      '通过 box-sizing 切换，工程上全局用 border-box 更直觉',
      'margin 永远不计入盒模型宽度',
    ],
    analysis:
      '一句对比 + 一个实践结论（`*{box-sizing:border-box}`）。可补充：flex/grid 子项尺寸计算也受 box-sizing 影响。',
  },
  {
    id: 'q-short-023',
    type: 'short',
    subject: 'browser',
    difficulty: 3,
    tags: ['browser-core', 'must-know', 'bytedance-r1'],
    title: '从输入 URL 到页面展示，中间发生了什么？',
    points: [
      'URL 解析 → 缓存检查（强缓存直接命中）',
      'DNS 解析得到 IP → TCP 三次握手 →（HTTPS）TLS 握手',
      '发送 HTTP 请求 → 服务端处理 → 返回响应（协商缓存 304 / 重定向）',
      '浏览器解析：HTML→DOM、CSS→CSSOM → Render Tree → Layout → Paint → 合成上屏',
      'JS 加载执行（defer/async），触发 DOMContentLoaded 与 load',
    ],
    analysis:
      '经典大题，按「网络 → 渲染」两段式答。网络段：缓存/DNS/TCP/TLS/HTTP；渲染段：解析、阻塞点、渲染流水线。追问点极多：缓存细节、三次握手、重排重绘、script 阻塞，每个子环节都要能展开。',
    followups: ['强缓存与协商缓存的区别？', '如何优化首屏加载时间？'],
  },
  {
    id: 'q-short-024',
    type: 'short',
    subject: 'browser',
    difficulty: 2,
    tags: ['browser-core'],
    title: '如何减少重绘与回流？',
    points: [
      '批量改样式：class 切换代替逐条 style，或用 cssText',
      '离线操作：documentFragment / display:none 后批量修改再显示',
      '读写分离：避免「写→读→写」交错导致强制同步布局（读 offsetTop 等）',
      '动画用 transform / opacity + will-change，走合成层',
      '复杂元素脱离文档流（absolute/fixed）减少影响范围',
    ],
    analysis:
      '按「减少次数、缩小范围、绕开流水线」三类作答。强制同步布局（layout thrashing）是高频追问：循环里先读几何再写样式每轮都触发回流。',
  },
  {
    id: 'q-short-025',
    type: 'short',
    subject: 'network',
    difficulty: 2,
    tags: ['network-core', 'must-know'],
    title: '完整描述 HTTP 缓存流程（强缓存 + 协商缓存）。',
    points: [
      '先查强缓存：Cache-Control: max-age（优先）/ Expires，未过期直接用本地副本，不发请求',
      '强缓存失效 → 发请求带 If-None-Match（ETag）/ If-Modified-Since（Last-Modified）',
      '服务端比对：未变 → 304 用本地缓存（只传 header）；变了 → 200 返回新资源',
      'ETag 优先级高于 Last-Modified（后者精度只到秒）',
      'Cache-Control 常用值：no-cache（每次协商）、no-store（不缓存）',
    ],
    analysis:
      '画流程图式回答：命中强缓存 → 不发请求；未命中 → 协商 → 304/200。补一句 no-cache 与 no-store 的经典辨析即可收尾。',
  },
  {
    id: 'q-short-026',
    type: 'short',
    subject: 'network',
    difficulty: 3,
    tags: ['network-core'],
    title: 'TCP 如何保证可靠传输与拥塞控制？',
    points: [
      '可靠传输：序列号 + 确认应答 ACK + 超时重传 + 滑动窗口（流量控制）+ 校验和 + 去重',
      '拥塞控制四板斧：慢启动、拥塞避免、快重传、快恢复',
      '慢启动：cwnd 指数增长至阈值；拥塞避免：之后线性增长',
      '快重传：收到 3 个重复 ACK 立即重传；快恢复：cwnd 降为阈值一半继续线性增长',
    ],
    analysis:
      '可靠传输靠「确认 + 重传 + 窗口」；拥塞控制记四个机制与 cwnd 曲线（指数→线性→丢包后减半再线性）。能和 HTTP/3 QUIC 对比是加分项。',
  },
  {
    id: 'q-short-027',
    type: 'short',
    subject: 'js',
    difficulty: 1,
    tags: ['js-handwrite', 'must-know'],
    title: '防抖与节流的区别？各自适用什么场景？',
    points: [
      '防抖 debounce：停止触发后延迟执行，期间再触发重新计时 —— 搜索联想、表单校验、resize 结束处理',
      '节流 throttle：固定频率执行，稀释事件流 —— 滚动加载、按钮防连点、拖拽跟随',
      '一句话：防抖「等消停了再做」，节流「按节奏做」',
    ],
    analysis:
      '定义 + 场景成对答，最后各给一个手写要点：防抖用 clearTimeout 重置计时；节流用时间戳或定时器开关。',
    followups: ['分别手写实现一下'],
  },
  {
    id: 'q-short-028',
    type: 'short',
    subject: 'vue',
    difficulty: 2,
    tags: ['vue-core', 'must-know'],
    title: 'Vue diff 算法中 key 的作用是什么？为什么不能用 index 当 key？',
    points: [
      'key 是 vnode 的唯一标识，diff 时用于判断「同一节点可复用」',
      'Vue3 双端 diff + 最长递增子序列：最小化 DOM 移动次数',
      '用 index 当 key：列表重排/插入时 key 与数据错位，导致错误的 DOM 复用与状态串位（如 input 内容错位）',
      '应使用数据自身的稳定 id',
    ],
    analysis:
      '核心：key 决定复用关系。index 的问题在「非稳定」——顺序变化时 Vue 复用了错误的 DOM 与组件状态。补充双端比较（头头/尾尾/头尾/尾头）+ LIS 求最少移动是进阶加分。',
    followups: ['Vue2 与 Vue3 diff 的区别？'],
  },
  {
    id: 'q-short-029',
    type: 'short',
    subject: 'js',
    difficulty: 2,
    tags: ['must-know'],
    title: '讲清原型链，并列举常见继承方式。',
    points: [
      '对象通过 __proto__ 指向构造函数的 prototype，逐级向上到 Object.prototype → null，形成原型链',
      '属性查找沿链向上；instanceof 判断构造函数 prototype 是否在链上',
      '继承方式：原型链继承、借用构造函数、组合继承、寄生组合式（最优经典）、ES6 class extends（语法糖）',
      '寄生组合式：Object.create(Parent.prototype) 修正 constructor + 构造函数内 Parent.call(this)',
    ],
    analysis:
      '先画链：实例 → Fn.prototype → Object.prototype → null。继承重点答寄生组合式为何最优（不重复调父构造函数、原型干净），class extends 本质是其语法糖。',
    followups: ['new 操作符做了什么？', '手写 instanceof'],
  },
  {
    id: 'q-short-030',
    type: 'short',
    subject: 'network',
    difficulty: 3,
    tags: ['network-core', 'must-know'],
    title: 'XSS 与 CSRF 分别是什么？如何防御？',
    points: [
      'XSS（跨站脚本）：注入恶意脚本窃取信息 —— 防御：输出转义/CSP/HttpOnly Cookie/输入校验',
      'CSRF（跨站请求伪造）：借用户登录态发伪造请求 —— 防御：SameSite Cookie / CSRF Token / 校验 Referer / 关键操作二次验证',
      '本质区别：XSS 是注入脚本在用户浏览器执行，CSRF 是冒用身份发请求',
    ],
    analysis:
      '对比式作答：攻击原理 → 防御清单 → 一句话区分。SameSite=Lax/Strict 是现代浏览器默认防线；CSP 用白名单限制脚本来源，是 XSS 纵深防御核心。',
  },

  // ============ 手撕 +10：算法 6 / JS 手写 4 ============
  {
    id: 'q-code-011',
    type: 'code',
    subject: 'algo',
    difficulty: 3,
    tags: ['lc-hot100', 'bytedance-r1'],
    title: '实现 LRU 缓存（LC 146）：`get` / `put` 均要求 O(1)，超出容量时淘汰最久未使用的键。',
    approach:
      '哈希表保证 O(1) 查找，双向链表维护使用顺序（头部最新、尾部最旧）。get 命中后把节点移到头部；put 插入/更新到头部，超容量时摘除尾节点。',
    analysis: `${codeBlock(
      'js',
      `class LRUCache {
  constructor(capacity) {
    this.cap = capacity
    this.map = new Map() // key -> 双向链表节点
    // 伪头伪尾，省去 null 边界判断
    this.head = { prev: null, next: null }
    this.tail = { prev: null, next: null }
    this.head.next = this.tail
    this.tail.prev = this.head
  }
  _remove(node) {
    node.prev.next = node.next
    node.next.prev = node.prev
  }
  _addFirst(node) {
    // 插到头节点之后 = 最近使用
    node.next = this.head.next
    node.prev = this.head
    this.head.next.prev = node
    this.head.next = node
  }
  get(key) {
    const node = this.map.get(key)
    if (!node) return -1
    this._remove(node)
    this._addFirst(node) // 访问后刷新为最新
    return node.val
  }
  put(key, val) {
    if (this.map.has(key)) this._remove(this.map.get(key))
    const node = { key, val, prev: null, next: null }
    this.map.set(key, node)
    this._addFirst(node)
    if (this.map.size > this.cap) {
      const lru = this.tail.prev // 尾部是最久未用
      this._remove(lru)
      this.map.delete(lru.key) // 别忘了同步清掉哈希表
    }
  }
}`,
    )}\n\n两个易错点：淘汰时哈希表要同步删除；伪头伪尾能把边界判断全部消掉。`,
    complexity: '时间 O(1) / 空间 O(capacity)',
    link: 'https://leetcode.cn/problems/lru-cache/',
  },
  {
    id: 'q-code-012',
    type: 'code',
    subject: 'algo',
    difficulty: 2,
    tags: ['lc-hot100'],
    title: '合并区间（LC 56）：合并所有重叠的区间，返回不重叠的区间数组。',
    approach:
      '先按起点排序，遍历维护结果数组：当前区间起点 ≤ 结果末尾区间的终点则合并（终点取 max），否则直接追加。',
    analysis: `${codeBlock(
      'js',
      `function merge(intervals) {
  if (!intervals.length) return []
  // 按区间起点排序，合并才能线性扫描
  intervals.sort((a, b) => a[0] - b[0])
  const res = [intervals[0]]
  for (let i = 1; i < intervals.length; i++) {
    const last = res[res.length - 1]
    const cur = intervals[i]
    if (cur[0] <= last[1]) {
      // 有重叠：终点取两者最大值
      last[1] = Math.max(last[1], cur[1])
    } else {
      res.push(cur) // 无重叠，开启新区间
    }
  }
  return res
}`,
    )}\n\n排序是前提：排完后任意重叠区间在数组中必然相邻可贪心合并。`,
    complexity: '时间 O(n log n)（排序）/ 空间 O(n)',
    link: 'https://leetcode.cn/problems/merge-intervals/',
  },
  {
    id: 'q-code-013',
    type: 'code',
    subject: 'algo',
    difficulty: 1,
    tags: ['lc-hot100', 'must-know'],
    title: '二叉树的层序遍历（LC 102）：按层返回节点值，结果为二维数组。',
    approach:
      'BFS 用队列。每轮先记录当前队列长度 n，循环弹出 n 个节点收值并入队其子节点 —— 这样一轮正好处理一整层。',
    analysis: `${codeBlock(
      'js',
      `function levelOrder(root) {
  if (!root) return []
  const res = []
  const queue = [root] // BFS 专用队列
  while (queue.length) {
    const size = queue.length // 先固定本层节点数，防止循环中被入队污染
    const level = []
    for (let i = 0; i < size; i++) {
      const node = queue.shift()
      level.push(node.val)
      if (node.left) queue.push(node.left)
      if (node.right) queue.push(node.right)
    }
    res.push(level) // 收集完一整层
  }
  return res
}`,
    )}\n\n关键是「按 size 分层」；若不需要分层，直接弹到空即可（LC 102 的简化版）。`,
    complexity: '时间 O(n) / 空间 O(n)',
    link: 'https://leetcode.cn/problems/binary-tree-level-order-traversal/',
  },
  {
    id: 'q-code-014',
    type: 'code',
    subject: 'algo',
    difficulty: 2,
    tags: ['lc-hot100', 'nowcoder-hot'],
    title: '三数之和（LC 15）：找出数组中所有和为 0 且不重复的三元组。',
    approach:
      '排序后枚举第一个数 a，剩余区间用左右双指针找 b + c = -a。每层都要跳过重复值来避免重复三元组。',
    analysis: `${codeBlock(
      'js',
      `function threeSum(nums) {
  const res = []
  nums.sort((a, b) => a - b) // 排序后才能用双指针
  for (let i = 0; i < nums.length - 2; i++) {
    if (nums[i] > 0) break // 最小数已大于 0，后面不可能凑出 0
    if (i > 0 && nums[i] === nums[i - 1]) continue // 第一个数去重
    let l = i + 1
    let r = nums.length - 1
    while (l < r) {
      const sum = nums[i] + nums[l] + nums[r]
      if (sum === 0) {
        res.push([nums[i], nums[l], nums[r]])
        while (l < r && nums[l] === nums[l + 1]) l++ // 第二个数去重
        while (l < r && nums[r] === nums[r - 1]) r-- // 第三个数去重
        l++
        r--
      } else if (sum < 0) {
        l++
      } else {
        r--
      }
    }
  }
  return res
}`,
    )}\n\n三处去重缺一不可；\`nums[i] > 0\` 提前剪枝是常见优化点。`,
    complexity: '时间 O(n²) / 空间 O(log n)（排序栈）',
    link: 'https://leetcode.cn/problems/3sum/',
  },
  {
    id: 'q-code-015',
    type: 'code',
    subject: 'algo',
    difficulty: 1,
    tags: ['lc-hot100'],
    title: '最大子数组和（LC 53）：找出具有最大和的连续子数组，返回其和。',
    approach:
      ' Kadane 算法：遍历维护「以当前元素结尾的最大和」cur，cur = max(当前值, cur + 当前值)，全程记录最大值。等价于前缀和 + 最小前缀。',
    analysis: `${codeBlock(
      'js',
      `function maxSubArray(nums) {
  let cur = nums[0] // 以当前元素结尾的最大和
  let ans = nums[0] // 全局答案
  for (let i = 1; i < nums.length; i++) {
    // 前面的和为负就果断丢弃，从当前元素重新开始
    cur = Math.max(nums[i], cur + nums[i])
    ans = Math.max(ans, cur)
  }
  return ans
}`,
    )}\n\n一句话理解：\`cur\` 是「以 i 结尾的最大和」，负数前缀只会拖累后面，直接重启。全负数数组也能正确处理（ans 取最大单元素）。`,
    complexity: '时间 O(n) / 空间 O(1)',
    link: 'https://leetcode.cn/problems/maximum-subarray/',
  },
  {
    id: 'q-code-016',
    type: 'code',
    subject: 'algo',
    difficulty: 3,
    tags: ['lc-hot100', 'bytedance-r2'],
    title: '接雨水（LC 42）：给定柱状图高度，计算下雨后能接多少水。',
    approach:
      '双指针：left/right 从两端向中间收，各自维护 leftMax/rightMax。哪边最大值更小就结算哪边（木桶效应：低的一侧水位由它决定）。',
    analysis: `${codeBlock(
      'js',
      `function trap(height) {
  let left = 0
  let right = height.length - 1
  let leftMax = 0
  let rightMax = 0
  let water = 0
  while (left < right) {
    if (height[left] < height[right]) {
      // 左边更矮：左指针处水位只取决于 leftMax
      if (height[left] >= leftMax) leftMax = height[left] // 更新历史最高
      else water += leftMax - height[left] // 能接的水 = 最高墙 - 当前高度
      left++
    } else {
      if (height[right] >= rightMax) rightMax = height[right]
      else water += rightMax - height[right]
      right--
    }
  }
  return water
}`,
    )}\n\n核心观察：当前位置能接的水 = min(左侧最高, 右侧最高) − 当前高度。双指针利用「较矮一侧的最大值已确定」把两次扫的空间优化到 O(1)。`,
    complexity: '时间 O(n) / 空间 O(1)',
    link: 'https://leetcode.cn/problems/trapping-rain-water/',
  },
  {
    id: 'q-code-017',
    type: 'code',
    subject: 'js',
    difficulty: 2,
    tags: ['js-handwrite', 'bytedance-r1'],
    title: '手写 `Promise.all`：全部成功才 resolve（保持顺序），任意一个 reject 立即 reject。',
    approach:
      '返回新 Promise。对输入逐个 Promise.resolve 包一层（兼容非 Promise 值），计数器统计完成数，结果按原下标写入保证顺序。',
    analysis: `${codeBlock(
      'js',
      `function promiseAll(list) {
  return new Promise((resolve, reject) => {
    if (!list.length) return resolve([]) // 空数组直接成功
    const results = new Array(list.length)
    let done = 0
    list.forEach((p, i) => {
      // Promise.resolve 兼容普通值与 thenable
      Promise.resolve(p).then(
        (val) => {
          results[i] = val // 按下标写入，保证输出顺序与输入一致
          done++
          if (done === list.length) resolve(results) // 全部完成才成功
        },
        reject, // 任何一个失败，整体立即失败
      )
    })
  })
}`,
    )}\n\n三个考点：包 \`Promise.resolve\`、顺序用下标而非 push、空输入边界。对比记忆：allSettled 永不 reject，any 与 all 的成败语义相反。`,
    complexity: '时间 O(n) / 空间 O(n)',
  },
  {
    id: 'q-code-018',
    type: 'code',
    subject: 'js',
    difficulty: 2,
    tags: ['js-handwrite'],
    title: '实现柯里化 `curry(fn)`：把多参数函数改造成可分批传参的形式，如 `add(1)(2)(3)`。',
    approach:
      '比较已收集参数个数与 fn.length：够数就执行原函数，不够就返回新函数继续收集（arguments 合并）。',
    analysis: `${codeBlock(
      'js',
      `function curry(fn) {
  return function curried(...args) {
    // 参数已够：直接执行并返回结果
    if (args.length >= fn.length) {
      return fn.apply(this, args)
    }
    // 不够：返回新函数，合并已收集的参数继续等待
    return function (...more) {
      return curried.apply(this, args.concat(more)) // 旧参数 + 新参数
    }
  }
}`,
    )}\n\n注意 \`fn.length\` 只统计默认值/剩余参数之前的形参个数；用 apply 透传 this 才能在对象方法上也成立。`,
    complexity: '每次调用 O(1)，展开执行时 O(n)',
  },
  {
    id: 'q-code-019',
    type: 'code',
    subject: 'js',
    difficulty: 1,
    tags: ['js-handwrite', 'nowcoder-hot'],
    title: '手写 `instanceof`：判断构造函数的 prototype 是否出现在对象的原型链上。',
    approach:
      '取左操作数的原型（Object.getPrototypeOf），沿原型链逐级向上与右操作数的 prototype 比较，直到命中或到达 null。',
    analysis: `${codeBlock(
      'js',
      `function myInstanceof(obj, Fn) {
  // 原始值没有原型链，直接 false
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return false
  }
  let proto = Object.getPrototypeOf(obj)
  while (proto) {
    if (proto === Fn.prototype) return true // 链上找到构造函数的 prototype
    proto = Object.getPrototypeOf(proto) // 继续向上走
  }
  return false // 走到 null 说明不在链上
}`,
    )}\n\n边界：原始值直接 false；右侧必须是函数（有 prototype）。\`Object.create(null)\` 的对象对任何构造函数都返回 false。`,
    complexity: '时间 O(链长) / 空间 O(1)',
  },
  {
    id: 'q-code-020',
    type: 'code',
    subject: 'js',
    difficulty: 2,
    tags: ['js-handwrite', 'meituan-r1'],
    title: '实现一个发布订阅 `EventEmitter`：支持 `on` / `off` / `emit` / `once`。',
    approach:
      '用 Map 存「事件名 → 回调数组」。once 用包装函数实现：先 off 再执行原回调，防止递归触发时重复执行。',
    analysis: `${codeBlock(
      'js',
      `class EventEmitter {
  constructor() {
    this.events = new Map() // 事件名 -> Set/数组
  }
  on(name, fn) {
    if (!this.events.has(name)) this.events.set(name, new Set())
    this.events.get(name).add(fn)
    return this // 返回 this 支持链式调用
  }
  off(name, fn) {
    this.events.get(name)?.delete(fn)
    return this
  }
  emit(name, ...args) {
    // 拷贝一份再遍历，避免回调里 off 自身导致遍历异常
    ;[...(this.events.get(name) ?? [])].forEach((fn) => fn(...args))
  }
  once(name, fn) {
    const wrapper = (...args) => {
      this.off(name, wrapper) // 先解绑再执行，递归 emit 也只触发一次
      fn(...args)
    }
    return this.on(name, wrapper)
  }
}`,
    )}\n\n易错点：emit 遍历时若回调内 off 会改原数组，先拷贝快照；once 必须先 off 再执行。这就是 Vue2 事件总线 / Node events 的最小实现。`,
    complexity: 'on/off O(1)，emit O(监听器数)',
  },
]
