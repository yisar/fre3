use crate::parser::Node;

#[derive(Clone, Debug, PartialEq)]
pub struct Generator {
    pub root: Node,
    pub next: usize,
}

impl Generator {
    pub fn new(root: Node) -> Generator {
        Generator { root, next: 0 }
    }

    pub fn generate_fre(&mut self) -> String {
        return self.generate();
    }

    pub fn generate(&mut self) -> String {
        let node = self.root.clone();
        let mut code = "".to_string();

        for child in node.children {
            let out = self.generate_jsx(child);
            code = format!("{}{}", code, out);
        }

        return code;
    }

    pub fn generate_prelude(&mut self, start: usize) -> String {
        let mut prelude = "let f0".to_string();

        let mut x = start;

        while x <= self.next {
            prelude = format!("{},{}", prelude, self.get_element(&x.to_string()));
            x += 1;
        }

        return format!("{};", prelude);
    }

    pub fn generate_jsx(&mut self, node: Node) -> String {
        let mut code = "".to_string();
        match node.kind {
            4 => {
                let text_id = self.next.to_string();
                let text_code = self.set_text_content(text_id, node.tag);
                code = format!("{}{}", code, text_code);
                return code;
            }
            3 => {
                if node.children.len() == 0 {
                    // 简单节点
                    let text_id = self.next.to_string();
                    let text_code = self.set_text_content(text_id, node.tag);
                    let out = self.set_computed(text_code);
                    code = format!("{}{}", code, out);
                    return code;
                }
                code = format!("{}{}", code, node.tag);
                for child in node.children {
                    let child_code = self.generate_jsx(child);
                    println!("{:#?}", child_code);
                    code = format!("{}{}", code, child_code);
                }
                return self.set_computed(code);
            }
            2 => {
                code = format!("{}{}", code, node.tag);
                return code;
            }
            1 => {
                if node.tag.chars().nth(0).unwrap().is_uppercase() {
                    code = format!("{}{}()", code, node.tag);
                    return code;
                }
                let parent_id = self.next.to_string();
                self.next += 1;
                let element_id = self.next.to_string();
                let element_code = self.crate_element(node.tag);
                let create_code = self.set_element(&element_id, element_code);
                let append_code = self.append_child(&parent_id, &element_id);
                let pre = self.generate_prelude(self.next);

                code = format!("{}{}", code, create_code);

                for prop in node.props {
                    if &prop.0[0..2] == "on" {
                        code = format!("{}{}", code, self.add_event(&element_id, prop.0, prop.1));
                    } else {
                        code = format!("{}{}", code, self.set_attrbute(prop, &element_id));
                    }
                }

                for child in node.children {
                    let child_code = self.generate_jsx(child);
                    println!("{:#?}", child_code);
                    code = format!("{}{}", code, child_code);
                }

                code = format!("(()=>{{{}{}{}\nreturn f1;}})()\n", pre, code,append_code);

                return code;
            }
            _ => {}
        }
        return code;
    }
}

impl Generator {
    pub fn get_element(&mut self, element: &String) -> String {
        return format!("{}{}", "f", &element);
    }

    pub fn set_element(&mut self, element: &String, code: String) -> String {
        return format!("{}={}", self.get_element(element), code);
    }

    pub fn crate_element(&mut self, tag: String) -> String {
        return format!("f.ce('{}');", tag);
    }

    pub fn crate_text_node(&mut self, tag: String) -> String {
        return format!("f.ctn('{}');", tag);
    }

    pub fn set_attrbute(&mut self, atribute: (String, String), element: &String) -> String {
        return format!(
            "f.sa({},'{}','{}');",
            self.get_element(&element),
            atribute.0,
            atribute.1
        );
    }

    pub fn add_event(&mut self, element: &String, key: String, handler: String) -> String {
        return format!(
            "f.ael({},'{}',{});",
            self.get_element(&element),
            key,
            handler
        );
    }

    pub fn set_computed(&mut self, code: String) -> String {
        return format!("f.computed(()=>{});", code);
    }

    pub fn set_text_content(&mut self, element: String, content: String) -> String {
        return format!("f.stc({},{})", self.get_element(&element), content);
    }

    pub fn append_child(&mut self, parent: &String, element: &String) -> String {
        return format!(
            "f.ac({},{});",
            self.get_element(parent),
            self.get_element(element),
        );
    }

    pub fn remove_child(&mut self, parent: String, element: String) -> String {
        return format!(
            "f.rc({},'{}');",
            self.get_element(&parent),
            self.get_element(&element),
        );
    }

    pub fn insert_before(&mut self, parent: String, element: String, after: String) -> String {
        return format!(
            "f.ib({},\"{}\",\"{}\");",
            self.get_element(&parent),
            self.get_element(&element),
            self.get_element(&after)
        );
    }
}
