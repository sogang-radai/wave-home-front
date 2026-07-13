import { useLayoutEffect, useRef, useState } from 'react';
import './chat.css';

function FadeText({ text, charOffset = 0, fadeFrom = Infinity }) {
  if (!text) return null;
  if (fadeFrom >= charOffset + text.length) {
    return text;
  }
  if (fadeFrom <= charOffset) {
    return <span className="chat-stream-fade">{text}</span>;
  }
  const splitAt = fadeFrom - charOffset;
  return (
    <>
      {text.slice(0, splitAt)}
      <span className="chat-stream-fade">{text.slice(splitAt)}</span>
    </>
  );
}

function InlineMarkdown({ text, charOffset = 0, fadeFrom = Infinity }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|_[^_]+_)/g).filter(Boolean);
  let offset = charOffset;

  return parts.map((part, index) => {
    const start = offset;
    offset += part.length;

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index}>
          <FadeText text={part.slice(2, -2)} charOffset={start + 2} fadeFrom={fadeFrom} />
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={index}>
          <FadeText text={part.slice(1, -1)} charOffset={start + 1} fadeFrom={fadeFrom} />
        </code>
      );
    }
    if (
      ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_')))
      && part.length >= 3
      && !part.startsWith('**')
    ) {
      return (
        <em key={index}>
          <FadeText text={part.slice(1, -1)} charOffset={start + 1} fadeFrom={fadeFrom} />
        </em>
      );
    }
    return <FadeText key={index} text={part} charOffset={start} fadeFrom={fadeFrom} />;
  });
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CodeBlock({ code, charOffset = 0, fadeFrom = Infinity }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  return (
    <div className="markdown-code-block">
      <button
        type="button"
        className={`markdown-code-copy${copied ? ' is-copied' : ''}`}
        onClick={handleCopy}
        aria-label={copied ? '복사됨' : '복사'}
        title={copied ? '복사됨' : '복사'}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      <pre className="markdown-code-pre">
        <code>
          <FadeText text={code} charOffset={charOffset} fadeFrom={fadeFrom} />
        </code>
      </pre>
    </div>
  );
}

function isTableDivider(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

export function MarkdownMessage({ text, streaming = false }) {
  const prevLenRef = useRef(0);
  const fadeFrom = streaming && text.length > prevLenRef.current
    ? prevLenRef.current
    : text.length;

  useLayoutEffect(() => {
    prevLenRef.current = text.length;
  }, [text]);

  const lines = text.split('\n');
  const nodes = [];
  let listItems = [];
  let tableRows = [];
  let tableHeader = null;
  let cursor = 0;

  const flushList = () => {
    if (!listItems.length) return;
    nodes.push(
      <ul key={`list-${nodes.length}`} className="markdown-list">
        {listItems.map((item, index) => (
          <li key={index}>
            <InlineMarkdown
              text={item.text}
              charOffset={item.charOffset}
              fadeFrom={fadeFrom}
            />
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  const flushTable = () => {
    if (!tableHeader || !tableRows.length) return;
    nodes.push(
      <div key={`table-${nodes.length}`} className="markdown-table-wrap">
        <table className="markdown-table">
          <thead>
            <tr>
              {tableHeader.cells.map((cell, index) => (
                <th key={index}>
                  <InlineMarkdown
                    text={cell}
                    charOffset={tableHeader.offsets[index]}
                    fadeFrom={fadeFrom}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.cells.map((cell, cellIndex) => (
                  <td key={cellIndex}>
                    <InlineMarkdown
                      text={cell}
                      charOffset={row.offsets[cellIndex]}
                      fadeFrom={fadeFrom}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableHeader = null;
    tableRows = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineStart = cursor;
    cursor += line.length + (index < lines.length - 1 ? 1 : 0);

    const trimmed = line.trim();
    const trimOffset = lineStart + line.indexOf(trimmed);
    const next = lines[index + 1]?.trim() || '';

    if (!trimmed) {
      flushList();
      flushTable();
      continue;
    }

    // Fenced code block: ``` or ```lang — language ignored; plain text box + copy.
    if (/^```/.test(trimmed)) {
      flushList();
      flushTable();
      const contentStart = cursor;
      const bodyLines = [];
      while (index + 1 < lines.length) {
        index += 1;
        const bodyLine = lines[index];
        cursor += bodyLine.length + (index < lines.length - 1 ? 1 : 0);
        if (/^```/.test(bodyLine.trim())) {
          break;
        }
        bodyLines.push(bodyLine);
      }
      const code = bodyLines.join('\n');
      nodes.push(
        <CodeBlock
          key={`code-${nodes.length}`}
          code={code}
          charOffset={contentStart}
          fadeFrom={fadeFrom}
        />
      );
      continue;
    }

    if (trimmed.includes('|') && isTableDivider(next)) {
      flushList();
      flushTable();
      const cells = parseTableRow(trimmed);
      // Approximate cell offsets from trimmed line start (good enough for fade).
      tableHeader = { cells, offsets: cells.map(() => trimOffset) };
      index += 1;
      const divider = lines[index] || '';
      cursor += divider.length + (index < lines.length - 1 ? 1 : 0);
      continue;
    }

    if (tableHeader && trimmed.includes('|')) {
      const cells = parseTableRow(trimmed);
      tableRows.push({ cells, offsets: cells.map(() => trimOffset) });
      continue;
    }

    flushTable();

    if (trimmed === '---') {
      flushList();
      nodes.push(<hr key={`hr-${nodes.length}`} />);
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushList();
      const Tag = `h${heading[1].length + 2}`;
      const contentOffset = trimOffset + heading[0].length - heading[2].length;
      nodes.push(
        <Tag key={`heading-${nodes.length}`}>
          <InlineMarkdown text={heading[2]} charOffset={contentOffset} fadeFrom={fadeFrom} />
        </Tag>
      );
      continue;
    }

    const listMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      const contentOffset = trimOffset + trimmed.length - listMatch[1].length;
      listItems.push({ text: listMatch[1], charOffset: contentOffset });
      continue;
    }

    flushList();
    nodes.push(
      <p key={`p-${nodes.length}`}>
        <InlineMarkdown text={trimmed} charOffset={trimOffset} fadeFrom={fadeFrom} />
      </p>
    );
  }

  flushList();
  flushTable();

  return (
    <div className={`markdown-message${streaming ? ' is-streaming' : ''}`}>
      {nodes}
    </div>
  );
}
