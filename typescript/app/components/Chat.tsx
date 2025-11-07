'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  responseId?: string;
}

/**
 * Format search query JSON objects to make them stand out.
 * Similar to the Python highlight_search_fields function.
 * Finds JSON objects with fields like query, search_query, search_mode, etc.
 * and wraps them in markdown code blocks.
 */
function formatSearchQueryJson(text: string): string {
  // Pattern to match JSON objects containing search-related fields
  // Matches: {"query": "...", "search_mode": "..."} or similar patterns
  const fieldPattern = /(?:,\s*)?\{[^}]*"(?:input_value|search_query|search_mode|search_[^"]+|query)"[^}]*\}/g;

  return text.replace(fieldPattern, (match) => {
    // Remove leading comma and whitespace if present
    const jsonObj = match.replace(/^,\s*/, '');
    // Wrap in markdown code block with json language tag
    return `\n\`\`\`json\n${jsonObj}\n\`\`\`\n\n`;
  });
}

/**
 * Highlight JSON keys in search query blocks by wrapping them in styled spans.
 * Keys like "query", "search_query", "search_mode" will be colored.
 */
function highlightJsonKeys(jsonString: string): string {
  // Pattern to match JSON keys (quoted strings followed by colon)
  // Matches: "key": or "key":
  const keyPattern = /"((?:input_value|search_query|search_mode|search_[^"]+|query))":/g;
  
  return jsonString.replace(keyPattern, (match, key) => {
    // Wrap the key in a span with styling
    return `"<span class="text-blue-600 dark:text-blue-400 font-semibold">${key}</span>":`;
  });
}

/**
 * Copy code to clipboard
 */
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [currentResponseId, setCurrentResponseId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Store previous response ID in a ref to maintain conversation continuity
  const previousResponseIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setCurrentResponse('');
    setCurrentResponseId(null);

    // Add user message to chat
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    // Get the previous response ID from the ref (maintains conversation continuity)
    const previousResponseId = previousResponseIdRef.current;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          previousResponseId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';
      let accumulatedResponse = '';
      let finalResponseId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'chunk') {
                accumulatedResponse += data.content;
                setCurrentResponse(accumulatedResponse);
              } else if (data.type === 'done') {
                finalResponseId = data.responseId || null;
                setCurrentResponseId(finalResponseId);
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }

      // Add assistant message to chat
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: accumulatedResponse,
          responseId: finalResponseId || undefined,
        },
      ]);

      // Update the previous response ID ref for conversation continuity
      if (finalResponseId) {
        previousResponseIdRef.current = finalResponseId;
      }

      setCurrentResponse('');
      setCurrentResponseId(null);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-black">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-4 shrink-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            OpenRAG Next.js Chat
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Streaming chat interface powered by OpenRAG
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-zinc-500 dark:text-zinc-400 mt-12">
              <p className="text-lg font-medium">Start a conversation</p>
              <p className="text-sm mt-2">Type a message below to begin chatting</p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-zinc-50'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="mb-3 last:mb-0 ml-4 list-disc">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-3 last:mb-0 ml-4 list-decimal">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        code: ({ node, inline, className, children, ...props }: any) => {
                          // Inline code detection:
                          // 1. If inline prop is explicitly true, it's inline
                          // 2. If there's a language- class, it's definitely a code block
                          // 3. If inline is undefined/null and no language class, assume inline (single backticks)
                          const hasLanguageClass = className?.includes('language-');
                          const isInline = inline === true || (inline !== false && !hasLanguageClass);
                          
                          if (isInline) {
                            return (
                              <code className="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                {children}
                              </code>
                            );
                          }
                          
                          // Code block - extract language and content
                          // Handle both language-xxx class and plain code blocks (no language)
                          const match = /language-(\w+)/.exec(className || '');
                          const language = match ? match[1] : 'text';
                          const codeString = String(children).replace(/\n$/, '');
                          
                          // Check if this is a JSON block with search query fields
                          const isSearchQueryJson = 
                            language === 'json' && 
                            /"(?:input_value|search_query|search_mode|search_[^"]+|query)"/.test(codeString);
                          
                          if (isSearchQueryJson) {
                            // Parse and highlight JSON keys
                            const highlightedJson = highlightJsonKeys(codeString);
                            
                            return (
                              <div className="relative mb-3 last:mb-0 group">
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                  <button
                                    onClick={() => copyToClipboard(codeString)}
                                    className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1"
                                    title="Copy code"
                                  >
                                    <span>Copy</span>
                                  </button>
                                </div>
                                <code 
                                  className="block bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-400 dark:border-blue-500 p-3 rounded-lg text-sm font-mono overflow-x-auto shadow-sm" 
                                  dangerouslySetInnerHTML={{ __html: highlightedJson }}
                                />
                              </div>
                            );
                          }
                          
                          // Regular code block with syntax highlighting
                          return (
                            <div className="relative mb-3 last:mb-0 group">
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                  onClick={() => copyToClipboard(codeString)}
                                  className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1"
                                  title="Copy code"
                                >
                                  <span>Copy</span>
                                </button>
                              </div>
                              <SyntaxHighlighter
                                language={language || 'text'}
                                style={vscDarkPlus}
                                customStyle={{
                                  margin: 0,
                                  borderRadius: '0.5rem',
                                  fontSize: '0.875rem',
                                  padding: '1rem',
                                }}
                                PreTag="div"
                                {...props}
                              >
                                {codeString}
                              </SyntaxHighlighter>
                            </div>
                          );
                        },
                        pre: ({ children }: any) => {
                          // react-markdown wraps code blocks in <pre><code>
                          // Our code component returns a div wrapper, so if children is already a div, just render it
                          if (children && typeof children === 'object') {
                            // Check if it's already our div wrapper (from code component)
                            if (children.type === 'div') {
                              return <>{children}</>;
                            }
                            // Check if it's an array with a div as first element
                            if (Array.isArray(children) && children.length > 0 && children[0]?.type === 'div') {
                              return <>{children}</>;
                            }
                            // Check if it's a code element that we need to process
                            // This shouldn't happen since code component handles it, but just in case
                            if (children.type === 'code' || (Array.isArray(children) && children.find((c: any) => c?.type === 'code'))) {
                              // Let it render normally - code component should have handled it
                              return <pre className="mb-3 last:mb-0">{children}</pre>;
                            }
                          }
                          // Regular pre element (fallback)
                          return <pre className="mb-3 last:mb-0">{children}</pre>;
                        },
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {children}
                          </a>
                        ),
                        h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h3>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 italic my-3">
                            {children}
                          </blockquote>
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-3">
                            <table className="min-w-full border-collapse border border-zinc-300 dark:border-zinc-700">
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 bg-zinc-200 dark:bg-zinc-800 font-semibold">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {formatSearchQueryJson(message.content)}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                )}
              </div>
            </div>
          ))}

          {/* Streaming response */}
          {isLoading && currentResponse && (
            <div className="flex justify-start">
              <div className="max-w-[85%] sm:max-w-[75%] rounded-xl px-4 py-3 bg-zinc-100 dark:bg-zinc-900 text-black dark:text-zinc-50">
                <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="mb-3 last:mb-0 ml-4 list-disc">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-3 last:mb-0 ml-4 list-decimal">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      code: ({ node, inline, className, children, ...props }: any) => {
                        // Inline code detection:
                        // 1. If inline prop is explicitly true, it's inline
                        // 2. If there's a language- class, it's definitely a code block
                        // 3. If inline is undefined/null and no language class, assume inline (single backticks)
                        const hasLanguageClass = className?.includes('language-');
                        const isInline = inline === true || (inline !== false && !hasLanguageClass);
                        
                        if (isInline) {
                          return (
                            <code className="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          );
                        }
                        
                        // Code block - extract language and content
                        // Handle both language-xxx class and plain code blocks (no language)
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : 'text';
                        const codeString = String(children).replace(/\n$/, '');
                        
                        // Check if this is a JSON block with search query fields
                        const isSearchQueryJson = 
                          language === 'json' && 
                          /"(?:input_value|search_query|search_mode|search_[^"]+|query)"/.test(codeString);
                        
                        if (isSearchQueryJson) {
                          // Parse and highlight JSON keys
                          const highlightedJson = highlightJsonKeys(codeString);
                          
                          return (
                            <div className="relative mb-3 last:mb-0 group">
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                  onClick={() => copyToClipboard(codeString)}
                                  className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1"
                                  title="Copy code"
                                >
                                  <span>Copy</span>
                                </button>
                              </div>
                              <code 
                                className="block bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-400 dark:border-blue-500 p-3 rounded-lg text-sm font-mono overflow-x-auto shadow-sm" 
                                dangerouslySetInnerHTML={{ __html: highlightedJson }}
                              />
                            </div>
                          );
                        }
                        
                        // Regular code block with syntax highlighting
                        return (
                          <div className="relative mb-3 last:mb-0 group">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <button
                                onClick={() => copyToClipboard(codeString)}
                                className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1"
                                title="Copy code"
                              >
                                <span>Copy</span>
                              </button>
                            </div>
                            <SyntaxHighlighter
                              language={language || 'text'}
                              style={vscDarkPlus}
                              customStyle={{
                                margin: 0,
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                padding: '1rem',
                              }}
                              PreTag="div"
                              {...props}
                            >
                              {codeString}
                            </SyntaxHighlighter>
                          </div>
                        );
                      },
                      pre: ({ children }: any) => {
                        // react-markdown wraps code blocks in <pre><code>
                        // Our code component returns a div wrapper, so if children is already a div, just render it
                        if (children && typeof children === 'object') {
                          // Check if it's already our div wrapper (from code component)
                          if (children.type === 'div') {
                            return <>{children}</>;
                          }
                          // Check if it's an array with a div as first element
                          if (Array.isArray(children) && children.length > 0 && children[0]?.type === 'div') {
                            return <>{children}</>;
                          }
                          // Check if it's a code element that we need to process
                          // This shouldn't happen since code component handles it, but just in case
                          if (children.type === 'code' || (Array.isArray(children) && children.find((c: any) => c?.type === 'code'))) {
                            // Let it render normally - code component should have handled it
                            return <pre className="mb-3 last:mb-0">{children}</pre>;
                          }
                        }
                        // Regular pre element (fallback)
                        return <pre className="mb-3 last:mb-0">{children}</pre>;
                      },
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {children}
                        </a>
                      ),
                      h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h3>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 italic my-3">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {formatSearchQueryJson(currentResponse)}
                  </ReactMarkdown>
                </div>
                <span className="animate-pulse inline-block ml-1">▊</span>
              </div>
            </div>
          )}

          {isLoading && !currentResponse && (
            <div className="flex justify-start">
              <div className="max-w-[85%] sm:max-w-[75%] rounded-xl px-4 py-3 bg-zinc-100 dark:bg-zinc-900 text-black dark:text-zinc-50">
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <span className="animate-spin">⏳</span>
                  <span>RAGging...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-4 shrink-0 bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3 w-full">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              disabled={isLoading}
              rows={1}
              className="flex-1 w-full min-w-0 resize-none rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-black dark:text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

