
/* global document, window */
/* eslint-disable import/extensions, no-console */

import $ from 'jquery'
import Media from './media.jsx'
import Scroll from './scroll.jsx'

$(() => {
  const scroller = new Scroll()
  const media = new Media()

  scroller.init()
  media.getAssets()
  .then(resp => media.configure(resp))
  // .then(resp => media.configure(JSON.parse(resp.body)))
  .catch(err => console.log(err))
  .then(() => media.init())

  if (/(?:local|heroku)/.test(window.location.host)) {
    $(document).on('keyup', (e) => {
      if (e && e.which && e.which === 71) { $('.grid').fadeToggle(0) }
    })
  } else {
    $('.grid').remove()
  }
})
