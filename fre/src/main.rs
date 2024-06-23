
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

  // let func = make_tree();
  // println!("{:#?}", func);

  let tree = parse(src.as_bytes()).unwrap();
  
  println!("{:#?}", tree);
}
