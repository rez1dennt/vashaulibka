import {
  ACCESSIBILITY_PREFERENCES_VERSION,
  ACCESSIBILITY_STORAGE_KEY,
} from '../js/core/accessibility-preferences.js';

const CHOICES = Object.freeze({
  scale: ['100', '125', '150', '200'],
  theme: ['standard', 'black-white', 'white-black', 'blue-light'],
  font: ['site', 'sans'],
  letterSpacing: ['standard', 'medium', 'large'],
  lineHeight: ['standard', 'medium', 'large'],
  paragraphSpacing: ['standard', 'large'],
  images: ['visible', 'hidden'],
});

export function renderAccessibilityBootstrap() {
  return `<script data-accessibility-bootstrap>(()=>{const r=document.documentElement;r.classList.replace('no-js','js');try{const p=JSON.parse(localStorage.getItem(${JSON.stringify(ACCESSIBILITY_STORAGE_KEY)}));const c=${JSON.stringify(CHOICES)};const k=['version','enabled',...Object.keys(c)];if(!p||Array.isArray(p)||typeof p!=='object'||Object.keys(p).length!==k.length||!k.every(x=>Object.prototype.hasOwnProperty.call(p,x))||p.version!==${ACCESSIBILITY_PREFERENCES_VERSION}||typeof p.enabled!=='boolean'||!Object.entries(c).every(([x,v])=>typeof p[x]==='string'&&v.includes(p[x]))||!p.enabled)return;r.dataset.accessibilityEnabled='true';r.dataset.accessibilityScale=p.scale;r.dataset.accessibilityTheme=p.theme;r.dataset.accessibilityFont=p.font;r.dataset.accessibilityLetterSpacing=p.letterSpacing;r.dataset.accessibilityLineHeight=p.lineHeight;r.dataset.accessibilityParagraphSpacing=p.paragraphSpacing;r.dataset.accessibilityImages=p.images}catch{}})()</script>`;
}
