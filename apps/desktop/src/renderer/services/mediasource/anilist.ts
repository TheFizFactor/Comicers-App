import { Series } from '@tiyo/common';
import { FetchBannerImageUrlFunc, ParseBannerImageUrlFunc } from './interface';

const fetchBannerImageUrl: FetchBannerImageUrlFunc = (series: Series) => {
  const query = `
    query ($q: String) {
      Media (search: $q, type: MANGA, format_not_in: [NOVEL]) {
        id
        bannerImage
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
      throw new Error(`AniList API error: ${response.status} ${response.statusText}`);
    }
    return response;
  }).catch(error => {
    console.warn('Failed to fetch banner from AniList:', error);
    return new Response(JSON.stringify({ data: { Media: null } }));
  });
};

const parseBannerImageUrl: ParseBannerImageUrlFunc = (json: any) => {
  try {
    const { data } = json;

    if (data?.Media?.bannerImage) {
      return data.Media.bannerImage;
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
