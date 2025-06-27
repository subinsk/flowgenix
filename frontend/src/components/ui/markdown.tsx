import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={cn('text-sm leading-relaxed', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ className, ...props }) => (
            <h1 className={cn('text-base font-bold mb-2 mt-3 first:mt-0', className)} {...props} />
          ),
          h2: ({ className, ...props }) => (
            <h2 className={cn('text-sm font-bold mb-2 mt-3 first:mt-0', className)} {...props} />
          ),
          h3: ({ className, ...props }) => (
            <h3 className={cn('text-sm font-semibold mb-1 mt-2 first:mt-0', className)} {...props} />
          ),
          
          // Paragraphs
          p: ({ className, ...props }) => (
            <p className={cn('mb-2 last:mb-0 leading-relaxed', className)} {...props} />
          ),
          
          // Strong and emphasis
          strong: ({ className, ...props }) => (
            <strong className={cn('font-semibold text-current', className)} {...props} />
          ),
          em: ({ className, ...props }) => (
            <em className={cn('italic text-current', className)} {...props} />
          ),
          
          // Lists
          ul: ({ className, ...props }) => (
            <ul className={cn('list-disc list-inside mb-2 space-y-0.5 ml-2', className)} {...props} />
          ),
          ol: ({ className, ...props }) => (
            <ol className={cn('list-decimal list-inside mb-2 space-y-0.5 ml-2', className)} {...props} />
          ),
          li: ({ className, ...props }) => (
            <li className={cn('text-sm leading-relaxed', className)} {...props} />
          ),
          
          // Code
          code: ({ className, ...props }: any) => {
            const isInline = !props.children?.includes('\n');
            if (isInline) {
              return (
                <code 
                  className={cn(
                    'bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs font-mono',
                    className
                  )} 
                  {...props} 
                />
              );
            }
            return (
              <code 
                className={cn(
                  'block bg-black/5 dark:bg-white/5 p-2 rounded text-xs font-mono overflow-x-auto mb-2 border border-current/10',
                  className
                )} 
                {...props} 
              />
            );
          },
          pre: ({ className, ...props }) => (
            <pre className={cn('bg-black/5 dark:bg-white/5 p-2 rounded text-xs font-mono overflow-x-auto mb-2 border border-current/10', className)} {...props} />
          ),
          
          // Blockquotes
          blockquote: ({ className, ...props }) => (
            <blockquote 
              className={cn('border-l-2 border-current/30 pl-3 my-2 italic opacity-80', className)} 
              {...props} 
            />
          ),
          
          // Links
          a: ({ className, ...props }) => (
            <a 
              className={cn('text-current underline hover:no-underline opacity-90 hover:opacity-100', className)} 
              target="_blank" 
              rel="noopener noreferrer"
              {...props} 
            />
          ),
          
          // Tables
          table: ({ className, ...props }) => (
            <div className="overflow-x-auto mb-2">
              <table className={cn('border-collapse border border-current/20 text-xs w-full', className)} {...props} />
            </div>
          ),
          th: ({ className, ...props }) => (
            <th className={cn('border border-current/20 px-2 py-1 bg-current/5 font-semibold text-left', className)} {...props} />
          ),
          td: ({ className, ...props }) => (
            <td className={cn('border border-current/20 px-2 py-1', className)} {...props} />
          ),
          
          // Horizontal rule
          hr: ({ className, ...props }) => (
            <hr className={cn('border-current/20 my-3', className)} {...props} />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
