import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

/**
 * Inline all computed styles onto every element so that
 * html-to-image's DOM clone preserves Tailwind v4 runtime styles.
 * Returns a cleanup function that restores original inline styles.
 */
function inlineAllStyles(root: HTMLElement): () => void {
  const saved = new Map<HTMLElement, string>();

  const walk = (el: HTMLElement) => {
    saved.set(el, el.getAttribute('style') || '');
    const cs = window.getComputedStyle(el);
    // Copy all computed properties onto inline style
    for (let i = 0; i < cs.length; i++) {
      const prop = cs[i];
      el.style.setProperty(prop, cs.getPropertyValue(prop));
    }
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i];
      if (child instanceof HTMLElement) walk(child);
    }
  };

  walk(root);

  return () => {
    saved.forEach((original, el) => {
      if (original) {
        el.setAttribute('style', original);
      } else {
        el.removeAttribute('style');
      }
    });
  };
}

async function capture(element: HTMLElement): Promise<string> {
  // Add export padding
  const prevPadding = element.style.padding;
  element.style.padding = '24px 32px';

  // Inline all computed styles so the clone keeps layouts
  const restore = inlineAllStyles(element);

  const opts: Parameters<typeof toPng>[1] = {
    backgroundColor: '#FDFBF7',
    pixelRatio: 2,
    cacheBust: true,
    skipFonts: true,
    filter: (node: Node) => {
      const el = node as HTMLElement;
      if (el.tagName === 'BUTTON' && el.textContent?.match(/图片|PDF/)) return false;
      return true;
    },
  };

  try {
    return await toPng(element, opts);
  } finally {
    restore();
    element.style.padding = prevPadding;
  }
}

export async function exportAsImage(element: HTMLElement, filename = '成绩分析') {
  try {
    const dataUrl = await capture(element);
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('导出图片失败:', err);
    alert('导出图片失败，请重试');
  }
}

export async function exportAsPDF(element: HTMLElement, filename = '成绩分析') {
  try {
    const dataUrl = await capture(element);

    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = dataUrl;
    });

    const imgW = img.width;
    const imgH = img.height;

    const isLandscape = imgW > imgH;
    const pdfW = isLandscape ? 297 : 210;
    const pdfH = isLandscape ? 210 : 297;
    const margin = 10;
    const availW = pdfW - margin * 2;
    const availH = pdfH - margin * 2;
    const ratio = Math.min(availW / imgW, availH / imgH);
    const w = imgW * ratio;
    const h = imgH * ratio;

    const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');
    pdf.addImage(dataUrl, 'PNG', (pdfW - w) / 2, (pdfH - h) / 2, w, h);
    pdf.save(`${filename}.pdf`);
  } catch (err) {
    console.error('导出PDF失败:', err);
    alert('导出PDF失败，请重试');
  }
}
