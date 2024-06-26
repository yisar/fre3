
use ast::Node;
use error::SyntaxResult;
use lex::Lexer;
use parse::Parser;

pub mod ast;
pub mod char;
pub mod error;
pub mod lex;
pub mod loc;
pub mod num;
pub mod operator;
pub mod parse;
pub mod token;
pub mod util;
pub mod visit;
pub mod pure;

pub fn parse(source: &[u8]) -> SyntaxResult<Node> {
  let lexer = Lexer::new(source);
  let mut parser = Parser::new(lexer);
  return parser.parse_top_level()
}
