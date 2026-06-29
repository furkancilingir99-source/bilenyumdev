(function (global) {
  'use strict';

  var liveClassTheme = {
    background: '#070B1F',
    surface: '#10162F',
    surfaceSoft: '#171E3B',
    surfaceRaised: '#20284A',
    border: 'rgba(255,255,255,0.10)',
    textPrimary: '#F8FAFC',
    textSecondary: '#AAB2D5',
    textMuted: '#6F789B',
    primary: '#FF2DAA',
    secondary: '#3B82FF',
    success: '#22C55E',
    warning: '#FACC15',
    danger: '#EF4444',
    info: '#38BDF8',
    xp: '#A855F7',
    whiteboard: '#3B82FF',
    quiz: '#FACC15',
    chat: '#AAB2D5',
    raisedHand: '#FACC15'
  };

  var liveClassRadii = { xs: '6px', sm: '10px', md: '14px', lg: '18px', xl: '24px', pill: '999px' };

  var liveClassMotion = { fast: '120ms', normal: '180ms', slow: '260ms', panel: '240ms', toast: '220ms' };

  /** Unified icon semantics — same meaning on both roles */
  var LiveClassIcons = {
    mic: '🎤',
    micOff: '🔇',
    camera: '📷',
    cameraOff: '📷✕',
    hand: '✋',
    whiteboard: '📝',
    quiz: '❓',
    chat: '💬',
    reaction: '😊',
    focus: '🎯',
    share: '🖥',
    xp: '⚡',
    badge: '🏅',
    connection: '📶',
    warning: '⚠',
    lock: '🔒',
    notes: '📓',
    people: '👥',
    end: '⏹',
    leave: '🚪'
  };

  global.LiveClassTheme = {
    theme: liveClassTheme,
    radii: liveClassRadii,
    motion: liveClassMotion,
    icons: LiveClassIcons
  };

})(typeof window !== 'undefined' ? window : this);
