use parse_js::ast::{Node, Syntax};
use parse_js::pure::{PureTree};
// use parse_js::cst::*;
use parse_js::loc::Loc;
use parse_js::parse;

fn main() {
  let src = r#"
  import { render, useState } from 'fre'

  function App() {
    const [count, setCount] = useState(0)
    return <>
        <h1>{count}</h1>
        <button onClick={() => setCount(count + 1)}>+</button>
      </>
  }
  
  render(<App/>, document.body)
    "#;

  let tree = parse(src.as_bytes()).unwrap();

  let pure: PureTree = PureTree::new(tree);

  let node2 = Node::new(
      Loc(0, 0),
      Syntax::IdentifierExpr {
        name: "bbb".to_string(),
      },
    
  );

  pure.replace_pure(node2);

  println!("{:#?}", <PureTree as Into<Node>>::into(pure));
}
