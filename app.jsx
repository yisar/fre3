import { h, render, useState, Fragment } from './fre'


const App = () => {
    const [count, setCount] = useState(0)
    console.log(count)
    return <>
        <button onClick={() => setCount(count + 1)}>
            {count}
        </button>
    </>
}
render(<App />, document.body)