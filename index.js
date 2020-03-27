const log = require('debug')('payid-server')

const express = require('express')
const app = express()
const router = express.Router({caseSensitive: false})

const port = process.env.PORT || 8080

const {
  Resolver,
  ConfigReader,
  Handle404
} = require('./src')

app.disable('x-powered-by')

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET')
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept')
  next()
})

router.get('*', 
  Resolver, 
  express.static(__dirname + '/public_html/', {
    index: [ 'index.html', 'index.sample.html' ]
  })
)

router.get('*', Handle404)

app.use('/', router)

const main = async () => {
  await ConfigReader(app)

  const Server = app.listen(port, () => {
    log(`PayID Static Server running at port ${port}`)
  })

  process.on('SIGINT', () => {
    log('--- STOPPING ---')
    Server.close()
    // We're not waiting for keepalive sessions, etc.
    process.exit(0)
  })  
}

main()
