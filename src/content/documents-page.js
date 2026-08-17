import { DOCUMENT_GROUPS } from '../data/documents.js';

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const renderDocumentActions = (item) => {
  if (item.localPdf) {
    const actions = [
      `<a class="button button-secondary" href="${escapeHtml(item.href)}">Открыть PDF</a>`,
      `<a class="text-link" href="${escapeHtml(item.href)}" download>Скачать PDF</a>`,
    ];
    if (item.officialHref) {
      actions.push(`<a class="text-link" href="${escapeHtml(item.officialHref)}" target="_blank" rel="noopener">Официальный источник</a>`);
    }
    return actions.join('\n      ');
  }
  if (item.kind === 'Страница сайта') {
    return `<a class="button button-secondary" href="${escapeHtml(item.href)}">Открыть</a>`;
  }
  return `<a class="button button-secondary" href="${escapeHtml(item.href)}" target="_blank" rel="noopener">Перейти к официальному ресурсу</a>`;
};

const renderDocumentItem = (item) => `
  <article class="document-item" id="document-${escapeHtml(item.id)}" data-document-item>
    <div class="document-item__copy">
      <span class="document-status" data-tone="${escapeHtml(item.statusTone)}">${escapeHtml(item.status)}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.meta)}</p>
    </div>
    <div class="document-item__actions">
      ${renderDocumentActions(item)}
    </div>
  </article>`;

const categoryNavigation = DOCUMENT_GROUPS
  .map((group) => `<li><a href="#documents-${escapeHtml(group.id)}">${escapeHtml(group.title)}</a></li>`)
  .join('');

const directory = DOCUMENT_GROUPS
  .map((group) => `<section class="documents-group" id="documents-${escapeHtml(group.id)}"><header><p class="eyebrow">Раздел документов</p><h2>${escapeHtml(group.title)}</h2></header><div class="documents-group__items">${group.items.map(renderDocumentItem).join('')}</div></section>`)
  .join('');

export const DOCUMENTS_PAGE = Object.freeze({
  file: 'documents.html',
  title: 'Документы стоматологической клиники',
  description: 'Документы ООО «Стоматология Ваша улыбка»: лицензия, регистрационные сведения, утверждённый прайс-лист, права пациентов, нормативные источники и охрана труда.',
  heading: 'Документы',
  lead: 'Документы клиники, информация для пациентов и ссылки на официальные публикации нормативных актов.',
  heroImage: 'about',
  noindex: false,
  layout: 'patient',
  body: `<section class="section documents-centre"><div class="container patient-content"><nav class="documents-categories" aria-label="Категории документов"><h2>Выберите раздел</h2><ul>${categoryNavigation}</ul></nav><div class="documents-directory">${directory}</div><aside class="documents-centre__note notice"><h2>Официальные источники</h2><p>Нормативные акты открываются на официальном интернет-портале правовой информации или на сайте соответствующего государственного органа. PDF-документы клиники можно открыть или скачать.</p></aside></div></section>`,
});
