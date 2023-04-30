# fre3

> 临时仓库，五一放假临时写一写

主要思路如下：

1. simlar with solidjs，but noneed babel
2. binary CST but not AST
3. arena tree

说人话？

使用 solidjs 的编译思路，将 JSX 编译为原生 dom 命令，但是不需要 babel，这个思路其实我在 asta 中已经尝试过了，是完全 ok 的
但是和 asta 不同，这次我决定用 rust 写，所以——rust的结构非常难办，我不得不尝试一个全新的结构：binary CST

什么是 binary CST?

CST 对于 AST，更加偏向于完整记录字符串，它不会对字符串进行“抽象描述”

```js
let TEXT = 1 << 1;
let JSXElEment = 1 << 2;
let Identity = 1 << 10;
let Keyword = 1 << 11;

{ kind: TEXT, flags: Identity & Keyword , start: 0, end: 10 }

// visitor
if (kind & TEXT){
    // todo more thing
}

// println! 每个节点只有数字和字符串
{
    kind: 8,
    flags: 144,
    raw: 'let a = 0;',
    start: 0,
    end: 10
}
```
这样做的好处，主要是 rust 的结构比较受限，使用这个结构可以完美适配 rust
另外一点，这样做性能还会很好，因为全都是二进制和位运算了嘛