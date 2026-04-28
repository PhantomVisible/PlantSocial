import { Injectable, signal, computed, inject, PLATFORM_ID, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { OAuthService } from 'angular-oauth2-oidc';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// ─── Public models (kept for backward compatibility with consumers) ──────────

export interface CurrentUser {
    id: string;
    email: string;
    username: string;
    fullName: string;
    profilePictureUrl?: string;
    subscriptionTier?: 'FREE' | 'PRO';
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private oauthService = inject(OAuthService);
    private platformId = inject(PLATFORM_ID);
    private http = inject(HttpClient);

    // ─── Signals ──────────────────────────────────────────────────
    readonly isAuthenticated = signal<boolean>(false);
    readonly currentUser = signal<CurrentUser | null>(null);

    // ─── Auth readiness ───────────────────────────────────────────
    private authReadySubject = new BehaviorSubject<boolean>(false);
    /** Becomes true (and stays true) after loadDiscoveryDocumentAndTryLogin resolves. */
    readonly authReady$ = this.authReadySubject.asObservable();

    constructor() {
        if (!isPlatformBrowser(this.platformId)) {
            // SSR: no OIDC exchange possible — unblock guards immediately
            this.authReadySubject.next(true);
            return;
        }

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

    // ─── Initialization ───────────────────────────────────────────

    /**
     * Called once by AppComponent after oauthService.configure().
     * Awaits discovery + login, then syncs state and signals readiness.
     * Guards must wait for authReady$ before making routing decisions.
     */
    async initialize(): Promise<void> {
        try {
            await this.oauthService.loadDiscoveryDocumentAndTryLogin();
            this.oauthService.setupAutomaticSilentRefresh();
        } catch {
            // Discovery failed — treat as unauthenticated
        }
        this.syncState();
        this.authReadySubject.next(true);

        // The Keycloak JWT `picture` claim is never populated by our upload flow —
        // S3 URLs live only in our DB. Reconcile non-blocking so guards aren't delayed.
        const user = this.currentUser();
        if (user) {
            this.http.get<{ profilePictureUrl?: string; subscriptionTier?: string }>(
                `${environment.apiUrl}/users/${user.username}`
            ).subscribe({
                next: (profile) => {
                    this.currentUser.update(u => {
                        if (!u) return u;
                        const patch: Partial<CurrentUser> = {};
                        if (profile.profilePictureUrl) patch.profilePictureUrl = profile.profilePictureUrl;
                        if (profile.subscriptionTier) patch.subscriptionTier = profile.subscriptionTier as 'FREE' | 'PRO';
                        return { ...u, ...patch };
                    });
                }
            });
        }
    }

    // ─── Public API ───────────────────────────────────────────────

    /** Initiates the Keycloak Authorization Code + PKCE flow. */
    login(): void {
        this.oauthService.initCodeFlow();
    }

    /** Sends the user directly to Keycloak's registration page, skipping the login tab. */
    register(): void {
        this.oauthService.initCodeFlow(undefined, { kc_action: 'register' });
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
