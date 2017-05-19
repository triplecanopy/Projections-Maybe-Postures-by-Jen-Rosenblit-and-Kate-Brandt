
/* global window:true, Image:true, document:true */
/* eslint-disable no-mixed-operators, operator-linebreak */


import $ from 'jquery'
import 'setimmediate' // binds to window

const MOBILE_SCREEN_WIDTH = 680
const isMobile = () => window.innerWidth <= MOBILE_SCREEN_WIDTH
const divisor = () => window.innerWidth <= MOBILE_SCREEN_WIDTH ? 2 : 1 // eslint-disable-line no-confusing-arrow

class Media {
  constructor(options = {}) {
    this.settings = {
      fadeToOpacity: 0.1,
      fadeInSpeed: 100,
      fadeOutSpeed: (_min = 2000, _max = 4500) => { // values in ms, divided by 2 if on mobile
        const d = divisor()
        const min = _min / d
        const max = _max / d
        return Math.random() * (max - min) + min
      },
      minFadeOutTime: 600 / divisor(),
      cycleSpeed: 3000 / divisor(),
      overlapTime: 1500 / divisor(),
      audioRemovalTimer: 5.345, // in seconds
      // if cycling disabled (i.e., the user is reading the text and is out of
      // visible range of the media elements), check every `pollCycleInterval`
      // to see if we can start cycling media again
      pollCycleInterval: 500,
      offsetBottom: 300 / divisor(),
      columns: 18,
      gutter: 2.47469,
      selector: 'main',
      introSelector: '.container'
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
        && this.isInteger(this.settings.minFadeOutTime)
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
      // return $.get('/api/media', resp => resp)
      return $.get('https://s3.amazonaws.com/tc3-whitecube/rosenblit/manifest.json') // DIST
    }

    this.noop = function noop() {}

    this.unplayedAudioRemovalTimer = null
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
    this.introHeight = function introHeight() {
      const elem = $(this.settings.introSelector)
      return elem.height() + elem.offset().top
    }
    this.elementMinTop = function elementMinTop() {
      const top = $(window).scrollTop()
      if (top < this.introHeight()) { console.log('defaults') }
      return top < this.introHeight() ? top + this.introHeight() + 30 : top
    }
    this.positions = {
      image: {
        x: [
          () => 30,
          () => (4 / this.settings.columns * 2) + (8 * this.settings.gutter / 100) * $(window).width() - 15, // eslint-disable-line max-len
          () => (5 / this.settings.columns * 2) + (10 * this.settings.gutter / 100) * $(window).width() - 15, // eslint-disable-line max-len
          d => $(window).width() - d.x - 30
        ],
        y: [
          () => this.elementMinTop(), //$(window).scrollTop() + 30,
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
          () => this.elementMinTop(), //$(window).scrollTop() + 30,
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
            <video playsinline webkit-playsinline autoplay muted>
              <source src="/ASSET_URL.mp4" type="video/mp4">
              <source src="/ASSET_URL.webm" type="video/webm">
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
        }(this)), this.settings.cycleSpeed + this.settings.fadeOutSpeed() - this.settings.overlapTime) // eslint-disable-line max-len
        return this.decayTimer
      },
      video: (elem) => {
        const video = elem.find('video')[0]
        video.addEventListener('canplay', () => {
          let videoFadeOutTime
          videoFadeOutTime = (video.duration * 1000) - this.settings.fadeOutSpeed()
          if (videoFadeOutTime < this.settings.minFadeOutTime) {
            videoFadeOutTime = this.settings.minFadeOutTime
          }
          this.decayTimer = setTimeout((function decayTimerSet(_this) {
            return function decayTimerDone() {
              clearTimeout(_this.decayTimer)
              const videoContainer = elem.find('.media__container')
              _this.fadeTo(videoContainer, () => {
                // replace videos with images and remove them from the DOM
                // when they're finished playing
                _this.replaceVideoElementWithImage(video, videoContainer)

                // remove video to free up memory
                _this.garbageCollect(video)
              })
              _this.cycle()
            }
          }(this)), videoFadeOutTime)
        }, false)
      },
      audio: (elem) => {
        const audio = elem.find('audio')[0]
        const audioId = `_${Math.round(Math.random() * 1000000)}`
        audio.id = audioId

        const removeAudio = () => {
          $('.media__controls').fadeOut(this.settings.fadeOutSpeed())
          this.audioPlaying = false
          elem.find('.media__container').fadeOut(this.settings.fadeOutSpeed(), () =>
            this.garbageCollect(audio)
          )
        }

        $('.media__controls').fadeIn(this.settings.fadeInSpeed)
        $('.media__button').attr('data-play-pause', audioId)

        audio.play()
        this.audioPlaying = true
        setImmediate(() => this.cycle())

        audio.addEventListener('play', () => {
          $('.media__button').addClass('pause').removeClass('play')
          clearTimeout(this.unplayedAudioRemovalTimer)
        })

        audio.addEventListener('pause', () => {
          $('.media__button').addClass('play').removeClass('pause')
          clearTimeout(this.unplayedAudioRemovalTimer)
          this.unplayedAudioRemovalTimer = setTimeout(() => {
            removeAudio()
          }, this.settings.audioRemovalTimer * 1000)
        })

        if (isMobile()) {
          this.unplayedAudioRemovalTimer = setTimeout(() => {
            removeAudio()
          }, this.settings.audioRemovalTimer * 1000)
        }

        audio.addEventListener('ended', () => {
          setImmediate(removeAudio)
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

  // memory management
  replaceVideoElementWithImage(video, container) {
    // get video dimensions
    const videoStyles = window.getComputedStyle(video)
    const vWidth = parseInt(videoStyles.width, 10)
    const vHeight = parseInt(videoStyles.height, 10)

    // create canvas
    const canvas = document.createElement('canvas')
    canvas.width = vWidth
    canvas.height = vHeight

    // draw video to canvas
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, vWidth, vHeight)

    // get URL from canvas
    const dataURL = canvas.toDataURL('image/jpeg', 1.0)

    container.css({
      backgroundImage: `url(${dataURL})`,
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    })

    // remove canvas
    this.garbageCollect(canvas)
  }

  garbageCollect(elem) {
    $(elem).remove()
    return this
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
    const str = this.models[type].replace(/\/ASSET_URL/g, url) // DIST
    // const str = this.models[type].replace(/ASSET_URL/g, url)
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
      this.cycleTimer = setTimeout(() => this.cycle(), this.pollCycleInterval)
      return this.cycleTimer
    }
    clearTimeout(this.cycleTimer)
    const type = this.dict[this.randomKey(0, this.dict.length - 1)]
    if (this.audioPlaying && type === 1) {
      return setImmediate(() => this.cycle())
    }
    const asset = this.assets[type][this.randomKey(0, this.assets[type].length - 1)]
    return this.show(asset)
  }

  preloadImages() {
    const callbackIfAllImagesLoaded = (idx, len, done) => {
      if (idx === len) { done() }
    }
    return new Promise((resolve/* , reject */) => {
      const images = this.assets[0]
      if (!images.length) { return resolve() }
      return images.map((image, i) => {
        const img = new Image()
        img.onload = () => {
          callbackIfAllImagesLoaded(i, images.length - 1, resolve)
        }
        img.onerror = () => {
          // remove 404 image from our assets and `resolve` so we don't mess up
          // the promise chain
          this.assets[0].splice(i, 1)
          callbackIfAllImagesLoaded(i, images.length - 1, resolve)
        }
        img.src = `${image.url}.jpg`
        return img
      })
    })
  }

  removeLoader() { // eslint-disable-line class-methods-use-this
    return new Promise((resolve/* , reject */) => {
      $('.loader__outer').remove()
      resolve()
    })
  }

  determineProbability() {
    const imageChance = 6
    const audioChance = 2
    const videoChance = 2

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
      .then(this.removeLoader)
      .catch(err => console.log(err)) // eslint-disable-line no-console
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
    const elem = $(this.settings.introSelector)
    this.allowCycle = Boolean($(window).scrollTop() >= elem.height() + elem.offset().top - 30)
  }

  bindAll() {
    $('.media__button').on('click', function bindAudio() {
      const audio = $(`audio#${$(this).attr('data-play-pause')}`)[0]
      if (audio.paused) {
        audio.play()
      } else {
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
    return setImmediate(() => {
      $('body').addClass('ready')
      return this.cycle()
    })
  }
}

export default Media
