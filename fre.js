const EMPTY_OBJECT = {}

const VTYPE_ELEMENT = 1
const VTYPE_FUNCTION = 2
const REF_SINGLE = 1
const REF_ARRAY = 4
const REF_PARENT = 8


let cursor = 0
let currentVnode = null
let rootRef = null

const isEmpty = (c) =>
    c === null || (Array.isArray(c) && c.length === 0)
const isNonEmptyArray = (c) => Array.isArray(c) && c.length > 0
const isLeaf = (c) => typeof c === "string" || typeof c === "number"
const isElement = (c) => c?.vtype === VTYPE_ELEMENT
const isComponent = (c) => c?.vtype === VTYPE_FUNCTION

function h(type, props, ...children) {
    props = props ?? EMPTY_OBJECT

    props =
        children.length > 1
            ? Object.assign({}, props, { children })
            : children.length === 1
                ? Object.assign({}, props, { children: children[0] })
                : props

    const vtype =
        typeof type === "string"
            ? VTYPE_ELEMENT
            : typeof type === "function"
                ? VTYPE_FUNCTION
                : 0

    return {
        vtype,
        type,
        props,
        key: props.key
    }
}

function Fragment(props) {
    return props.children
}

function getDomNode(ref) {
    if (ref.type === REF_SINGLE) {
        return ref.node
    } else if (ref.type === REF_ARRAY) {
        return getDomNode(ref.children[0])
    } else if (ref.type === REF_PARENT) {
        return getDomNode(ref.childRef)
    }
}

function getParentNode(ref) {
    if (ref.type === REF_SINGLE) {
        return ref.node.parentNode
    } else if (ref.type === REF_ARRAY) {
        return getParentNode(ref.children[0])
    } else if (ref.type === REF_PARENT) {
        return getParentNode(ref.childRef)
    }
}

function getNextSibling(ref) {
    if (ref.type === REF_SINGLE) {
        return ref.node.nextSibling
    } else if (ref.type === REF_ARRAY) {
        return getNextSibling(ref.children[ref.children.length - 1])
    } else if (ref.type === REF_PARENT) {
        return getNextSibling(ref.childRef)
    }
}

function insertDom(parent, ref, nextSibling) {
    if (ref.type === REF_SINGLE) {
        parent.insertBefore(ref.node, nextSibling)
    } else if (ref.type === REF_ARRAY) {
        ref.children.forEach((ch) => insertDom(parent, ch, nextSibling))
    } else if (ref.type === REF_PARENT) {
        insertDom(parent, ref.childRef, nextSibling)
    }
}

function removeDom(parent, ref) {
    if (ref.type === REF_SINGLE) {
        parent.removeChild(ref.node)
    } else if (ref.type === REF_ARRAY) {
        ref.children.forEach((ch) => removeDom(parent, ch))
    } else if (ref.type === REF_PARENT) {
        removeDom(parent, ref.childRef)
    }
}

function replaceDom(parent, newRef, oldRef) {
    insertDom(parent, newRef, getDomNode(oldRef))
    removeDom(parent, oldRef)
}

function mountAttributes(dom, props, isSvg) {
    for (var key in props) {
        if (key === "key" || key === "children") continue
        if (key[0] === 'o' && key[1] === 'n') {
            dom[key.toLowerCase()] = props[key]
        } else {
            setDOMAttribute(dom, key, props[key], isSvg)
        }
    }
}

function patchAttributes(dom, newProps, oldProps, isSvg) {
    for (var key in newProps) {
        if (key === "key" || key === "children") continue
        var oldValue = oldProps[key]
        var newValue = newProps[key]
        if (oldValue !== newValue) {
            if (key[0] === 'o' && key[1] === 'n') {
                dom[key.toLowerCase()] = newValue
            } else {
                setDOMAttribute(dom, key, newValue, isSvg.isSVG)
            }
        }
    }
    for (key in oldProps) {
        if (
            key === "key" ||
            key === "children" ||
            key in newProps
        )
            continue
        if (key[0] === 'o' && key[1] === 'n') {
            dom[key.toLowerCase()] = null
        } else {
            dom.removeAttribute(key)
        }
    }
}

function setDOMAttribute(el, name, value, isSvg) {
    if (value === true) {
        el.setAttribute(name, "")
    } else if (value === false) {
        el.removeAttribute(name)
    } else {
        if (isSvg) {
            el[name] = value
        } else {
            el.setAttribute(name, value)
        }
    }
}

function mount(vnode, isSvg) {
    if (isEmpty(vnode)) {
        return {
            type: REF_SINGLE,
            node: document.createComment("NULL"),
        }
    } else if (isLeaf(vnode)) {
        return {
            type: REF_SINGLE,
            node: document.createTextNode(vnode),
        }
    } else if (isElement(vnode)) {
        let node
        let { type, props } = vnode
        if (!isSvg) {
            node = document.createElement(type)
        } else {
            node = document.createElementNS("http://www.w3.org/2000/svg", type)
        }
        mountAttributes(node, props, isSvg)
        let childrenRef = props.children == null ? null : mount(props.children, isSvg)
        if (childrenRef != null) insertDom(node, childrenRef)
        return {
            type: REF_SINGLE,
            node,
            children: childrenRef,
        }
    } else if (isNonEmptyArray(vnode)) {
        return {
            type: REF_ARRAY,
            children: vnode.map((child) => mount(child, isSvg)),
        }
    } else if (isComponent(vnode)) {
        currentVnode = vnode


        let childVnode = vnode.type(vnode.props)
        cursor = 0

        let childRef = mount(childVnode, isSvg)

        return {
            type: REF_PARENT,
            childRef,
            childVnode,
        }
    } else if (vnode instanceof Node) {
        return {
            type: REF_SINGLE,
            node: vnode,
        }
    }
}

function patch(
    parent,
    newVnode,
    oldVnode,
    ref,
    isSvg
) {
    if (oldVnode === newVnode && !newVnode.dirty) {
        return ref
    } else if (isEmpty(newVnode) && isEmpty(oldVnode)) {
        return ref
    } else if (isLeaf(newVnode) && isLeaf(oldVnode)) {
        ref.node.nodeValue = newVnode
        return ref
    } else if (
        isElement(newVnode) &&
        isElement(oldVnode) &&
        newVnode.type === oldVnode.type
    ) {
        if (newVnode.type === "svg") {
            isSvg = true
        }
        patchAttributes(ref.node, newVnode.props, oldVnode.props, isSvg)
        let oldChildren = oldVnode.props.children
        let newChildren = newVnode.props.children
        if (oldChildren == null) {
            if (newChildren != null) {
                ref.children = mount(newChildren, isSvg)
                insertDom(ref.node, ref.children)
            }
        } else {
            if (newChildren == null) {
                ref.node.textContent = ""
                ref.children = null
            } else {
                ref.children = patchInPlace(
                    ref.node,
                    newChildren,
                    oldChildren,
                    ref.children,
                    isSvg
                )
            }
        }
        return ref
    } else if (isNonEmptyArray(newVnode) && isNonEmptyArray(oldVnode)) {
        patchChildren(parent, newVnode, oldVnode, ref, isSvg)
        return ref
    } else if (
        isComponent(newVnode) &&
        isComponent(oldVnode) &&
        newVnode.type === oldVnode.type
    ) {
        let fn = newVnode.type
        let shouldUpdate = newVnode.dirty || (fn.shouldUpdate != null
            ? fn.shouldUpdate(oldVnode.props, newVnode.props)
            : defaultShouldUpdate(oldVnode.props, newVnode.props))

        if (shouldUpdate) {
            currentVnode = newVnode
            let childVnode = fn(newVnode.props)
            cursor = 0
            let childRef = patch(
                parent,
                childVnode,
                ref.childVnode,
                ref.childRef,
                isSvg
            )
            if (childRef !== ref.childRef) {
                return {
                    type: REF_PARENT,
                    childRef,
                    childVnode,
                }
            } else {
                ref.childVnode = childVnode
                return ref
            }
        } else {
            return ref
        }
    } else if (newVnode instanceof Node && oldVnode instanceof Node) {
        ref.node = newVnode
        return ref
    } else {
        return mount(newVnode, isSvg)
    }
}

function patchInPlace(parent, newVnode, oldVnode, ref, isSvg) {
    const newRef = patch(parent, newVnode, oldVnode, ref, isSvg)
    if (newRef !== ref) {
        replaceDom(parent, newRef, ref)
    }
    return newRef
}

function patchChildren(parent, newChildren, oldchildren, ref, isSvg) {
    // We need to retreive the next sibling before the old children
    // get eventually removed from the current DOM document
    const nextNode = getNextSibling(ref)
    const children = Array(newChildren.length)
    let refChildren = ref.children
    let newStart = 0,
        oldStart = 0,
        newEnd = newChildren.length - 1,
        oldEnd = oldchildren.length - 1
    let oldVnode, newVnode, oldRef, newRef, refMap

    while (newStart <= newEnd && oldStart <= oldEnd) {
        if (refChildren[oldStart] === null) {
            oldStart++
            continue
        }
        if (refChildren[oldEnd] === null) {
            oldEnd--
            continue
        }

        oldVnode = oldchildren[oldStart]
        newVnode = newChildren[newStart]
        if (newVnode?.key === oldVnode?.key) {
            oldRef = refChildren[oldStart]
            newRef = children[newStart] = patchInPlace(
                parent,
                newVnode,
                oldVnode,
                oldRef,
                isSvg
            )
            newStart++
            oldStart++
            continue
        }

        oldVnode = oldchildren[oldEnd]
        newVnode = newChildren[newEnd]
        if (newVnode?.key === oldVnode?.key) {
            oldRef = refChildren[oldEnd]
            newRef = children[newEnd] = patchInPlace(
                parent,
                newVnode,
                oldVnode,
                oldRef,
                isSvg
            )
            newEnd--
            oldEnd--
            continue
        }

        if (refMap == null) {
            refMap = {}
            for (let i = oldStart; i <= oldEnd; i++) {
                oldVnode = oldchildren[i]
                if (oldVnode?.key != null) {
                    refMap[oldVnode.key] = i
                }
            }
        }

        newVnode = newChildren[newStart]
        const idx = newVnode?.key != null ? refMap[newVnode.key] : null
        if (idx != null) {
            oldVnode = oldchildren[idx]
            oldRef = refChildren[idx]
            newRef = children[newStart] = patch(
                parent,
                newVnode,
                oldVnode,
                oldRef,
                isSvg
            )
            insertDom(parent, newRef, getDomNode(refChildren[oldStart]))
            if (newRef !== oldRef) {
                removeDom(parent, oldRef)
            }
            refChildren[idx] = null
        } else {
            newRef = children[newStart] = mount(newVnode, isSvg)
            insertDom(parent, newRef, getDomNode(refChildren[oldStart]))
        }
        newStart++
    }

    const beforeNode =
        newEnd < newChildren.length - 1
            ? getDomNode(children[newEnd + 1])
            : nextNode
    while (newStart <= newEnd) {
        const newRef = mount(newChildren[newStart], isSvg)
        children[newStart] = newRef
        insertDom(parent, newRef, beforeNode)
        newStart++
    }
    while (oldStart <= oldEnd) {
        oldRef = refChildren[oldStart]
        if (oldRef != null) {
            removeDom(parent, oldRef)
        }
        oldStart++
    }
    ref.children = children
}

function defaultShouldUpdate(p1, p2) {
    if (p1 === p2) return false
    for (let key in p2) {
        if (p1[key] !== p2[key]) return true
    }
    return false
}

function render(vnode, parent) {
    if (rootRef == null) {
        const ref = mount(vnode, false)
        rootRef = { ref, vnode }
        parent.textContent = ""
        insertDom(parent, ref, null)
    } else {
        rootRef.ref = patchInPlace(
            parent,
            vnode,
            rootRef.vnode,
            rootRef.ref,
            false
        )
        rootRef.vnode = vnode
    }
}

function useState(value) {
    const [hook, c] = getHook(cursor++)
    const setter = (newValue) => {
        hook[0] = newValue
        c.dirty = true
        render(c, rootRef)
    }
    if (hook.length === 0) {
        hook[0] = value
        hook[1] = setter
    }
    return hook
}

export const getHook = (
    cursor
) => {
    const hooks =
        currentVnode.hooks || (currentVnode.hooks = { list: [], effect: [], layout: [] })
    if (cursor >= hooks.list.length) {
        hooks.list.push([])
    }
    return [hooks.list[cursor], currentVnode]
}

export { Fragment, getParentNode, h, render, useState }