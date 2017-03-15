
# Rosenblit

## Project Preview

https://young-wildwood-65423.herokuapp.com/

## Install

```
$ npm i
```

## Develop

Two commands should be run in two separate console windows:

```
$ gulp serve
```

```
$ npm start
```

If you get an error like the following after running `gulp serve`

```
rosenblit (master) % gulp serve
/<path to dir>/node_modules/node-sass/lib/binding.js:15
      throw new Error(errors.missingBinary());
      ^
```

You'll need to rebuild `node-sass`:

```bash
$ npm rebuild node-sass
```

## Build

```
$ gulp build
```

## Deploy

```
$ git push heroku master
```

