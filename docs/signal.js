const EMPTY_ARR = [];
let tracking;
let queue;


export function isListening() {
    return !!tracking;
}


export function root(fn) {
    const prevTracking = tracking;
    const rootUpdate = () => { };
    tracking = rootUpdate;
    resetUpdate(rootUpdate);
    const result = fn(() => {
        _unsubscribe(rootUpdate);
        tracking = undefined;
    });
    tracking = prevTracking;
    return result;
}


export function sample(fn) {
    const prevTracking = tracking;
    tracking = undefined;
    const value = fn();
    tracking = prevTracking;
    return value;
}


export function transaction(fn) {
    let prevQueue = queue;
    queue = [];
    const result = fn();
    let q = queue;
    queue = prevQueue;
    q.forEach((data) => {
        if (data._pending !== EMPTY_ARR) {
            const pending = data._pending;
            data._pending = EMPTY_ARR;
            data(pending);
        }
    });
    return result;
}


function signal(value) {
    function data(nextValue) {
        if (arguments.length === 0) {
            if (tracking && !data._observers.has(tracking)) {
                data._observers.add(tracking);
                tracking._observables.push(data);
            }
            return value;
        }

        if (queue) {
            if (data._pending === EMPTY_ARR) {
                queue.push(data);
            }
            data._pending = nextValue;
            return nextValue;
        }

        value = nextValue;

        const clearedUpdate = tracking;
        tracking = undefined;

        data._runObservers = new Set(data._observers);
        data._runObservers.forEach((observer) => (observer._fresh = false));
        data._runObservers.forEach((observer) => {
            if (!observer._fresh) observer();
        });

        tracking = clearedUpdate;
        return value;
    }
    data.$o = 1;
    data._observers = new Set();
    data._pending = EMPTY_ARR;

    return data;
}


function computed(observer, value) {
    observer._update = update;


    resetUpdate(update);
    update();

    function update() {
        const prevTracking = tracking;
        if (tracking) {
            tracking._children.push(update);
        }

        _unsubscribe(update);
        update._fresh = true;
        tracking = update;
        value = observer(value);

        tracking = prevTracking;
        return value;
    }

    data.$o = 1;

    function data() {
        if (update._fresh) {
            if (tracking) {
                update._observables.forEach((o) => o());
            }
        } else {
            value = update();
        }
        return value;
    }

    return data;
}


export function cleanup(fn) {
    if (tracking) {
        tracking._cleanups.push(fn);
    }
    return fn;
}

export function subscribe(observer) {
    computed(observer);
    return () => _unsubscribe(observer._update);
}

export function on(obs, fn, seed, onchanges) {
    obs = [].concat(obs);
    return computed((value) => {
        obs.forEach((o) => o());

        let result = value;
        if (!onchanges) {
            result = sample(() => fn(value));
        }

        onchanges = false;
        return result;
    }, seed);
}

export function unsubscribe(observer) {
    _unsubscribe(observer._update);
}

function _unsubscribe(update) {
    update._children.forEach(_unsubscribe);
    update._observables.forEach((o) => {
        o._observers.delete(update);
        if (o._runObservers) {
            o._runObservers.delete(update);
        }
    });
    update._cleanups.forEach((c) => c());
    resetUpdate(update);
}

function resetUpdate(update) {
    update._observables = [];
    update._children = [];
    update._cleanups = [];
}

export { signal, computed }