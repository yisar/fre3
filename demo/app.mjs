import { h } from "../src/h.mjs";


const state = { todos: [], value: "" }

const view = ({ value, todos }) =>
    h("main", {}, [
        h("h1", {}, ["To do list"]),
        h("input", { type: "text", oninput: 'newValue', value }),
        h("ul", {},
            todos.map((todo) => h("li", {}, todo))
        ),
        h("button", { onclick: 'AddTodo' }, ["New!"]),
    ])

export { view, state }