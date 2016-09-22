import pyramid from './pyramid'

const sourceImage = document.getElementById('source')
sourceImage.addEventListener('load', function () {

  const layers = pyramid(sourceImage, 7)
  console.log(layers)

})
