import React from 'react';
import { sanitizeHtml, isHtmlContent } from '../utils/sanitizer';

interface FormattedTextProps {
  content?: string;
  className?: string;
  fallbackText?: string;
}

export const FormattedText: React.FC<FormattedTextProps> = ({
  content,
  className = '',
  fallbackText = '',
}) => {
  const textToRender = content || fallbackText;

  if (!textToRender) return null;

  const isHtml = isHtmlContent(textToRender);

  if (isHtml) {
    const cleanHtml = sanitizeHtml(textToRender, true);
    return (
      <div
        className={`formatted-content text-slate-700 text-sm leading-relaxed space-y-3 ${className}`}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  }

  // Plain text fallback: render with whitespace-pre-line so linebreaks and paragraphs are preserved
  return (
    <div className={`formatted-content text-slate-700 text-sm leading-relaxed whitespace-pre-line ${className}`}>
      {textToRender}
    </div>
  );
};

export default FormattedText;
