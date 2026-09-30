import ReactMarkdown from "react-markdown";

export function Markdown({ source }: { source: string }) {
  return (
    <div className="prose prose-stone max-w-none dark:prose-invert">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
