import { isObject } from './utils.js';
import { watchEffect } from './reactive.js';

function createAppAPI (render) {
  // 在这里安装插件
  const installPlugins = new Set();
  return function (context) {
    // 返回Vue实例
    return {
      use(plugin, ...options) {},
      mixin(mixin) {},
      component(name, component) {},
      directive(name, directive) {},
      mount (container) {
        container = new String(container);
        // vue3新出的Composition API的setup，这个方法会在beforeCreate之前执行
        // 第一个形参为props，第二个为上下文context,返回值为可以挂载模板上
        const getVnode = renderComponentRoot(context);
        // 数据改变页面变化，用了watchEffect，重新对页面渲染
        watchEffect(() => {
          const vnode = getVnode();
          // 将上下文存入虚拟节点便于后序使用
          vnode.appContext = context;
          context.subTree = vnode;
          // 第一个形参表示根节点的虚拟dom，第二个形参代表挂载到的容器的id
          render(vnode, container)
        }) 
      }
    }
  }
}

// 这里面会做具体的虚拟dom的生成,
function renderComponentRoot ({ setup }) {
  return setup && setup(
    new Proxy({}, {}),
    { attrs: null,
      emit: null,
      expose: () => {},
      slots: null,
      props: null
    })
}

// 可以自定义的渲染函数，通过暴露像querySelector这样的选项，进行dom操作
function createRenderer ({ querySelector, createElement, insert }) {
  const render = (vnode, container) => {
    // 这里进行新旧节点的比较
    function patch (oldVnode, newVnode, container) {
      if (oldVnode) {
        // 这里进行更新dom操作，最长子序列比较
      } else {
        // 初始化dom
        const parent = querySelector(container);
        // 将旧节点的虚拟dom缓存起来
        container.vnode = vnode;
        const child = createElement(vnode.tag);
        if (typeof vnode.children === 'string') { parent.innerHTML = vnode.children }
        else {  }
        insert(child, parent);
      }
    }
    patch(container._vnode || null, vnode, container);
  }
  return {
    render,
    hydrate: {},
    createApp: createAppAPI(render)
  }
}

// vue3有默认的渲染选项，这里是我简单自定义的选项
const ensureRenderer = () => createRenderer({
  querySelector (sel) {
    return document.querySelector(sel);
  },
  createElement (tag) {
    return document.createElement(tag);
  },
  insert (child, parent) {
    if (parent) {
      parent.appendChild(child);
    }
  }
})

function h (tag, attrs, children) {
  if (isObject(tag)) {
    // TODO 这里是组件生成vnode的逻辑
    return tag;
  } else if (typeof tag === 'string') {
    // 这是自己写的骚操作不是源码
    if (typeof children === 'string') {
      children = new Function('obj',
       'with (obj) {return `'+ children.replace(/\{\{(.+)?\}\}/g, '${$1}') + '`}')(attrs.props);
    }
    return {
      tag,
      attrs,
      children
    }
  }
}

export {
  ensureRenderer,
  createRenderer,
  h
};
