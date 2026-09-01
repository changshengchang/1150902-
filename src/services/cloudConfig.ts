export interface CloudConfig {
  mode: 'auto' | 'api' | 'google_sheets' | 'firebase' | 'local';
  googleSheetsWebhookUrl?: string;
}

const STORAGE_KEY = 'sanyi_eap_cloud_config_115';

// Listeners for real-time config updates across React components
type ConfigListener = (config: CloudConfig) => void;
const configListeners = new Set<ConfigListener>();

export function subscribeCloudConfig(listener: ConfigListener): () => void {
  configListeners.add(listener);
  return () => configListeners.delete(listener);
}

function notifyConfigListeners(config: CloudConfig) {
  configListeners.forEach(listener => {
    try {
      listener(config);
    } catch (e) {
      console.error('Error notifying config listener:', e);
    }
  });
}

// Check if URL contains query parameter on initial load (e.g. from QR code)
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {}
    // Explicitly push non-empty URL to server
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
  notifyConfigListeners(config);
  // Only push to server if we have an actual valid non-empty URL
  if (config.googleSheetsWebhookUrl && config.googleSheetsWebhookUrl.trim().startsWith('http')) {
    pushConfigToServer(config).catch(() => {});
  }
}

export async function pushConfigToServer(config: CloudConfig): Promise<boolean> {
  // Never push empty url unless explicitly intended via clearWebhookUrlOnServer
  if (!config.googleSheetsWebhookUrl || !config.googleSheetsWebhookUrl.trim().startsWith('http')) {
    return false;
  }

  try {
    const res = await fetch('/api/cloud-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'google_sheets',
        googleSheetsWebhookUrl: config.googleSheetsWebhookUrl.trim()
      })
    });
    return res.ok;
  } catch (err) {
    console.warn('[Cloud Config Sync Warning]', err);
    return false;
  }
}

// Explicitly save Webhook URL to server and local storage
export async function saveWebhookUrlDirectly(webhookUrl: string): Promise<boolean> {
  const trimmed = webhookUrl.trim();
  const updated: CloudConfig = {
    mode: trimmed ? 'google_sheets' : 'auto',
    googleSheetsWebhookUrl: trimmed
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  notifyConfigListeners(updated);

  try {
    const res = await fetch('/api/cloud-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: trimmed ? 'google_sheets' : 'auto',
        googleSheetsWebhookUrl: trimmed,
        explicitClear: !trimmed
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Explicitly clear Webhook URL from server and local storage
export async function clearWebhookUrlOnServer(): Promise<boolean> {
  const cleared: CloudConfig = {
    mode: 'auto',
    googleSheetsWebhookUrl: ''
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleared));
  } catch {}

  notifyConfigListeners(cleared);

  try {
    const res = await fetch('/api/cloud-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'auto',
        googleSheetsWebhookUrl: '',
        explicitClear: true
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Automatically fetch latest config from central server on startup
export async function initCloudConfigFromServer(): Promise<CloudConfig> {
  const localConfig = getStoredCloudConfig();
  try {
    const res = await fetch('/api/cloud-config', {
      headers: { Accept: 'application/json' }
    });
    if (res.ok) {
      const serverConfig = await res.json();
      if (serverConfig && typeof serverConfig.googleSheetsWebhookUrl === 'string' && serverConfig.googleSheetsWebhookUrl.trim().length > 0) {
        const merged: CloudConfig = {
          mode: 'google_sheets',
          googleSheetsWebhookUrl: serverConfig.googleSheetsWebhookUrl.trim()
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch {}
        notifyConfigListeners(merged);
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
  if (typeof window === 'undefined') return '';
  
  const currentOrigin = window.location.origin;
  const currentPath = window.location.pathname;
  const config = getStoredCloudConfig();

  if (config.googleSheetsWebhookUrl && config.googleSheetsWebhookUrl.trim().length > 0) {
    const encoded = encodeURIComponent(config.googleSheetsWebhookUrl.trim());
    return `${currentOrigin}${currentPath}?gs=${encoded}`;
  }

  return `${currentOrigin}${currentPath}`;
}
