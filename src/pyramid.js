import readPixels from './read-pixels'

const pyramid = function (image, numLayers) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  canvas.width = image.width
  canvas.height = image.height
  context.drawImage(image, 0, 0, image.width, image.height)

  let layers = new Array(numLayers)
  let width = image.width
  let height = image.height
  let ratio = 1
  for (let i = 0; i < numLayers; i++) {
    const roundWidth = Math.round(width)
    const roundHeight = Math.round(height)

    context.drawImage(canvas, 0, 0, roundWidth, roundHeight)
    layers[numLayers - i - 1] = {
      ratio, width: roundWidth, height: roundHeight,
      pixels: readPixels(context, 0, 0, roundWidth, roundHeight),
    }

    width /= 2
    height /= 2
    ratio *= 2
  }

  return layers
}

export default pyramid
