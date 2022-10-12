import polka from 'polka'
import chalk from 'chalk'
import sirv from 'sirv'

function serve(options) {
    const app = polka()
        .use(sirv(options.o))
        .get("/", async (req, res) => {
            // const App = await import('./entry')
            // const html = renderToString(App)
            res.end('ok')
        })
        .listen(1234, (err) => {
            if (err) throw err
            console.log(chalk.green(`serve on localhost:1234`))
        })
    return app.server
}
serve({ o: './dist' })