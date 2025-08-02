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
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';
import { Page } from 'puppeteer';

/**
 * Content extraction result with pagination information
 */
export interface PaginatedContentResult {
  /** The extracted content in markdown format */
  content: string;
  /** Total number of pages */
  totalPages: number;
  /** Current page number */
  currentPage: number;
  /** Whether there are more pages available */
  hasMorePages: boolean;
  /** Original page title */
  title?: string;
}

/**
 * PaginatedContentExtractor - Memory-efficient content extraction with pagination support
 * 
 * This class leverages the Mozilla Readability algorithm to extract the main content
 * from web pages while supporting pagination to prevent memory issues on large pages.
 */
export class PaginatedContentExtractor {
  private readonly pageSize: number;
  private turndownService: TurndownService;

  /**
   * Create a new paginated content extractor
   * 
   * @param pageSize - Maximum number of characters per page
   */
  constructor(pageSize = 100000) {
    this.pageSize = pageSize;
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
  }

  /**
   * Extract content from a web page with pagination support
   * 
   * @param page - Puppeteer page object
   * @param pageNumber - Page number to extract (1-based index)
   * @returns Promise with paginated content result
   */
  async extractContent(page: Page, pageNumber = 1): Promise<PaginatedContentResult> {
    try {
      console.log(`Extracting content page ${pageNumber} with max length ${this.pageSize}`);

      // Get the full HTML content from the page
      const htmlContent = await page.content();
      const url = page.url();

      // Create a JSDOM instance for Readability
      const dom = new JSDOM(htmlContent, { url });
      const document = dom.window.document;

      // Clean up the document
      document.querySelectorAll('script,noscript,style,link,svg,img,video,iframe,canvas,.reflist')
        .forEach((el) => el.remove());

      // Use Readability to extract the main content
      const reader = new Readability(document);
      const article = reader.parse();

      if (!article) {
        throw new Error('Failed to extract readable content from page');
      }

      // Convert HTML content to markdown
      const fullMarkdown = this.turndownService.turndown(article.content || '');

      // Calculate pagination information
      const totalPages = Math.ceil(fullMarkdown.length / this.pageSize);
      const validPageNumber = Math.min(Math.max(1, pageNumber), totalPages);
      const startIndex = (validPageNumber - 1) * this.pageSize;
      const endIndex = Math.min(startIndex + this.pageSize, fullMarkdown.length);

      // Extract the requested page content
      const pageContent = fullMarkdown.substring(startIndex, endIndex);

      // Add pagination information if there are multiple pages
      let contentWithPagination = pageContent;
      if (totalPages > 1) {
        const paginationInfo = `\n\n---\n\n*Page ${validPageNumber} of ${totalPages}. ${
          validPageNumber < totalPages
            ? `There are ${totalPages - validPageNumber} more pages with additional content.`
            : 'This is the last page.'
        }*\n`;
        contentWithPagination += paginationInfo;
      }

      // Add title to first page if available
      if (validPageNumber === 1 && article.title) {
        contentWithPagination = `# ${article.title}\n\n${contentWithPagination}`;
      }

      return {
        content: contentWithPagination,
        totalPages,
        currentPage: validPageNumber,
        hasMorePages: validPageNumber < totalPages,
        title: article.title || undefined,
      };
    } catch (error) {
      console.error(`Error extracting paginated content: ${error}`);
      throw new Error(
        `Content extraction failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}