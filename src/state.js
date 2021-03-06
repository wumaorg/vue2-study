import Dep from "./observe/dep"
import { observe } from "./observe/index"
import Watcher, { nextTick } from "./observe/watcher"

export function initState (vm) {
  const opts = vm.$options
  // console.log(opts);
  // if (opts.props) {
  //   initProps()
  // }
  if (opts.data) {
    initData(vm)
  }
  if (opts.computed) {
    initComputed(vm)
  }
  if (opts.watch) {
    initWatch(vm)
  }
}

function proxy (vm, target, key) {
  Object.defineProperty(vm, key, {
    get () {
      return vm[target][key]
    },
    set (newValue) {
      // if (newValue === vm[target][key]) return
      vm[target][key] = newValue
    }
  })
}

function initData (vm) {
  let data = vm.$options.data
  data = typeof data === 'function' ? data.call(vm) : data

  vm._data = data
  observe(data)

  // 将vm._data 用vm来代理就可以直接使用this.xxx访问到data里面的数据
  for (const key in data) {
    if (Object.hasOwnProperty.call(data, key)) {
      proxy(vm, '_data', key)
    }
  }
}


function initComputed (vm) {
  const computed = vm.$options.computed
  let watchers = vm._computedWatchers = {} // 将计算属性watcher保存到vm上
  for (const key in computed) {
    let userDef = computed[key]

    const fn = typeof userDef === 'function' ? userDef : userDef.get // 计算属性的get方法
    // 我们需要监控计算属性中get的变化 ,将属性和watcher关联起来
    watchers[key] = new Watcher(vm, fn, { lazy: true }) // 如果直接new 就会执行fn,但是我们在计算属性中不需要他立即执行,所以lazy:true

    defineComputed(vm, key, userDef)
  }
}

function initWatch (vm) {
  let watch = vm.$options.watch
  for (const key in watch) { // 字符串 数组 函数
    const handler = watch[key];
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}


function createWatcher (vm, key, handler) {
  // 字符串 函数 对象(不写了)
  if (typeof handler === 'string') {
    handler = vm[handler]
  }
  return vm.$watch(key, handler)
}

function defineComputed (target, key, userDef) {
  // const getter = typeof userDef === 'function' ? userDef : userDef.get
  const setter = userDef.set || (() => [])

  // 可以通过实例拿到对应的属性
  Object.defineProperty(target, key, {
    get: createComputedGetter(key),
    set: setter
  })
}

// 计算属性根本不会去收集依赖,只会让自己的依赖属性去收集依赖  vue3跟vue2不一样
function createComputedGetter (key) {
  // 我们要检测是否执行这个getter
  return function () {
    const watcher = this._computedWatchers[key] // 获取对应属性的watcher
    if (watcher.dirty) {
      // 如果是脏值 就去执行用户传入的函数
      watcher.evaluate()  // 求值之后 dirty变成了false 下次就不执行了
      // 并且求值的时候会去执行计算属性的回调函数,此时又会出触发回调里面的data的依赖收集,它此时会把dep全部收集到计算属性watcher的deps上
    }
    if (Dep.target) { //计算属性watcher出栈之后,还剩下一个渲染watcher,我们应该让计算属性watcher里面的依赖dep也去收集上一层的渲染watcher
      watcher.depend()
    }
    return watcher.value // 最后返回的是watcher上的值
  }
}

export function initStateMixin (Vue) {
  Vue.prototype.$nextTick = nextTick

  // 最终调用的都是这个方法
  Vue.prototype.$watch = function (exprOrFn, cb, options = {}) {
    // console.log(exprOrFn, cb);
    // firstName
    // ()=>vm.firstName
    // firstName的值变化了 直接执行cb函数
    new Watcher(this, exprOrFn, { user: true }, cb)
  }
}