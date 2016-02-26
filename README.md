# Tessellate

Code project building and management platform

[![Build Status](https://img.shields.io/travis/KyperTech/tessellate.svg?style=flat-square)](https://travis-ci.org/KyperTech/tessellate)
[![Dependencies](https://img.shields.io/david/KyperTech/tessellate.svg?style=flat-square)](https://david-dm.org/KyperTech/tessellate)
[![Code climate](http://img.shields.io/codeclimate/github/KyperTech/tessellate.svg?style=flat-square)](https://codeclimate.com/github/KyperTech/tessellate)

## Using The API

Tessellate can be interacted with through a REST API as well as few different javascript helper libraries listed below.

## Helper Libraries

There are a few helper libraries for interacting with the service (instead of making direct REST calls)

Authentication library: Matter
Resource interaction library: Grout

## Install
1. Clone and install
```sh
$ git clone git://github.com/KyperTech/tessellate.git
$ npm install
```

2. Set environment vars
```sh
$ export JWT_SECRET
$ export OAUTHIO_KEY
$ export OAUTHIO_SECRET
$ export AWS_KEY
$ export AWS_SECRET
```

3. Start dev server

  ```sh
  $ npm start
  ```

4. Then visit [http://localhost:3000/](http://localhost:3000/)

## Tests

```sh
$ npm test
```

## License

MIT
