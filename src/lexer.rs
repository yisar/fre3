use regex::Regex;

#[derive(Clone, Debug, PartialEq)]
pub struct Lexer {
    pub code: String,
    pub tokens: Vec<Token>,
}

#[derive(PartialEq, Debug, Clone)]
pub enum Token {
    Code(String),
    Text(String),
    OpenTag(String),
    CloseTag(String),
    SelfCloseTag(String),
    AttributeKey(String),
    AttributeValue(String),
}

impl Lexer {
    pub fn new(code: &str) -> Lexer {
        Lexer {
            code: code.to_string(),
            tokens: vec![],
        }
    }

    pub fn start(&mut self, code: String) -> isize {
        let re = Regex::new(r"<([\w]+).*?>").unwrap();
        let caps = re.captures(&code);

        match caps {
            Some(c) => {
                return c.get(0).unwrap().start() as isize;
            }
            None => {
                return -1;
            }
        }
    }

    pub fn read_head(&mut self, code: &String, is_block: bool) -> isize {
        let end = self.start(code.to_string());
        if end == -1 {
            return -1;
        }
        let code = &code[0..end as usize];
        if code.len() > 0 {
            if is_block {
                self.tokens.push(Token::Code(code.to_string()));
            } else {
                self.tokens.push(Token::Text(code.to_string()));
            }
        }

        // FXEYYKFNKX4E4RGQ

        return end;
    }

    pub fn tokenize(&mut self, input: String, is_block: bool) -> usize {
        let code = input.clone();
        let end = self.read_head(&code, is_block);

        if end == -1 {
            // tobe fixed
            self.tokens.push(Token::Code(code.to_string()));
            return code.len();
        }

        let mut i = end as usize;

        loop {
            let current_letter = code.chars().nth(i);
            let next_letter = code.chars().nth(i + 1);
            match (current_letter, next_letter) {
                (None, ..) => {
                    break i;
                }
                (Some(' '), Some(' ')) | (Some('>'), Some(_)) => {
                    i += 1;
                }

                (Some('{'), _) => {
                    let (_, end) = self.read_block(code[i..].to_string());
                    i += end;
                }

                (Some(' '), _) => {
                    let (key, end) = self.read_attrbute_key(code[i..].to_string());
                    self.tokens.push(Token::AttributeKey(key));
                    i += end;
                }

                (Some('='), _) => {
                    let (value, end) = self.read_attrbute_value(code[i..].to_string());
                    self.tokens.push(Token::AttributeValue(value));
                    i += end;
                }
                (Some('<'), Some(next_letter)) => {
                    if next_letter == '/' {
                        i += 2;
                        let (tag, end, _) = self.read_tag(code[i..].to_string());
                        self.tokens.push(Token::CloseTag(tag));
                        i += end;
                        break i;
                    } else {
                        i += 1;
                        let (tag, end, selfclose) = self.read_tag(code[i..].to_string());
                        i += end;
                        if selfclose {
                            self.tokens.push(Token::SelfCloseTag(tag));
                        } else {
                            self.tokens.push(Token::OpenTag(tag));
                        }
                    };
                }
                _ => {
                    let (text, end) = self.read_text(code[i..].to_string());
                    self.tokens.push(Token::Text(text));
                    i += end;
                }
            }
        }
    }

    pub fn read_block(&mut self, code: String) -> (String, usize) {
        let mut i = 0;
        let mut block = "".to_string();
        let mut count = 1;
        i += 1;

        loop {
            let current_letter = code.chars().nth(i);
            match current_letter {
                Some('{') => {
                    count += 1;
                }
                Some('}') => {
                    count -= 1;
                }
                _ => {}
            }

            if count == 0 {
                let end = self.tokenize(block.clone(), true);
                let code = block[end..].to_string();
                if code.len() > 0 {
                    self.tokens.push(Token::Code(code));
                }

                break (block, i + 1);
            } else {
                block += &String::from(current_letter.unwrap());
                i += 1;
            }
        }
    }

    pub fn read_tag(&mut self, code: String) -> (String, usize, bool) {
        let mut i = 0;
        let mut tag = "".to_string();

        loop {
            let current_letter = code.chars().nth(i);
            let next_letter = code.chars().nth(i + 1);

            match (current_letter, next_letter) {
                (Some('/'), Some('>')) => {
                    i += 2;
                    break (tag, i, true);
                }
                (Some('>'), _) => {
                    i += 1;
                    break (tag, i, false);
                }
                (Some(' '), _) => {
                    break (tag, i, false);
                }
                _ => {
                    tag += &String::from(current_letter.unwrap());
                    i += 1;
                }
            }
        }
    }

    pub fn read_attrbute_key(&mut self, code: String) -> (String, usize) {
        let mut i = 1;
        let mut key = "".to_string();

        loop {
            let current_letter = code.chars().nth(i);
            let next_letter = code.chars().nth(i + 1);

            match (current_letter, next_letter) {
                (Some('='), _) => {
                    // i += 1;
                    break (key, i);
                }
                _ => {
                    key += &String::from(current_letter.unwrap());
                    i += 1;
                }
            }
        }
    }
    pub fn read_attrbute_value(&mut self, code: String) -> (String, usize) {
        let mut i = 1;
        let mut value = "".to_string();

        loop {
            let current_letter = code.chars().nth(i);
            let next_letter = code.chars().nth(i + 1);

            match (current_letter, next_letter) {
                (Some(' '), _) | (Some('>'), _) => {
                    i += 1;
                    break (value, i);
                }
                (Some('{'), _) => {
                    let (block, end) = self.read_block(code[i..].to_string());
                    self.tokens.pop(); // 要出栈一个 code
                    i += end;
                    break (block, i);
                }
                _ => {
                    value += &String::from(current_letter.unwrap());
                    i += 1;
                }
            }
        }
    }
    pub fn read_text(&mut self, code: String) -> (String, usize) {
        let mut i = 0;
        let mut value = "".to_string();

        loop {
            let current_letter = code.chars().nth(i);

            match current_letter {
                Some('{') | Some('<') => {
                    break (value, i);
                }
                None => {
                    break (value, i);
                }
                _ => {
                    value += &String::from(current_letter.unwrap());
                    i += 1;
                }
            }
        }
    }
}
