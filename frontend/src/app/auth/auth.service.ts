import { Injectable, signal, computed, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OAuthService } from 'angular-oauth2-oidc';
import { filter } from 'rxjs/operators';

// ─── Public models (kept for backward compatibility with consumers) ──────────

export interface CurrentUser {
    id: string;
    email: string;
    username: string;
    fullName: string;
    profilePictureUrl?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private oauthService = inject(OAuthService);
    private platformId = inject(PLATFORM_ID);

    // ─── Signals ──────────────────────────────────────────────────
    readonly isAuthenticated = signal<boolean>(false);
    readonly currentUser = signal<CurrentUser | null>(null);

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            // Sync state once on startup (in case the OIDC session is already valid)
            this.syncState();

            // Re-sync whenever the OAuthService emits a relevant event
            this.oauthService.events
                .pipe(
                    filter(e =>
                        e.type === 'token_received' ||
                        e.type === 'token_refreshed' ||
                        e.type === 'logout' ||
                        e.type === 'session_terminated' ||
                        e.type === 'token_expires'
                    )
                )
                .subscribe(() => this.syncState());
        }
    }

    // ─── Public API ───────────────────────────────────────────────

    /** Initiates the Keycloak Authorization Code + PKCE flow. */
    login(): void {
        this.oauthService.initCodeFlow();
    }

    /** Logs out and clears the OIDC session on the Keycloak side. */
    logout(): void {
        this.oauthService.logOut();
    }

    /** Returns the raw OIDC access token, or null if not authenticated. */
    getToken(): string | null {
        if (!isPlatformBrowser(this.platformId)) return null;
        const token = this.oauthService.getAccessToken();
        return token || null;
    }

    /** Returns true if a valid, non-expired access token exists. */
    get isLoggedIn(): boolean {
        return this.oauthService.hasValidAccessToken();
    }

    /** Returns the raw Keycloak identity claims object. */
    getUserProfile(): Record<string, any> | null {
        return (this.oauthService.getIdentityClaims() as Record<string, any>) ?? null;
    }

    // ─── Private ──────────────────────────────────────────────────

    /** Maps Keycloak claims to our CurrentUser shape and updates signals. */
    private syncState(): void {
        if (this.oauthService.hasValidAccessToken()) {
            const claims = this.oauthService.getIdentityClaims() as Record<string, any> | null;
            if (claims) {
                this.currentUser.set({
                    id: claims['sub'] ?? '',
                    email: claims['email'] ?? '',
                    username: claims['preferred_username'] ?? '',
                    fullName: claims['name'] ?? `${claims['given_name'] ?? ''} ${claims['family_name'] ?? ''}`.trim(),
                    profilePictureUrl: claims['picture'] ?? undefined
                });
                this.isAuthenticated.set(true);
                return;
            }
        }
        // Not authenticated / token expired
        this.currentUser.set(null);
        this.isAuthenticated.set(false);
    }
}
