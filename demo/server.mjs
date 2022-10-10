import polka from 'polka'
import chalk from 'chalk'

module.exports = function serve(options) {
    const app = polka()
        .use(require("sirv")(options.o))
        .use(redirect)
        .get("/", async (req, res) => {
            const App = await import('./entry')
            const html = renderToString(App)
            res.end(html)
        })
        .listen(1234, (err) => {
            if (err) throw err
            console.log(chalk.green(`serve on localhost:1234`))
        })
    return app.server
}