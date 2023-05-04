pub mod lexer;
pub mod parser;
pub mod generator;

fn main() {
    // println!("Hello, world!");
    let code = "function App(){
        return <div onclick={()=>{add()}}>{list.map(a=><i>{a()}</i>)}</div>
    }";
    let mut parser = parser::Parser::new(code);
    let root = parser.parse_all().unwrap();
    println!("{:#?}", root);
    let mut g = generator::Generator::new(root);
    let out = g.generate();
    println!("{}",out);
}
