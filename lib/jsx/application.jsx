
import $ from 'jquery'
import fs from 'fs'

class Media {
  constructor(settings) {
    this.options = {
      fadeSpeed: 400,
      cycleSpeed: 3000
    }

    this.timer = null
    this.playing = null
    this.assets = {}
    this.positions = {
      top: {},
      left: {},
    }
    this.models = {
      image: `<div class="media">
        <div class="media__container">
          <div class="media__container--image" style="background-image:url(ASSET_URL.jpg)"></div>
        </div>
      </div>`,
      video: `<div class="media">
        <div class="media__container">
          <div class="media__container--video">
            <video autoplay>
              <source src="video/ASSET_URL.webm" type="video/webm">
              <source src="video/ASSET_URL.mp4" type="video/mp4">
              <source src="video/ASSET_URL.ogv" type="video/ogg">
          </video>
          </div>
        </div>
      </div>`,
      audio: `<div class="media">
        <div class="media__container">
          <div class="media__container--audio">
            <audio autoplay>
               <source src="ASSET_URL.ogg">
               <source src="ASSET_URL.mp3">
            </audio>
          </div>
        </div>
      </div>`,
    }
    this.decay = {
      image: elem =>
        // timeout fade based on elem type
        this.timer = setTimeout((function(_this) {
          return function() {
            clearTimeout(_this.timer)
            _this.cycle()
          }
        })(this), this.options.cycleSpeed),
      video: elem => console.log('video decay'),
      audio: elem => console.log('audio decay')
    }

    Object.assign(this.options, settings)
  }

  _get(prop) {
    return this.options[prop]
  }

  _set(prop, attr) {
    this.options[prop] = attr
    return 1
  }

  posTop() {}

  posLeft() {}

  elemWidth() {}

  append() {}

  remove() {}

  randomPos() {

  }

  randomKey(min, max) {
    // const min = 0
    // const max = this.assets.length - 1
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  createElement(type, url) {
    const str = this.models[type].replace(/ASSET_URL/, url)
    return $(str)
  }

  cycle() {

    // get index
    const key = this.randomKey(0, this.assets.length - 1)
    const asset = this.assets[key]

    // create element
    const elem = this.createElement(asset.type, asset.url)

    // append to dom
    this.append(elem)
    this.decay[asset.type](elem)
  }

  addURLs(data) {
    Object.assign(this.assets, data)
    this.bindAll()
  }

  getAssets() {
    return $.get('/api/media', resp => resp)
  }

  bindAll() {
    // play/pause methods?
    this.init()
  }

  init() {
    // remove loader?
    this.cycle()
  }
}

$(function() {
  const media = new Media()
  media.getAssets()
  .then(resp => media.addURLs(JSON.parse(resp.body)))
})
