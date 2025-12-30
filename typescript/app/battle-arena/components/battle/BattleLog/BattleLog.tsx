'use client';

import { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BattleLog as BattleLogType } from '../../../lib/types';

type BattleLogProps = {
  battleLog: BattleLogType[];
  isWaitingForAgent: boolean;
  isLoadingClassDetails: boolean;
  onResetBattle: () => void;
  onTriggerDropAnimation: () => void;
  battleLogRef: React.RefObject<HTMLDivElement | null>;
  onOpenSummary?: () => void;
  hasSummary?: boolean;
};

export function BattleLog({
  battleLog,
  isWaitingForAgent,
  isLoadingClassDetails,
  onResetBattle,
  onTriggerDropAnimation,
  battleLogRef,
  onOpenSummary,
  hasSummary,
}: BattleLogProps) {
  return (
    <div 
      ref={battleLogRef}
      className="bg-white p-6 shadow-lg overflow-y-auto -mx-4 sm:-mx-6 border-t-4 border-l-4 border-r-4" 
      style={{ 
        borderColor: '#5C4033',
        borderTopLeftRadius: '0.5rem',
        borderTopRightRadius: '0.5rem',
        borderBottomLeftRadius: '0',
        borderBottomRightRadius: '0',
        marginBottom: '-1.5rem',
        marginLeft: '-1rem',
        marginRight: '-1rem',
        minHeight: 'calc(100vh - 500px)',
        paddingBottom: '2rem',
      }}
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'serif', color: '#5C4033' }}>
          Battle Log
        </h2>
        <div className="flex items-center gap-2">
          {hasSummary && onOpenSummary && (
            <button
              onClick={onOpenSummary}
              className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white font-semibold rounded-lg border-2 border-amber-700 transition-all shadow-md"
              title="View battle summary"
              style={{ fontFamily: 'serif' }}
            >
              📜 Battle Chronicle
            </button>
          )}
          <button
            onClick={onResetBattle}
            className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white font-semibold rounded-lg border-2 border-red-700 transition-all shadow-md"
            title="Start a new battle"
          >
            New Battle
          </button>
          <button
            onClick={onTriggerDropAnimation}
            className="px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-white text-sm font-semibold rounded-lg border-2 border-purple-700 transition-all shadow-md"
            title="Test the drop and slam animation"
          >
            🎬 Test Drop & Slam
          </button>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        {battleLog.length === 0 && (
          <div className="text-gray-500 italic">The battle log is empty...</div>
        )}
        {[...battleLog].reverse().map((log, idx) => (
          <div
            key={idx}
            className={`p-2 rounded ${
              log.type === 'attack' ? 'bg-red-50 text-red-800 font-mono' :
              log.type === 'ability' ? 'bg-purple-50 text-purple-800 font-mono' :
              log.type === 'roll' ? 'text-red-600' :
              log.type === 'narrative' ? 'text-gray-800' :
              'bg-gray-50 text-gray-700 font-mono'
            }`}
          >
            {log.type === 'narrative' ? (
              <div className="prose max-w-none text-sm" style={{ fontFamily: 'serif' }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0" style={{ color: '#5C4033' }}>{children}</p>,
                    strong: ({ children }) => <strong className="font-bold" style={{ color: '#5C4033' }}>{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    h1: ({ children }) => <h1 className="text-lg mb-2" style={{ color: '#5C4033', fontWeight: 900 }}>{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base mb-2" style={{ color: '#5C4033', fontWeight: 900 }}>{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm mb-1" style={{ color: '#5C4033', fontWeight: 900 }}>{children}</h3>,
                    h4: ({ children }) => <h4 className="text-sm mb-1" style={{ color: '#5C4033', fontWeight: 900 }}>{children}</h4>,
                    h5: ({ children }) => <h5 className="text-sm mb-1" style={{ color: '#5C4033', fontWeight: 900 }}>{children}</h5>,
                    h6: ({ children }) => <h6 className="text-sm mb-1" style={{ color: '#5C4033', fontWeight: 900 }}>{children}</h6>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="ml-2">{children}</li>,
                    code: ({ children }) => <code className="bg-gray-100 px-1 rounded text-xs font-mono">{children}</code>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-2 italic">{children}</blockquote>,
                  }}
                >
                  {log.message}
                </ReactMarkdown>
              </div>
            ) : (
              <div style={log.type === 'roll' ? { color: '#DC2626', fontFamily: 'serif' } : {}}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <span>{children}</span>,
                    strong: ({ children }) => <strong className="font-bold" style={{ color: log.type === 'roll' ? '#DC2626' : undefined }}>{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                  }}
                >
                  {log.message}
                </ReactMarkdown>
                {log.type === 'system' && 
                 log.message === 'Loading class abilities from knowledge base...' && 
                 isLoadingClassDetails && (
                  <span className="waiting-indicator ml-2">
                    <span className="waiting-dot"></span>
                    <span className="waiting-dot"></span>
                    <span className="waiting-dot"></span>
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
        {isWaitingForAgent && (
          <div className="p-2 rounded bg-gray-100 text-gray-700">
            <span className="waiting-indicator">
              Waiting for agent response
              <span className="waiting-dot"></span>
              <span className="waiting-dot"></span>
              <span className="waiting-dot"></span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

