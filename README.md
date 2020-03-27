# PayID Static

Simple, self hosted PayID server, serving your own PayID's for the XRPL on your own domain.

### Run:

 - `npm run watch` (for development (more verbose) + live reload)
 - `npm run dev` (for development (more verbose))
 - `npm run start` (for production (less verbose))

This package will start a webserver on port `8080` by default. Provide the `PORT` environment variabele to start
the server on a different port, eg.: `PORT=3000 npm run watch`.

### Run using Docker

1. Build the image:  
```
docker build -t wietse/payid .
```
2. Run a container:  
```
docker run --rm -p 8080:8080 wietse/payid
```

Now you can call `localhost:8080`, eg. using `curl`:

```
curl --verbose \
  -H 'Content-Type: application/json' \
  -H "Accept: application/xrpl-mainnet+json" \
  http://localhost:8080
```

### Browser requests (static content serving) 
When the server receives a request without a valid PayID header (presumably requested by a webbrowser), the `public_html` folder will be served. If the requested path/file is not found in the `public_html` folder and the root path is called, `index.html` will be served.

If the requested file (or `index.html` if root) cannot be found, `404.html` will be served (from the `public_html` folder). If `404.html` cannot be found, a plain text 404 message will be returned.

Optionally this static file serving behaviour van be overruled using the  `redirect` parameter in the config (see next chapter).

## Configuration

Add your PayID paths (routes) in `config.toml`.

The `redirect` parameter can be set globally to redirect all requests not containing PayID headers. On a per-route basis the `redirect` parameter can be configured as well, to redirect the specific route to an (other) URL.

#### Sample:


```
# Optional, in case of a non-PayID request:
# redirect = "https://wietse.com/?noPayID"

# The ["..."] sections contain the route

["/"]
  account = "rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY"
  tag = 495

["/wietse/"]
  account = "XV5sbjUmgPpvXv4ixFWZ5ptAYZ6PD2q1qM6owqNbug8W6KV"
  redirect = "https://xrpl-labs.com/?noPayID"

["/w"]
  account = "XVjKs2ae5EgCyKL4oPoNo7RoeBKFCbndk8gq6W6n93WeYZG"

["/pets/pepper"]
  account = "TVd2rqMkYL2AyS97NdELcpeiprNBjwVu8XCE7W73WEvzcB1"

["/pets/dino"]
  account = "rPdvC6ccq8hCdPKSPJkPmyZ4Mi1oG2FFkT"
  
["/pets/null"]
  redirect = "https://arwen.im/?noPayID=true"
```

This sample is present in `config.sample.toml` as well, which will be the fallback file in case of a missing `config.toml` file.

If an `r` account is specified, this account will be served both for `mainnet` and `testnet` requests. For `r` accounts, an optional `tag` integer can be specified as well (destination tag).

If an `X` account is specified, this account will only be served for `mainnet` requests.

If an `T` account is specified, this account will only be served for `testnet` requests.