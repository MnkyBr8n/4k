import { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout';
import { Card, CardWithHeader, Button, Input, useNotification } from '../components/ui';
import {
  getSettings,
  saveSettings,
  exportAllData,
  importData,
  clearAllData,
  getStorageInfo,
  getCharacters,
} from '../services/storage';
import { testConnection, syncAllCharacters } from '../services/github-api';
import type { AppSettings, StorageInfo } from '../types';

export function Settings() {
  const { showNotification } = useNotification();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [githubConfig, setGithubConfig] = useState({
    owner: '',
    repo: '',
    branch: 'main',
    token: '',
  });

  useEffect(() => {
    setSettings(getSettings());
    setStorageInfo(getStorageInfo());

    // Load GitHub config from localStorage
    const savedConfig = localStorage.getItem('4k_studio_github_config');
    if (savedConfig) {
      try {
        setGithubConfig(JSON.parse(savedConfig));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  const handleSaveSettings = () => {
    if (settings) {
      saveSettings(settings);
      showNotification('success', 'Settings saved');
    }
  };

  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSaveGitHubConfig = () => {
    localStorage.setItem('4k_studio_github_config', JSON.stringify(githubConfig));
    showNotification('success', 'GitHub settings saved');
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    const result = await testConnection();
    setIsTesting(false);

    if (result.success) {
      showNotification('success', 'Connected to GitHub successfully!');
    } else {
      showNotification('error', result.error || 'Connection failed');
    }
  };

  const handleSyncToGitHub = async () => {
    setIsSyncing(true);
    const characters = getCharacters();
    // Convert to plain objects for GitHub API
    const plainCharacters = characters.map(c => ({ ...c }));
    const result = await syncAllCharacters(plainCharacters);
    setIsSyncing(false);

    if (result.success) {
      showNotification('success', `Synced ${result.synced} characters, ${result.imagesUploaded} images uploaded`);
    } else {
      showNotification('error', `Sync failed: ${result.synced} synced, ${result.failed} failed`);
    }
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `4k-studio-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('success', 'Backup downloaded');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = importData(content);
      if (result.success) {
        showNotification('success', 'Data restored successfully');
        window.location.reload();
      } else {
        showNotification('error', `Import failed: ${result.error}`);
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (!confirm('Are you sure you want to delete ALL data? This cannot be undone!')) return;
    if (!confirm('This will permanently delete all characters, images, and settings. Type "DELETE" to confirm.')) return;

    const confirmation = prompt('Type DELETE to confirm:');
    if (confirmation !== 'DELETE') {
      showNotification('info', 'Cancelled');
      return;
    }

    clearAllData();
    showNotification('success', 'All data cleared');
    window.location.reload();
  };

  if (!settings) return null;

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your preferences and data"
        icon="⚙️"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance */}
        <CardWithHeader title="Appearance" subtitle="Customize the look and feel">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSettings({ ...settings, theme: 'light' })}
                  className={`flex-1 p-3 rounded border-2 transition-colors ${
                    settings.theme === 'light'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-dark-border'
                  }`}
                >
                  <span className="text-2xl block mb-1">☀️</span>
                  <span className="text-sm">Light</span>
                </button>
                <button
                  onClick={() => setSettings({ ...settings, theme: 'dark' })}
                  className={`flex-1 p-3 rounded border-2 transition-colors ${
                    settings.theme === 'dark'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-dark-border'
                  }`}
                >
                  <span className="text-2xl block mb-1">🌙</span>
                  <span className="text-sm">Dark</span>
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => setSettings({ ...settings, autoSave: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Auto-save changes
                </span>
              </label>
            </div>

            <Button variant="primary" onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </div>
        </CardWithHeader>

        {/* Storage */}
        <CardWithHeader title="Storage" subtitle="View and manage your data">
          {storageInfo && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-gray-50 dark:bg-dark-tertiary rounded">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {storageInfo.characters}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Characters</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-dark-tertiary rounded">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {storageInfo.images}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Images</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-dark-tertiary rounded">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {storageInfo.backgrounds}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Backgrounds</div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Storage Used</span>
                  <span className="text-gray-900 dark:text-gray-100">{storageInfo.totalSize}</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-dark-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                    style={{ width: '10%' }} // Simplified - would calculate actual percentage
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {storageInfo.available} available
                </div>
              </div>
            </div>
          )}
        </CardWithHeader>

        {/* GitHub Sync */}
        <CardWithHeader title="GitHub Sync" subtitle="Sync your data to a GitHub repository">
          <div className="space-y-4">
            <Input
              label="Repository Owner"
              placeholder="username"
              value={githubConfig.owner}
              onChange={(e) => setGithubConfig({ ...githubConfig, owner: e.target.value })}
            />
            <Input
              label="Repository Name"
              placeholder="my-repo"
              value={githubConfig.repo}
              onChange={(e) => setGithubConfig({ ...githubConfig, repo: e.target.value })}
            />
            <Input
              label="Branch"
              placeholder="main"
              value={githubConfig.branch}
              onChange={(e) => setGithubConfig({ ...githubConfig, branch: e.target.value })}
            />
            <Input
              label="Personal Access Token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxx"
              value={githubConfig.token}
              onChange={(e) => setGithubConfig({ ...githubConfig, token: e.target.value })}
              hint="Generate at github.com/settings/tokens"
            />

            <div className="flex gap-2">
              <Button variant="primary" onClick={handleSaveGitHubConfig} className="flex-1">
                Save Config
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                disabled={!githubConfig.token || isTesting}
                onClick={handleTestConnection}
                isLoading={isTesting}
              >
                Test Connection
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Sync characters to <code className="bg-gray-100 dark:bg-dark-tertiary px-1 rounded">data/characters.js</code> and portraits to <code className="bg-gray-100 dark:bg-dark-tertiary px-1 rounded">/oc</code> folder.
              </p>
              <Button
                variant="primary"
                className="w-full"
                disabled={!githubConfig.token || isSyncing}
                onClick={handleSyncToGitHub}
                isLoading={isSyncing}
              >
                🔄 Sync Characters to GitHub
              </Button>
            </div>
          </div>
        </CardWithHeader>

        {/* Backup & Restore */}
        <CardWithHeader title="Backup & Restore" subtitle="Export or import your data">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create a backup of all your characters, images, and settings, or restore from a previous backup.
            </p>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleExport} className="flex-1">
                📥 Download Backup
              </Button>
              <label className="flex-1 cursor-pointer">
                <span className="inline-flex items-center justify-center gap-2 w-full px-3 py-1.5 text-sm border rounded-sm font-normal transition-all duration-100 bg-white border-gray-300 text-gray-900 hover:bg-gray-100 hover:border-primary dark:bg-dark-panel dark:border-dark-border dark:text-gray-100 dark:hover:bg-dark-tertiary">
                  📤 Restore Backup
                </span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
            </div>
          </div>
        </CardWithHeader>

        {/* Danger Zone */}
        <Card className="lg:col-span-2 border-error/50">
          <h3 className="text-lg font-semibold text-error mb-2">Danger Zone</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Irreversible actions. Please be careful.
          </p>

          <Button variant="danger" onClick={handleClearData}>
            🗑️ Delete All Data
          </Button>
        </Card>
      </div>
    </div>
  );
}
