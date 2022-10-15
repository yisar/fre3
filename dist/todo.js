export const AddTodo = (state) => ({
    ...state,
    value: "",
    todos: state.todos.concat(state.value),
})

export const NewValue = (state, event) => {
    console.log(state)
    return {
        ...state,
        value: event.target.value,
    }
}