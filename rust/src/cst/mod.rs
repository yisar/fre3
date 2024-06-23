mod pure;
mod sll;

use std::{
    cell::{Cell, RefCell},
    fmt, iter,
    rc::{self, Rc}, borrow::Borrow,
};

pub use pure::{PureTree, PureTreeData};
use rc::Weak;

#[derive(Clone)]
pub struct SyntaxTree {
    data: Rc<SyntaxTreeData>,
}

struct SyntaxTreeData {
    pure: RefCell<PureTree>,

    parent: Cell<Option<SyntaxTree>>,
    index: Cell<usize>,

    first: Cell<rc::Weak<SyntaxTreeData>>,
    // Invariant: never null
    next: Cell<rc::Weak<SyntaxTreeData>>,
    prev: Cell<rc::Weak<SyntaxTreeData>>,
}

impl sll::Elem for SyntaxTreeData {
    fn prev(&self) -> &Cell<Weak<Self>> {
        &self.prev
    }
    fn next(&self) -> &Cell<Weak<Self>> {
        &self.next
    }
    fn key(&self) -> &Cell<usize> {
        &self.index
    }
}

impl SyntaxTree {
    fn new(pure: PureTree, parent: Option<SyntaxTree>, index: usize) -> SyntaxTree {
        let data = SyntaxTreeData {
            pure: RefCell::new(pure),
            parent: Cell::new(parent),
            index: Cell::new(index),
            first: Default::default(),
            next: Default::default(),
            prev: Default::default(),
        };
        let data = Rc::new(data);
        data.next.set(Rc::downgrade(&data));
        data.prev.set(Rc::downgrade(&data));
        SyntaxTree { data }
    }
    pub fn kind(&self) -> String {
        self.data.pure.borrow().kind().to_string()
    }
    pub fn parent(&self) -> Option<SyntaxTree> {
        let ret = self.data.parent.take();
        self.data.parent.set(ret.clone());
        ret
    }
    pub fn first_child(&self) -> Option<SyntaxTree> {
        self.get_child(0)
    }
    pub fn next_sibling(&self) -> Option<SyntaxTree> {
        let parent = self.parent()?;
        let index = self.data.index.get() + 1;
        parent.get_child(index)
    }
    pub fn prev_sibling(&self) -> Option<SyntaxTree> {
        let parent = self.parent()?;
        let index = self.data.index.get().checked_sub(1)?;
        parent.get_child(index)
    }
    fn get_child(&self, index: usize) -> Option<SyntaxTree> {
        let pure = self.data.pure.borrow().get_child(index).cloned()?;
        let parent = Some(self.clone());
        let mut res = SyntaxTree::new(pure, parent, index);
        sll::link(&self.data.first, &mut res.data);
        Some(res)
    }

    pub fn children(&self) -> impl Iterator<Item = SyntaxTree> {
        iter::successors(self.first_child(), |it| it.next_sibling())
    }
    pub fn find(&self, kind: &str) -> Option<SyntaxTree> {
        self.children().find(|it| it.kind() == kind)
    }

    pub fn insert_child(&self, index: usize, mut child: SyntaxTree) {
        assert!(child.parent().is_none());
        let weak = self.data.first.take();
        let first = weak.upgrade();
        self.data.first.set(weak);
        if let Some(first) = first {
            sll::adjust(&first, index, 1);
        }
        sll::link(&self.data.first, &mut child.data);

        let pure = self.data.pure.borrow().insert_child(index, child.data.pure.borrow().clone());
        self.replace_pure(pure)
    }
    pub fn detach(&self) {
        if let Some(parent) = self.parent() {
            let pure = parent.data.pure.borrow().remove_child(self.data.index.get());
            parent.replace_pure(pure);
        }
        sll::adjust(&self.data, self.data.index.get() + 1, -1);
        self.unlink();
    }
    pub fn replace_pure(&self, mut pure: PureTree) {
        let mut node = self.clone();
        loop {
            *node.data.pure.borrow_mut() = pure.clone();
            match node.parent() {
                Some(parent) => {
                    pure = parent.data.pure.borrow().replace_child(node.data.index.get(), pure);
                    node = parent
                }
                None => return,
            }
        }
    }
    fn unlink(&self) {
        let dummy;
        let parent = self.data.parent.take();
        let head = match parent.as_ref() {
            Some(it) => &it.data.first,
            None => {
                dummy = Cell::new(rc::Weak::new());
                &dummy
            }
        };
        sll::unlink(head, &self.data);
        self.data.index.set(0);
    }

    fn pure(&self) -> &RefCell<PureTree> {
       &self.data.pure
            
    }
}

impl Drop for SyntaxTree {
    fn drop(&mut self) {
        if Rc::strong_count(&self.data) == 1 {
            assert!(self.data.first.take().strong_count() == 0);
            self.unlink()
        }
    }
}

impl From<PureTree> for SyntaxTree {
    fn from(pure: PureTree) -> Self {
        SyntaxTree::new(pure, None, !0)
    }
}

impl fmt::Display for SyntaxTree {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt::Debug::fmt(&*self.pure().borrow(), f)
    }
}

impl fmt::Debug for SyntaxTree {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt::Debug::fmt(&*self.pure().borrow(), f)
    }
}

impl PartialEq for SyntaxTree {
    fn eq(&self, other: &SyntaxTree) -> bool {
        self.data.pure == other.data.pure
    }
}

impl Eq for SyntaxTree {}

impl fmt::Debug for SyntaxTreeData {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt::Debug::fmt(&*self.pure.borrow(), f)
    }
}