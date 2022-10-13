const AddTodo = (state) => ({
    ...state,
    value: "",
    todos: state.todos.concat(state.value),
})

const NewValue = (state, event) => ({
    ...state,
    value: event.target.value,
})