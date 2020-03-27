const Options = {
  root: __dirname + '/../public_html/'
}

module.exports = (req, res, next) => {
  res.status(404)
  res.sendFile('404.html', Options, err => {
      if (err) {
      res.sendFile('404.sample.html', Options, err => {
          if (err) {
          res.header('Content-Type', 'text/plain')
          res.send('This is a 404, even static did not work.')
          }
      })
      }
  })
}
