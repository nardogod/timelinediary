'use client';

import mixpanel from 'mixpanel-browser';

let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return;
  try {
    mixpanel.init('55d673464697348b7c023308bcae8124', {
      debug: false,
      track_pageview: true,
      persistence: 'localStorage',
      autocapture: true,
      record_sessions_percent: 100,
    });
    initialized = true;
  } catch (error) {
    console.error('[Mixpanel] Erro ao inicializar:', error);
  }
}

export function isMixpanelInitialized(): boolean {
  return initialized && typeof window !== 'undefined';
}

export function getMixpanelInstance() {
  return mixpanel;
}

export function trackEvent(eventName: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (!initialized) {
    initAnalytics();
  }
  try {
    mixpanel.track(eventName, props);
  } catch (error) {
    console.error(`[Mixpanel] Erro ao rastrear evento ${eventName}:`, error);
    // evita quebrar UI em caso de erro de tracking
  }
}

