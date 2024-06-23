use std::{sync::Arc};

use crate::ast::Node;

#[derive(Clone, Debug)]
pub struct PureTree {
  data: Arc<PureTreeData>,
}

#[derive(Clone, Debug)]
pub struct PureTreeData {
  kind: String,
  node: Node,
  children: Vec<PureTree>,
}

impl PureTree {
  pub fn new(kind: impl Into<String>, node: Node) -> PureTreeData {
    PureTreeData {
      kind: kind.into(),
      children: Vec::new(),
      node,
    }
  }
  pub fn kind(&self) -> &str {
    self.data.kind.as_str()
  }
  pub fn children(&self) -> impl Iterator<Item = &PureTree> + '_ {
    self.data.children.iter()
  }
  pub fn get_child(&self, index: usize) -> Option<&PureTree> {
    self.data.children.get(index)
  }
  pub fn remove_child(&self, index: usize) -> PureTree {
    let mut data = self.data.clone();
    Arc::make_mut(&mut data).children.remove(index);
    PureTree { data }
  }
  pub fn insert_child(&self, index: usize, child: PureTree) -> PureTree {
    let mut data = self.data.clone();
    Arc::make_mut(&mut data).children.insert(index, child);
    PureTree { data }
  }
  pub fn replace_child(&self, index: usize, child: PureTree) -> PureTree {
    let mut data = self.data.clone();
    Arc::make_mut(&mut data).children[index] = child;
    PureTree { data }
  }
}

impl PureTreeData {
  pub fn push(mut self, child: impl Into<PureTree>) -> PureTreeData {
    self.children.push(child.into());
    self
  }
}

impl From<PureTreeData> for PureTree {
  fn from(data: PureTreeData) -> PureTree {
    PureTree {
      data: Arc::new(data),
    }
  }
}


impl PartialEq for PureTree {
  fn eq(&self, other: &Self) -> bool {
    Arc::ptr_eq(&self.data, &other.data)
  }
}

impl Eq for PureTree {}
