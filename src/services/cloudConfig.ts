export interface CloudConfig {
  mode: 'auto' | 'api' | 'google_sheets' | 'firebase' | 'local';
  googleSheetsWebhookUrl?: string;
}

const STORAGE_KEY = 'sanyi_eap_cloud_config_115';

export function getStoredCloudConfig(): CloudConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading cloud config:', e);
  }
  return {
    mode: 'auto',
    googleSheetsWebhookUrl: ''
  };
}

export function saveStoredCloudConfig(config: CloudConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving cloud config:', e);
  }
}
