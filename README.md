# fre3

input

```jsx
import { signal } from 'fre'

function Counter() {
  const count = signal(0)
  const doubleCount = computed(count() * 2)
  return <>
    <button onClick={() => count(count() + 1)}>
      <span>hello</span>
      {word}
    </button>
  </>
}
```

output
```js
import { createElement as $createElement, setProp as $setProp, insertNode as $insertNode, insertSignal as $insertSignal } from 'fre'
import { signal } from 'fre'

function Counter() {
  const count = signal(0);
  const doubleCount = computed(count() * 2);
  return (() => {
    var $el1 = $createElement("button");
    $setProp($el1, "onClick", () => setCount(count() + 1));
    var $el2 = $createElement("span");
    $insertNode($el1, $el2);
    var $el3 = $createTextNode("hello");
    $insertNode($el2, $el3);
    $insertContent($el1, word);
    return $el1;
  })();
}
```
todo:
1. jsx 部分可以不保留空格
2. jsx 文字节点解析
3. pid 算不准
