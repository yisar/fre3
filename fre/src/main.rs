use parse_js::parse;

use parse_js::cst::*;

#[rustfmt::skip]
fn make_tree() -> SyntaxTree {
    fn kw(kw: &'static str) -> PureToken {
        PureToken::new(kw, kw)
    }
    fn op(kw: &'static str) -> PureToken {
        PureToken::new(kw, kw)
    }
    fn ident(ident: &str) -> PureToken {
        PureToken::new("ident", ident)
    }

    let func: PureTree = PureTree::new("function-decl")
        .push(kw("pub"))
        .push(kw("fun"))
        .push(PureTree::new("generic-param-list")
            .push(PureTree::new("param-decl")
                .push(ident("T"))
                .push(PureTree::new("param-bound")
                    .push(op(":"))
                    .push(ident("Clone"))
                )
            )
        )
        .push(PureTree::new("param-list").push(op("(")).push(op(")")))
        .push(PureTree::new("where-clause")
            .push(PureTree::new("where-pred")
                .push(ident("T"))
                .push(PureTree::new("param-bound")
                    .push(op(":"))
                    .push(ident("Eq"))
                )
            )
        ).into();
    func.into()
}

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

    let func = make_tree();
    println!("{:#?}", func);

  let mut node = parse(src.as_bytes());

  println!("{:#?}",node);
}
