
/* global document, window */
/* eslint-disable import/extensions, no-console */

import $ from 'jquery'
import Media from './media.jsx'
import Scroll from './scroll.jsx'

$(() => {
  $('.grid').remove()

  const scroller = new Scroll()
  const media = new Media()

  scroller.init()
  media.getAssets()
  .then(resp => media.configure(resp)) // DIST
  // .then(resp => media.configure(JSON.parse(resp.body)))
  .catch(err => console.log(err))
  .then(() => media.init())
})
