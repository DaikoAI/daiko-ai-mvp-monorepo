import { cn } from "@/utils";
import Link from "next/link";
import { memo, type ComponentPropsWithoutRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

const components: Partial<Components> = {
  pre: ({ children }) => children,
  code: ({ className, children, ...props }: ComponentPropsWithoutRef<"code"> & { inline?: boolean }) => {
    const isInline = !className?.includes("language-");

    if (isInline) {
      return (
        <code
          className={cn("relative font-mono text-sm bg-muted px-1 py-0.5 rounded break-words", className)}
          {...props}
        >
          {children}
        </code>
      );
    }

    const language = className?.replace("language-", "");

    return (
      <div className="not-prose my-4">
        <pre className="relative rounded-lg p-2 bg-muted w-full">
          <div className="overflow-x-auto">
            {language ? (
              <SyntaxHighlighter
                language={language}
                style={oneDark}
                customStyle={{
                  fontSize: "12px",
                }}
                children={String(children).replace(/\n$/, "")}
              />
            ) : (
              <code className={cn("relative font-mono text-sm whitespace-pre", language && `language-${language}`)}>
                {children}
              </code>
            )}
          </div>
        </pre>
      </div>
    );
  },
  ol: ({ className, children, ...props }) => (
    <ol className={cn("list-decimal list-outside ml-2 space-y-1", className)} {...props}>
      {children}
    </ol>
  ),
  ul: ({ className, children, ...props }) => (
    <ul className={cn("list-disc list-outside ml-2 space-y-1", className)} {...props}>
      {children}
    </ul>
  ),
  li: ({ className, children, ...props }) => (
    <li className={cn("my-1", className)} {...props}>
      {children}
    </li>
  ),
  strong: ({ className, children, ...props }) => (
    <span className={cn("font-semibold", className)} {...props}>
      {children}
    </span>
  ),
  a: ({ className, href = "/", children, ...props }) => {
    const isInternal = href.startsWith("/");
    if (isInternal) {
      return (
        <Link href={href} className={cn("text-primary underline-offset-4 hover:underline", className)} {...props}>
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        className={cn("text-primary underline-offset-4 hover:underline", className)}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  },
  p: ({ className, children, ...props }) => (
    <p className={cn("leading-7", className)} {...props}>
      {children}
    </p>
  ),
  h1: ({ className, children, ...props }) => (
    <h1 className={cn("text-3xl font-bold tracking-tight mt-6 mb-2", className)} {...props}>
      {children}
    </h1>
  ),
  h2: ({ className, children, ...props }) => (
    <h2 className={cn("text-2xl font-semibold tracking-tight mt-6 mb-2", className)} {...props}>
      {children}
    </h2>
  ),
  h3: ({ className, children, ...props }) => (
    <h3 className={cn("text-xl font-semibold tracking-tight mt-6 mb-2", className)} {...props}>
      {children}
    </h3>
  ),
  h4: ({ className, children, ...props }) => (
    <h4 className={cn("text-lg font-semibold tracking-tight mt-6 mb-2", className)} {...props}>
      {children}
    </h4>
  ),
  blockquote: ({ className, children, ...props }) => (
    <blockquote
      className={cn("mt-6 border-l-2 border-muted pl-4 italic [&>*]:text-muted-foreground", className)}
      {...props}
    >
      {children}
    </blockquote>
  ),
  table: ({ className, children, ...props }) => (
    <div className="w-full overflow-x-auto">
      <table className={cn("min-w-full divide-y divide-gray-200", className)} {...props}>
        {children}
      </table>
    </div>
  ),
  img: ({ className, alt, src, ...props }) => (
    <img className={cn("max-w-full h-auto object-contain", className)} alt={alt} src={src} {...props} />
  ),
};

const remarkPlugins = [remarkGfm];

export interface MarkdownProps {
  children: string;
  className?: string;
}

const PureMarkdown: React.FC<MarkdownProps> = ({ children, className }) => {
  return (
    <div className={cn("prose prose-neutral dark:prose-invert max-w-none w-full", className)}>
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
};

export const Markdown = memo(PureMarkdown, (prevProps, nextProps) => prevProps.children === nextProps.children);
