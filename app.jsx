import { h, render,useState } from './fre'


const App = () => {
    const [count, setCount] = useState(0)
    return <button onClick={() => setCount(count+1)}>
        count
    </button>
};
render(<App/>,document.body)