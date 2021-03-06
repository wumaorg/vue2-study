import Watcher from "./observe/watcher"
import { createElementVNode, createTextVNode } from "../vdom"
import { patch } from "../vdom/patch"


export function initLifecycle (Vue) {
  Vue.prototype._render = function () {
    const vm = this
    // 让with的this指向vm
    // 当渲染的时候就会从实例中去取值,我们就可以将属性和视图绑定在一起
    return vm.$options.render.call(vm) //将AST语法转译后后生成的render方法
  }

  //_c('div',{},...children)
  Vue.prototype._c = function () {
    return createElementVNode(this, ...arguments)
  }

  Vue.prototype._v = function () {
    return createTextVNode(this, ...arguments)
  }

  Vue.prototype._s = function (value) {
    if (typeof value !== 'object') return value
    return JSON.stringify(value)
  }

  Vue.prototype._update = function (vnode) { // 将vnode转换成真实dom
    const vm = this
    const el = vm.$el
    // patch 既有初始化的功能 又有更新的功能
    vm.$el = patch(el, vnode)
  }
}


export function mountComponent (vm, el) {  // 这里的el是通过querySelector处理过的
  vm.$el = el

  //1.调用render函数产生虚拟dom
  // vm._render() // vm.$options.render 生成虚拟节点
  //2.根据虚拟dom生成真实dom
  console.log('虚拟dom:', vm._render());
  const updateComponent = () => {
    vm._update(vm._render())
  }
  const watchers = new Watcher(vm, updateComponent, true) // true用于标识是渲染watcher
  // console.log(watchers);
  //3.插入到真实dom
}



// Vue核心流程  
// 1) 创建了响应式数据
// 2) 模板转换成ast语法树
// 3) 将ast语法树转换成render函数
// 4) 后续每次数据更新可以直接执行render函数(无需再次执行ast转换的过程)


// render函数会产生虚拟节点(使用响应式数据)
// 根据生成的虚拟节点创建真实的dom



export function callHook (vm, hook) {
  const handlers = vm.$options[hook]
  if (handlers) {
    handlers.forEach(handler => handler.call(vm))
  }
}