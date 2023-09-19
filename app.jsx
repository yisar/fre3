import { h } from "./signal";
import { observable } from './signal'

const counter = observable(0);

const jsxView = () => {
    return <div>Counter {counter}</div>;
};
document.body.append(jsxView());

setInterval(() => counter(counter() + 1), 1000);