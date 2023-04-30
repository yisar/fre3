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
        let root = self.root.clone();
        return self.generate(root);
    }

    pub fn generate(&mut self, node: Node) -> String {
        let mut create = "".to_string();
        let mut update = "".to_string();
        let mut distory = "".to_string();

        for child in node.children {
            let out = self.generate_node(child);
            create = out.0;
            update = out.1;
            distory = out.2;
        }

        let mut prelude = "let ".to_string() + &self.get_element("0".to_string());

        let mut x = 1;

        while x < self.next {
            prelude = format!(",{}", self.get_element(x.to_string()));
            x += 1;
        }

        return format!(
            "{};return [function($){{{}",
            prelude,
            self.set_element("0".to_string(), "$".to_string())
        );
    }

    pub fn generate_node(&mut self, node: Node) -> (String, String, String) {
        let mut create = "".to_string();
        let mut update = "".to_string();
        let mut distory = "".to_string();

        return ("".to_string(), "".to_string(), "".to_string());
    }
}

impl Generator {
    pub fn get_element(&mut self, element: String) -> String {
        return "f".to_string() + &element;
    }

    pub fn set_element(&mut self, element: String, code: String) -> String {
        return self.get_element(element) + "=" + &code;
    }

    pub fn crate_element(&mut self, tag: String) -> String {
        return "f.ce".to_string() + "(" + &tag + ")";
    }

    pub fn crate_text_node(&mut self, tag: String) -> String {
        return "f.ctn".to_string() + "(" + &tag + ")";
    }

    pub fn set_attrbute(&mut self, atribute: (String, String), element: String) -> String {
        return format!(
            "f.sa({},\"{}\",\"{}\");",
            self.get_element(element),
            atribute.0,
            atribute.1
        );
    }

    pub fn add_event(&mut self, element: String, key: String, handler: String) -> String {
        return format!(
            "f.ael({},\"{}\",\"{}\");",
            self.get_element(element),
            key,
            handler
        );
    }

    pub fn set_text_content(&mut self, element: String, content: String) -> String {
        return format!("f.stc({},\"{}\");", self.get_element(element), content);
    }

    pub fn append_child(&mut self, parent: String, element: String) -> String {
        return format!(
            "f.ac({},\"{}\");",
            self.get_element(element),
            self.get_element(parent)
        );
    }

    pub fn remove_child(&mut self, parent: String, element: String) -> String {
        return format!(
            "f.rc({},\"{}\");",
            self.get_element(element),
            self.get_element(parent)
        );
    }

    pub fn insert_before(&mut self, parent: String, element: String, after: String) -> String {
        return format!(
            "f.ib({},\"{}\",\"{}\");",
            self.get_element(element),
            self.get_element(parent),
            self.get_element(after)
        );
    }
}
