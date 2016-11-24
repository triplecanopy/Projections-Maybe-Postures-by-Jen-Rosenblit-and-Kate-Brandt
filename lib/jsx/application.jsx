
/* global document:true */

import $ from 'jquery'
import Media from './media.jsx'
import Scroll from './scroll.jsx'

$(() => {
  const scroller = new Scroll()
  const media = new Media()
  scroller.init()
  media.getAssets().then(resp => media.addURLs(JSON.parse(resp.body)))
  $(document).on('keyup', (e) => {
    if (e && e.which && e.which === 71) { $('.grid').fadeToggle(0) }
  })
})
