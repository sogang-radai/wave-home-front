import './chat.css';

function InlineMarkdown({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    return <span key={index}>{part}</span>;
  });
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

export function MarkdownMessage({ text }) {
  const lines = text.split('\n');
  const nodes = [];
  let listItems = [];
  let tableRows = [];
  let tableHeader = null;

  const flushList = () => {
    if (!listItems.length) return;
    nodes.push(
      <ul key={`list-${nodes.length}`} className="markdown-list">
        {listItems.map((item, index) => (
          <li key={index}><InlineMarkdown text={item} /></li>
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
              {tableHeader.map((cell, index) => (
                <th key={index}><InlineMarkdown text={cell} /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}><InlineMarkdown text={cell} /></td>
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
    const trimmed = line.trim();
    const next = lines[index + 1]?.trim() || '';

    if (!trimmed) {
      flushList();
      flushTable();
      continue;
    }

    if (trimmed.includes('|') && isTableDivider(next)) {
      flushList();
      flushTable();
      tableHeader = parseTableRow(trimmed);
      index += 1;
      continue;
    }

    if (tableHeader && trimmed.includes('|')) {
      tableRows.push(parseTableRow(trimmed));
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
      nodes.push(<Tag key={`heading-${nodes.length}`}><InlineMarkdown text={heading[2]} /></Tag>);
      continue;
    }

    const listMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      listItems.push(listMatch[1]);
      continue;
    }

    flushList();
    nodes.push(<p key={`p-${nodes.length}`}><InlineMarkdown text={trimmed} /></p>);
  }

  flushList();
  flushTable();

  return <div className="markdown-message">{nodes}</div>;
}
