import { LocalBrowser, RemoteBrowser } from '@agent-infra/browser';

export interface BrowserLaunchOptions {
  cdpEndpoint?: string;
  headless?: boolean;
  type?: 'local' | 'remote';
}

export class BrowserManager {
  private static instance: BrowserManager | null = null;
  private browser: LocalBrowser | RemoteBrowser | null = null;
  private lastLaunchOptions: BrowserLaunchOptions | null = null;
  private isLaunched = false;
  private isRecoveryInProgress = false;

  private constructor() {}

  public static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  public getBrowser(): LocalBrowser | RemoteBrowser {
    if (!this.browser) {
      if (this.lastLaunchOptions?.cdpEndpoint) {
        console.log(`🌐 Creating RemoteBrowser for CDP endpoint: ${this.lastLaunchOptions.cdpEndpoint}`);
        this.browser = new RemoteBrowser({
          cdpEndpoint: this.lastLaunchOptions.cdpEndpoint,
        });
      } else {
        console.log('🌐 Creating LocalBrowser');
        this.browser = new LocalBrowser({
          headless: this.lastLaunchOptions?.headless ?? true,
        });
      }
    }
    return this.browser;
  }

  public async launchBrowser(options: BrowserLaunchOptions = {}): Promise<void> {
    if (this.isLaunched) {
      console.log('Browser already launched');
      return;
    }

    this.lastLaunchOptions = options;
    
    try {
      console.log('🚀 Launching browser with options:', options);
      
      // Create browser instance
      const browser = this.getBrowser();
      
      // Launch the browser
      await browser.launch();
      
      this.isLaunched = true;
      console.log('✅ Browser launched successfully');
    } catch (error) {
      console.error('❌ Failed to launch browser:', error);
      this.isLaunched = false;
      throw error;
    }
  }

  public async closeBrowser(): Promise<void> {
    if (this.browser) {
      try {
        console.log('🔴 Closing browser');
        await this.browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
      } finally {
        this.browser = null;
        this.isLaunched = false;
      }
    }
  }

  public async closeAllPages(): Promise<void> {
    if (this.browser && this.isLaunched) {
      try {
        // Get underlying Puppeteer browser instance
        const puppeteerBrowser = this.browser.getBrowser();
        const pages = await puppeteerBrowser.pages();
        
        for (const page of pages) {
          if (!page.isClosed()) {
            await page.close();
          }
        }
        console.log(`🗑️ Closed ${pages.length} browser pages`);
      } catch (error) {
        console.error('Error closing pages:', error);
      }
    }
  }

  public async recoverBrowser(): Promise<boolean> {
    if (this.isRecoveryInProgress) return false;

    this.isRecoveryInProgress = true;
    try {
      console.log('🔄 Recovering browser...');
      
      // Reset state
      this.isLaunched = false;

      // Close existing browser (ignoring errors)
      if (this.browser) {
        await this.browser.close().catch(() => {});
        this.browser = null;
      }

      // Re-launch with last known options
      if (this.lastLaunchOptions) {
        await this.launchBrowser(this.lastLaunchOptions);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Browser recovery failed:', error);
      return false;
    } finally {
      this.isRecoveryInProgress = false;
    }
  }

  public async isBrowserAlive(): Promise<boolean> {
    if (!this.browser || !this.isLaunched) return false;
    
    try {
      // Use the built-in health check method
      return await this.browser.isBrowserAlive();
    } catch (error) {
      console.log('Browser health check failed:', error);
      return false;
    }
  }

  public isLaunchingComplete(): boolean {
    return this.isLaunched;
  }

  public async getOrCreatePage(): Promise<any> {
    if (!this.browser || !this.isLaunched) {
      throw new Error('Browser not ready');
    }

    try {
      // Get the active page or create a new one
      const page = await this.browser.getActivePage();
      
      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      return page;
    } catch (error) {
      console.error('Failed to get active page, creating new page:', error);
      // Fallback: create a new page
      const page = await this.browser.createPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      return page;
    }
  }

  public async ensureBrowserReady(): Promise<void> {
    // Check if browser is alive
    const isAlive = await this.isBrowserAlive();
    
    if (!isAlive) {
      console.log('🔄 Browser not ready, attempting recovery...');
      const recovered = await this.recoverBrowser();
      
      if (!recovered) {
        // If recovery failed, try fresh launch
        await this.launchBrowser(this.lastLaunchOptions || {});
      }
    }
  }

  // Auto-discover existing Chrome/Chromium browsers
  public static async discoverBrowser(): Promise<string | null> {
    const possibleEndpoints = [
      'http://localhost:9222',
      'http://127.0.0.1:9222',
      'http://localhost:9223',
      'http://127.0.0.1:9223',
    ];

    for (const endpoint of possibleEndpoints) {
      try {
        const response = await fetch(`${endpoint}/json/version`, { 
          method: 'GET',
          signal: AbortSignal.timeout(2000) 
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`🔍 Found browser at ${endpoint}:`, data.Browser);
          return endpoint;
        }
      } catch (error) {
        // Silently continue to next endpoint
      }
    }
    
    console.log('🔍 No existing browser found, will launch local browser');
    return null;
  }
}