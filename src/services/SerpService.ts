import { getEnv } from '../lib/env';

interface ReverseImageResult {
  duplicatesFound: number;
  sources: Array<{
    title: string;
    link: string;
    source: string;
    thumbnail?: string;
  }>;
  isStockPhoto: boolean;
  searchUrl: string;
}

interface SerpApiResponse {
  image_results?: Array<{
    title: string;
    link: string;
    source: string;
    thumbnail?: string;
  }>;
  inline_images?: Array<{
    title: string;
    link: string;
    source: string;
  }>;
  search_metadata?: {
    google_url: string;
  };
}

/**
 * Service for reverse image search via SerpAPI
 * Detects recycled/stolen imagery in fundraising campaigns
 */
export class SerpService {
  private apiKey: string;
  private baseUrl = 'https://serpapi.com/search.json';

  constructor() {
    this.apiKey = getEnv().SERPAPI_API_KEY;
  }

  /**
   * Perform reverse image search on a given image URL
   * Returns matching sources and duplicate count
   */
  async reverseImageSearch(imageUrl: string): Promise<ReverseImageResult> {
    const url = new URL(this.baseUrl);
    url.searchParams.set('engine', 'google_reverse_image');
    url.searchParams.set('image_url', imageUrl);
    url.searchParams.set('api_key', this.apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.statusText}`);
    }

    const data = (await response.json()) as SerpApiResponse;

    const sources =
      data.image_results?.slice(0, 10).map((r) => ({
        title: r.title || '',
        link: r.link || '',
        source: r.source || '',
        thumbnail: r.thumbnail,
      })) || [];

    // Check for stock photo indicators
    const stockIndicators = [
      'shutterstock',
      'getty',
      'adobe stock',
      'istock',
      'alamy',
      'dreamstime',
      'stock photo',
    ];
    const isStockPhoto = sources.some((s) =>
      stockIndicators.some(
        (indicator) =>
          s.source.toLowerCase().includes(indicator) ||
          s.title.toLowerCase().includes(indicator),
      ),
    );

    return {
      duplicatesFound: sources.length,
      sources,
      isStockPhoto,
      searchUrl: data.search_metadata?.google_url || '',
    };
  }

  /**
   * Check multiple images and aggregate results
   */
  async checkMultipleImages(
    imageUrls: string[],
  ): Promise<Map<string, ReverseImageResult>> {
    const results = new Map<string, ReverseImageResult>();

    for (const url of imageUrls) {
      try {
        const result = await this.reverseImageSearch(url);
        results.set(url, result);
      } catch {
        results.set(url, {
          duplicatesFound: 0,
          sources: [],
          isStockPhoto: false,
          searchUrl: '',
        });
      }
    }

    return results;
  }
}
