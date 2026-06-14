async function loadJson(path, fallback) {
  try {
    const r = await fetch(path);
    if (!r.ok) throw new Error(path);
    return await r.json();
  } catch { return fallback; }
}

async function loadText(path, fallback) {
  try {
    const r = await fetch(path);
    if (!r.ok) throw new Error(path);
    return await r.text();
  } catch { return fallback; }
}

function markdownToHtml(md) {
  return md.split(/\n{2,}/).map(b => b.trim()).filter(Boolean).map(b => {
    if (b.startsWith('# ')) return `<h3>${b.slice(2)}</h3>`;
    return `<p>${b.replace(/\n/g, '<br>')}</p>`;
  }).join('');
}

function renderPublications(items, container, emptyText) {
  if (!items.length) { container.innerHTML = `<p class="empty">${emptyText}</p>`; return; }
  container.innerHTML = items.map(item => `
    <article class="item-card">
      <p class="citation">•${item.url ? `<a href="${item.url}" target="_blank" rel="noreferrer">${item.citationHtml || item.citation || item.title}</a>` : item.citationHtml || item.citation || item.title}</p>
    </article>
  `).join('');
}

function apaName(name) {
  const cleaned = name.trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length < 2) return cleaned;
  const surname = parts.pop();
  const initials = parts.map(part => `${part.replace(/\./g, '')[0]}.`).join(' ');
  return `${surname}, ${initials}`;
}

function apaNames(value) {
  const names = value
    .replace(/\s*&\s*/g, ', ')
    .split(/\s*,\s*/)
    .filter(Boolean)
    .map(apaName);

  if (names.length <= 1) return names[0] || '';
  return `${names.slice(0, -1).join(', ')}, & ${names[names.length - 1]}`;
}

function translatorName(name) {
  const cleaned = name.trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length < 2) return cleaned;
  const surname = parts.pop();
  const initials = parts.map(part => `${part.replace(/\./g, '')[0]}.`).join(' ');
  return `${initials} ${surname}`;
}

function translatorNames(value) {
  const names = value
    .replace(/\s*&\s*/g, ', ')
    .split(/\s*,\s*/)
    .filter(Boolean)
    .map(translatorName);

  if (names.length <= 1) return names[0] || '';
  return `${names.slice(0, -1).join(', ')}, & ${names[names.length - 1]}`;
}

function renderTranslationCitation(item) {
  const author = apaNames(item.author || '');
  const authorWithPeriod = author.endsWith('.') ? author : `${author}.`;
  const translator = item.translator ? ` (${translatorNames(item.translator)}, Trans.)` : '';
  const titleZh = item.titleZh || item.title || '';
  const titleEn = item.titleEn ? ` [${item.titleEn}]` : '';
  const year = item.year || 'n.d.';
  const publisher = item.publisher ? `${item.publisher}.` : '';
  const rating = item.rating ? ` ${item.rating}.` : '';
  return `${authorWithPeriod} (${year}). <em>${titleZh}${titleEn}</em>${translator}. ${publisher}${rating}`;
}

function renderTranslations(items, container, emptyText) {
  if (!items.length) { container.innerHTML = `<p class="empty">${emptyText}</p>`; return; }
  container.innerHTML = items.map(item => `
    <article class="book-entry">
      <p class="book-main">•${renderTranslationCitation(item)}</p>
    </article>
  `).join('');
}

function renderInfo(items) {
  const container = document.querySelector('[data-info-list]');
  if (!container) return;
  container.innerHTML = (items || []).map(item => `
    <div class="info-item">
      <div class="info-icon">${item.icon && item.icon.includes('/') ? `<img src="${item.icon}" alt="" />` : item.icon || '-'}</div>
      <div>
        <p class="info-title">${item.title || ''}</p>
        ${item.url
          ? `<p class="info-subtitle"><a href="${item.url}" target="_blank" rel="noreferrer">${item.label || item.subtitle || item.url}</a></p>`
          : `<p class="info-subtitle">${item.subtitle || ''}</p>`}
      </div>
    </div>
  `).join('');
}

function videoEmbed(url) {
  if (!url) return '<p>Project video will appear here when available.</p>';
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const id = url.includes('youtu.be') ? url.split('/').pop() : new URL(url).searchParams.get('v');
    return `<iframe src="https://www.youtube.com/embed/${id}" title="Project video" allowfullscreen></iframe>`;
  }
  if (url.endsWith('.mp4')) return `<video src="${url}" controls></video>`;
  return `<p><a href="${url}" target="_blank" rel="noreferrer">Open project video</a></p>`;
}

function projectPreview(project) {
  if (project.videoUrl) return videoEmbed(project.videoUrl);
  if (project.imageUrl) {
    return `<img src="${project.imageUrl}" alt="${project.imageAlt || project.title || 'Project preview'}" />`;
  }
  return '<p>Project preview will appear here when available.</p>';
}

async function main() {
  const site = await loadJson('content/site.json', {});
  const publications = await loadJson('content/publications.json', []);
  const translations = await loadJson('content/translations.json', []);
  const project = await loadJson('content/project.json', {});
  const profile = await loadText('content/profile.md', 'Profile coming soon.');

  document.querySelector('[data-hero-name]').textContent = site.name || 'Xie Hailun';
  document.querySelector('[data-last-updated]').textContent = site.lastUpdated || '';
  document.title = site.siteName || 'Xie Hailun';
  if (site.tagline) {
    const sub = document.querySelector('[data-tagline]');
    if (sub) sub.textContent = site.tagline;
  }
  renderInfo(site.info || []);
  document.querySelector('[data-profile]').innerHTML = markdownToHtml(profile);
  renderPublications(publications, document.querySelector('[data-publications]'), 'Publications will be added soon.');
  renderTranslations(translations, document.querySelector('[data-translations]'), 'Translations will be added soon.');

  document.querySelector('[data-project-title]').textContent = project.title || 'Wright';
  document.querySelector('[data-project-summary]').textContent = project.summary || '';
  const projectLinks = document.querySelector('[data-project-links]');
  if (project.repoUrl) {
    projectLinks.innerHTML = `<a href="${project.repoUrl}" target="_blank" rel="noreferrer">Go to GitHub &rarr;</a>`;
  } else {
    projectLinks.remove();
  }
  const projectMedia = document.querySelector('[data-project-media]');
  if (project.videoUrl || project.imageUrl) { projectMedia.innerHTML = projectPreview(project); } else { projectMedia.remove(); }
}

main();

