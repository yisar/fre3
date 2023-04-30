pub mod lexer;
pub mod parser;

fn main() {
    // println!("Hello, world!");
    let str = "function App(){
        return <div><h1>hello world</h1></div>
    }";
    let mut p = parser::Parser::new(str);
    let root = p.parse_all();
    // println!("{:#?}", lexer.tokens)
    // let mut out = old_parser::parse(str.to_string());
    println!("{:#?}", root)


}
