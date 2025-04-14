import { cn } from "@/utils";
import Link from "next/link";
import { memo, type ComponentPropsWithoutRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Partial<Components> = {
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children, ...props }: ComponentPropsWithoutRef<"code"> & { inline?: boolean }) => {
    const match = /language-(\w+)/.exec(className || "");
    return props.inline ? (
      <code className={cn("relative font-mono text-sm bg-muted px-1 py-0.5 rounded", className)} {...props}>
        {children}
      </code>
    ) : (
      <pre className={cn("relative rounded-lg p-4 bg-muted overflow-x-auto", className)}>
        <code className={cn("relative font-mono text-sm", className)} {...props}>
          {children}
        </code>
      </pre>
    );
  },
  ol: ({ className, ...props }) => (
    <ol className={cn("list-decimal list-outside ml-4 space-y-1", className)} {...props} />
  ),
  ul: ({ className, ...props }) => <ul className={cn("list-disc list-outside ml-4 space-y-1", className)} {...props} />,
  li: ({ className, ...props }) => <li className={cn("my-1", className)} {...props} />,
  strong: ({ className, ...props }) => <span className={cn("font-semibold", className)} {...props} />,
  a: ({ className, href = "/", children, ...props }) => {
    const isInternal = href?.startsWith("/");
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
  p: ({ className, ...props }) => <p className={cn("leading-7", className)} {...props} />,
  h1: ({ className, ...props }) => (
    <h1 className={cn("text-3xl font-bold tracking-tight mt-6 mb-2", className)} {...props} />
  ),
  h2: ({ className, ...props }) => (
    <h2 className={cn("text-2xl font-semibold tracking-tight mt-6 mb-2", className)} {...props} />
  ),
  h3: ({ className, ...props }) => (
    <h3 className={cn("text-xl font-semibold tracking-tight mt-6 mb-2", className)} {...props} />
  ),
  h4: ({ className, ...props }) => (
    <h4 className={cn("text-lg font-semibold tracking-tight mt-6 mb-2", className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn("mt-6 border-l-2 border-muted pl-6 italic [&>*]:text-muted-foreground", className)}
      {...props}
    />
  ),
};

const remarkPlugins = [remarkGfm];

export interface MarkdownProps {
  children: string;
  className?: string;
}

const PureMarkdown: React.FC<MarkdownProps> = ({ children, className }) => {
  return (
    <div className={cn("prose prose-neutral dark:prose-invert max-w-none", className)}>
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
};

export const Markdown = memo(PureMarkdown, (prevProps, nextProps) => prevProps.children === nextProps.children);
