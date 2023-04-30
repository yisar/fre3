pub mod lexer;

fn main() {
    // println!("Hello, world!");
    let str = "function App(){
        return <div>hello world</div>
    }";
    let mut lexer = lexer::Lexer::new(str);
    lexer.lexer();
    println!("{:#?}", lexer.tokens)
}
