import type { LeaderboardResponse } from '@/types';
import { callApi } from './api';

export async function getLeaderboard(): Promise<LeaderboardResponse> {
    const response = await callApi('/leaderboard', {
        method: 'GET',
    });

    return response as LeaderboardResponse;
}
