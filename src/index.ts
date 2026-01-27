import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import type { AppType } from './lib/types';
import { verifyToken } from './middlewares/auth';
import { initServices } from './middlewares/init';
import { assessRoute } from './lib/routes';
import { getErrorMessage, getStatusCode } from './lib/response';
import type {
  Forensics,
  BlockchainForensics,
  ExifForensics,
  ReverseImageForensics,
  IdentityForensics,
} from './lib/schemas/output';
import { EtherscanService } from './services/EtherscanService';
import { SerpService } from './services/SerpService';
import { ExifService } from './services/ExifService';
import { getEnv } from './lib/env';

const app = new OpenAPIHono<AppType>();

app.use('*', initServices);
app.use('*', cors({ origin: '*' }));
app.get('/', (c) => c.text('GemFund Forensic Engine Online'));
app.use('/api/*', verifyToken);

app.openapi(assessRoute, async (c) => {
  const { text, media, creatorAddress, donors, creator } = c.req.valid('json');

  // Track cleanup functions for temp files
  let cleanupFn: (() => Promise<void>) | null = null;

  try {
    // Initialize forensic services
    const env = getEnv();
    let blockchain: BlockchainForensics | null = null;
    let exif: ExifForensics = {
      hasGps: false,
      hasEdits: false,
      dateMismatch: false,
      warnings: [],
    };
    let reverseImage: ReverseImageForensics = {
      duplicatesFound: 0,
      isStockPhoto: false,
      sources: [],
    };
    let identity: IdentityForensics | null = null;

    // 1. Blockchain Forensics (if creator address provided)
    if (creatorAddress && env.ETHERSCAN_API_KEY) {
      try {
        const etherscan = new EtherscanService();
        const walletHistory = await etherscan.getWalletHistory(creatorAddress);
        let washTradingScore = 0;

        if (donors && donors.length > 0) {
          const washResult = await etherscan.detectWashTrading(
            creatorAddress,
            donors,
          );
          washTradingScore = washResult.score;
        }

        const isBurnerWallet =
          walletHistory.ageHours < 24 && walletHistory.nonce < 5;

        blockchain = {
          nonce: walletHistory.nonce,
          ageHours: walletHistory.ageHours,
          washTradingScore,
          isBurnerWallet,
        };
      } catch {
        // Continue without blockchain data
      }
    }

    // 2. EXIF Metadata Extraction (download files, extract, cleanup)
    const imageMedia = media.filter((m) => m.type === 'image');
    if (imageMedia.length > 0) {
      try {
        // Download images to temp storage
        const imagePaths = imageMedia.slice(0, 3).map((m) => m.path);
        const { files, cleanupAll } =
          await c.var.services.supabase.downloadMultiple(imagePaths);
        cleanupFn = cleanupAll;

        if (files.length > 0) {
          const exifService = new ExifService();
          const localPaths = files.map((f) => f.localPath);
          const metadataResults = await exifService.extractMultiple(localPaths);

          // Aggregate EXIF results from all images
          let hasGps = false;
          let hasEdits = false;
          let dateMismatch = false;
          const warnings: string[] = [];

          for (const [, metadata] of metadataResults) {
            if (metadata.hasGps) hasGps = true;
            if (metadata.hasEdits) hasEdits = true;
            if (metadata.dateMismatch) dateMismatch = true;
            warnings.push(...metadata.warnings);
          }

          exif = {
            hasGps,
            hasEdits,
            dateMismatch,
            warnings: warnings.slice(0, 5), // Limit warnings
          };
        }
      } catch {
        exif.warnings = ['EXIF extraction failed, analyzed via AI'];
      }
    }

    // 3. Reverse Image Search (for images)
    if (imageMedia.length > 0 && env.SERPAPI_API_KEY) {
      try {
        const serpService = new SerpService();
        let totalDuplicates = 0;
        let isStockPhoto = false;
        const allSources: Array<{
          title: string;
          link: string;
          source: string;
        }> = [];

        // Get signed URLs for reverse image search
        for (const item of imageMedia.slice(0, 2)) {
          const { url } = await c.var.services.supabase.getFileUrl(item.path);
          const result = await serpService.reverseImageSearch(url);

          totalDuplicates += result.duplicatesFound;
          if (result.isStockPhoto) isStockPhoto = true;
          allSources.push(...result.sources.slice(0, 3));
        }

        reverseImage = {
          duplicatesFound: totalDuplicates,
          isStockPhoto,
          sources: allSources.slice(0, 5),
        };
      } catch {
        // Continue without reverse image data
      }
    }

    // 4. Identity OSINT Investigation (if creator provided)
    if (creator) {
      try {
        identity = await c.var.services.gemini.investigateIdentity(creator);
      } catch {
        // Continue without identity data
      }
    }

    // Build forensics object
    const forensics: Forensics = {
      blockchain,
      exif,
      reverseImage,
      identity,
    };

    // 4. Run AI Assessment with forensic data
    const result = await c.var.services.gemini.assess(text, media, forensics);

    return c.json(
      {
        success: true as const,
        data: result,
        forensics,
      },
      200,
    );
  } catch (e) {
    const status = getStatusCode(e) as 400 | 401 | 500;
    return c.json(
      { success: false as const, error: getErrorMessage(e) },
      status,
    );
  } finally {
    // Cleanup temp files
    if (cleanupFn) {
      await cleanupFn();
    }
  }
});

app.doc('/doc', {
  openapi: '3.1.0',
  info: {
    title: 'GemFund Forensic Engine API',
    version: '2.0.0',
    description:
      'AI-powered charity fraud detection service using Gemini AI with blockchain forensics, EXIF analysis, and reverse image search.',
  },
  servers: [
    {
      url: 'https://gemfund.apir.live',
      description: 'Production',
    },
    { url: 'http://localhost:3000', description: 'Local development' },
  ],
});

app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Supabase JWT token',
});

app.get(
  '/docs',
  Scalar({
    url: '/doc',
    theme: 'purple',
    pageTitle: 'GemFund Forensic Engine API',
  }),
);

export default app;
