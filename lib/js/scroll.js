
/* global window:true */

import $ from 'jquery'

class Scroll {
  constructor(options) {
    this.settings = {}
    Object.assign(this.settings, options)
    this.init = function init() {
      const elemH = $('html').height()
      let pos = 0
      $(window).on('scroll', () => {
        if ($(window).scrollTop() > pos) {
          pos = $(window).scrollTop()
          $('html').height(elemH + pos)
        }
      })
      $(window).scroll()
    }
  }
}

export default Scroll
