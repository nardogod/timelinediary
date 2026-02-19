'use client';

import mixpanel from 'mixpanel-browser';

let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return;
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token) return;
  try {
    mixpanel.init(token, { track_pageview: false });
    initialized = true;
  } catch {
    // silenciosamente ignora erro de init
  }
}

export function trackEvent(eventName: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (!initialized) {
    initAnalytics();
  }
  try {
    mixpanel.track(eventName, props);
  } catch {
    // evita quebrar UI em caso de erro de tracking
  }
}

