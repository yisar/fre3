pub mod generator;
pub mod lexer;
pub mod parser;

fn main() {
    // println!("Hello, world!");
    let str = "function App(){
        const count = f.signal(0)
        return <button onclick={()=>count(count()+1)}>111{count()}</button>
    }
    document.body.appendChild(<App/>)";
    let mut p = parser::Parser::new(str);
    let root = p.parse_all().unwrap();
    // println!("{:#?}", p.lexer.tokens);
    println!("{:#?}", root);
    let mut g = generator::Generator::new(root.clone());
    let out = g.generate();
    println!("{:#?}", out)
}
