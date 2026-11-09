import DOMPurify from 'dompurify';

/**
 * Normalizes inline styles on table elements by stripping properties that cause
 * cell compression, overflow, or fixed desktop sizing (like width, height, white-space: nowrap, mso-*).
 */
function cleanTableStyleAttribute(styleValue: string): string {
  if (!styleValue) return '';

  const declarations = styleValue.split(';');
  const preserved: string[] = [];

  for (const decl of declarations) {
    const trimmed = decl.trim();
    if (!trimmed) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const prop = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const val = trimmed.slice(colonIdx + 1).trim();

    // Strip problematic style properties that break tables or import Word/Docs junk
    if (
      prop === 'width' ||
      prop === 'min-width' ||
      prop === 'max-width' ||
      prop === 'height' ||
      prop === 'min-height' ||
      prop === 'max-height' ||
      prop === 'white-space' ||
      prop === 'font-family' ||
      prop === 'font-size' ||
      prop === 'line-height' ||
      prop.startsWith('mso-') ||
      prop.startsWith('margin') ||
      prop.startsWith('padding') ||
      prop === 'table-layout'
    ) {
      continue;
    }

    // Keep safe text alignment if specified
    if (prop === 'text-align' && (val === 'center' || val === 'right' || val === 'left')) {
      preserved.push(`${prop}: ${val}`);
    }
  }

  return preserved.join('; ');
}

/**
 * Normalizes an HTML string containing tables (e.g. pasted from Word, Google Docs, or entered via CMS):
 * 1. Strips deprecated layout attributes (width, height, border, cellspacing, cellpadding, nowrap, bgcolor).
 * 2. Normalizes inline styles to prevent column collapse and text overflow.
 * 3. Promotes first-row bold/heading cells to <th> and wraps in <thead> if missing.
 * 4. Injects data-label attributes onto <td> elements for optional responsive card rendering.
 * 5. If wrapInResponsive is true, wraps every <table> in a <div class="table-responsive" role="region" tabindex="0" aria-label="Table"> container.
 */
export function normalizeTableHtml(htmlString: string, wrapInResponsive = false): string {
  if (!htmlString || typeof htmlString !== 'string') return '';
  if (!htmlString.includes('<table')) return htmlString;

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return htmlString;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const tables = doc.querySelectorAll('table');

    if (tables.length === 0) return htmlString;

    tables.forEach((table) => {
      // 1. Clean attributes on <table>
      const deprecatedTableAttrs = ['width', 'height', 'border', 'cellspacing', 'cellpadding', 'bgcolor', 'align', 'frame', 'rules'];
      deprecatedTableAttrs.forEach((attr) => table.removeAttribute(attr));

      const tableStyle = table.getAttribute('style');
      if (tableStyle) {
        const cleaned = cleanTableStyleAttribute(tableStyle);
        if (cleaned) {
          table.setAttribute('style', cleaned);
        } else {
          table.removeAttribute('style');
        }
      }

      // 2. Remove fixed pixel widths on colgroups/cols
      const cols = table.querySelectorAll('colgroup, col');
      cols.forEach((col) => {
        col.removeAttribute('width');
        const colStyle = col.getAttribute('style');
        if (colStyle) {
          const cleaned = cleanTableStyleAttribute(colStyle);
          if (cleaned) col.setAttribute('style', cleaned);
          else col.removeAttribute('style');
        }
      });

      // 3. Extract column headers and normalize <thead>
      let headers: string[] = [];
      const thead = table.querySelector('thead');
      const allRows = table.querySelectorAll('tr');

      if (allRows.length > 0) {
        const firstRow = allRows[0];
        const thCells = firstRow.querySelectorAll('th');

        if (thCells.length > 0) {
          headers = Array.from(thCells).map((th) => (th.textContent || '').trim());
        } else {
          // If the first row contains <td> cells, promote them to <th>
          const tdCells = firstRow.querySelectorAll('td');
          if (tdCells.length > 0) {
            const firstRowCells = Array.from(tdCells);
            headers = firstRowCells.map((td) => (td.textContent || '').trim());

            firstRowCells.forEach((td) => {
              const th = doc.createElement('th');
              th.innerHTML = td.innerHTML;
              if (td.hasAttribute('colspan')) th.setAttribute('colspan', td.getAttribute('colspan')!);
              if (td.hasAttribute('rowspan')) th.setAttribute('rowspan', td.getAttribute('rowspan')!);
              th.setAttribute('scope', 'col');
              td.replaceWith(th);
            });

            if (!thead && firstRow.parentElement !== thead) {
              const newThead = doc.createElement('thead');
              firstRow.parentElement?.insertBefore(newThead, firstRow);
              newThead.appendChild(firstRow);
            }
          }
        }
      }

      // 4. Clean all rows and cells (tr, th, td)
      const rows = table.querySelectorAll('tr');
      rows.forEach((tr) => {
        tr.removeAttribute('height');
        tr.removeAttribute('bgcolor');
        tr.removeAttribute('align');
        tr.removeAttribute('valign');

        const trStyle = tr.getAttribute('style');
        if (trStyle) {
          const cleaned = cleanTableStyleAttribute(trStyle);
          if (cleaned) tr.setAttribute('style', cleaned);
          else tr.removeAttribute('style');
        }

        const cells = tr.querySelectorAll('th, td');
        cells.forEach((cell, cellIdx) => {
          ['width', 'height', 'nowrap', 'bgcolor', 'align', 'valign', 'border'].forEach((attr) => {
            cell.removeAttribute(attr);
          });

          const cellStyle = cell.getAttribute('style');
          if (cellStyle) {
            const cleaned = cleanTableStyleAttribute(cellStyle);
            if (cleaned) cell.setAttribute('style', cleaned);
            else cell.removeAttribute('style');
          }

          // Populate data-label for mobile card treatment
          if (cell.tagName.toLowerCase() === 'td') {
            const colHeader = headers[cellIdx];
            if (colHeader && !cell.hasAttribute('data-label')) {
              cell.setAttribute('data-label', colHeader);
            }
          }
        });
      });

      // 5. Wrap in responsive container if requested
      if (wrapInResponsive) {
        const parent = table.parentElement;
        if (!parent || !parent.classList.contains('table-responsive')) {
          const wrapper = doc.createElement('div');
          wrapper.className = 'table-responsive';
          wrapper.setAttribute('role', 'region');
          wrapper.setAttribute('tabindex', '0');
          wrapper.setAttribute('aria-label', 'Table container');
          table.parentNode?.insertBefore(wrapper, table);
          wrapper.appendChild(table);
        }
      }
    });

    return doc.body.innerHTML;
  } catch (err) {
    console.warn('Error normalizing table HTML:', err);
    return htmlString;
  }
}

function getPurifier() {
  if (typeof (DOMPurify as any).sanitize === 'function') {
    return DOMPurify as any;
  }
  if (typeof DOMPurify === 'function' && typeof window !== 'undefined') {
    return (DOMPurify as any)(window);
  }
  return null;
}

/**
 * Sanitizes HTML string using DOMPurify to eliminate XSS risks like <script> or onclick handlers,
 * while allowing safe publishing formatting tags and attributes.
 * Also normalizes table structures and wraps them in responsive containers.
 */
export function sanitizeHtml(htmlString: string, wrapTablesInResponsive = true): string {
  if (!htmlString) return '';
  
  const purifier = getPurifier();
  const clean = purifier
    ? purifier.sanitize(htmlString, {
        ALLOWED_TAGS: [
          'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
          'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del',
          'ul', 'ol', 'li', 
          'blockquote', 'a', 'span', 'div', 'br', 'hr',
          'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
          'img', 'figure', 'figcaption', 'iframe', 'code', 'pre', 'sub', 'sup', 'mark'
        ],
        ALLOWED_ATTR: [
          'href', 'target', 'rel', 'class', 'style', 'id', 'title',
          'src', 'alt', 'frameborder', 'allow', 'allowfullscreen',
          'colspan', 'rowspan', 'scope', 'headers',
          'data-label', 'data-responsive', 'role', 'aria-label', 'tabindex'
        ],
        ALLOW_DATA_ATTR: true,
        ADD_ATTR: ['target'],
      })
    : htmlString;

  return normalizeTableHtml(clean, wrapTablesInResponsive);
}

/**
 * Checks if a string contains HTML markup tags.
 */
export function isHtmlContent(text: string): boolean {
  if (!text) return false;
  return /<\/?[a-z][\s\S]*>/i.test(text);
}
