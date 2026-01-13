import React from 'react';

// Format inline text (bold, emphasis, quotes)
function formatInlineText(text) {
  // Replace **bold** and *italic* patterns
  const parts = [];
  let remaining = text;
  let key = 0;

  // Simple regex-based replacement for bold (**text**) and emphasis (*text*)
  const boldRegex = /\*\*(.+?)\*\*/g;
  const emphasisRegex = /\*(.+?)\*/g;
  const quoteRegex = /"([^"]+)"/g;

  // First pass: bold
  remaining = remaining.replace(boldRegex, (_, content) => `<strong>${content}</strong>`);
  // Second pass: emphasis (only single asterisks now)
  remaining = remaining.replace(emphasisRegex, (_, content) => `<em>${content}</em>`);
  // Third pass: quotes
  remaining = remaining.replace(quoteRegex, (_, content) => `<q>${content}</q>`);

  // Convert to React elements
  const htmlRegex = /<(strong|em|q)>(.+?)<\/\1>/g;
  let lastIndex = 0;
  let match;

  while ((match = htmlRegex.exec(remaining)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(remaining.slice(lastIndex, match.index));
    }

    // Add styled element
    const [, tag, content] = match;
    if (tag === 'strong') {
      parts.push(<strong key={key++} className="font-semibold text-label">{content}</strong>);
    } else if (tag === 'em') {
      parts.push(<em key={key++} className="italic">{content}</em>);
    } else if (tag === 'q') {
      parts.push(<span key={key++} className="text-[var(--color-info)] italic">"{content}"</span>);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < remaining.length) {
    parts.push(remaining.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

// Format summary text with rich styling
export function formatSummaryText(text) {
  if (!text) return null;

  // Check if it's a bullet list
  const isBulletList = text.includes('•') || /^[-*]\s/m.test(text) || /^\d+\.\s/m.test(text);

  if (isBulletList) {
    // Split by bullet points, dashes, or numbers
    const items = text
      .split(/(?:^|\n)[•\-*]\s*|(?:^|\n)\d+\.\s*/g)
      .filter(item => item.trim());

    return (
      <ul className="space-y-3 list-none">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3">
            <span className="text-[var(--color-info)] mt-1.5 flex-shrink-0" aria-hidden="true">
              <svg width="6" height="6" viewBox="0 0 6 6">
                <circle cx="3" cy="3" r="3" fill="currentColor" />
              </svg>
            </span>
            <span className="flex-1">{formatInlineText(item.trim())}</span>
          </li>
        ))}
      </ul>
    );
  }

  // Regular paragraphs - split by double newlines
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());

  if (paragraphs.length === 1) {
    return <p className="leading-relaxed">{formatInlineText(paragraphs[0])}</p>;
  }

  return (
    <div className="space-y-4">
      {paragraphs.map((para, i) => (
        <p key={i} className="leading-relaxed">{formatInlineText(para.trim())}</p>
      ))}
    </div>
  );
}

export default formatSummaryText;
