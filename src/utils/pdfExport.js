/**
 * PDF Export utility.
 * Renders the current markdown editor content to a styled PDF using the browser's print API.
 * Works in both Tauri desktop and browser environments.
 */

/**
 * Export the editor content to PDF.
 * Opens the native print dialog which allows saving as PDF.
 * @param {string} title - The document filename for the print title
 */
export async function exportToPDF(title = 'MDViewer Document') {
  // Get the editor content
  const editorEl = document.querySelector('.milkdown-wrapper');
  if (!editorEl) {
    console.error('No editor element found for PDF export');
    return;
  }

  // Create a hidden iframe for clean printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '100%';
  iframe.style.bottom = '100%';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;

  // Get the current theme
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
    document.querySelector('[data-theme="dark"]') !== null;

  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page {
      margin: 2cm 2.5cm;
      size: A4;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 11pt;
      line-height: 1.7;
      color: ${isDark ? '#e4e4f0' : '#1a1a2e'};
      background: ${isDark ? '#1a1a27' : '#ffffff'};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    h1 { font-size: 22pt; font-weight: 700; margin: 1.2em 0 0.5em; letter-spacing: -0.02em; }
    h2 { font-size: 17pt; font-weight: 650; margin: 1em 0 0.4em; letter-spacing: -0.015em; }
    h3 { font-size: 13pt; font-weight: 600; margin: 0.9em 0 0.3em; }
    h4, h5, h6 { font-size: 11pt; font-weight: 600; margin: 0.8em 0 0.2em; }

    h1:first-child, h2:first-child, h3:first-child { margin-top: 0; }

    p { margin-bottom: 0.7em; }

    a { color: ${isDark ? '#818cf8' : '#6366f1'}; text-decoration: underline; }

    code {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.88em;
      background: ${isDark ? '#252535' : '#f0f2f5'};
      padding: 1px 4px;
      border-radius: 3px;
    }

    pre {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9pt;
      line-height: 1.5;
      background: ${isDark ? '#16161f' : '#f0f2f5'};
      padding: 12px 16px;
      border-radius: 6px;
      margin: 0.8em 0;
      overflow-x: auto;
      page-break-inside: avoid;
    }

    pre code { background: none; padding: 0; }

    blockquote {
      border-left: 3px solid ${isDark ? '#818cf8' : '#6366f1'};
      padding-left: 14px;
      margin: 0.8em 0;
      color: ${isDark ? '#9ca3b0' : '#6b7280'};
      font-style: italic;
    }

    hr {
      border: none;
      height: 1px;
      background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
      margin: 1.5em 0;
    }

    ul, ol { padding-left: 1.4em; margin-bottom: 0.8em; }
    li { margin-bottom: 0.2em; }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 0.8em 0;
      font-size: 10pt;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'};
      padding: 6px 10px;
      text-align: left;
    }

    th {
      background: ${isDark ? '#16161f' : '#f0f2f5'};
      font-weight: 600;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    img { max-width: 100%; }

    s, del { color: ${isDark ? '#6b7280' : '#9ca3af'}; }
    strong { font-weight: 650; }
  </style>
</head>
<body>${editorEl.innerHTML}</body>
</html>`);
  doc.close();

  // Wait for fonts to load
  await new Promise((resolve) => setTimeout(resolve, 500));

  iframe.contentWindow.print();

  // Clean up after printing
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 1000);
}
