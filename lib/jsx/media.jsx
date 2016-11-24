
/* global window:true */

import $ from 'jquery'

class Media {
  constructor(options) {
    this.settings = {
      fadeSpeed: 400,
      cycleSpeed: 3000,
      columns: 18,
      gutter: 2.47469,
      selector: 'main'
    }

    this.randomKey = function randomKey(min, max) {
      return Math.floor(Math.random() * ((max - min) + 1)) + min
    }

    this.getAssets = function getAssets() {
      return $.get('/api/media', resp => resp)
    }

    // tmp -- the next two will change when a different sequence is figured out
    this.imageCount = 0
    this.minimumImages = 4

    this.timer = null
    this.previousType = null
    this.assets = {}

    this.main = $(this.settings.selector)
    this.positions = {
      image: {
        x: [
          () => 30,
          () => (4 / this.settings.columns * 2) + (8 * this.settings.gutter / 100) * $(window).width() - 15,
          () => (5 / this.settings.columns * 2) + (10 * this.settings.gutter / 100) * $(window).width() - 15,
          d => $(window).width() - d.x - 30
        ],
        y: [
          () => $(window).scrollTop() + 30,
          d => ($(window).height() / 2) - (d.y / 2),
          d => $(window).height() - d.y - 30
        ]
      },
      video: {
        x: [
          () => $(window).scrollTop() + 30,
          () => (3 / this.settings.columns) * $(window).width() - 15
        ],
        y: [
          () => $(window).scrollTop() + 30,
          d => ($(window).height() / 2) - (d.y / 2),
          d => $(window).height() - d.y - 30
        ]
      },
      audio: {
        x: [() => 0], y: [() => 0]
      }
    }
    this.models = {
      image: `<div class="media">
        <div class="media__container">
          <div class="media__container--image" style="background-image:url(/ASSET_URL.jpg)"></div>
        </div>
      </div>`,
      video: `<div class="media">
        <div class="media__container">
          <div class="media__container--video">
            <video>
              <source src="/ASSET_URL.webm" type="video/webm">
              <source src="/ASSET_URL.mp4" type="video/mp4">
              <source src="/ASSET_URL.ogv" type="video/ogg">
          </video>
          </div>
        </div>
      </div>`,
      audio: `<div class="media">
        <div class="media__container">
          <div class="media__container--audio">
            <audio autoplay>
               <source src="/ASSET_URL.ogg">
               <source src="/ASSET_URL.mp3">
            </audio>
          </div>
        </div>
      </div>`
    }
    this.decay = {
      image: (elem) => {
        // timeout fade based on elem type
        this.timer = setTimeout((function timerSet(_this) {
          return function timerDone() {
            clearTimeout(_this.timer)
            elem.find('.media__container').fadeOut(_this.settings.fadeSpeed, () => _this.cycle())
          }
        }(this)), this.settings.cycleSpeed - this.settings.fadeSpeed)
        return this.timer
      },
      video: (elem) => {
        const video = elem.find('video')[0]
        video.addEventListener('canplay', () => {
          video.muted = true
          video.play()
        }, false)
        video.addEventListener('ended', () => {
          elem.find('.media__container').fadeOut(this.settings.fadeSpeed, () => this.cycle())
        }, false)
      },
      audio: () => console.log('audio decay')
    }
    this.ratio = {
      image: { x: 55, y: 31, p: 11 / this.settings.columns },
      video: { x: 190, y: 107, p: 15 / this.settings.columns },
      audio: { x: 55, y: 31, p: 1 }
    }

    Object.assign(this.settings, options)
  }

  _get(attr, prop) {
    return this[attr][prop]
  }

  _set(prop, attr) {
    this[prop] = attr
    return 1
  }

  dimensions(type) {
    const w = $(window).width()
    const x = this.ratio[type].x
    const y = this.ratio[type].y
    const p = this.ratio[type].p
    return { x: (w * p) - 15, y: (y / x) * (w * p) }
  }

  randomPos(elem, type, d) {
    const rx = this.randomKey(0, this.positions[type].x.length - 1)
    const ry = this.randomKey(0, this.positions[type].y.length - 1)
    const x = this.positions[type].x[rx](d)
    const y = this.positions[type].y[ry](d)
    return { x, y }
  }

  append(elem, type) {
    const d = this.dimensions(type)
    const p = this.randomPos(elem, type, d)
    const css = { height: d.y, width: d.x, top: p.y, left: p.x }
    this.main.append(elem.css(css))
    elem.find('.media__container').fadeIn(this.settings.fadeSpeed)
  }

  createElement(type, url) {
    const str = this.models[type].replace(/ASSET_URL/, url)
    return $(str)
  }

  show(asset) {
    this._set('previousType', asset.type)

    // create element
    const elem = this.createElement(asset.type, asset.url)

    // append to dom
    this.append(elem, asset.type)
    this.decay[asset.type](elem)
  }

  limit(type) { // need to figure out a good way to sequence these
    let res
    // if (this.limit[type].push(type) > this.allowedRunOf(type)) {
    this.imageCount += 1
    if (this.imageCount < this.minimumImages) {
      res = false
    } else {
      res = true
      this.imageCount = 0
    }
    return res
  }

  cycle() {
    // get asset index
    const key = this.randomKey(0, this.assets.length - 1)
    const asset = this.assets[key]
    return this.limit(asset.type) ? this.cycle() : this.show(asset)
    this.show(asset)
  }

  addURLs(data) {
    this._set('assets', data)
    this.init()
  }

  init() {
    this.cycle()
  }
}

export default Media
