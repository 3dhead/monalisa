import randgen from 'randgen'
import Color from 'color'

import pyramid from './pyramid'
import Genetics from './genetics'
import readPixels from './read-pixels'

const NUM_LAYERS = 8
const NUM_GENES = 10
const MUTATION_RATE = 0.95
const NUM_TRIANGLES = 256
const TRIANGLE_RATIO = 3
const MAX_HUE_CHANGE = 10
const MAX_SATUATION_CHANGE = 5
const MAX_LIGHTNESS_CHANGE = 5
const MAX_POS_CHANGE = 10
const MAX_ALPHA_CHANGE = 0.05
const NEW_TRIANGLE_RATE = 0.01
const SWAP_RATE = 0.05

const random = function (min, max) {
  return Math.random() * (max - min) + min
}

const randomInt = function (min, max) {
  return Math.floor(random(min, max))
}

const randomColor = function () {
  return Color({ r: randomInt(0, 256), g: randomInt(0, 256), b: randomInt(0, 256), a: random(0, 1) })
}

const colorDiff = function (c1, c2) {
  c1 = c1.rgbArray(), c2 = c2.rgbArray()
  const r = c1[0] - c2[0]
  const g = c1[1] - c2[1]
  const b = c1[2] - c2[2]
  return Math.sqrt(r*r+g*g+b*b)
}

const source = document.getElementById('source')
source.addEventListener('load', function () {

  const layers = pyramid(source, NUM_LAYERS)

  const randomMovement = function ({ x, y }, deviation) {
    return {
      x: x + randgen.rnorm(0, deviation),
      y: y + randgen.rnorm(0, deviation)
    }
  }

  const newTriangle = (function () {
    const deviation = Math.sqrt(source.width * source.height) / TRIANGLE_RATIO
    return function () {
      const p0 = { x: random(0, source.width), y: random(0, source.height) }
      return {
        color: randomColor(),
        points: [ p0, randomMovement(p0, deviation), randomMovement(p0, deviation) ]
      }
    }
  })()

  let usingLayer = 0

  const ga = Genetics({
    numGenes: NUM_GENES,
    gene() {
      let triangles = new Array(NUM_TRIANGLES)
      for (let i = 0; i < NUM_TRIANGLES; ++i) {
        triangles[i] = newTriangle()
      }
      return triangles
    },
    mutationRate: MUTATION_RATE,
    mutate: (function () {
      const mutations = [
        // change hue
        function ({ color, points }) {
          return {
            color: color.clone().rotate(randgen.rnorm(0, MAX_HUE_CHANGE)),
            points
          }
        },
        // change saturation
        function ({ color, points }){
          const satuationChange = randgen.rnorm(0, MAX_SATUATION_CHANGE)
          if (satuationChange < 0) {
            return {
              color: color.clone().saturate(Math.abs(satuationChange)),
              points
            }
          } else {
            return {
              color: color.clone().desaturate(satuationChange),
              points
            }
          }
        },
        // change lightness
        function ({ color, points }) {
          const lightnessChange = randgen.rnorm(0, MAX_LIGHTNESS_CHANGE)
          if (lightnessChange < 0) {
            return {
              color: color.clone().darken(Math.abs(lightnessChange)),
              points
            }
          } else {
            return {
              color: color.clone().lighten(lightnessChange),
              points
            }
          }
        },
        // change opacity
        function ({ color, points }) {
          return {
            color: color.clone().alpha(Math.max(0, Math.min(color.alpha() + randgen.rnorm(0, MAX_ALPHA_CHANGE)))),
            points
          }
        },
        // move p0
        function ({ color, points }) {
          return {
            color,
            points: [ randomMovement(points[0], MAX_POS_CHANGE), points[1], points[2] ]
          }
        },
        // move p1
        function ({ color, points }) {
          return {
            color,
            points: [ points[0], randomMovement(points[1], MAX_POS_CHANGE), points[2] ]
          }
        },
        // move p2
        function ({ color, points }) {
          return {
            color,
            points: [ points[0], points[1], randomMovement(points[2], MAX_POS_CHANGE) ]
          }
        }
      ]
      return function (triangles) {
        const idx = randomInt(0, NUM_TRIANGLES)

        if (Math.random() < SWAP_RATE) {
          const jdx = randomInt(0, NUM_TRIANGLES)
          return triangles.map(function (triangle, i) {
            if (i === idx) {
              return triangles[jdx]
            }
            if (i === jdx) {
              return triangles[idx]
            }
            return triangle
          })
        }

        return triangles.map(function (triangle, i) {
          if (i !== idx) {
            return triangle
          }
          if (Math.random() < NEW_TRIANGLE_RATE) {
            return newTriangle()
          }
          return randgen.rlist(mutations)(triangle)
        })
      }
    })(),
    cross(g1, g2) {
      return g1.map(function (t1, i) {
        if (Math.random() < 0.5) {
          return t1
        } else {
          return g2[i]
        }
      })
    },
    evaluate: (function () {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.width = source.width
      canvas.height = source.height

      return function (triangles) {
        const layer = layers[usingLayer]
        const ratio = layer.ratio

        context.clearRect(0, 0, layer.width, layer.height)
        triangles.forEach(function ({ color, points }) {
          context.fillStyle = color.rgbaString()
          context.beginPath()
          context.moveTo(points[0].x / ratio, points[0].y / ratio);
          context.lineTo(points[1].x / ratio, points[1].y / ratio);
          context.lineTo(points[2].x / ratio, points[2].y / ratio);
          context.lineTo(points[0].x / ratio, points[0].y / ratio);
          context.closePath()
          context.fill()
        })

        const pixels = readPixels(context, 0, 0, layer.width, layer.height)
        let score = 0
        for (let i = 0; i < layer.width * layer.height; ++i) {
          score += colorDiff(pixels[i], layer.pixels[i])
        }
        return score / (layer.width * layer.height)
      }
    })()
  })

  const target = document.getElementById('target')
  target.width = source.width
  target.height = source.height
  const context = target.getContext('2d')

  const numIteration = document.getElementById('num-iteration')
  const currentLayer = document.getElementById('current-layer')
  const bestScore = document.getElementById('best-score')

  const iterate = function () {
    if (ga.bestScore() < 20) {
      usingLayer = Math.min(NUM_LAYERS - 1, usingLayer + 1)
      ga.reEvaluate()
    }

    ga.iterate()
    ga.bestGene().forEach(function ({ color, points }) {
      context.fillStyle = color.rgbaString()
      context.beginPath()
      context.moveTo(points[0].x, points[0].y);
      context.lineTo(points[1].x, points[1].y);
      context.lineTo(points[2].x, points[2].y);
      context.lineTo(points[0].x, points[0].y);
      context.closePath()
      context.fill()
    })
    numIteration.innerHTML = ga.iteration()
    currentLayer.innerHTML = usingLayer
    bestScore.innerHTML = ga.bestScore()
    requestAnimationFrame(iterate)
  }
  requestAnimationFrame(iterate)

})
