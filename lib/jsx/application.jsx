
import $ from 'jquery'
import Media from './media.jsx'
import Scroll from './scroll.jsx'

$(() => {
  const media = new Media()
  const scroller = new Scroll()
  media.getAssets()
  .then(resp => media.addURLs(JSON.parse(resp.body)))
  $(document).on('keyup', e => {
    if (e && e.which && e.which == 71) { $('.grid').fadeToggle(0) }
  })
})
