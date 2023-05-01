# fre3

> 临时仓库，五一放假临时写一写

input:

```js
function App(){
    return <div><h1>hello world</h1></div>
}

document.body.appendChild(<App/>)
```
output:

```js
function App() {
    return (() => {
        let f0, f1, f2; 
        f1 = f.createElement('div'); 
        f2 = f.createElement('h1'); 
        f.setTextContent(f2, 'hello world');
        f.appendChild(f1, f2)
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


