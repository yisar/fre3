use crate::ast::Node;
use std::{cell::RefCell, sync::Arc};

#[derive(Clone, Debug)]
pub struct PureTree {
  data: Arc<Pure>,
}

#[derive(Clone, Debug)]
pub struct Pure {
  pure: RefCell<Node>,
}

impl PureTree {
  pub fn new(pure: Node) -> PureTree {
    let data = Pure {
      pure: RefCell::new(pure),
    };

    let data = Arc::new(data);
    return PureTree { data };
  }

  pub fn replace_pure(&self, pure: Node) {
    let node = self.clone();
    *node.data.pure.borrow_mut() = pure.clone();
  }
}

impl From<Node> for PureTree {
    fn from(node: Node) -> PureTree {
        PureTree::new(node)
    }
}

impl From<PureTree> for Node {
    fn from(pure: PureTree) -> Node {
        pure.data.pure.borrow().to_owned()
    }
}