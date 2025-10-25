 * Export Tools Module
 * PDF portfolios, social media cards, data backup/restore
 */

class ExportTools {
  constructor() {
    this.init();
  }

  init() {
    console.log('Export Tools initialized');
  }

  async exportBackup() {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        characters: JSON.parse(localStorage.getItem('4k_characters') || '{}'),
        images: JSON.parse(localStorage.getItem('4k_images') || '{}'),
        heroBackgrounds: JSON.parse(localStorage.getItem('4k_hero_backgrounds') || '{}'),
        settings: {
          githubOwner: localStorage.getItem('4k_github_owner'),
          githubRepo: localStorage.getItem('4k_github_repo'),
          githubBranch: localStorage.getItem('4k_github_branch')
        },
        activityLog: JSON.parse(localStorage.getItem('4k_activity_log') || '[]')
      }
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `4k-studio-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    return {
      success: true,
      message: 'Backup downloaded successfully'
    };
  }

  async restoreBackup(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target.result);
          
          if (!backup.version || !backup.data) {
            reject(new Error('Invalid backup file format'));
            return;
          }

          if (backup.data.characters) {
            localStorage.setItem('4k_characters', JSON.stringify(backup.data.characters));
          }
          if (backup.data.images) {
            localStorage.setItem('4k_images', JSON.stringify(backup.data.images));
          }
          if (backup.data.heroBackgrounds) {
            localStorage.setItem('4k_hero_backgrounds', JSON.stringify(backup.data.heroBackgrounds));
          }
          if (backup.data.settings) {
            if (backup.data.settings.githubOwner) {
              localStorage.setItem('4k_github_owner', backup.data.settings.githubOwner);
            }
            if (backup.data.settings.githubRepo) {
              localStorage.setItem('4k_github_repo', backup.data.settings.githubRepo);
            }
            if (backup.data.settings.githubBranch) {
              localStorage.setItem('4k_github_branch', backup.data.settings.githubBranch);
            }
          }
          if (backup.data.activityLog) {
            localStorage.setItem('4k_activity_log', JSON.stringify(backup.data.activityLog));
          }

          resolve({
            success: true,
            message: 'Backup restored successfully',
            stats: {
              characters: Object.keys(backup.data.characters || {}).length,
              images: Object.keys(backup.data.images || {}).length,
              heroBackgrounds: Object.keys(backup.data.heroBackgrounds || {}).length
            }
          });
        } catch (e) {
          reject(new Error(`Failed to restore backup: ${e.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read backup file'));
      };

      reader.readAsText(file);
    });
  }

  async generateSocialMediaCard(characterId, options = {}) {
    const {
      width = 1200,
      height = 630,
      template = 'default',
      includeStats = true
    } = options;

    const characters = JSON.parse(localStorage.getItem('4k_characters') || '{}');
    const character = characters[characterId];

    if (!character) {
      throw new Error('Character not found');
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (character.portrait) {
      try {
        const img = await this.loadImage(character.portrait);
        const portraitSize = height * 0.8;
        const portraitX = 50;
        const portraitY = (height - portraitSize) / 2;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(portraitX + portraitSize / 2, portraitY + portraitSize / 2, portraitSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, portraitX, portraitY, portraitSize, portraitSize);
        ctx.restore();
      } catch (e) {
        console.warn('Failed to load portrait:', e);
      }
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(character.name, width - 50, height / 2 - 50);

    if (character.about) {
      ctx.font = '32px Arial, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      const aboutShort = character.about.substring(0, 80) + (character.about.length > 80 ? '...' : '');
      ctx.fillText(aboutShort, width - 50, height / 2 + 20);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(width - 250, height - 80, 200, 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(character.template || 'Character', width - 150, height - 45);

    if (includeStats && character.template === 'dandy' && character.stats) {
      const statsY = height / 2 + 80;
      ctx.font = '20px Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`⚡ ${character.stats.speed || 0}/5`, width - 50, statsY);
      ctx.fillText(`💪 ${character.stats.strength || 0}/5`, width - 50, statsY + 30);
      ctx.fillText(`🧠 ${character.stats.smarts || 0}/5`, width - 50, statsY + 60);
    }

    ctx.font = '18px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('4K-art.com', 20, height - 20);

    return canvas.toDataURL('image/png');
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async downloadSocialMediaCard(characterId, options = {}) {
    try {
      const imageDataURL = await this.generateSocialMediaCard(characterId, options);
      
      const characters = JSON.parse(localStorage.getItem('4k_characters') || '{}');
      const character = characters[characterId];
      const filename = `${character.slug || characterId}-social-card.png`;

      const link = document.createElement('a');
      link.href = imageDataURL;
      link.download = filename;
      link.click();

      return {
        success: true,
        message: 'Social media card downloaded'
      };
    } catch (e) {
      return {
        success: false,
        error: e.message
      };
    }
  }

  generatePDFPortfolio(options = {}) {
    const {
      includeCharacters = true,
      includeImages = true,
      characterIds = null
    } = options;

    const characters = JSON.parse(localStorage.getItem('4k_characters') || '{}');
    const images = JSON.parse(localStorage.getItem('4k_images') || '{}');

    let charactersToInclude = Object.values(characters);
    if (characterIds) {
      charactersToInclude = charactersToInclude.filter(c => characterIds.includes(c.id));
    }

    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>4K Art Portfolio</title>
  <style>
    @page { margin: 1in; }
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .cover-page {
      text-align: center;
      padding: 100px 0;
      page-break-after: always;
    }
    .cover-page h1 {
      font-size: 48px;
      margin-bottom: 20px;
      background: linear-gradient(45deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .character-page {
      page-break-after: always;
      padding: 20px;
    }
    .character-header {
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .character-name {
      font-size: 36px;
      font-weight: bold;
      color: #667eea;
    }
    .character-portrait {
      float: right;
      width: 200px;
      height: 200px;
      object-fit: cover;
      border-radius: 10px;
      margin-left: 20px;
    }
    .character-info {
      margin: 20px 0;
    }
    .character-images {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 20px;
    }
    .character-images img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      border-radius: 5px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin: 20px 0;
    }
    .stat-item {
      padding: 10px;
      background: #f0f0f0;
      border-radius: 5px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <h1>4K Art Portfolio</h1>
    <p style="font-size: 24px; color: #666;">Character Collection</p>
    <p style="margin-top: 50px; color: #999;">Generated ${new Date().toLocaleDateString()}</p>
  </div>
`;

    charactersToInclude.forEach(character => {
      html += `
  <div class="character-page">
    <div class="character-header">
      ${character.portrait ? `<img src="${character.portrait}" class="character-portrait" alt="${character.name}">` : ''}
      <h2 class="character-name">${character.name}</h2>
      <p style="font-style: italic; color: #666;">${character.template || 'Character'}</p>
    </div>
    
    <div class="character-info">
      ${character.about ? `<p><strong>About:</strong> ${character.about}</p>` : ''}
      ${character.pronouns ? `<p><strong>Pronouns:</strong> ${character.pronouns}</p>` : ''}
      ${character.species ? `<p><strong>Species:</strong> ${character.species}</p>` : ''}
    </div>
`;

      if (character.template === 'dandy' && character.stats) {
        html += `
    <div class="stats-grid">
      <div class="stat-item">
        <strong>⚡ Speed</strong><br>${character.stats.speed || 0}/5
      </div>
      <div class="stat-item">
        <strong>💪 Strength</strong><br>${character.stats.strength || 0}/5
      </div>
      <div class="stat-item">
        <strong>🧠 Smarts</strong><br>${character.stats.smarts || 0}/5
      </div>
    </div>
`;
      }

      if (includeImages) {
        const characterImages = Object.values(images).filter(img => img.characterId === character.id);
        if (characterImages.length > 0) {
          html += `
    <div class="character-images">
`;
          characterImages.slice(0, 9).forEach(img => {
            html += `      <img src="${img.imageData || img.path}" alt="${img.filename}">\n`;
          });
          html += `    </div>\n`;
        }
      }

      html += `  </div>\n\n`;
    });

    html += `
</body>
</html>
`;

    return html;
  }

  downloadPDFPortfolio(options = {}) {
    const html = this.generatePDFPortfolio(options);
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `4k-portfolio-${Date.now()}.html`;
    link.click();
    URL.revokeObjectURL(url);

    return {
      success: true,
      message: 'Portfolio HTML downloaded. Open in browser and print to PDF (Ctrl+P)'
    };
  }

  getExportStats() {
    const characters = JSON.parse(localStorage.getItem('4k_characters') || '{}');
    const images = JSON.parse(localStorage.getItem('4k_images') || '{}');
    const heroBackgrounds = JSON.parse(localStorage.getItem('4k_hero_backgrounds') || '{}');

    return {
      totalCharacters: Object.keys(characters).length,
      totalImages: Object.keys(images).length,
      totalHeroBackgrounds: Object.keys(heroBackgrounds).length,
      storageUsed: this.calculateStorageUsed(),
      lastBackup: localStorage.getItem('4k_last_backup') || 'Never'
    };
  }

  calculateStorageUsed() {
    let total = 0;
    for (let key in localStorage) {
      if (key.startsWith('4k_')) {
        total += localStorage[key].length * 2;
      }
    }
    
    const mb = (total / 1024 / 1024).toFixed(2);
    return `${mb} MB`;
  }

  clearAllData() {
    const keysToRemove = [];
    for (let key in localStorage) {
      if (key.startsWith('4k_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));

    return {
      success: true,
      message: `Cleared ${keysToRemove.length} items`,
      cleared: keysToRemove.length
    };
  }
}

const exportTools = new ExportTools();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportTools;
}
ENDOFFILE
echo "File 1 created: export-tools.txt"
