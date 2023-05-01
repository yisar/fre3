extern crate wasm_bindgen;

use wasm_bindgen::prelude::*;

pub mod generator;
pub mod lexer;
pub mod parser;

#[wasm_bindgen]
pub fn compile(str: &str) -> String {
    let mut p = parser::Parser::new(str);
    let root = p.parse_all().unwrap();
    let mut g = generator::Generator::new(root.clone());
    let out = g.generate();
    return out;
}
