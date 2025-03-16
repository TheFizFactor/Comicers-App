import { Series } from '@tiyo/common';
import { FetchBannerImageUrlFunc, ParseBannerImageUrlFunc, BannerImageResponse } from './interface';

const fetchBannerImageUrl: FetchBannerImageUrlFunc = (series: Series) => {
  // Skip AniList API call if no title is available
  if (!series.title) {
    console.warn('No title available for AniList banner fetch');
    return Promise.resolve(new Response(JSON.stringify({ data: { Media: null } })));
  }

  const query = `
    query ($q: String) {
      Media (search: $q, type: MANGA, format_not_in: [NOVEL]) {
        id
        bannerImage
        coverImage {
          extraLarge
          large
        }
      }
    }
  `;

  const variables = {
    q: series.title,
  };

  return fetch('https://graphql.anilist.co/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  }).then(response => {
    if (!response.ok) {
      // For 404 errors, just return null result instead of throwing
      if (response.status === 404) {
        return new Response(JSON.stringify({ data: { Media: null } }));
      }
      throw new Error(`AniList API error: ${response.status} ${response.statusText}`);
    }
    return response;
  }).catch(error => {
    console.warn('Failed to fetch banner from AniList:', error);
    // Return null result for any error
    return new Response(JSON.stringify({ data: { Media: null } }));
  });
};

const parseBannerImageUrl: ParseBannerImageUrlFunc = (json: BannerImageResponse) => {
  try {
    const { data } = json;

    if (data?.Media?.bannerImage) {
      return data.Media.bannerImage;
    }

    // If no banner image is found, try to use a fallback
    if (data?.Media?.coverImage?.extraLarge || data?.Media?.coverImage?.large) {
      return data.Media.coverImage.extraLarge || data.Media.coverImage.large || null;
    }

    return null;
  } catch (error) {
    console.warn('Failed to parse AniList banner response:', error);
    return null;
  }
};

export default {
  fetchBannerImageUrl,
  parseBannerImageUrl,
};
