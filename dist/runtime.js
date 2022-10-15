const events = ['click']
function parseURLParams(url) {
    let queryParams = {}
    let reg = /([^?=&]+)=([^?=&]+)/g
    url.replace(reg, function () {
        queryParams[arguments[1]] = arguments[2]
    })
    return queryParams
}
function $import(url, e) {
    const { fn } = parseURLParams(url)
    import(url).then(mod => {
        mod[fn](window.__state, e)
    })
}

for (const event of events) {
    document.addEventListener(event, e => {
        const target = e.target.closest('.a');
        if (target) {
            $import(target.getAttribute('on:' + event), e)

        }
    })
}