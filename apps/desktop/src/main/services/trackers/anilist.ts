import fetch, { Response } from 'node-fetch';
import {
  GetUsernameFunc,
  GetAuthUrlFunc,
  TrackerClientAbstract,
  SearchFunc,
  GetLibraryEntryFunc,
  AddLibraryEntryFunc,
  UpdateLibraryEntryFunc,
  GetTokenFunc,
} from '@/common/models/interface';
import { TrackEntry, TrackerMetadata, TrackScoreFormat, TrackStatus } from '@/common/models/types';
import { AniListTrackerMetadata } from '@/common/temp_tracker_metadata';

// AniList client ID and authorize endpoint
const clientId = '23253';
const API_URL = 'https://graphql.anilist.co/';

// For AniList, we need to use their implicit flow as they don't support authorization_code
// flow for custom URL schemes. Users will need to copy the token manually.
const STATUS_MAP: { [key: string]: TrackStatus } = {
  CURRENT: TrackStatus.Reading,
  PLANNING: TrackStatus.Planning,
  COMPLETED: TrackStatus.Completed,
  DROPPED: TrackStatus.Dropped,
  PAUSED: TrackStatus.Paused,
  REREADING: TrackStatus.Reading,
};

const SCORE_FORMAT_MAP: { [key: string]: TrackScoreFormat } = {
  POINT_10: TrackScoreFormat.POINT_10,
  POINT_100: TrackScoreFormat.POINT_100,
  POINT_10_DECIMAL: TrackScoreFormat.POINT_10_DECIMAL,
  POINT_5: TrackScoreFormat.POINT_5,
  POINT_3: TrackScoreFormat.POINT_3,
};

interface AniListGraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

interface AniListUserData {
  Viewer: {
    id: string;
    name: string;
    mediaListOptions: {
      scoreFormat: string;
    };
  };
}

interface AniListMediaTitle {
  romaji: string;
}

interface AniListCoverImage {
  large: string;
}

interface AniListMedia {
  id: number;
  title: AniListMediaTitle;
  coverImage: AniListCoverImage;
  description: string | null;
}

interface AniListSearchResponse {
  Page: {
    media: AniListMedia[];
  };
}

interface AniListMediaList {
  id: number;
  status: string;
  score: number;
  progress: number;
  media: AniListMedia;
}

interface AniListLibraryResponse {
  MediaList: AniListMediaList | null;
}

export class AniListTrackerClient extends TrackerClientAbstract {
  userId: string;
  userScoreFormat?: TrackScoreFormat;

  constructor(accessToken: string = '') {
    super(accessToken);
    this.userId = '';
  }

  private async makeGraphQLRequest<T>(query: string, variables?: Record<string, unknown>): Promise<AniListGraphQLResponse<T> | null> {
    if (!this.accessToken) {
      console.warn('No access token available for AniList request');
      return null;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`AniList API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if ('errors' in data) {
        const errorMessages = data.errors?.map(error => error.message).join('; ');
        throw new Error(`AniList GraphQL error: ${errorMessages}`);
      }

      return data as AniListGraphQLResponse<T>;
    } catch (error: unknown) {
      console.error('AniList request failed:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  getMetadata: () => TrackerMetadata = () => {
    return AniListTrackerMetadata;
  };

  getAuthUrl: GetAuthUrlFunc = () => {
    return `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&response_type=token`;
  };

  getToken: GetTokenFunc = (code: string) => {
    return new Promise((resolve) => resolve(code));
  };

  getUsername: GetUsernameFunc = async () => {
    const query = `
      query User {
        Viewer {
          id
          name
          mediaListOptions {
            scoreFormat
          }
        }
      }
    `;

    const response = await this.makeGraphQLRequest<AniListUserData>(query);
    if (!response) return null;

    try {
      const { data } = response;
      this.userId = data.Viewer.id;
      this.userScoreFormat = SCORE_FORMAT_MAP[data.Viewer.mediaListOptions.scoreFormat];
      return data.Viewer.name;
    } catch (error) {
      console.error('Failed to parse AniList user data:', error);
      return null;
    }
  };

  search: SearchFunc = async (text: string) => {
    if (this.accessToken === '') return [];

    const query = `
      query Search(${'$'}query: String) {
        Page (perPage: 10) {
          media (search: ${'$'}query, type: MANGA, format_not_in: [NOVEL]) {
            id
            title {
              romaji
            }
            coverImage {
              large
            }
            description
          }
        }
      }`.trim();

    try {
      const response = await this.makeGraphQLRequest<AniListSearchResponse>(query, { query: text });
      if (!response) return [];

      return response.data.Page.media.map(media => ({
        id: media.id.toString(),
        title: media.title.romaji,
        description: media.description || '',
        coverUrl: media.coverImage.large,
      }));
    } catch (error: unknown) {
      console.error('Failed to search AniList:', error instanceof Error ? error.message : error);
      return [];
    }
  };

  getLibraryEntry: GetLibraryEntryFunc = async (seriesId: string) => {
    if (this.accessToken === '') return null;

    if (this.userId === '' || this.userScoreFormat === undefined) await this.getUsername();
    if (this.userId === '') return null;

    const query = `
      query (${'$'}id: Int!, ${'$'}manga_id: Int!) {
        MediaList (userId: ${'$'}id, type: MANGA, mediaId: ${'$'}manga_id) {
          id
          status
          score
          progress
          media {
            id
            title {
              romaji
            }
            coverImage {
              large
            }
            description
          }
        }
      }`.trim();

    try {
      const response = await this.makeGraphQLRequest<AniListLibraryResponse>(query, {
        id: parseInt(this.userId, 10),
        manga_id: parseInt(seriesId, 10),
      });

      if (!response || !response.data.MediaList) return null;

      const { MediaList: entry } = response.data;
      return {
        id: entry.id.toString(),
        status: STATUS_MAP[entry.status] || TrackStatus.Reading,
        score: entry.score,
        progress: entry.progress,
        seriesId: entry.media.id.toString(),
        title: entry.media.title.romaji,
        description: entry.media.description || '',
        coverUrl: entry.media.coverImage.large,
      };
    } catch (error: unknown) {
      console.error('Failed to get AniList library entry:', error instanceof Error ? error.message : error);
      return null;
    }
  };

  addLibraryEntry: AddLibraryEntryFunc = async (trackEntry: TrackEntry) => {
    if (this.accessToken === '') return new Promise((resolve) => resolve(null));

    if (this.userId === '') await this.getUsername();
    if (this.userId === '') return null;

    const query = `
      mutation AddManga(${'$'}mangaId: Int, ${'$'}progress: Int, ${'$'}status: MediaListStatus) {
        SaveMediaListEntry (mediaId: ${'$'}mangaId, progress: ${'$'}progress, status: ${'$'}status) { 
          id 
          status 
        } 
      }`.trim();

    const url = 'https://graphql.anilist.co';
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          mangaId: trackEntry.seriesId,
          progress: trackEntry.progress,
          status: Object.keys(STATUS_MAP).find(
            (key: string) => STATUS_MAP[key] === trackEntry.status,
          ),
        },
      }),
    };

    return (
      fetch(url, options)
        .then((response: Response) => response.json())
        // biome-ignore lint/suspicious/noExplicitAny: TODO external schema
        .then((data: any) => {
          if ('errors' in data) {
            console.error(
              `Error adding library entry for series ${trackEntry.seriesId} from tracker ${
                AniListTrackerMetadata.id
                // biome-ignore lint/suspicious/noExplicitAny: TODO external schema
              }: ${data.errors.map((error: any) => error.message).join('; ')}`,
            );
            return null;
          }
          return this.getLibraryEntry(trackEntry.seriesId);
        })
        .catch((e: Error) => {
          console.error(e);
          return null;
        })
    );
  };

  updateLibraryEntry: UpdateLibraryEntryFunc = async (trackEntry: TrackEntry) => {
    if (this.accessToken === '') return new Promise((resolve) => resolve(null));

    if (this.userId === '' || this.userScoreFormat === undefined) await this.getUsername();
    if (this.userId === '') return null;

    const prevEntry = await this.getLibraryEntry(trackEntry.seriesId);
    if (prevEntry === null)
      return this.addLibraryEntry(trackEntry).then(() => this.updateLibraryEntry(trackEntry));

    trackEntry.id = prevEntry.id;
    if (trackEntry.progress === undefined) {
      trackEntry.progress = prevEntry.progress;
    }
    if (trackEntry.status === undefined) {
      trackEntry.status = prevEntry.status;
    }
    if (trackEntry.score === undefined) {
      trackEntry.score = prevEntry.score;
    }

    const query = `
      mutation UpdateManga (
        ${'$'}listId: Int, ${'$'}progress: Int, ${'$'}status: MediaListStatus, ${'$'}score: Float
      ) {
        SaveMediaListEntry (
          id: ${'$'}listId, progress: ${'$'}progress, status: ${'$'}status, score: ${'$'}score
        ) {
          id
          progress
          status
        }
      }`.trim();

    const url = 'https://graphql.anilist.co';
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          listId: trackEntry.id,
          progress: trackEntry.progress,
          status: Object.keys(STATUS_MAP).find(
            (key: string) => STATUS_MAP[key] === trackEntry.status,
          ),
          score: trackEntry.score === undefined ? 0 : trackEntry.score,
        },
      }),
    };

    return (
      fetch(url, options)
        .then((response: Response) => response.json())
        // biome-ignore lint/suspicious/noExplicitAny: TODO external schema
        .then((data: any) => {
          if ('errors' in data) {
            console.error(
              `Error updating library entry for series ${trackEntry.seriesId} from tracker ${
                AniListTrackerMetadata.id
                // biome-ignore lint/suspicious/noExplicitAny: TODO external schema
              }: ${data.errors.map((error: any) => error.message).join('; ')}`,
            );
            return null;
          }
          return this.getLibraryEntry(trackEntry.seriesId);
        })
        .catch((e: Error) => {
          console.error(e);
          return null;
        })
    );
  };
}
