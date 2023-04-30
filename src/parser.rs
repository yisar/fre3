use crate::lexer::{Lexer, Token};
use std::collections::HashMap;

#[derive(PartialEq, Debug)]
enum Actions {
    EmptyState,
    ReadingOpenTag,
    ReadingCloseTag,
}

#[derive(PartialEq, Debug)]
pub struct Node {
    pub tag: String,
    pub children: Vec<Node>,
    pub props: HashMap<String, Option<String>>,
}

impl Node {
    fn new(tag: String) -> Node {
        Node {
            tag,
            children: Vec::new(),
            props: HashMap::new(),
        }
    }
}

#[derive(Clone, Debug)]
pub struct Parser {
    pub lexer: Lexer,
}

impl Parser {
    pub fn new(code: &str) -> Parser {
        Parser {
            lexer: Lexer::new(code),
        }
    }

    pub fn parse_all(&mut self) -> Result<Node, ()> {
        self.lexer.tokenize_all();
        let (childs, idx) = self.parse_schild(self.lexer.tokens.clone());
        let mut node = Node::new("root".to_string());
        for child in childs {
            node.children.push(child);
        }

        return Ok(node);
    }

    pub fn parse_schild(&mut self, mut slice_tokens: Vec<Token>) -> (Vec<Node>, usize) {
        let mut idx = 0;
        let mut state: Vec<Actions> = vec![];
        let mut parsed: Vec<Node> = vec![];

        loop {
            if let Some(last_state) = state.last().clone() {
                if let Some(token) = slice_tokens.get_mut(idx) {
                    match &token {
                        Token::OpenTag(s) => {
                            state.push(Actions::ReadingOpenTag);
                            // let last_idx_parsed = parsed.len() - 1;
                            let mut node = Node::new(s.to_string());
                            idx += 1;

                            let tokens = slice_tokens[idx..].to_vec();

                            let (childs, readed) = self.parse_schild(tokens);

                            for child in childs {
                                node.children.push(child)
                            }
                            parsed.push(node);
                            idx += readed;
                        }

                        Token::CloseTag(s) => {
                            state.push(Actions::ReadingCloseTag);
                            idx += 1;
                            break (parsed, idx);
                        }
                        Token::Text(t) => {
                            idx += 1;
                            let n = Node::new(t.to_string());
                            parsed.push(n);
                        }

                        _ => {
                            idx += 1;
                        }
                    }
                } else {
                    let node = Node::new("\n".to_string());
                    break (parsed, idx);
                }
            } else {
                state.push(Actions::EmptyState)
            }
        }
    }
}
