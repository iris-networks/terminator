import { tool } from 'ai';
import { z } from 'zod';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { WORKSPACE_PATH } from '../core/constants.js';
import { ensureWorkspace, validatePath } from '../core/security.js';
import type { CommandResult } from '../core/types.js';

export const generateLatexPdfTool = tool({
  description: 'Generate a PDF from LaTeX source code using pdflatex',
  parameters: z.object({
    latex: z.string().describe('The LaTeX source code to compile'),
    filename: z.string().optional().default('document').describe('Output filename (without extension)'),
    cleanup: z.boolean().optional().default(true).describe('Whether to clean up auxiliary files'),
  }),
  execute: async ({ latex, filename, cleanup }) => {
    console.log(`📄 Generating PDF from LaTeX: ${filename}.pdf`);
    
    try {
      await ensureWorkspace();
      
      // Validate filename (no directory traversal)
      const safeFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '');
      if (!safeFilename) {
        throw new Error('Invalid filename provided');
      }
      
      const texFile = path.join(WORKSPACE_PATH, `${safeFilename}.tex`);
      const pdfFile = path.join(WORKSPACE_PATH, `${safeFilename}.pdf`);
      
      // Write LaTeX source to file
      await fs.writeFile(texFile, latex, 'utf8');
      
      // Run pdflatex
      const result = await new Promise<CommandResult>((resolve) => {
        const startTime = Date.now();
        let stdout = '';
        let stderr = '';
        let exitCode = 0;
        
        const child = spawn('pdflatex', [
          '-interaction=nonstopmode',
          '-output-directory',
          WORKSPACE_PATH,
          texFile
        ], {
          cwd: WORKSPACE_PATH,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        // Set up timeout (30 seconds)
        const timeoutHandle = setTimeout(() => {
          child.kill('SIGTERM');
          setTimeout(() => {
            if (!child.killed) {
              child.kill('SIGKILL');
            }
          }, 5000);
        }, 30000);
        
        child.stdout?.on('data', (data) => {
          stdout += data.toString();
        });
        
        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });
        
        child.on('close', (code) => {
          clearTimeout(timeoutHandle);
          exitCode = code || 0;
          
          const duration = Date.now() - startTime;
          
          resolve({
            success: exitCode === 0,
            output: stdout,
            error: stderr || (exitCode !== 0 ? 'LaTeX compilation failed' : undefined),
            exitCode,
            command: `pdflatex -interaction=nonstopmode -output-directory ${WORKSPACE_PATH} ${texFile}`,
            workingDirectory: WORKSPACE_PATH,
            shell: 'pdflatex',
            signal: null,
            duration,
            timestamp: new Date().toISOString(),
            timedOut: false
          });
        });
        
        child.on('error', (error) => {
          clearTimeout(timeoutHandle);
          
          resolve({
            success: false,
            output: '',
            error: error.message,
            exitCode: -1,
            command: `pdflatex -interaction=nonstopmode -output-directory ${WORKSPACE_PATH} ${texFile}`,
            workingDirectory: WORKSPACE_PATH,
            shell: 'pdflatex',
            signal: null,
            duration: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            timedOut: false
          });
        });
      });
      
      // Check if PDF was created
      let pdfExists = false;
      try {
        await fs.access(pdfFile);
        pdfExists = true;
      } catch {
        pdfExists = false;
      }
      
      // Clean up auxiliary files if requested
      if (cleanup) {
        const auxExtensions = ['.aux', '.log', '.fls', '.fdb_latexmk', '.synctex.gz'];
        for (const ext of auxExtensions) {
          try {
            await fs.unlink(path.join(WORKSPACE_PATH, `${safeFilename}${ext}`));
          } catch {
            // Ignore cleanup errors
          }
        }
        
        // Always remove the .tex file
        try {
          await fs.unlink(texFile);
        } catch {
          // Ignore cleanup errors
        }
      }
      
      return {
        ...result,
        pdfGenerated: pdfExists,
        pdfPath: pdfExists ? pdfFile : null,
        filename: safeFilename,
        texContent: latex
      };
      
    } catch (error) {
      console.error('LaTeX PDF generation error:', error);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: -1,
        command: `pdflatex ${filename}.tex`,
        workingDirectory: WORKSPACE_PATH,
        shell: 'pdflatex',
        signal: null,
        duration: 0,
        timestamp: new Date().toISOString(),
        timedOut: false,
        pdfGenerated: false,
        pdfPath: null,
        filename,
        texContent: latex
      };
    }
  },
});