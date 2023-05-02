#[derive(Clone, Debug, PartialEq)]
pub struct Lexer {
    pub code: String,
    pub tokens: Vec<Token>,
    pub is_jsx: bool,
    pub signal: usize,
}

impl Lexer {
    pub fn new(code: &str) -> Lexer {
        Lexer {
            code: code.to_string(),
            tokens: vec![],
            is_jsx: false,
            signal: 0,
        }
    }

    pub fn tokenize_all(&mut self) {
        let mut reading = false;
        let mut idx = 0;

        let to_read = self.code.clone();

        loop {
            let posible_last_token = self.tokens.last_mut();
            let posible_letter = to_read.chars().nth(idx);
            let posible_next_letter = to_read.chars().nth(idx + 1);

            match (posible_letter, posible_next_letter, posible_last_token) {
                (None, ..) => break,
                (Some('<'), Some(next_letter), _) => {
                    let token = if next_letter == '/' {
                        self.is_jsx = false;
                        Token::CloseTag(String::new())
                    } else {
                        self.is_jsx = true;
                        Token::OpenTag(String::from(next_letter))
                    };

                    self.tokens.push(token);
                    reading = true;
                    idx += 2;
                }
                (Some('/'), Some('>'), _) => {
                    if let Some(token) = self.tokens.iter_mut().rev().find(|i| match i {
                        Token::OpenTag(_) => true,
                        _ => false,
                    }) {
                        token.convert_to_self_close_tag();
                        self.is_jsx = false;
                        reading = false;
                    }

                    idx += 2;
                }
                (Some('{'), _, Some(Token::AttributeValue(_)))
                | (Some('{'), _, Some(Token::JSXText(_)))
                | (Some('{'), _, Some(Token::OpenTag(_))) => {
                    self.tokens.push(Token::Signal(String::new()));
                    reading = true;
                    idx += 1;
                }
                (Some('}'), next_letter, _) => {
                    if next_letter == Some('<') {
                        self.tokens.push(Token::CloseSignal(String::new()));
                        reading = false;
                    }

                    idx += 1;
                }
                (Some('>'), _, Some(last_token)) | (Some('"'), _, Some(last_token)) => {
                    match last_token {
                        Token::CloseTag(t) => {
                            reading = false;
                            idx += 1;
                        }
                        Token::AttributeValue(t) | Token::Signal(t) => {
                            let last_str = &t[(t.len() - 1)..(t.len())];
                            if last_str == "=" {
                                last_token.add('>');
                            };
                            idx += 1;
                        }

                        _ => {
                            idx += 1;
                        }
                    }
                }
                (Some('='), Some('"'), _) | (Some('='), Some('{'), _) => {
                    self.tokens.push(Token::AttributeValue(String::new()));
                    reading = true;
                    idx += 2;
                }
                (Some(' '), Some('/'), _) => {
                    reading = false;
                    idx += 2;
                }
                (Some(' '), _, Some(last_token @ Token::AttributeValue(_))) if reading => {
                    last_token.add(' ');
                    idx += 1;
                }
                (Some(' '), Some(next_letter), Some(Token::OpenTag(_)))
                | (Some(' '), Some(next_letter), Some(Token::AttributeValue(_)))
                    if next_letter != '/' && next_letter != ' ' =>
                {
                    self.tokens.push(Token::AttributeKey(String::new()));
                    reading = true;
                    idx += 1;
                }
                (Some(letter), _, _) if !reading => {
                    if self.is_jsx {
                        self.tokens.push(Token::JSXText(String::from(letter)));
                    } else {
                        self.tokens.push(Token::Text(String::from(letter)));
                    }

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
pub enum Token {
    Text(String),
    JSXText(String),
    Signal(String),
    OpenTag(String),
    CloseTag(String),
    CloseSignal(String),
    SelfCloseTag(String),
    AttributeKey(String),
    AttributeValue(String),
}

impl Token {
    fn add(&mut self, c: char) {
        match *self {
            Token::Text(ref mut s)
            | Token::Signal(ref mut s)
            | Token::JSXText(ref mut s)
            | Token::OpenTag(ref mut s)
            | Token::CloseTag(ref mut s)
            | Token::CloseSignal(ref mut s)
            | Token::SelfCloseTag(ref mut s)
            | Token::AttributeKey(ref mut s)
            | Token::AttributeValue(ref mut s) => {
                *s = String::from(s.clone()) + &String::from(c);
            }
        }
    }

    fn convert_to_self_close_tag(&mut self) {
        if let Token::OpenTag(tag) = &*self {
            *self = Token::SelfCloseTag(tag.clone());
        }
    }
}
