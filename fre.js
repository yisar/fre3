const EMPTY_OBJECT = {}

const VTYPE_ELEMENT = 1
const VTYPE_FUNCTION = 2
let cursor = 0
let currentElement = null
let currentVnode = null

const isEmpty = (c) =>
    c === null || (Array.isArray(c) && c.length === 0)
const isNonEmptyArray = (c) => Array.isArray(c) && c.length > 0
const isLeaf = (c) => typeof c === "string" || typeof c === "number"
const isElement = (c) => c?.vtype === VTYPE_ELEMENT
const isRenderFunction = (c) => c?.vtype === VTYPE_FUNCTION

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
                : undefined
    if (vtype === undefined) throw new Error("Invalid Vnode type")
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

const REF_SINGLE = 1 // ref with a single dom node
const REF_ARRAY = 4 // ref with an array od nodes
const REF_PARENT = 8 // ref with a child ref

const SVG_NS = "http://www.w3.org/2000/svg"

const XLINK_NS = "http://www.w3.org/1999/xlink"
const NS_ATTRS = {
    show: XLINK_NS,
    actuate: XLINK_NS,
    href: XLINK_NS,
}

function getDomNode(ref) {
    if (ref.type === REF_SINGLE) {
        return ref.node
    } else if (ref.type === REF_ARRAY) {
        return getDomNode(ref.children[0])
    } else if (ref.type === REF_PARENT) {
        return getDomNode(ref.childRef)
    }
    throw new Error("Unkown ref type " + JSON.stringify(ref))
}

function getParentNode(ref) {
    if (ref.type === REF_SINGLE) {
        return ref.node.parentNode
    } else if (ref.type === REF_ARRAY) {
        return getParentNode(ref.children[0])
    } else if (ref.type === REF_PARENT) {
        return getParentNode(ref.childRef)
    }
    throw new Error("Unkown ref type " + ref)
}

function getNextSibling(ref) {
    if (ref.type === REF_SINGLE) {
        return ref.node.nextSibling
    } else if (ref.type === REF_ARRAY) {
        return getNextSibling(ref.children[ref.children.length - 1])
    } else if (ref.type === REF_PARENT) {
        return getNextSibling(ref.childRef)
    }
    throw new Error("Unkown ref type " + JSON.stringify(ref))
}

function insertDom(parent, ref, nextSibling) {
    if (ref.type === REF_SINGLE) {
        parent.insertBefore(ref.node, nextSibling)
    } else if (ref.type === REF_ARRAY) {
        ref.children.forEach((ch) => {
            insertDom(parent, ch, nextSibling)
        })
    } else if (ref.type === REF_PARENT) {
        insertDom(parent, ref.childRef, nextSibling)
    } else {
        throw new Error("Unkown ref type " + JSON.stringify(ref))
    }
}

function removeDom(parent, ref) {
    if (ref.type === REF_SINGLE) {
        parent.removeChild(ref.node)
    } else if (ref.type === REF_ARRAY) {
        ref.children.forEach((ch) => {
            removeDom(parent, ch)
        })
    } else if (ref.type === REF_PARENT) {
        removeDom(parent, ref.childRef)
    } else {
        throw new Error("Unkown ref type " + ref)
    }
}

function replaceDom(parent, newRef, oldRef) {
    insertDom(parent, newRef, getDomNode(oldRef))
    removeDom(parent, oldRef)
}

function mountAttributes(domElement, props, isSvg) {
    for (var key in props) {
        if (key === "key" || key === "children") continue
        if (key.startsWith("on")) {
            domElement[key.toLowerCase()] = props[key]
        } else {
            setDOMAttribute(domElement, key, props[key], isSvg.isSVG)
        }
    }
}

function patchAttributes(domElement, newProps, oldProps, isSvg) {
    for (var key in newProps) {
        if (key === "key" || key === "children") continue
        var oldValue = oldProps[key]
        var newValue = newProps[key]
        if (oldValue !== newValue) {
            if (key.startsWith("on")) {
                domElement[key.toLowerCase()] = newValue
            } else {
                setDOMAttribute(domElement, key, newValue, isSvg.isSVG)
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
        if (key.startsWith("on")) {
            domElement[key.toLowerCase()] = null
        } else {
            domElement.removeAttribute(key)
        }
    }
}

function setDOMAttribute(el, attr, value, isSVG) {
    if (value === true) {
        el.setAttribute(attr, "")
    } else if (value === false) {
        el.removeAttribute(attr)
    } else {
        var namespace = isSVG ? NS_ATTRS[attr] : undefined
        if (namespace !== undefined) {
            el.setAttributeNS(namespace, attr, value)
        } else {
            el.setAttribute(attr, value)
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
            node = document.createElementNS(SVG_NS, type)
        }
        mountAttributes(node, props, isSvg)
        let childrenRef =
            props.children == null ? props.children : mount(props.children, isSvg)

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
    } else if (isRenderFunction(vnode)) {

        let childVnode = vnode.type(vnode.props)
        let childRef = mount(childVnode, isSvg)

        currentElement = childRef
        currentVnode = childVnode


        return {
            type: REF_PARENT,
            childRef,
            childState: childVnode,
        }
    } else if (vnode instanceof Node) {
        return {
            type: REF_SINGLE,
            node: vnode,
        }
    }
    if (vnode === undefined) {
        throw new Error("mount: vnode is undefined!")
    }

    throw new Error("mount: Invalid Vnode!")
}

function patch(
    parentDomNode,
    newVnode,
    oldVnode,
    ref,
    isSvg
) {
    if (oldVnode == null) {
        const ref = mount(newVnode, isSvg)
        parentDomNode.textContent = ""
        insertDom(parentDomNode, ref, null)
        return ref
    } else if (oldVnode === newVnode) {
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
        patchChildren(parentDomNode, newVnode, oldVnode, ref, isSvg)
        return ref
    } else if (
        isRenderFunction(newVnode) &&
        isRenderFunction(oldVnode) &&
        newVnode.type === oldVnode.type
    ) {
        let renderFn = newVnode.type
        let shouldUpdate =
            renderFn.shouldUpdate != null
                ? renderFn.shouldUpdate(oldVnode.props, newVnode.props)
                : defaultShouldUpdate(oldVnode.props, newVnode.props)
        if (shouldUpdate) {
            let childVnode = renderFn(newVnode.props)
            let childRef = patch(
                parentDomNode,
                childVnode,
                ref.childState,
                ref.childRef,
                isSvg
            )
            if (childRef !== ref.childRef) {
                return {
                    type: REF_PARENT,
                    childRef,
                    childState: childVnode,
                }
            } else {
                ref.childState = childVnode
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

function patchInPlace(parentDomNode, newVnode, oldVnode, ref, isSvg) {
    const newRef = patch(parentDomNode, newVnode, oldVnode, ref, isSvg)
    if (newRef !== ref) {
        replaceDom(parentDomNode, newRef, ref)
    }
    return newRef
}

function patchChildren(parentDomNode, newChildren, oldchildren, ref, isSvg) {
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
                parentDomNode,
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
                parentDomNode,
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
                parentDomNode,
                newVnode,
                oldVnode,
                oldRef,
                isSvg
            )
            insertDom(parentDomNode, newRef, getDomNode(refChildren[oldStart]))
            if (newRef !== oldRef) {
                removeDom(parentDomNode, oldRef)
            }
            refChildren[idx] = null
        } else {
            newRef = children[newStart] = mount(newVnode, isSvg)
            insertDom(parentDomNode, newRef, getDomNode(refChildren[oldStart]))
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
        insertDom(parentDomNode, newRef, beforeNode)
        newStart++
    }
    while (oldStart <= oldEnd) {
        oldRef = refChildren[oldStart]
        if (oldRef != null) {
            removeDom(parentDomNode, oldRef)
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

function render(vnode, parentDomNode) {
    patch(parentDomNode, vnode, vdom, null, false)
}

function useState(value){
    return [value, ()=>{
        console.log(currentElement, currentVnode)
        patch(currentElement, )
    }]
}

export { Fragment, getParentNode, h, render, useState }