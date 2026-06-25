import axios, { isAxiosError } from 'axios';

export interface NominatimCoordinates {
  latitude: number;
  longitude: number;
}

interface NominatimSearchOptions {
  userAgent: string;
  referer?: string;
  timeout?: number;
}

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_MIN_DELAY_MS = 1100;
const NOMINATIM_RATE_LIMIT_DELAY_MS = 5000;
const geocodeCache = new Map<string, NominatimCoordinates | null>();
let nextRequestAt = 0;
let requestQueue = Promise.resolve();

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const normalizeQuery = (query: string) =>
  query.trim().replace(/\s+/g, ' ').toLowerCase();

async function waitForNominatimSlot(): Promise<void> {
  const waitMs = Math.max(0, nextRequestAt - Date.now());

  if (waitMs > 0) {
    await delay(waitMs);
  }

  nextRequestAt = Date.now() + NOMINATIM_MIN_DELAY_MS;
}

async function runWithNominatimThrottle<T>(task: () => Promise<T>): Promise<T> {
  const previousTask = requestQueue;
  let releaseQueue: () => void;

  requestQueue = new Promise<void>((resolve) => {
    releaseQueue = resolve;
  });

  await previousTask;
  await waitForNominatimSlot();

  try {
    return await task();
  } finally {
    releaseQueue!();
  }
}

export async function geocodeWithNominatim(
  query: string,
  options: NominatimSearchOptions,
): Promise<NominatimCoordinates | null> {
  const cacheKey = normalizeQuery(query);

  if (!cacheKey) {
    return null;
  }

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey) ?? null;
  }

  const coordinates = await runWithNominatimThrottle(async () => {
    try {
      const response = await axios.get(NOMINATIM_SEARCH_URL, {
        headers: {
          'User-Agent': options.userAgent,
          ...(options.referer ? { Referer: options.referer } : {}),
        },
        params: {
          q: query,
          format: 'json',
          limit: 1,
        },
        timeout: options.timeout ?? 5000,
      });

      if (!Array.isArray(response.data) || response.data.length === 0) {
        return null;
      }

      const result = response.data[0];
      const latitude = Number(result.lat);
      const longitude = Number(result.lon);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      return { latitude, longitude };
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 429) {
        nextRequestAt = Date.now() + NOMINATIM_RATE_LIMIT_DELAY_MS;
      }

      throw error;
    }
  });

  geocodeCache.set(cacheKey, coordinates);

  return coordinates;
}
