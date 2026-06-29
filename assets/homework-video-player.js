/* ---------------------------------------------------------------------------
 * Bilenyum homework-video-player.js — Ödev video çözüm oynatıcısı
 * ------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var DEFAULT_SRC = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
  var SKIP_SEC = 10;
  var CONTROLS_IDLE_MS = 2800;

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + pad2(s);
  }

  function mount(root) {
    if (!root) return null;

    var video = root.querySelector('#hwVideoEl');
    var stage = root.querySelector('#hwVideoStage');
    var overlay = root.querySelector('#hwVpOverlay');
    var centerPlay = root.querySelector('#hwVpCenterPlay');
    var playBtn = root.querySelector('#hwVpPlay');
    var rewindBtn = root.querySelector('#hwVpRewind');
    var forwardBtn = root.querySelector('#hwVpForward');
    var muteBtn = root.querySelector('#hwVpMute');
    var fsBtn = root.querySelector('#hwVpFullscreen');
    var seek = root.querySelector('#hwVpSeek');
    var volume = root.querySelector('#hwVpVolume');
    var speed = root.querySelector('#hwVpSpeed');
    var curEl = root.querySelector('#hwVpCurrent');
    var durEl = root.querySelector('#hwVpDuration');
    if (!video || !stage) return null;

    var seeking = false;
    var hideTimer = null;

    function isFullscreen() {
      return document.fullscreenElement === stage;
    }

    function syncPlayIcon() {
      var playing = !video.paused && !video.ended;
      if (playBtn) {
        playBtn.setAttribute('aria-label', playing ? 'Duraklat' : 'Oynat');
        playBtn.classList.toggle('is-playing', playing);
      }
      if (centerPlay) {
        centerPlay.setAttribute('aria-label', playing ? 'Duraklat' : 'Oynat');
      }
      stage.classList.toggle('is-playing', playing);
      stage.classList.toggle('is-paused', !playing);
      if (!playing) {
        stage.classList.remove('is-idle');
        clearTimeout(hideTimer);
      } else {
        scheduleHideControls();
      }
    }

    function syncMuteIcon() {
      if (!muteBtn) return;
      var muted = video.muted || video.volume === 0;
      muteBtn.classList.toggle('is-muted', muted);
      muteBtn.setAttribute('aria-label', muted ? 'Sesi aç' : 'Sesi kapat');
    }

    function syncFullscreenUi() {
      var fs = isFullscreen();
      stage.classList.toggle('is-fullscreen', fs);
      if (fsBtn) {
        fsBtn.setAttribute('aria-label', fs ? 'Tam ekrandan çık' : 'Tam ekran');
      }
      showControls();
    }

    function syncSeek() {
      if (!seek || seeking) return;
      var pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
      seek.value = String(pct);
      if (curEl) curEl.textContent = formatTime(video.currentTime);
    }

    function showControls() {
      stage.classList.add('is-show-controls');
      stage.classList.remove('is-idle');
      clearTimeout(hideTimer);
      if (!video.paused && !video.ended) {
        scheduleHideControls();
      }
    }

    function scheduleHideControls() {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () {
        if (!video.paused && !video.ended) {
          stage.classList.add('is-idle');
          stage.classList.remove('is-show-controls');
        }
      }, CONTROLS_IDLE_MS);
    }

    function togglePlay() {
      if (video.paused || video.ended) {
        if (video.ended) video.currentTime = 0;
        video.play().catch(function () {});
      } else {
        video.pause();
      }
      showControls();
    }

    function skipSeconds(delta) {
      if (!video.duration) return;
      video.currentTime = Math.min(video.duration, Math.max(0, video.currentTime + delta));
      syncSeek();
      showControls();
    }

    function toggleMute() {
      video.muted = !video.muted;
      if (!video.muted && video.volume === 0 && volume) {
        video.volume = 0.7;
        volume.value = '0.7';
      }
      syncMuteIcon();
      showControls();
    }

    function toggleFullscreen() {
      if (!stage) return;
      if (isFullscreen()) {
        document.exitFullscreen().catch(function () {});
        return;
      }
      if (stage.requestFullscreen) stage.requestFullscreen();
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
      showControls();
    }

    function load(src, poster) {
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.src = src || DEFAULT_SRC;
      if (poster) video.poster = poster;
      else video.removeAttribute('poster');
      if (speed) {
        speed.value = '1';
        video.playbackRate = 1;
      }
      if (volume) {
        volume.value = '1';
        video.volume = 1;
      }
      video.muted = false;
      if (seek) seek.value = '0';
      if (curEl) curEl.textContent = '0:00';
      if (durEl) durEl.textContent = '0:00';
      stage.classList.remove('is-idle', 'is-fullscreen');
      syncPlayIcon();
      syncMuteIcon();
      syncFullscreenUi();
    }

    function reset() {
      load(DEFAULT_SRC);
    }

    function pause() {
      video.pause();
      syncPlayIcon();
    }

    function onStageActivity() {
      showControls();
    }

    if (playBtn) playBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      togglePlay();
    });
    if (centerPlay) centerPlay.addEventListener('click', function (e) {
      e.stopPropagation();
      togglePlay();
    });
    if (rewindBtn) rewindBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      skipSeconds(-SKIP_SEC);
    });
    if (forwardBtn) forwardBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      skipSeconds(SKIP_SEC);
    });
    if (muteBtn) muteBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMute();
    });
    if (fsBtn) fsBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleFullscreen();
    });

    if (overlay) {
      overlay.addEventListener('click', function (e) { e.stopPropagation(); });
      overlay.addEventListener('mousemove', onStageActivity);
    }

    stage.addEventListener('click', function (e) {
      if (e.target.closest('.asm-hw-vp-overlay, .asm-hw-vp-center-play')) return;
      togglePlay();
    });
    stage.addEventListener('mousemove', onStageActivity);
    stage.addEventListener('touchstart', onStageActivity, { passive: true });

    video.addEventListener('play', syncPlayIcon);
    video.addEventListener('pause', syncPlayIcon);
    video.addEventListener('ended', syncPlayIcon);

    video.addEventListener('loadedmetadata', function () {
      if (durEl) durEl.textContent = formatTime(video.duration);
      syncSeek();
    });

    video.addEventListener('timeupdate', syncSeek);

    if (seek) {
      seek.addEventListener('input', function () {
        seeking = true;
        showControls();
        if (curEl && video.duration) {
          var t = (parseFloat(seek.value) / 100) * video.duration;
          curEl.textContent = formatTime(t);
        }
      });
      seek.addEventListener('change', function () {
        if (video.duration) {
          video.currentTime = (parseFloat(seek.value) / 100) * video.duration;
        }
        seeking = false;
        showControls();
      });
      seek.addEventListener('click', function (e) { e.stopPropagation(); });
    }

    if (volume) {
      volume.addEventListener('input', function () {
        video.volume = parseFloat(volume.value);
        video.muted = video.volume === 0;
        syncMuteIcon();
        showControls();
      });
      volume.addEventListener('click', function (e) { e.stopPropagation(); });
    }

    if (speed) {
      speed.addEventListener('change', function () {
        var rate = parseFloat(speed.value);
        if (!isFinite(rate)) rate = 1;
        video.playbackRate = Math.min(1.5, Math.max(0.5, rate));
        showControls();
      });
      speed.addEventListener('click', function (e) { e.stopPropagation(); });
    }

    document.addEventListener('fullscreenchange', syncFullscreenUi);

    stage.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        skipSeconds(-SKIP_SEC);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        skipSeconds(SKIP_SEC);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
    });

    return {
      load: load,
      reset: reset,
      pause: pause,
      play: function () { video.play().catch(function () {}); },
      element: video
    };
  }

  global.BilenyumHomeworkVideoPlayer = { mount: mount, DEFAULT_SRC: DEFAULT_SRC };
})(typeof window !== 'undefined' ? window : this);
