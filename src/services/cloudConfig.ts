export interface CloudConfig {
  mode: 'auto' | 'api' | 'google_sheets' | 'firebase' | 'local';
  googleSheetsWebhookUrl?: string;
}

const STORAGE_KEY = 'sanyi_eap_cloud_config_115';

// Check if URL contains query parameter on initial load
function extractUrlParam(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const gs = params.get('gs') || params.get('webhook') || params.get('w');
    if (gs && gs.startsWith('http')) {
      return decodeURIComponent(gs.trim());
    }
  } catch (e) {
    console.warn('Error reading URL params:', e);
  }
  return null;
}

export function getStoredCloudConfig(): CloudConfig {
  let config: CloudConfig = {
    mode: 'auto',
    googleSheetsWebhookUrl: ''
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      config = { ...config, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error reading cloud config from storage:', e);
  }

  // Check URL param override (e.g. from shared QR code or link)
  const urlWebhook = extractUrlParam();
  if (urlWebhook && urlWebhook !== config.googleSheetsWebhookUrl) {
    config.googleSheetsWebhookUrl = urlWebhook;
    config.mode = 'google_sheets';
    saveStoredCloudConfig(config);
  }

  return config;
}

export function saveStoredCloudConfig(config: CloudConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving cloud config:', e);
  }
}

// Generate a shareable URL that embeds the Webhook for colleagues' phones
export function getShareableSurveyUrl(): string {
  if (typeof window === 'undefined') return 'https://sanyi-eap-survey.app';
  
  const currentOrigin = window.location.origin;
  const currentPath = window.location.pathname;
  const config = getStoredCloudConfig();

  if (config.googleSheetsWebhookUrl && config.googleSheetsWebhookUrl.trim().length > 0) {
    const encoded = encodeURIComponent(config.googleSheetsWebhookUrl.trim());
    return `${currentOrigin}${currentPath}?gs=${encoded}`;
  }

  return `${currentOrigin}${currentPath}`;
}
