import { h } from './index'

function App() {
    const counter = 0
    return <button style={{ background: '#000' }}>{counter}</button>
}

document.body.appendChild(h(App))