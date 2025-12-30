/**
 * TestLog Component
 * Displays the battle log with formatted messages
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BattleLog } from '../../lib/types';

export interface TestLogProps {
  battleLog: BattleLog[];
}

export function TestLog({ battleLog }: TestLogProps) {
  return (
    <div 
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
      <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'serif', color: '#5C4033' }}>
        Test Log
      </h2>
      <div className="space-y-2 text-sm">
        {battleLog.length === 0 && (
          <div className="text-gray-500 italic">Test log is empty...</div>
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Made with Bob
