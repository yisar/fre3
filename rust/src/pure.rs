use std::{
  cell::{Cell, RefCell},
  fmt, iter,
  rc::{self, Rc},
};

// pub use pure::{PureTree, PureTreeData};


use crate::ast::Node;

#[derive(Clone, Debug)]
pub struct PureTree {
    data: Rc<Pure>,
}

#[derive(Clone, Debug)]
pub struct Pure {
  pure: RefCell<Node>,
}

impl PureTree {
  pub fn new(pure: Node)->PureTree {

    let data = Pure { pure:RefCell::new(pure) };

    let data = Rc::new(data);
    return PureTree { data }
  }

  pub fn replace_pure(&self, mut pure: Node) {
    let mut node = self.clone();
    *node.data.pure.borrow_mut() = pure.clone();
  }
}
