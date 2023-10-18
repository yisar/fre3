import { h, render, useState } from './fre'


const App = () => {
    const [count, setCount] = useState(0)
    console.log(count)
    return <div>
        <button onClick={() => setCount(count + 1)}>
            {count}
        </button>
    </div>
}
render(<App />, document.body)