import { h, render, useState } from './fre'


const App = () => {
    const [count, setCount] = useState([1,2,3])
    console.log(count)
    return <div>
        {count.map(i=>{
            return <button onClick={() => setCount([1,3,2])} key={i}>
            {i}
        </button>
        })}
    </div>
}
render(<App />, document.body)