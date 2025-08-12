'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiFile, FiDownload, FiEye, FiCode, FiCheck, FiX, FiClock } from 'react-icons/fi';
import { ToolResultContentPart } from './EnhancedToolResultRenderer';

interface PdfRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: any) => void;
}

export const PdfRenderer: React.FC<PdfRendererProps> = ({ part, onAction }) => {
  const [showLatexSource, setShowLatexSource] = useState(false);
  const [showInlinePdf, setShowInlinePdf] = useState(false);

  if (!part || !part.toolResult) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 dark:text-gray-400">No PDF data available</p>
      </div>
    );
  }

  const result = part.toolResult;
  const isSuccess = result.success && result.pdfGenerated;
  
  // Always use the filename, never the full path
  const pdfFilename = result.filename || 'document';
  const pdfUrl = `/api/pdf/${pdfFilename}.pdf`;
  
  return (
    <div className="pdf-renderer">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isSuccess 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <FiFile className={`${
                isSuccess ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`} size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                LaTeX PDF Generation
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {result.filename || 'document'}.pdf
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {result.duration && (
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                <FiClock size={12} />
                <span>{(result.duration / 1000).toFixed(1)}s</span>
              </div>
            )}
            
            {isSuccess ? (
              <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-md text-xs font-medium">
                <FiCheck size={12} />
                <span>Success</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md text-xs font-medium">
                <FiX size={12} />
                <span>Failed</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {isSuccess ? (
            <>
              {/* Success Actions */}
              <div className="flex items-center space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowInlinePdf(!showInlinePdf)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <FiEye size={16} />
                  <span>{showInlinePdf ? 'Hide PDF' : 'Show PDF'}</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.open(pdfUrl, '_blank')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <FiEye size={16} />
                  <span>Open in New Tab</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // Create download link
                    const link = document.createElement('a');
                    link.href = pdfUrl;
                    link.download = `${pdfFilename}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <FiDownload size={16} />
                  <span>Download</span>
                </motion.button>
              </div>

              {/* Inline PDF Viewer */}
              {showInlinePdf && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 border"
                >
                  <div className="bg-white rounded border" style={{ height: '600px' }}>
                    <iframe
                      src={pdfUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 'none' }}
                      title={`PDF: ${pdfFilename}.pdf`}
                      sandbox="allow-same-origin"
                    >
                      <p>Your browser does not support PDFs. <a href={pdfUrl} target="_blank" rel="noopener noreferrer">Download the PDF</a>.</p>
                    </iframe>
                  </div>
                </motion.div>
              )}

              {/* PDF Info */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <p><strong>File:</strong> {pdfFilename}.pdf</p>
                  <p><strong>Status:</strong> PDF generated successfully</p>
                  <p><strong>URL:</strong> <code>{pdfUrl}</code></p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Error Display */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                  LaTeX Compilation Failed
                </h4>
                {result.error && (
                  <div className="text-sm text-red-700 dark:text-red-400 font-mono bg-red-100 dark:bg-red-900/30 p-3 rounded border overflow-x-auto">
                    <pre className="whitespace-pre-wrap">{result.error}</pre>
                  </div>
                )}
              </div>

              {/* LaTeX Output */}
              {result.output && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    LaTeX Output
                  </h4>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-mono bg-white dark:bg-gray-900/50 p-3 rounded border overflow-x-auto max-h-48 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{result.output}</pre>
                  </div>
                </div>
              )}
            </>
          )}

          {/* LaTeX Source Toggle */}
          {result.texContent && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowLatexSource(!showLatexSource)}
                className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <FiCode size={16} />
                <span>{showLatexSource ? 'Hide' : 'Show'} LaTeX Source</span>
              </motion.button>
              
              {showLatexSource && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 border"
                >
                  <div className="text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{result.texContent}</pre>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};