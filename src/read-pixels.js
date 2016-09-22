import Color from 'color'

const readPixels = function (context, dx, dy, width, height) {
  const numPixels = width * height
  const data = context.getImageData(dx, dy, width, height).data
  const pixels = new Array(numPixels)
  for (let i = 0; i < numPixels; i++) {
    pixels[i] = Color({
      r: data[i*4], g: data[i*4+1], b: data[i*4+2]
    })
  }
  return pixels
}

export default readPixels
