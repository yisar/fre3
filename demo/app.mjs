import { h } from "../src/h.mjs";


const state = { todos: [], value: "" }

const view = ({ value, todos }) =>
    h("main", {}, [
        h("button", { 'on:click': './todo.js?fn=NewValue', class: 'a' }, ["New!"]),
    ])

export { view, state }