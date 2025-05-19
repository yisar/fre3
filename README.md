# fre3

input

```jsx
import { signal } from 'fre'

function Counter() {
  const count = signal(0)
  const doubleCount = computed(count() * 2)
  return <>
    <button onClick={() => setCount(c => c + 1)}>
      <span>{count()}</span>
      {doubleCount()}
    </button>
  </>
}
```

output
```js
import { createElement as $createElement, setProp as $setProp, insertNode as $insertNode, insertSignal as $insertSignal } from 'fre'
import { signal } from 'fre'

function Counter() {
  const count = signal(0)
  const doubleCount = computed(count() * 2)
  return (() => {
    var $el1 = $createElement("button");
    $setProp($el1, "onClick", () => setCount(c => c + 1));
    var $el2 = $createElement("span");
    $insertNode($el1, $el2);
    $insertSignal($el2, count);
    $insertSignal($el2, doubleCount);
  })();
}
```
todo:
1. jsx 部分可以不保留空格
