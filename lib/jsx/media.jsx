
/* global window:true, Image:true */
/* eslint-disable no-mixed-operators, operator-linebreak */


import $ from 'jquery'

class Media {
  constructor(options = {}) {
    this.settings = {
      fadeToOpacity: 0.1,                                 // float / int
      fadeInSpeed: 100,                                   // int
      fadeOutSpeed: (min = 3000, max = 4500) =>          // func
        Math.random() * (max - min) + min,
      cycleSpeed: 3000,                                   // int
      overlapTime: 1500,                                  // int
      offsetBottom: 300,                                  // int
      columns: 18,                                        // int
      gutter: 2.47469,                                    // float / int
      selector: 'main',                                   // string
      introSelector: '.container'                         // string
    }

    this.isInteger = function isInteger(n) {
      return Number(n) === n && n % 1 === 0
    }

    this.isFloat = function isFloat(n) {
      return Number(n) === n && n % 1 !== 0
    }

    this.isString = function isString(s) {
      return typeof s === 'string'
    }

    this.isFunction = function isFunction(f) {
      return f && typeof f === 'function'
    }

    this.validateSettings = function validateSettings() {
      if (window.location.href.match(/localhost/) === null) { return true }
      return Boolean(
        (this.isFloat(this.settings.fadeToOpacity) || this.isInteger(this.settings.fadeToOpacity))
        && this.isInteger(this.settings.fadeInSpeed)
        && this.isFunction(this.settings.fadeOutSpeed)
        && this.isInteger(this.settings.cycleSpeed)
        && this.isInteger(this.settings.overlapTime)
        && this.isInteger(this.settings.columns)
        && (this.isFloat(this.settings.gutter) || this.isInteger(this.settings.gutter))
        && this.isString(this.settings.selector)
        && this.isString(this.settings.introSelector)
      )
    }

    this.randomKey = function randomKey(min, max) {
      return Math.floor(Math.random() * ((max - min) + 1)) + min
    }

    this.getAssets = function getAssets() {
      return $.get('/api/media', resp => resp)
    }

    this.noop = function noop() {}

    this.decayTimer = null
    this.appendTimer = null
    this.cycleTimer = null
    this.assets = [
      [], // images
      [], // audio
      [] // video
    ]
    this.dict = []
    this.audioPlaying = false
    this.allowCycle = false

    this.main = $(this.settings.selector)
    this.positions = {
      image: {
        x: [
          () => 30,
          () => (4 / this.settings.columns * 2) + (8 * this.settings.gutter / 100) * $(window).width() - 15, // eslint-disable-line max-len
          () => (5 / this.settings.columns * 2) + (10 * this.settings.gutter / 100) * $(window).width() - 15, // eslint-disable-line max-len
          d => $(window).width() - d.x - 30
        ],
        y: [
          () => $(window).scrollTop() + 30,
          d => $(window).scrollTop() + ($(window).height() / 2) - (d.y / 2),
          d => ($(window).scrollTop() + $(window).height()) - d.y - 30 + this.settings.offsetBottom
        ]
      },
      video: {
        x: [
          () => 30,
          () => (3 / this.settings.columns) * $(window).width() - 15
        ],
        y: [
          () => $(window).scrollTop() + 30,
          d => $(window).scrollTop() + ($(window).height() / 2) - (d.y / 2),
          d => ($(window).scrollTop() + $(window).height()) - d.y - 30 + this.settings.offsetBottom
        ]
      },
      audio: {
        x: [() => 0],
        y: [() => 0]
      }
    }
    this.models = {
      image: `<div class="media media__image">
        <div class="media__container">
          <div class="media__container--image" style="background-image:url(/ASSET_URL.jpg)"></div>
        </div>
      </div>`,
      video: `<div class="media media__video">
        <div class="media__container">
          <div class="media__container--video">
            <video playsinline webkit-playsinline>
              <source src="/ASSET_URL.webm" type="video/webm">
              <source src="/ASSET_URL.mp4" type="video/mp4">
              <source src="/ASSET_URL.ogv" type="video/ogg">
          </video>
          </div>
        </div>
      </div>`,
      audio: `<div class="media media__audio">
        <div class="media__container">
          <div class="media__container--audio">
            <audio>
               <source src="/ASSET_URL.ogg">
               <source src="/ASSET_URL.mp3">
            </audio>
          </div>
        </div>
      </div>`
    }
    this.fadeTo = function fadeTo(elem, callback) {
      const css = { opacity: this.settings.fadeToOpacity }
      $(elem).animate(css, this.settings.fadeOutSpeed(), callback)
    }
    this.decay = {
      image: (elem) => {
        // timeout fade based on elem type
        this.decayTimer = setTimeout((function decayTimerSet(_this) {
          return function decayTimerDone() {
            clearTimeout(_this.decayTimer)
            _this.fadeTo(elem.find('.media__container'), _this.noop)
          }
        }(this)), this.settings.cycleSpeed)
        this.appendTimer = setTimeout((function appendTimerSet(_this) {
          return function appendTimerDone() {
            clearTimeout(_this.appendTimer)
            _this.cycle()
          }
        }(this)), this.settings.cycleSpeed + this.settings.fadeOutSpeed() - this.settings.overlapTime)
        return this.decayTimer
      },
      video: (elem) => {
        const video = elem.find('video')[0]
        video.muted = true
        video.addEventListener('canplay', () => {
          video.play()
          const videoFadeOutTime = (video.duration * 1000) - this.settings.fadeOutSpeed()
          this.decayTimer = setTimeout((function decayTimerSet(_this) {
            return function decayTimerDone() {
              clearTimeout(_this.decayTimer)
              _this.fadeTo(elem.find('.media__container'), _this.noop)
              _this.cycle()
            }
          }(this)), videoFadeOutTime)
        }, false)
      },
      audio: (elem) => {
        const audio = elem.find('audio')[0]
        const audioId = `_${Math.round(Math.random() * 1000000)}`
        $('.media__controls').fadeIn(this.settings.fadeInSpeed)
        $('.media__button').addClass('pause').removeClass('play').attr('data-play-pause', audioId)
        audio.id = audioId
        audio.addEventListener('canplay', () => {
          audio.play()
          this.audioPlaying = true
          setTimeout(() => this.cycle(), 1000) // delay before restarting cycle after audio starts
        }, false)
        audio.addEventListener('ended', () => {
          $('.media__controls').fadeOut(this.settings.fadeOutSpeed())
          this.audioPlaying = false
          elem.find('.media__container').fadeOut(this.settings.fadeOutSpeed())
        }, false)
      }
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
    return { x, y, rx, ry }
  }

  append(elem, type) {
    const d = this.dimensions(type)
    const p = this.randomPos(elem, type, d)
    const css = { height: d.y, width: d.x, top: p.y, left: p.x }
    this.main.append(elem.attr('data-pos-x', p.rx).css(css))
    elem.find('.media__container').fadeIn(this.settings.fadeSpeed)
  }

  createElement(type, url) {
    const str = this.models[type].replace(/ASSET_URL/g, url)
    return $(str)
  }

  show(asset) {
    // create element
    const elem = this.createElement(asset.type, asset.url)

    // append to dom
    this.append(elem, asset.type)
    this.decay[asset.type](elem)
    return this
  }

  cycle() {
    if (this.allowCycle === false) {
      this.cycleTimer = setTimeout(() => this.cycle(), 600)
      return this.cycleTimer
    }
    clearTimeout(this.cycleTimer)
    const type = this.dict[this.randomKey(0, this.dict.length - 1)]
    if (this.audioPlaying && type === 1) { return this.cycle() }
    const asset = this.assets[type][this.randomKey(0, this.assets[type].length - 1)]
    return this.show(asset)
  }

  preloadImages() {
    return new Promise((resolve, reject) => {
      const images = this.assets[0]
      if (!images.length) { return resolve() }
      return images.map((image, i) => {
        const img = new Image()
        img.onload = () => {
          if (i === images.length - 1) { resolve() }
        }
        img.onerror = () => {
          // remove 404 image from our assets and `resolve` so we don't mess up
          // the promise chain
          this.assets[0].splice(i, 1)
          resolve()
        }
        img.src = `${image.url}.jpg`
        return img
      })
    })
  }

  determineProbability() {
    const imageChance = 5
    const audioChance = 5
    const videoChance = 0

    // const imageChance = 6
    // const audioChance = 2
    // const videoChance = 2

    for (let i = 0; i < imageChance; i += 1) { this.dict.push(0) }
    for (let i = 0; i < audioChance; i += 1) { this.dict.push(1) }
    for (let i = 0; i < videoChance; i += 1) { this.dict.push(2) }

    return this.dict
  }

  configure(data) {
    return new Promise((resolve/* , reject */) => {
      this.assets[0] = data.filter(_ => _.type === 'image')
      this.assets[1] = data.filter(_ => _.type === 'audio')
      this.assets[2] = data.filter(_ => _.type === 'video')

      this.bindAll()
      this.determineProbability()

      this.preloadImages()
      .catch(err => console.log(err))
      .then(resolve)
    })
  }

  onResize() {
    ['image', 'audio', 'video'].forEach((_) => {
      const d = this.dimensions(_)
      $(`.media__${_}`).each((i, elem) => {
        const pos = parseInt($(elem).attr('data-pos-x'), 10)
        const left = this.positions[_].x[pos](d)
        const css = { height: d.y, width: d.x, left }
        $(elem).css(css)
      })
    })
  }

  onScroll() {
    this.allowCycle = Boolean($(window).scrollTop() >= $(this.settings.introSelector).height() - 50)
  }

  bindAll() {
    $('.media__button').on('click', function bindAudio() {
      const audio = $(`audio#${$(this).attr('data-play-pause')}`)[0]
      if (audio.paused) {
        $(this).addClass('pause')
        $(this).removeClass('play')
        audio.play()
      } else {
        $(this).removeClass('pause')
        $(this).addClass('play')
        audio.pause()
      }
    })

    $('audio').on('play', function pauseAudio() {
      const $button = $(`[data-play-pause='${$(this).attr('id')}']`)
      $button.removeClass('play').addClass('pause')
    })

    $(window).on('resize', () => this.onResize())
    $(window).on('scroll', () => this.onScroll())

    return this
  }

  init() {
    if (this.validateSettings() === false) {
      return window.alert( // eslint-disable-line no-alert
        'Invalid settings object.\nVerify `media.jsx` between lines 10 and 16'
      )
    }
    $(window).scrollTop(0)
    setTimeout(() => { $('body').addClass('ready') }, 0)
    return this.cycle()
  }
}

export default Media
