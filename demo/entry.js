store.counter = single(0)

export function App() {
    return h('div', {
        $onClick: () => {
            import('./a.js').then(mod => {
                mod.add()
            })
        }
    }, [])
}