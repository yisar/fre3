const EMPTY_ARR$1 = [];
let tracking;


function root(fn) {
  const prevTracking = tracking;
  const rootUpdate = () => {};
  tracking = rootUpdate;
  resetUpdate(rootUpdate);
  const result = fn(() => {
    _unsubscribe(rootUpdate);
    tracking = undefined;
  });
  tracking = prevTracking;
  return result;
}


function sample(fn) {
  const prevTracking = tracking;
  tracking = undefined;
  const value = fn();
  tracking = prevTracking;
  return value;
}


function observable(value) {
  function data(nextValue) {
    if (arguments.length === 0) {
      if (tracking && !data._observers.has(tracking)) {
        data._observers.add(tracking);
        tracking._observables.push(data);
      }
      return value;
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
  data._pending = EMPTY_ARR$1;

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
        // If being read from inside another computed, pass observables to it
        update._observables.forEach((o) => o());
      }
    } else {
      value = update();
    }
    return value;
  }

  return data;
}


function cleanup(fn) {
  if (tracking) {
    tracking._cleanups.push(fn);
  }
  return fn;
}


function subscribe(observer) {
  computed(observer);
  return () => _unsubscribe(observer._update);
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
  // Keep track of which observables trigger updates. Needed for unsubscribe.
  update._observables = [];
  update._children = [];
  update._cleanups = [];
}


const api = {};

const EMPTY_ARR = [];

const castNode = (value) => {
  if (typeof value === 'string') {
    return document.createTextNode(value);
  }
  if (!(value instanceof Node)) {

    return api.h(EMPTY_ARR, value);
  }
  return value;
};


const frag = (value) => {
  const { childNodes } = value;
  if (!childNodes || value.nodeType !== 11) return;
  if (childNodes.length < 2) return childNodes[0];
  return {
    _startMark: /** @type {Text} */ (api.add(value, '', childNodes[0])),
  };
};


const add = (parent, value, endMark) => {
  value = castNode(value);
  const fragOrNode = frag(value) || value;

  // If endMark is `null`, value will be added to the end of the list.
  parent.insertBefore(value, endMark && endMark.parentNode && endMark);
  return fragOrNode;
};

const insert = (el, value, endMark, current, startNode) => {
  el = (endMark && endMark.parentNode) || el;

  startNode = startNode || (current instanceof Node && current);

  // @ts-ignore Allow empty if statement
  if (value === current);
  else if (
    (!current || typeof current === 'string') &&
    // @ts-ignore Doesn't like `value += ''`
    // eslint-disable-next-line no-implicit-coercion
    (typeof value === 'string' || (typeof value === 'number' && (value += '')))
  ) {
    // Block optimized for string insertion.
    // eslint-disable-next-line eqeqeq
    if (current == null || !el.firstChild) {
      if (endMark) {
        api.add(el, value, endMark);
      } else {
        // Using textContent is a lot faster than append -> createTextNode.
        el.textContent = /** @type {string} See `value += '' */ (value);
      }
    } else {
      if (endMark) {
        (endMark.previousSibling || el.lastChild).data = value;
      } else {
        el.firstChild.data = value;
      }
    }
    current = value;
  } else if (typeof value === 'function') {
    api.subscribe(() => {
      current = api.insert(
        el,
        value.call({ el, endMark }),
        endMark,
        current,
        startNode
      );
    });
  } else {
    // Block for nodes, fragments, Arrays, non-stringables and node -> stringable.
    if (endMark) {
      // `current` can't be `0`, it's coerced to a string in insert.
      if (current) {
        if (!startNode) {
          // Support fragments
          startNode =
            (current._startMark && current._startMark.nextSibling) ||
            endMark.previousSibling;
        }
        api.rm(el, startNode, endMark);
      }
    } else {
      el.textContent = '';
    }
    current = null;

    if (value && value !== true) {
      current = api.add(el, value, endMark);
    }
  }

  return current;
};


function eventProxy(e) {
  return this._listeners && this._listeners[e.type](e);
}


const handleEvent = (el, name, value) => {
  name = name.slice(2).toLowerCase();

  if (value) {
    el.addEventListener(name, eventProxy);
  } else {
    el.removeEventListener(name, eventProxy);
  }

  (el._listeners || (el._listeners = {}))[name] = value;
};


const property = (el, value, name, isAttr, isCss) => {
  // eslint-disable-next-line eqeqeq
  if (value == null) return;
  if (!name || (name === 'attrs' && (isAttr = true))) {
    for (name in value) {
      api.property(el, value[name], name, isAttr, isCss);
    }
  } else if (name[0] === 'o' && name[1] === 'n' && !value.$o) {
    // Functions added as event handlers are not executed
    // on render unless they have an observable indicator.
    handleEvent(el, name, value);
  } else if (typeof value === 'function') {
    api.subscribe(() => {
      api.property(el, value.call({ el, name }), name, isAttr, isCss);
    });
  } else if (isCss) {
    el.style.setProperty(name, value);
  } else if (
    isAttr ||
    name.slice(0, 5) === 'data-' ||
    name.slice(0, 5) === 'aria-'
  ) {
    el.setAttribute(name, value);
  } else if (name === 'style') {
    if (typeof value === 'string') {
      el.style.cssText = value;
    } else {
      api.property(el, value, null, isAttr, true);
    }
  } else {
    if (name === 'class') name += 'Name';
    el[name] = value;
  }
};


const removeNodes = (parent, startNode, endMark) => {
  while (startNode && startNode !== endMark) {
    const n = startNode.nextSibling;
    // Is needed in case the child was pulled out the parent before clearing.
    if (parent === startNode.parentNode) {
      parent.removeChild(startNode);
    }
    startNode = n;
  }
};


const h$1 = (...args) => {
  let el;
  const item = (/** @type {*} */ arg) => {
    // @ts-ignore Allow empty if
    // eslint-disable-next-line eqeqeq
    if (arg == null);
    else if (typeof arg === 'string') {
      if (el) {
        api.add(el, arg);
      } else {
        el = api.s
          ? document.createElementNS('http://www.w3.org/2000/svg', arg)
          : document.createElement(arg);
      }
    } else if (Array.isArray(arg)) {
      // Support Fragments
      if (!el) el = document.createDocumentFragment();
      arg.forEach(item);
    } else if (arg instanceof Node) {
      if (el) {
        api.add(el, arg);
      } else {
        // Support updates
        el = arg;
      }
    } else if (typeof arg === 'object') {
      // @ts-ignore 0 | 1 is a boolean but can't type cast; they don't overlap
      api.property(el, arg, null, api.s);
    } else if (typeof arg === 'function') {
      if (el) {
        // See note in add.js#frag() - This is a Text('') node
        const endMark = /** @type {Text} */ (api.add(el, ''));
        api.insert(el, arg, endMark);
      } else {
        // Support Components
        el = arg.apply(null, args.splice(1));
      }
    } else {
      // eslint-disable-next-line no-implicit-coercion,prefer-template
      api.add(el, '' + arg);
    }
  };
  args.forEach(item);
  return el;
};


api.h = h$1;
api.insert = insert;
api.property = property;
api.add = add;
api.rm = removeNodes;
api.subscribe = subscribe;
api.cleanup = cleanup;
api.root = root;
api.sample = sample;

api.hs = (...args) => {
  const prevIsSvg = api.s;
  api.s = true;
  const el = h(...args);
  api.s = prevIsSvg;
  return el;
};

// Makes it possible to intercept `h` calls and customize.
const h = (...args) => api.h.apply(api.h, args);

// Makes it possible to intercept `hs` calls and customize.
const hs = (...args) => api.hs.apply(api.hs, args);

export { api, computed, h, hs, observable as o, observable };