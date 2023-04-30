use std::collections::HashMap;

#[derive(PartialEq, Debug)]
pub struct HtmlElement {
    pub node_type: String,
    pub text_content: String,
    pub child_nodes: Vec<HtmlElement>,
    pub attributes: HashMap<String, Option<String>>,
}

impl HtmlElement {
    fn new(node_type: String) -> HtmlElement {
        HtmlElement {
            node_type: node_type,
            child_nodes: Vec::new(),
            attributes: HashMap::new(),
            text_content: String::new(),
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct Lexer {
    pub code: String,
    pub tokens: Vec<Tokens>,
}

impl Lexer {
    pub fn new(code: &str) -> Lexer {
        Lexer {
            code: code.to_string(),
            tokens: vec![],
        }
    }

    pub fn lexer(&mut self)  {
        let mut reading = false;
        let mut idx = 0;

        let to_read = self.code.clone();

        loop {
            let posible_last_token = self.tokens.last_mut();
            let posible_letter = to_read.chars().nth(idx);
            let posible_next_letter = to_read.chars().nth(idx + 1);

            match (posible_letter, posible_next_letter, posible_last_token) {
                (None, ..) => {
                    break
                }
                (Some('<'), Some(next_letter), _) => {
                    let token = if next_letter == '/' {
                        Tokens::CloseTag(String::new())
                    } else {
                        Tokens::OpenTag(String::from(next_letter))
                    };

                    self.tokens.push(token);
                    reading = true;
                    idx += 2;
                }
                (Some('/'), Some('>'), _) => {
                    if let Some(token) = self.tokens.iter_mut().rev().find(|i| match i {
                        Tokens::OpenTag(_) => true,
                        _ => false,
                    }) {
                        token.convert_to_self_close_tag();
                        reading = false;
                    }

                    idx += 2;
                }
                (Some('>'), ..) | (Some('"'), ..) => {
                    reading = false;
                    idx += 1;
                }
                (Some('='), Some('"'), _) => {
                    self.tokens.push(Tokens::AttributeValue(String::new()));
                    reading = true;
                    idx += 2;
                }
                (Some(' '), Some('/'), _) => {
                    reading = false;
                    idx += 2;
                }
                (Some(' '), _, Some(last_token @ Tokens::AttributeValue(_))) if reading => {
                    last_token.add(' ');
                    idx += 1;
                }
                (Some(' '), Some(next_letter), Some(Tokens::OpenTag(_)))
                | (Some(' '), Some(next_letter), Some(Tokens::AttributeValue(_)))
                    if next_letter != '/' && next_letter != ' ' =>
                {
                    self.tokens.push(Tokens::AttributeKey(String::new()));
                    reading = true;
                    idx += 1;
                }
                (Some(letter), _, _) if !reading => {
                    self.tokens.push(Tokens::Text(String::from(letter)));
                    reading = true;
                    idx += 1;
                }
                (Some(letter), _, Some(last_token)) => {
                    last_token.add(letter);
                    idx += 1;
                }
                _ => {}
            }
        }
    }
}

#[derive(PartialEq, Debug, Clone)]
pub enum Tokens {
    Text(String),
    OpenTag(String),
    CloseTag(String),
    SelfCloseTag(String),
    AttributeKey(String),
    AttributeValue(String),
}

impl Tokens {
    fn add(&mut self, c: char) {
        match *self {
            Tokens::Text(ref mut s)
            | Tokens::OpenTag(ref mut s)
            | Tokens::CloseTag(ref mut s)
            | Tokens::SelfCloseTag(ref mut s)
            | Tokens::AttributeKey(ref mut s)
            | Tokens::AttributeValue(ref mut s) => {
                *s = String::from(s.clone()) + &String::from(c);
            }
        }
    }

    fn convert_to_self_close_tag(&mut self) {
        if let Tokens::OpenTag(tag) = &*self {
            *self = Tokens::SelfCloseTag(tag.clone());
        }
    }
}

fn parser(_tokens: Vec<Tokens>) -> Vec<HtmlElement> {
    vec![]
}

/// Returns a parsed html with the value given them
///
/// # Arguments
///
/// * `html` - A string os the html to parse
///
/// # Examples
///
/// ```
/// use crate::rust_simple_parser::HtmlElement;
/// use crate::rust_simple_parser::parse;
/// use std::collections::HashMap;
///
///	let html = String::from("<h1>Olá Marcos</h1>");
///	let parsed = parse(html);
///
///	let expected: Vec<HtmlElement> = vec![
///		HtmlElement {
///			text_content: String::from("Olá Marcos"),
///			node_type: String::from("h1"),
///			attributes: HashMap::new(),
///			child_nodes: Vec::new(),
///		}
///	];
///
/// assert_eq!(expected, parsed);
/// ```
pub fn parse(html: String) {
    // let tokens = lexer(html);
    // println!("{:#?}", tokens);

    // let parsed = parser(tokens);

    // parsed
}
