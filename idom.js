let currentNode = null;
let currentParent = null;
let attrBuilder = new Map();

function enterNode() {
    currentParent = currentNode;
    currentNode = null;
}

function nextNode() {
    currentNode = currentNode
        ? currentNode.nextSibling
        : currentParent.firstChild;
}

export function exitNode() {
    currentNode = currentParent;
    currentParent = currentParent.parentNode;
}

const matches = function (matchNode, name) {
    const data = getData(matchNode);
    return name === data.name;
};

function renderDOM(name) {
    if (currentNode && matches(currentNode, name)) {
        return currentNode;
    }

    const node =
        name === '#text'
            ? document.createTextNode('')
            : document.createElement(name);

    currentParent.insertBefore(node, currentNode);
    currentNode = node;
    return node;
}

export function elementOpen(name, attrs) {
    elementOpenStart(name);
    attrBuilder = new Map(attrs);
    elementOpenEnd(name);
}

export function elementOpenStart(name) {
    nextNode();
    renderDOM(name);
}

export function elementOpenEnd() {
    const data = getData(currentNode);
    // diff attrs
    // clean old attrs
    const prevAttrs = data.attrs;
    for (const [key] of prevAttrs) {
        if (!attrBuilder.has(key)) {
            currentNode[key] = undefined;
            data.attrs.delete(key);
        }
    }

    // set new attrs
    for (const [key, value] of attrBuilder) {
        if (!data.attrs.has(key) || data.attrs.get(key) !== value) {
            currentNode[key] = value;
            data.attrs.set(key, value);
        }
    }

    attrBuilder = new Map();
    enterNode();
    return currentParent;
}

export function elementClose(node) {
    let unvisitedNode = currentNode
        ? currentNode.nextSibling
        : currentParent.firstChild;

    while (unvisitedNode) {
        const next = unvisitedNode.nextSibling;
        currentParent.removeChild(unvisitedNode);
        unvisitedNode = next;
    }

    exitNode();
    return currentNode;
}

export function text(value) {
    nextNode();
    const node = renderDOM('#text');
    const data = getData(node);
    if (data.text !== value) {
        data.text = value;
        node.data = value;
    }

    node.data = value;
    return currentNode;
}

const NODE_DATA_KEY = '__ID_Data__';

class NodeData {
    constructor(name) {
        this.name = name;
        this.text = null;
        this.attrs = new Map();
    }
}

function getData(node) {
    if (!node[NODE_DATA_KEY]) {
        node[NODE_DATA_KEY] = new NodeData(node.nodeName.toLowerCase());
    }

    return node[NODE_DATA_KEY];
}

export function patch(node, fn) {
    currentNode = node;
    enterNode();
    fn();
    exitNode();
}