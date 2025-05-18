# fre3

input

```js
export default () => <>
      <button onClick={() => setCount(c => c + 1)}>
      <span>{count()}</span>
        {doubleCount()}
      </button>
    </>
```

output
```js
import { createElement as $createElement, setProp as $setProp, insertNode as $insertNode, insertSignal as $insertSignal } from 'fre'

export default () => (() => {
  var $el1 = $createElement("button");
  $setProp($el1, "onClick", () => setCount((c) => c + 1));
  var $el2 = $createElement("span");
  $insertNode($el2, $el1);
  $insertSignal($el2, count);
  $insertSignal($el2, doubleCount);
})();
```
