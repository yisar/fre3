import { signal, computed } from "./signal.js";

const createElement = function (type) { return document.createElement(type); };

const createTextNode = function (content) { return document.createTextNode(content); };

const createComment = function () { return document.createComment(""); };

const setAttribute = function (element, key, value) {
    element.setAttribute(key, value);
};

const addEventListener = function (element, type, handler) {
    element.addEventListener(type.slice(2), handler);
};

const setTextContent = function (element, content) {
    element.textContent = content;
};

const appendChild = function (parent, element) {
    if (!parent) {
        return
    }
    parent.appendChild(element);
};

const removeChild = function (parent, element) {
    parent.removeChild(element);
};

const insertBefore = function (parent, element, reference) {
    parent.insertBefore(element, reference);
}

export default {
    ce: createElement,
    ctn: createTextNode,
    cc: createComment,
    sa: setAttribute,
    ael: addEventListener,
    stc: setTextContent,
    ac: appendChild,
    rc: removeChild,
    ib: insertBefore,
    signal,
    computed
}