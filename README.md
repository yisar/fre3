# fre3

> 临时仓库，五一放假临时写一写

input:

```js
function App(){
    const count = signal(0)
    return <button onclick={() => count(count() + 1)}>
        {count()}
    </button>
}

document.body.appendChild(<App/>)
```
output:

```js
function App() {
    const count = signal(0)
    return (() => {
        let f0, f1; 
        f1 = f.createElement('button');
        f1.addEventListener('click', () => count(count() + 1))
        computed(() => { // 是闭包！不是 Proxy!
            f.setTextContent(f2, count());
        });
        return f1;
    })()
}

document.appendChild(App())
```

### 动机

起因是想要将 fre 用于嵌入式跨端，嵌入式的特点，要求最小的空间，内存占用，最低的复杂度，不坏的性能

fre2 由于使用了 VDOM，不可能在内存和算法复杂度方面做到极致

同理，React 和 Vue 也是如此，庞大的 vdom 结构和 O(ND) 的 diff 算法，对嵌入式来说是灾难

fre3 使用全新的思路，走纯编译路线，将 JSX 编译为原生 dom 指令，而不是 VDOM，重编译时，轻运行时

> 目标：最小的内存占用，尽可能低的算法复杂度，不坏的性能

### 细节

1. 类似 solidjs，but...

solidjs 比 svelte 做的最大的一个优化，就是先一次性 innerHTML，再进行后续操作，这在 fre3 中是不可接受的，原因很简单，嵌入式没有 innerHTML 这种骚方法

fre3 使用手写的编译器，而不是 babel，这是完全可行的，但就无法利用 babel 的生态了就是

2. No Proxy

Proxy 的解构是个致命缺陷，很多 js 引擎也不支持 Proxy（如 hermes），fre3 使用闭包来做到细粒度响应式，不需要 Proxy
