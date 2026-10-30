import { Fragment } from 'react';

/** Renders lesson text: **bold**, single newline = line break, blank line = paragraph. */
export function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={className}>
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i} className="mt-3 first:mt-0">
          {para.split('\n').map((line, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              {renderInline(line)}
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}

function renderInline(line: string) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-semibold text-ink-900 dark:text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
