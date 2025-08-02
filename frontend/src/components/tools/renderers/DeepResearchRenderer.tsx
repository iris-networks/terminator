/*
 * Copyright 2025 hivelogic pvt ltd, singapore
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use client';

import React, { useState } from 'react';
import { FiSearch, FiCopy, FiCheck, FiExternalLink, FiBookOpen, FiTarget, FiTrendingUp, FiFileText, FiClock, FiGlobe, FiImage, FiLink, FiCheckCircle, FiPlayCircle, FiBarChart } from 'react-icons/fi';
import { ToolResultContentPart } from './EnhancedToolResultRenderer';

interface DeepResearchRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: any) => void;
}

/**
 * Specialized renderer for DeepResearch tool results
 * Handles research plans, search results, and comprehensive reports
 * Modern DeepResearch renderer patterns
 */
export const DeepResearchRenderer: React.FC<DeepResearchRendererProps> = ({ part }) => {
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sources' | 'insights'>('overview');

  // Extract DeepResearch data from the tool result
  const toolResult = part.toolResult || part || {};
  const toolInput = part.toolInput || {};
  
  // Determine type with fallbacks and special cases
  let type = toolResult.type || part.toolName || part.type || 'deep_research';
  
  // If we have search results structure, assume it's search
  if ((toolResult.results || toolResult.query || toolResult.originalQuery) && !type.includes('search')) {
    type = 'search';
  }
  
  // Debug logging to help identify the issue
  console.log('DeepResearchRenderer Debug:', {
    type,
    toolResultType: toolResult.type,
    partToolName: part.toolName,
    partType: part.type,
    hasResults: !!(toolResult.results),
    resultsLength: toolResult.results?.length || 0,
    hasQuery: !!(toolResult.query || toolResult.originalQuery),
    rawPart: part
  });

  const copyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  // Render different components based on tool type
  const renderContent = () => {
    switch (type) {
      case 'search':
        return renderSearchResults();
      case 'enhanced_visit':
        return renderVisitResults();
      case 'deep_dive':
        return renderDeepDiveResults();
      case 'research_plan':
        return renderResearchPlan();
      case 'research_report':
        return renderResearchReport();
      default:
        return renderGenericResearch();
    }
  };

  const renderSearchResults = () => {
    // Handle different possible data structures
    const results = toolResult.results || part.toolResult?.results || [];
    const query = toolResult.query || toolResult.originalQuery || toolInput.query || part.toolInput?.query || '';
    const totalResults = toolResult.totalResults || results.length || 0;
    const searchEngine = toolResult.searchEngine || 'duckduckgo';

    return (
      <div className="enhanced-search-results">
        {/* Search header */}
        <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiSearch className="text-blue-600 dark:text-blue-400" size={16} />
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Enhanced Search
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  "{query}" via {searchEngine}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {totalResults} results
            </div>
          </div>
        </div>

        {/* Search results */}
        <div className="p-4 space-y-3">
          {results.map((result: any, index: number) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                      {result.title}
                    </h4>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${
                        result.relevanceScore >= 0.8 ? 'bg-green-500' :
                        result.relevanceScore >= 0.6 ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                      <span className="text-xs text-gray-500">{Math.round(result.relevanceScore * 100)}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {result.snippet}
                  </p>
                  <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center space-x-1">
                      <FiGlobe size={10} />
                      <span>{result.domain}</span>
                    </span>
                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">
                      {result.type}
                    </span>
                  </div>
                </div>
                {result.url && (
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 p-1 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <FiExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderVisitResults = () => {
    const url = toolResult.url || toolInput.url || '';
    const title = toolResult.title || '';
    const content = toolResult.content || '';
    const images = toolResult.images || [];
    const links = toolResult.links || [];
    const relevanceScore = toolResult.relevanceScore || 0;
    const metadata = toolResult.metadata || {};

    return (
      <div className="enhanced-visit-results">
        {/* Visit header */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiGlobe className="text-emerald-600 dark:text-emerald-400" size={16} />
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Enhanced Visit
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-md">
                  {url}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                relevanceScore >= 0.8 ? 'bg-green-500' :
                relevanceScore >= 0.6 ? 'bg-yellow-500' : 'bg-gray-400'
              }`} />
              <span className="text-xs text-gray-500">{Math.round(relevanceScore * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              {title}
            </h3>
          )}
          
          {content && (
            <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {content.substring(0, 1000)}{content.length > 1000 ? '...' : ''}
                </pre>
              </div>
            </div>
          )}

          {/* Images */}
          {images.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <FiImage className="text-gray-500" size={14} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Images ({images.length})
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {images.slice(0, 6).map((image: any, index: number) => (
                  <div key={index} className="aspect-video bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                    <img 
                      src={image.src || image} 
                      alt={image.alt || `Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {links.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <FiLink className="text-gray-500" size={14} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Links ({links.length})
                </span>
              </div>
              <div className="space-y-1">
                {links.slice(0, 5).map((link: any, index: number) => (
                  <div key={index} className="flex items-center space-x-2 text-xs">
                    <FiExternalLink className="text-gray-400" size={10} />
                    <a 
                      href={link.href || link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                    >
                      {link.text || link.href || link}
                    </a>
                  </div>
                ))}
                {links.length > 5 && (
                  <div className="text-xs text-gray-500">
                    ... and {links.length - 5} more links
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          {Object.keys(metadata).length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {Object.entries(metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-gray-700 dark:text-gray-300 truncate ml-2">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDeepDiveResults = () => {
    const topic = toolResult.topic || '';
    const focusAreas = toolResult.focusAreas || [];
    const sources = toolResult.sources || [];
    const insights = toolResult.insights || [];
    const coverageAnalysis = toolResult.coverageAnalysis || [];
    const duration = toolResult.duration || 0;

    return (
      <div className="deep-dive-results">
        {/* Deep dive header */}
        <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiTarget className="text-purple-600 dark:text-purple-400" size={16} />
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Deep Dive Research
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {topic}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {Math.round(duration / 1000)}s
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            {[
              { id: 'overview', label: 'Overview', icon: FiBarChart },
              { id: 'sources', label: `Sources (${sources.length})`, icon: FiLink },
              { id: 'insights', label: `Insights (${insights.length})`, icon: FiTrendingUp }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Focus areas */}
              <div>
                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Focus Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {focusAreas.map((area: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* Coverage analysis */}
              {coverageAnalysis.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Coverage Analysis</h4>
                  <div className="space-y-2">
                    {coverageAnalysis.map((analysis: any, index: number) => (
                      <div key={index} className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{analysis.area}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full" 
                              style={{ width: `${(analysis.coverage / sources.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{analysis.coverage}/{sources.length}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Research metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Sources</div>
                  <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{sources.length}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Avg Relevance</div>
                  <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {toolResult.avgRelevanceScore ? Math.round(toolResult.avgRelevanceScore * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sources' && (
            <div className="space-y-3">
              {sources.map((source: any, index: number) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {source.title}
                    </h5>
                    <div className="flex items-center space-x-2 ml-2">
                      <div className={`w-2 h-2 rounded-full ${
                        source.relevanceScore >= 0.8 ? 'bg-green-500' :
                        source.relevanceScore >= 0.6 ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                      <span className="text-xs text-gray-500">{Math.round(source.relevanceScore * 100)}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-3">
                    {source.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600 dark:text-blue-400 truncate">
                      {source.url}
                    </span>
                    {source.images && source.images.length > 0 && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <FiImage size={10} />
                        <span>{source.images.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-2">
              {insights.map((insight: string, index: number) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <FiTrendingUp className="text-purple-500 mt-0.5" size={12} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{insight}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResearchPlan = () => {
    const plan = toolResult.plan || {};
    const action = toolResult.action || '';
    const steps = plan.steps || [];

    return (
      <div className="research-plan">
        {/* Plan header */}
        <div className="bg-green-50 dark:bg-green-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiBookOpen className="text-green-600 dark:text-green-400" size={16} />
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Research Plan
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {plan.title || 'Research Planning'}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {plan.completedSteps || 0}/{plan.totalSteps || 0} completed
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {plan.totalSteps > 0 && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((plan.completedSteps || 0) / plan.totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="p-4 space-y-3">
          {steps.map((step: any, index: number) => (
            <div key={step.id || index} className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="mt-1">
                {step.status === 'completed' ? (
                  <FiCheckCircle className="text-green-500" size={16} />
                ) : step.status === 'in_progress' ? (
                  <FiPlayCircle className="text-blue-500" size={16} />
                ) : (
                  <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                  {step.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {step.description}
                </p>
                {step.progress > 0 && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full"
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderResearchReport = () => {
    const report = toolResult.report || '';
    const title = toolResult.title || 'Research Report';
    const format = toolResult.format || 'markdown';
    const wordCount = toolResult.wordCount || 0;
    const sourceCount = toolResult.sourceCount || 0;

    return (
      <div className="research-report">
        {/* Report header */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiFileText className="text-indigo-600 dark:text-indigo-400" size={16} />
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Research Report
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {title}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => copyContent(report)}
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Copy report"
              >
                {copied ? <FiCheck size={12} className="text-green-500" /> : <FiCopy size={12} />}
              </button>
            </div>
          </div>
        </div>

        {/* Report metadata */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <FiFileText size={10} />
                <span>{wordCount} words</span>
              </span>
              <span className="flex items-center space-x-1">
                <FiLink size={10} />
                <span>{sourceCount} sources</span>
              </span>
              <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] uppercase">
                {format}
              </span>
            </div>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Report content */}
        <div className="p-4 bg-white dark:bg-gray-800 overflow-auto max-h-[70vh]">
          {format === 'markdown' ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                {report}
              </pre>
            </div>
          ) : (
            <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
              {report}
            </pre>
          )}
        </div>
      </div>
    );
  };

  const renderGenericResearch = () => {
    const content = JSON.stringify(toolResult, null, 2);
    
    return (
      <div className="generic-research">
        <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiSearch className="text-gray-600 dark:text-gray-400" size={16} />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Research Result
              </span>
            </div>
            <button
              onClick={() => copyContent(content)}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {copied ? <FiCheck size={12} className="text-green-500" /> : <FiCopy size={12} />}
            </button>
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 overflow-auto max-h-[60vh]">
          <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
            {content}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="deep-research-result">
      <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
        {renderContent()}
      </div>
    </div>
  );
};