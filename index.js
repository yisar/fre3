
export const h = (...args) => {
    let el
    const item = (arg) => {
        if (arg == null) {
        } else if (typeof arg === 'string') {
            // 'div'
            if (el == null) {
                el = document.createElement(arg)
            } else {
                el.appendChild(document.createTextNode(arg))
            }
        } else if (Array.isArray(arg)) {
            // fragments
            if (!el) el = document.createDocumentFragment()
            arg.forEach(item)
        } else if (arg instanceof Node) {
            if (el == null) {
                el = arg
            } else {
                el.appendChild(arg)
            }
        } else if (typeof arg === 'object') {
            // props
            property(el, arg)
        } else if (typeof arg === 'function') {
            console.log(el)
            el = arg.apply(null, args.splice(1))
        } else {
            el.appendChild(document.createTextNode('' + arg)) // 1 true null
        }
    }

    args.forEach(item)
    return el
}


const property = (el, name, value) => {
    if (typeof name === 'object') {
        for (const key in name) {
            property(el, key, name[key]);
        }
    } else if (name === 'style' && typeof value === 'object') {
        // style object
        for (var k in value) {
            if (k[0] === "-") {
                el[name].setProperty(k, value)
            } else {
                
                el[name][k] = value
            }
        }
    }
    else if (name[0] === 'o' && name[1] === 'n') {
        const n = name.slice(2).toLowerCase()
        if (value) {
            el.addEventListener(n, value)
        } else {
            el.removeEventListener(n, value)
        }
    } else if (name in el && !(el instanceof SVGAElement)) {
        // property
        el[name] = value
    } else if (!value) {
        el.removeAttribute(name)
    } else {
        el.setAttribute(name, value)
    }
}