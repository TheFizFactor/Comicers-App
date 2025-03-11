import fetch from 'node-fetch';
import pkceChallenge from 'pkce-challenge';
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
import {
  TrackEntry,
  TrackerMetadata,
  TrackerSeries,
  TrackScoreFormat,
  TrackStatus,
} from '@/common/models/types';
import { MALTrackerMetadata } from '@/common/temp_tracker_metadata';

const CLIENT_ID = 'da33fd0a72e2c77f1b30552407ca5ed2';
const BASE_URL = 'https://api.myanimelist.net/v2';
const OAUTH_BASE_URL = 'https://myanimelist.net/v1/oauth2';

const STATUS_MAP: { [key: string]: TrackStatus } = {
  reading: TrackStatus.Reading,
  plan_to_read: TrackStatus.Planning,
  completed: TrackStatus.Completed,
  dropped: TrackStatus.Dropped,
  on_hold: TrackStatus.Paused,
};

type UserResponseData = {
  id: number;
  name: string;
  location: string;
  joined_at: string;
};

type MangaResponseData = {
  id: number;
  title: string;
  synopsis: string;
  main_picture: {
    medium: string;
    large: string;
  };
  num_chapters: number;
  my_list_status?: {
    status: string;
    is_rereading: boolean;
    num_volumes_read: number;
    num_chapters_read: number;
    score: number;
  };
};

type MangaListResponseData = {
  data: {
    node: {
      id: number;
      title: string;
      main_picture:
        | {
            large: string | null | undefined;
            medium: string | null | undefined;
          }
        | null
        | undefined;
      start_date: string | null | undefined;
      end_date: string | null | undefined;
      synopsis: string | null | undefined;
      mean: number | null | undefined;
      rank: number | null | undefined;
      media_type: string | undefined;
      popularity: number | null | undefined;
      num_list_users: number | null | undefined;
      num_scoring_users: number | null | undefined;
      my_list_status:
        | {
            status: string | null | undefined;
            score: number;
            num_volumes_read: number;
            num_chapters_read: number;
            start_date: string | null | undefined;
            finish_date: string | null | undefined;
            priority: number;
            tags: string[];
            comments: string;
          }
        | null
        | undefined;
    };
  }[];
  paging: {
    next: string;
  };
};

type UpdateMangaResponseData = {
  error?: string;
  message?: string;
  status: string;
  is_rereading: boolean;
  num_volumes_read: number;
  num_chapters_read: number;
  score: number;
  updated_at: string;
  priority: number;
  num_times_reread: number;
  reread_value: number;
  tags: string[];
  comments: string;
};

export class MALTrackerClient extends TrackerClientAbstract {
  userId: string;
  // Store multiple PKCE challenges with timestamps
  pkceChallenges: Array<{
    timestamp: number;
    code_challenge: string;
    code_verifier: string;
    state: string;
  }>;

  constructor(accessToken = '') {
    super(accessToken);
    this.userId = '';
    this.pkceChallenges = [];
  }

  getMetadata: () => TrackerMetadata = () => {
    return MALTrackerMetadata;
  };

  getAuthUrl: GetAuthUrlFunc = () => {
    // Generate PKCE challenge with SHA-256 method, which is more secure and better supported
    const pkceCode = pkceChallenge();
    
    // Generate state
    const state = Buffer.from(Date.now().toString()).toString('base64');
    
    // Store the PKCE challenge with a timestamp and state
    const challenge = {
      timestamp: Date.now(),
      code_challenge: pkceCode.code_challenge,
      code_verifier: pkceCode.code_verifier,
      state: state // Store state with the challenge
    };
    
    // Clear old challenges (only keep the current one)
    this.pkceChallenges = [challenge];
    
    console.debug('[MAL Auth] Generated new PKCE challenge:', {
      code_challenge: pkceCode.code_challenge.substring(0, 10) + '...',
      state: state,
      verifier: pkceCode.code_verifier.substring(0, 10) + '...'
    });

    // Build the auth URL with properly encoded parameters
    const params = {
      response_type: 'code',
      client_id: CLIENT_ID,
      code_challenge: pkceCode.code_challenge,
      code_challenge_method: 'S256',
      redirect_uri: 'https://comicers.org',
      state: state
    };

    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    const authUrl = `${OAUTH_BASE_URL}/authorize?${queryString}`;
    console.debug('[MAL Auth] Generated auth URL:', authUrl);
    
    return authUrl;
  };

  getToken: GetTokenFunc = async (code: string) => {
    if (this.pkceChallenges.length === 0) {
      console.error('[MAL Auth] No PKCE challenges available for token request');
      return null;
    }

    console.debug('[MAL Auth] Starting token request with raw input:', code);

    // Clean up the code by removing any leading/trailing whitespace and any @ symbols
    let cleanedCode = code.trim();
    let stateFromUrl: string | null = null;
    
    // Try to parse the URL and extract the code parameter
    try {
      if (cleanedCode.includes('comicers.org')) {
        const url = new URL(cleanedCode);
        const urlCode = url.searchParams.get('code');
        stateFromUrl = url.searchParams.get('state');
        
        if (urlCode) {
          cleanedCode = urlCode;
          console.debug('[MAL Auth] Successfully extracted code from URL params:', {
            codeLength: cleanedCode.length,
            codeStart: cleanedCode.substring(0, 20) + '...',
            state: stateFromUrl
          });
        } else {
          console.debug('[MAL Auth] URL found but no code parameter present');
          return null;
        }
      }
    } catch (e) {
      console.debug('[MAL Auth] URL parsing failed:', e);
      return null;
    }

    // Find the challenge that matches the state from the URL
    const challenge = this.pkceChallenges.find(c => c.state === stateFromUrl);
    if (!challenge) {
      console.error('[MAL Auth] No matching PKCE challenge found for state:', stateFromUrl);
      return null;
    }

    console.debug('[MAL Auth] Found matching PKCE challenge:', {
      timestamp: new Date(challenge.timestamp).toLocaleTimeString(),
      state: challenge.state
    });

    // Try token exchange with the matching challenge
    const result = await this.tryTokenExchange(cleanedCode, challenge.code_verifier);
    
    // Clean up challenges after attempt
    this.pkceChallenges = [];
    
    return result;
  };

  // Helper method to try token exchange with a specific code_verifier
  private async tryTokenExchange(code: string, code_verifier: string): Promise<string | null> {
    const url = `${OAUTH_BASE_URL}/token`;
    
    // Create form data with the exact parameters MAL expects
    const formData = new URLSearchParams();
    formData.append('client_id', CLIENT_ID);
    formData.append('code', code);
    formData.append('code_verifier', code_verifier);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', 'https://comicers.org');

    console.debug('[MAL Auth] Token request parameters:', {
      code_length: code.length,
      code_start: code.substring(0, 20) + '...',
      verifier_length: code_verifier.length,
      verifier_start: code_verifier.substring(0, 20) + '...'
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      const text = await response.text();
      
      if (!response.ok) {
        console.debug('[MAL Auth] Token exchange failed:', {
          status: response.status,
          response: text
        });
        return null;
      }

      try {
        const data = JSON.parse(text);
        if ('error' in data || !data.access_token) {
          console.debug('[MAL Auth] Invalid token response:', data);
          return null;
        }
        
        console.debug('[MAL Auth] Successfully retrieved access token');
        return data.access_token;
      } catch (e) {
        console.debug('[MAL Auth] Failed to parse token response:', e);
        return null;
      }
    } catch (e) {
      console.debug('[MAL Auth] Token request network error:', e);
      return null;
    }
  }

  getUsername: GetUsernameFunc = () => {
    if (this.accessToken === '') return new Promise((resolve) => resolve(null));

    const url = `${BASE_URL}/users/@me`;
    const options = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/json',
      },
    };

    return fetch(url, options)
      .then((response) => response.json())
      .then((data: UserResponseData) => {
        this.userId = `${data.id}`;
        return data.name;
      })
      .catch((e: Error) => {
        console.error(e);
        return null;
      });
  };

  search: SearchFunc = async (text: string) => {
    if (this.accessToken === '') return new Promise((resolve) => resolve([]));

    const url = `${BASE_URL}/manga?q=${text}&nsfw=true&fields=id,title,synopsis,main_picture,media_type`;
    const options = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/json',
      },
    };

    return fetch(url, options)
      .then((response) => response.json())
      .then((data: MangaListResponseData) => {
        return data.data
          .filter((item) => item.node.media_type !== 'light_novel')
          .map((item) => {
            const { node } = item;
            return {
              id: node.id.toString(),
              title: node.title,
              description: node.synopsis,
              coverUrl: node.main_picture?.large,
            } as TrackerSeries;
          });
      })
      .catch((e: Error) => {
        console.error(e);
        return [];
      });
  };

  getLibraryEntry: GetLibraryEntryFunc = async (seriesId: string) => {
    if (this.accessToken === '') return new Promise((resolve) => resolve(null));

    if (this.userId === '') await this.getUsername();
    if (this.userId === '') return null;

    const url = `${BASE_URL}/manga/${seriesId}?fields=synopsis,num_chapters,my_list_status{start_date,finish_date}`;
    const options = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/json',
      },
    };

    return fetch(url, options)
      .then((response) => response.json())
      .then((data: MangaResponseData) => {
        if (data.my_list_status === undefined) {
          return null;
        }

        return {
          seriesId: `${data.id}`,
          title: data.title,
          description: data.synopsis,
          coverUrl: data.main_picture?.large,
          score: data.my_list_status.score,
          scoreFormat: TrackScoreFormat.POINT_10,
          progress: data.my_list_status.num_chapters_read,
          status: STATUS_MAP[data.my_list_status.status],
        } as TrackEntry;
      })
      .catch((e: Error) => {
        console.error(e);
        return null;
      });
  };

  addLibraryEntry: AddLibraryEntryFunc = async (trackEntry: TrackEntry) => {
    return this.updateLibraryEntry(trackEntry);
  };

  updateLibraryEntry: UpdateLibraryEntryFunc = async (trackEntry: TrackEntry) => {
    if (this.accessToken === '') return new Promise((resolve) => resolve(null));

    if (this.userId === '') await this.getUsername();
    if (this.userId === '') return null;

    const formContents = {
      num_chapters_read: trackEntry.progress,
      status: Object.keys(STATUS_MAP).find((key: string) => STATUS_MAP[key] === trackEntry.status),
      score: trackEntry.score,
    };

    const bodyFields: string[] = [];
    Object.entries(formContents).forEach(([key, value]) => {
      if (value !== undefined) {
        bodyFields.push(`${key}=${value}`);
      }
    });

    const url = `${BASE_URL}/manga/${trackEntry.seriesId}/my_list_status`;
    const options = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/json',
      },
      body: bodyFields.join('&'),
    };

    return fetch(url, options)
      .then((response) => response.json())
      .then((data: UpdateMangaResponseData) => {
        if ('error' in data) {
          console.error(
            `Error updating library entry for series ${trackEntry.seriesId} from tracker ${MALTrackerMetadata.id}: ${data.error}`,
          );
          return null;
        }

        return this.getLibraryEntry(trackEntry.seriesId);
      })
      .catch((e: Error) => {
        console.error(e);
        return null;
      });
  };
}