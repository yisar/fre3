import { h, signal } from "./index";


const App = () => {
    const [count, setCount] = useState(0)
    return <button onClick={() => setCount(count+1)}>
        count
    </button>
};
document.body.append(<App/>)