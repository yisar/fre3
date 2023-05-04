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
    pub code: String,
    pub reading: bool,
}

impl Parser {
    pub fn new(code: &str) -> Parser {
        Parser {
            reading: false,
            code: code.to_string(),
            lexer: Lexer::new(code),
        }
    }

    pub fn parse_all(&mut self) -> Result<Node, ()> {
        self.lexer.tokenize(self.code.to_string(), false);
        let (childs, _, _) = self.parse_child(self.lexer.tokens.clone());
        let mut node = Node::new("root".to_string());
        for child in childs {
            node.children.push(child);
        }
        return Ok(node);
    }

    pub fn parse_child(
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
                        if self.reading {
                            self.reading = false;
                            break (parsed, idx, props);
                        }
                        let mut node = Node::new(s.to_string());
                        idx += 1;

                        let tokens = slice_tokens[idx..].to_vec();

                        let (childs, readed, props) = self.parse_child(tokens);

                        for child in childs {
                            node.children.push(child)
                        }
                        if node.children[0].kind == 3 {
                            node.kind = 5
                        }
                        node.props = props;
                        node.kind = 1;
                        parsed.push(node);
                        idx += readed;
                    }

                    Token::AttributeKey(k) => {
                        props.push((k.to_string(), "".to_string()));
                        idx += 1;
                    }

                    Token::AttributeValue(v) => {
                        let last_props = props.len() - 1;
                        let k = &props[last_props].0;
                        props[last_props] = (k.to_string(), v.to_string());
                        idx += 1;
                    }

                    Token::SelfCloseTag(s) => {
                        self.reading = true;
                        let mut node = Node::new(s.to_string());
                        idx += 1;
                        let tokens = slice_tokens[idx..].to_vec();
                        let (childs, readed, props) = self.parse_child(tokens);

                        for child in childs {
                            node.children.push(child)
                        }
                        node.props = props;
                        node.kind = 1;
                        parsed.push(node);
                        idx += readed;
                    }

                    Token::CloseTag(_) => {
                        idx += 1;
                        break (parsed, idx, props);
                    }
                    Token::Text(t) => {
                        if self.reading {
                            self.reading = false;
                            break (parsed, idx, props);
                        }
                        idx += 1;

                        let mut n = Node::new(t.to_string());
                        n.kind = 2;
                        parsed.push(n);
                    }
                    Token::Code(t) => {
                        if self.reading {
                            self.reading = false;
                            break (parsed, idx, props);
                        }
                        idx += 1;

                        let mut n = Node::new(t.to_string());
                        n.kind = 3;
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
