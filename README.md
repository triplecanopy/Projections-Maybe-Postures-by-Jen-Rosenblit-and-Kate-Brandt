
# Projections Maybe Postures by Jen Rosenblit and Kate Brandt

This is the repository for the digital project, "Projections Maybe Postures," by Jen Rosenblit and Kate Brandt, published by Triple Canopy. The project can be found [here](https://www.canopycanopycanopy.com/contents/projections-maybe-postures).

***

## Install

```
$ yarn
```

## Develop

Two commands should be run in two separate console windows:

```
$ gulp watch
```

```
$ yarn start
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

