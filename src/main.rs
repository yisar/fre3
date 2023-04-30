pub mod lexer;
pub mod parser;
// pub mod generator;

fn main() {
    // println!("Hello, world!");
    let str = "function App(){
        return <div a=\"b\" c=\"d\"><h1>hello world</h1></div>
    }";
    let mut p = parser::Parser::new(str);
    let root = p.parse_all().unwrap();
    // println!("{:#?}", p.lexer.tokens)
    println!("{:#?}", root)
    // let mut g = generator::Generator::new(root);


}
