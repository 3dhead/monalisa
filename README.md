# Monalisa

Inspired by @antirez's [shapeme](https://github.com/antirez/shapeme).

Browser version, drawing on canvas.

- Use [genetic algorithm](https://en.wikipedia.org/wiki/Genetic_algorithm) to generate triangles to produce image similar to input.
- Use image pyramid for faster color tone generation at early stage.

## Usage

### Build

- Browserify

```sh
$ npm install
$ npm run build
```

### Dev

- Watchify

```sh
$ npm install
$ npm run dev
```

- Server

```sh
$ python -m SimpleHTTPServer
```

## Tricks

Currently, determining when to upscale the (downscaled) source image is not ideal. So sometimes it may get no improvement for a long time, and it need to use a larger reference image in order to draw the details.

```js
window.useLayer(1); // layers[0] has the smallest image
```

At your browser console, will force to use another layer even the upscaling criteria is not met yet.
