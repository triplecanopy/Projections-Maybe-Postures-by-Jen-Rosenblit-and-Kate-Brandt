
/* global window:true */

import $ from 'jquery'

class Scroll {
  constructor() {
    let pos = 0
    let elemH = $('html').height()
    $(window).on('scroll', (e) => {
      if ($(window).scrollTop() > pos) {
        pos = $(window).scrollTop()
        $('html').height(elemH + pos)
      }
    })
    $(window).scroll()
  }
}

export default Scroll
