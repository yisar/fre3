use crate::lexer::{Lexer, Token};

#[derive(PartialEq, Debug, Clone)]
pub struct Node {
    pub kind: usize,
    pub tag: String,
    pub children: Vec<Node>,
    pub props: Vec<(String, String)>,
}

impl Node {
    fn new(tag: String) -> Node {
        Node {
            kind: 0,
            tag,
            children: Vec::new(),
            props: Vec::new(),
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
        let (childs, idx,_) = self.parse_schild(self.lexer.tokens.clone());
        let mut node = Node::new("root".to_string());
        for child in childs {
            node.children.push(child);
        }

        return Ok(node);
    }

    pub fn parse_schild(
        &mut self,
        mut slice_tokens: Vec<Token>,
    ) -> (Vec<Node>, usize, Vec<(String, String)>) {
        let mut idx = 0;
        let mut parsed: Vec<Node> = vec![];
        let mut props: Vec<(String, String)> = vec![];

        loop {
            if let Some(token) = slice_tokens.get_mut(idx) {
                match &token {
                    Token::OpenTag(s) => {
                        let mut node = Node::new(s.to_string());
                        idx += 1;

                        let tokens = slice_tokens[idx..].to_vec();

                        let (childs, readed, props) = self.parse_schild(tokens);

                        for child in childs {
                            node.children.push(child)
                        }
                        node.props = props;
                        parsed.push(node);
                        idx += readed;
                    }

                    Token::AttributeKey(k) => {
                        //todo
                        // let last_idx_parsed = parsed.len() - 1;
                        props.push((k.to_string(), "".to_string()));
                        idx += 1;
                    }

                    Token::AttributeValue(v) => {
                        //todo
                        let last_props = props.len() - 1;
                        let k = &props[last_props].0;
                        props[last_props] = (k.to_string(), v.to_string());
                        idx += 1;
                    }

                    Token::SelfCloseTag(k) => {
                        //todo
                        idx += 1;
                    }

                    Token::CloseTag(s) => {
                        idx += 1;
                        break (parsed, idx, props);
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
                break (parsed, idx, vec![]);
            }
        }
    }
}
