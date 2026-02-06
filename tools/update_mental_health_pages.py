#!/usr/bin/env python3
"""
Add notification banner and recommended resources to all Mental Health Resource pages.
"""

import os
import re
from pathlib import Path

MENTAL_HEALTH_DIR = Path(__file__).parent.parent / "MENTALHEALTHRESOURCES"

# Notification banner HTML (to be inserted after crisis banner)
NOTIFICATION_BANNER = '''
  <section class="info-banner">
    <div class="info-content">
      <span class="info-icon">ℹ️</span>
      <div class="info-text">
        <strong>Note:</strong> Save features use your browser's local storage and are for personal reflection only. 
        Data is stored on your device and not on our servers. These tools are designed for self-reflection and are not a substitute for professional help.
      </div>
    </div>
  </section>
'''

# Notification banner CSS
NOTIFICATION_CSS = '''
    .info-banner {
      background: linear-gradient(90deg, #1e40af 0%, #3730a3 100%);
      color: white;
      padding: 0.75rem 1rem;
      border-bottom: 2px solid #1e3a8a;
    }
    .info-content {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .info-icon { font-size: 1.25rem; }
    .info-text { font-size: 0.875rem; line-height: 1.4; }
    .info-text strong { color: #fbbf24; }
'''

# Recommended resources section HTML (to be inserted before back-link)
RESOURCES_SECTION = '''
    <div class="recommended-resources">
      <h3>📚 Recommended Resources</h3>
      <div class="resources-grid">
        <div class="resource-category">
          <h4>📖 Books</h4>
          <ul>
            <li><a href="https://www.amazon.com/Feeling-Good-New-Mood-Therapy/dp/0380810336" target="_blank" rel="noopener noreferrer">"Feeling Good" by David D. Burns</a> - CBT classic</li>
            <li><a href="https://www.amazon.com/Body-Keeps-Score-Healing-Trauma/dp/0143127748" target="_blank" rel="noopener noreferrer">"The Body Keeps the Score" by Bessel van der Kolk</a> - Trauma & healing</li>
            <li><a href="https://www.amazon.com/Atomic-Habits-Proven-Build-Break/dp/0735211299" target="_blank" rel="noopener noreferrer">"Atomic Habits" by James Clear</a> - Building better habits</li>
            <li><a href="https://www.amazon.com/Mans-Search-Meaning-Viktor-Frankl/dp/0807014273" target="_blank" rel="noopener noreferrer">"Man's Search for Meaning" by Viktor Frankl</a> - Finding purpose</li>
          </ul>
        </div>
        <div class="resource-category">
          <h4>🎬 Videos & Channels</h4>
          <ul>
            <li><a href="https://www.youtube.com/@hubaboratoryermanlab" target="_blank" rel="noopener noreferrer">Huberman Lab</a> - Neuroscience-based mental health</li>
            <li><a href="https://www.youtube.com/@HealthyGamerGG" target="_blank" rel="noopener noreferrer">HealthyGamer GG</a> - Mental health for modern life</li>
            <li><a href="https://www.youtube.com/@TherapyinaNutshell" target="_blank" rel="noopener noreferrer">Therapy in a Nutshell</a> - CBT & DBT techniques</li>
            <li><a href="https://www.ted.com/topics/mental+health" target="_blank" rel="noopener noreferrer">TED Talks: Mental Health</a> - Expert insights</li>
          </ul>
        </div>
        <div class="resource-category">
          <h4>🎧 Apps & Podcasts</h4>
          <ul>
            <li><a href="https://www.headspace.com" target="_blank" rel="noopener noreferrer">Headspace</a> - Guided meditation</li>
            <li><a href="https://www.calm.com" target="_blank" rel="noopener noreferrer">Calm</a> - Sleep & relaxation</li>
            <li><a href="https://www.wysa.io" target="_blank" rel="noopener noreferrer">Wysa</a> - AI mental health companion</li>
            <li><a href="https://podcasts.apple.com/us/podcast/the-happiness-lab-with-dr-laurie-santos/id1474245040" target="_blank" rel="noopener noreferrer">The Happiness Lab Podcast</a></li>
          </ul>
        </div>
      </div>
    </div>
'''

# Resources section CSS
RESOURCES_CSS = '''
    .recommended-resources {
      background: var(--surface-2);
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-top: 2rem;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .recommended-resources h3 {
      color: var(--pk-500);
      margin-bottom: 1rem;
      font-size: 1.25rem;
    }
    .resources-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    .resource-category h4 {
      color: var(--text-1);
      margin-bottom: 0.75rem;
      font-size: 1rem;
    }
    .resource-category ul {
      list-style: none;
      padding: 0;
    }
    .resource-category li {
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }
    .resource-category a {
      color: var(--text-2);
      text-decoration: none;
      transition: color 0.3s;
    }
    .resource-category a:hover {
      color: var(--pk-500);
      text-decoration: underline;
    }
'''

def update_html_file(filepath: Path):
    """Update a single HTML file with notification and resources."""
    content = filepath.read_text(encoding='utf-8')
    modified = False
    
    # Skip index.html - it has a different structure
    if filepath.name == 'index.html':
        print(f"  [SKIP] {filepath.name} (index page)")
        return
    
    # Check if already updated
    if 'info-banner' in content:
        print(f"  [SKIP] {filepath.name} (already updated)")
        return
    
    # 1. Add CSS before </style>
    if '</style>' in content and '.info-banner' not in content:
        content = content.replace('</style>', NOTIFICATION_CSS + RESOURCES_CSS + '\n  </style>')
        modified = True
    
    # 2. Add notification banner after crisis banner
    crisis_banner_end = '</section>'
    # Find the first </section> which should be the crisis banner
    if '<section class="crisis-banner">' in content:
        # Find position after first </section>
        pos = content.find('</section>')
        if pos != -1:
            pos += len('</section>')
            content = content[:pos] + '\n' + NOTIFICATION_BANNER + content[pos:]
            modified = True
    
    # 3. Add resources section before back-link
    back_link_pattern = r'(<div style="text-align: center;">\s*<a href="/MENTALHEALTHRESOURCES/" class="back-link">)'
    if re.search(back_link_pattern, content):
        content = re.sub(back_link_pattern, RESOURCES_SECTION + '\n\n    \\1', content)
        modified = True
    
    if modified:
        filepath.write_text(content, encoding='utf-8')
        print(f"  [OK] {filepath.name}")
    else:
        print(f"  [WARN] {filepath.name} - no changes made")

def main():
    print("Updating Mental Health Resource pages...")
    print()
    
    html_files = list(MENTAL_HEALTH_DIR.glob("*.html"))
    
    for html_file in sorted(html_files):
        update_html_file(html_file)
    
    print()
    print(f"Updated {len(html_files)} files")

if __name__ == "__main__":
    main()
