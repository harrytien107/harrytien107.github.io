/**
 * Spotify API Integration for HarryTien Admin Dashboard
 * Handles Spotify OAuth and playlist fetching
 */

class SpotifyAPI {
    constructor(clientId, clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.accessToken = null;
        this.tokenExpiry = null;
        this.userId = '31iem24idd3bh2xe6jtei23pi55y'; // HarryTien's Spotify user ID
        this.redirectUri = window.location.origin + '/admin/callback.html';
    }

    /**
     * Check if we have valid credentials
     */
    hasCredentials() {
        return this.clientId && this.clientSecret;
    }

    /**
     * Check if token is valid
     */
    isTokenValid() {
        return this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry;
    }

    /**
     * Get access token using Client Credentials flow
     * This flow doesn't require user login but has limited access
     */
    async getAccessToken() {
        if (this.isTokenValid()) {
            return this.accessToken;
        }

        if (!this.hasCredentials()) {
            throw new Error('Spotify credentials not configured');
        }

        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(this.clientId + ':' + this.clientSecret)
                },
                body: 'grant_type=client_credentials'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error_description || 'Failed to get access token');
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Subtract 1 minute for safety

            return this.accessToken;
        } catch (error) {
            console.error('Spotify Auth Error:', error);
            throw error;
        }
    }

    /**
     * Make authenticated request to Spotify API
     */
    async request(endpoint) {
        const token = await this.getAccessToken();
        
        const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Spotify API error');
        }

        return await response.json();
    }

    /**
     * Get user's public playlists
     */
    async getUserPlaylists(userId = this.userId) {
        try {
            const data = await this.request(`/users/${userId}/playlists?limit=50`);
            return data.items.map(playlist => ({
                id: playlist.id,
                name: playlist.name,
                description: playlist.description,
                image: playlist.images[0]?.url || null,
                tracks: playlist.tracks.total,
                url: playlist.external_urls.spotify,
                uri: playlist.uri,
                public: playlist.public
            }));
        } catch (error) {
            console.error('Error fetching playlists:', error);
            throw error;
        }
    }

    /**
     * Get playlist details
     */
    async getPlaylist(playlistId) {
        try {
            const data = await this.request(`/playlists/${playlistId}`);
            return {
                id: data.id,
                name: data.name,
                description: data.description,
                image: data.images[0]?.url || null,
                tracks: data.tracks.items.map(item => ({
                    name: item.track?.name,
                    artist: item.track?.artists.map(a => a.name).join(', '),
                    album: item.track?.album.name,
                    duration: item.track?.duration_ms,
                    image: item.track?.album.images[0]?.url
                })),
                totalTracks: data.tracks.total,
                url: data.external_urls.spotify,
                uri: data.uri
            };
        } catch (error) {
            console.error('Error fetching playlist:', error);
            throw error;
        }
    }

    /**
     * Get user profile
     */
    async getUserProfile(userId = this.userId) {
        try {
            return await this.request(`/users/${userId}`);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    }

    /**
     * Generate embed URL for playlist
     */
    getEmbedUrl(playlistId, theme = 'dark') {
        return `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=${theme === 'dark' ? '0' : '1'}`;
    }

    /**
     * Generate embed HTML code
     */
    getEmbedCode(playlistId, width = '100%', height = 352) {
        const embedUrl = this.getEmbedUrl(playlistId);
        return `<iframe 
    style="border-radius:12px" 
    src="${embedUrl}" 
    width="${width}" 
    height="${height}" 
    frameBorder="0" 
    allowfullscreen="" 
    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
    loading="lazy">
</iframe>`;
    }

    /**
     * Validate credentials by making a test request
     */
    async validateCredentials() {
        try {
            await this.getAccessToken();
            return { valid: true };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
}

// Export for use in other modules
window.SpotifyAPI = SpotifyAPI;
