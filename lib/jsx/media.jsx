
/* global window:true, Image:true */
/* eslint-disable no-mixed-operators */


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

    this.timer = null
    this.assets = [
      [], // images
      [], // audio
      [] // video
    ]
    this.dict = []

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
          d => ($(window).scrollTop() + $(window).height()) - d.y - 30
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
          d => ($(window).scrollTop() + $(window).height()) - d.y - 30
        ]
      },
      audio: {
        x: [() => 0], y: [() => 0]
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
            <video>
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
        video.muted = true
        video.addEventListener('canplay', () => {
          video.play()
        }, false)
        video.addEventListener('ended', () => {
          elem.find('.media__container').fadeOut(this.settings.fadeSpeed, () => this.cycle())
        }, false)
      },
      audio: (elem) => {
        const audio = elem.find('audio')[0]
        const audioId = `_${Math.round(Math.random() * 1000000)}`
        $('.media__controls').fadeIn(this.settings.fadeSpeed)
        $('.media__button').addClass('pause').removeClass('play').attr('data-play-pause', audioId)
        audio.id = audioId
        audio.addEventListener('canplay', () => {
          audio.play()
        }, false)
        audio.addEventListener('ended', () => {
          $('.media__controls').fadeOut(this.settings.fadeSpeed)
          elem.find('.media__container').fadeOut(this.settings.fadeSpeed, () => this.cycle())
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

    console.log(d.x, d.y)
    console.log(rx, ry)

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
    // create element
    const elem = this.createElement(asset.type, asset.url)

    // append to dom
    this.append(elem, asset.type)
    this.decay[asset.type](elem)
  }

  cycle() {
    const type = this.dict[this.randomKey(0, this.dict.length - 1)]
    const asset = this.assets[type][this.randomKey(0, this.assets[type].length - 1)]

    console.log(type, asset)

    return this.show(asset)
  }

  preloadImages() {
    return new Promise((resolve/* , reject */) => {
      const images = this.assets[0]
      return images.map((image, i) => {
        const img = new Image()
        img.onload = () => { if (i === images.length - 1) { resolve() } }
        img.onerror = () => { reject(`Error loading image: ${image}`) }
        img.src = `${image.url}.jpg`
        return img
      })
    })
  }

  determineProbability() {
    const imageChance = 7
    const audioChance = 1
    const videoChance = 2

    for (let i = 0; i < imageChance; i+=1) { this.dict.push(0) }
    for (let i = 0; i < audioChance; i+=1) { this.dict.push(1) }
    for (let i = 0; i < videoChance; i+=1) { this.dict.push(2) }

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
    return this
  }

  init() {
    this.cycle()
  }
}

export default Media
