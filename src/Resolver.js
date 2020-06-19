const log = require('debug')('payid-server')
const logRequest = log.extend('request')
const xTagged = require('xrpl-tagged-address-codec')

module.exports = (req, res, next) => {
  const usedHeaders = {
    contentType: (req.headers['content-type'] || '').toLowerCase().split(';')[0].trim(),
    accept: (req.headers['accept'] || '').toLowerCase().split(';')[0].trim()
  }

  const resolveInfo = {
    isPayId: false,
    isMainNet: null,
    matchingConfig: null,
    redirectLocation: ''
  }
  const sanitizedPath = req.path === '/' || req.path === '/.well-known/pay'
    ? '/'
    : req.path.trim().replace(/\/+$/, '').toLowerCase()
  
  const payIdAccept = usedHeaders.accept.match(/^application\/xrpl\-([a-z]+)\+json/)
  if (payIdAccept) {
    resolveInfo.isPayId = true
    resolveInfo.isMainNet = Boolean(payIdAccept[1].match(/main|live/))
  }

  if (!payIdAccept && usedHeaders.accept.match(/^application\/payid\+json/)) {
    resolveInfo.isPayId = true
    resolveInfo.isMainNet = true
  }

  resolveInfo.matchingConfig = req.app.config[sanitizedPath] || null

  if (resolveInfo.isPayId && resolveInfo.matchingConfig !== null && typeof resolveInfo.matchingConfig.account === 'undefined') {
    // Valid PayId headers, but no account configured.
    resolveInfo.isPayId = false
  }

  if (!resolveInfo.isPayId) {
    // No PayId headers, check for redirect
    if (
      sanitizedPath === '/' &&
      typeof req.app.config.redirect === 'string'
    ) {
      resolveInfo.redirectLocation = req.app.config.redirect.trim()
    } else if (
      sanitizedPath !== '/' &&
      resolveInfo.matchingConfig !== null &&
      typeof resolveInfo.matchingConfig.redirect === 'string'
    ) {
      resolveInfo.redirectLocation = resolveInfo.matchingConfig.redirect.trim()
    }
  }
  
  logRequest({
    sanitizedPath,
    usedHeaders,
    resolveInfo
  })

  if (resolveInfo.isPayId) {
    const net = resolveInfo.isMainNet
      ? 'mainnet'
      : 'testnet'

    if (resolveInfo.matchingConfig !== null) {
      res.header('Content-Type', `application/xrpl-${net}+json; charset=utf-8`)
      log(`PayID response [ ${sanitizedPath} ] » ${resolveInfo.matchingConfig.account} @ ${net}`)
      return res.json({
        addresses: [
          {
            paymentNetwork: 'XRPL',
            environment: net.toUpperCase(),
            addressDetailsType: 'CryptoAddressDetails',
            addressDetails: {
              address: xTagged.Encode({
                account: resolveInfo.matchingConfig.account,
                tag: resolveInfo.matchingConfig.tag || null,
                test: !resolveInfo.isMainNet
              })
            },
            details: {
              address: xTagged.Encode({
                account: resolveInfo.matchingConfig.account,
                tag: resolveInfo.matchingConfig.tag || null,
                test: !resolveInfo.isMainNet
              })
            }
          }
        ],
        payId: sanitizedPath.slice(1) + '$' + req.hostname
      })
    } else {
      log(`PayID 404 [ ${sanitizedPath} ] » @ ${net}`)
      return res.json({
        statusCode: 404,
        error: `Not Found`,
        message: `Payment information for ${sanitizedPath} in XRPL on ${net.toUpperCase()} could not be found.`
      })
    }
  } else {
    if (resolveInfo.redirectLocation !== '') {
      log(`Redirect [ ${sanitizedPath} ] » ${resolveInfo.redirectLocation}`)
      return res.redirect(resolveInfo.redirectLocation)
    } else {
      log(`Static content [ ${sanitizedPath} ]`)
      return next()
    }
  }
}
