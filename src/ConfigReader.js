const fs = require('fs')
const log = require('debug')('payid-server')

const toml = require('toml')
const concat = require('concat-stream')

const xTagged = require('xrpl-tagged-address-codec')

const Read = (file) => {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(__dirname + '/../' + file, 'utf8')

    readStream.pipe(concat(data => {
      let parsed
      try {
        parsed = toml.parse(data)
      } catch (err) {
        reject(new Error('Error parsing TOML configfile: ' + err.message))
      }
      
      if (parsed) {
        resolve(Object.keys(parsed).reduce((a, b) => {
          const route = b === '' || b === '/'
            ? '/'
            : b.toLowerCase().replace(/\/+$/, '')

          if (typeof parsed[b] === 'object' && parsed[b]) {
            const configuredKeys = Object.keys(parsed[b])
            if (configuredKeys.indexOf('account') < 0 && configuredKeys.indexOf('redirect') < 0) {
              // No account nor redirect configured
              return a
            } else if (configuredKeys.indexOf('account') > -1) {
              if (parsed[b].account.match(/^[XT]/)) {
                // X-encoding, decode
                try {
                  const decoded = xTagged.Decode(parsed[b].account)
                  Object.assign(parsed[b], {
                    account: decoded.account,
                    tag: decoded.tag
                  })
                } catch (e) {
                  reject(new Error('Error decoding account address [' + parsed[b].account + ']: ' + e.message))
                }
              }
            }
          }
          
          Object.assign(a, {
            [(route.substring(0, 1) === '/' ? '' : '/') + route]: typeof parsed[b] === 'object'
              ? Object.assign({}, parsed[b])
              : parsed[b]
          })
          return a
        }, {}))
      }
    }))

    readStream.on('error', err => reject(err))
  })
}

module.exports = async (app) => {
  try {
    app.config = await Read('config.toml')
    log('Loaded config from [ config.toml ]')
  } catch (e) {
    log(e, 'Trying config.sample.toml next...')
  }
  if (!app.config) {
    try {
      app.config = await Read('config.sample.toml')
      log('Loaded <SAMPLE> config from [ config.sample.toml ]')
    } catch (e) {
      log(e)
      process.exit(1)
    }
  }

  log(app.config)
}
