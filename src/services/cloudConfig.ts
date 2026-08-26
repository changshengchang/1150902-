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
    // Also try to push to server if server is running
    pushConfigToServer(config).catch(() => {});
  }

  return config;
}

export function saveStoredCloudConfig(config: CloudConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving cloud config:', e);
  }
  // Sync to server backend
  pushConfigToServer(config).catch(() => {});
}

async function pushConfigToServer(config: CloudConfig): Promise<void> {
  try {
    await fetch('/api/cloud-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
  } catch {
    // Silent catch if server is offline or static SPA
  }
}

// Automatically fetch latest config from server on startup
export async function initCloudConfigFromServer(): Promise<CloudConfig> {
  const localConfig = getStoredCloudConfig();
  try {
    const res = await fetch('/api/cloud-config', {
      headers: { Accept: 'application/json' }
    });
    if (res.ok) {
      const serverConfig = await res.json();
      if (serverConfig && serverConfig.googleSheetsWebhookUrl && serverConfig.googleSheetsWebhookUrl.trim().length > 0) {
        const merged: CloudConfig = {
          ...localConfig,
          googleSheetsWebhookUrl: serverConfig.googleSheetsWebhookUrl.trim(),
          mode: 'google_sheets'
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch {}
        return merged;
      }
    }
  } catch {
    // Backend not answering
  }
  return localConfig;
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initCloudConfigFromServer().catch(() => {});
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
