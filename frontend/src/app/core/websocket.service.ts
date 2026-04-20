import { Injectable, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Centrifuge, Subscription as CentrifugeSubscription, PublicationContext } from 'centrifuge';
import { OAuthService } from 'angular-oauth2-oidc';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * WebSocket service backed by Centrifugo via centrifuge-js.
 *
 * READ  path: subscribe to a Centrifugo channel → receive publications.
 * WRITE path: delegated to HTTP POST in ChatService (this service is read-only).
 *
 * The Keycloak JWT is passed in the `token` option of Centrifuge constructor
 * (NOT as a custom header), as required by Centrifugo's JWT auth model.
 */
@Injectable({
    providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
    private platformId = inject(PLATFORM_ID);
    private oauthService = inject(OAuthService);

    private centrifuge: Centrifuge | null = null;
    private subscriptions = new Map<string, CentrifugeSubscription>();
    private connectionState$ = new Subject<boolean>();

    // ─── Lifecycle ────────────────────────────────────────────────

    connect(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        if (this.centrifuge) return; // already connected

        const token = this.oauthService.getAccessToken();
        if (!token) {
            console.warn('WebSocketService: No access token — aborting Centrifugo connection.');
            return;
        }

        this.centrifuge = new Centrifuge(environment.centrifugoUrl, { token });

        this.centrifuge.on('connected', () => {
            console.log('🟢 Centrifugo connected');
            this.connectionState$.next(true);
        });

        this.centrifuge.on('disconnected', () => {
            console.log('🔴 Centrifugo disconnected');
            this.connectionState$.next(false);
        });

        this.centrifuge.on('error', (ctx) => {
            console.error('Centrifugo error:', ctx);
        });

        this.centrifuge.connect();
    }

    disconnect(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
        this.subscriptions.clear();
        this.centrifuge?.disconnect();
        this.centrifuge = null;
    }

    // ─── Subscribe ────────────────────────────────────────────────

    /**
     * Returns an Observable that emits parsed message data from a Centrifugo channel.
     * Caller should unsubscribe from the Observable to release the channel subscription.
     */
    subscribe<T>(channel: string): Observable<T> {
        return new Observable<T>(subscriber => {
            const doSubscribe = () => {
                if (!this.centrifuge) {
                    // Wait for connection then retry
                    const connSub = this.connectionState$.subscribe(connected => {
                        if (connected) {
                            connSub.unsubscribe();
                            this.attachChannelSubscription(channel, subscriber);
                        }
                    });
                    return;
                }
                this.attachChannelSubscription(channel, subscriber);
            };

            doSubscribe();

            return () => {
                const sub = this.subscriptions.get(channel);
                if (sub) {
                    sub.unsubscribe();
                    this.subscriptions.delete(channel);
                }
            };
        });
    }

    private attachChannelSubscription<T>(channel: string, subscriber: any): void {
        if (!this.centrifuge || this.subscriptions.has(channel)) return;

        const sub = this.centrifuge.newSubscription(channel);

        sub.on('publication', (ctx: PublicationContext) => {
            try {
                subscriber.next(ctx.data as T);
            } catch (e) {
                console.error('Failed to process Centrifugo publication:', e);
            }
        });

        sub.subscribe();
        this.subscriptions.set(channel, sub);
    }

    // ─── Connection state ─────────────────────────────────────────

    get connected$(): Observable<boolean> {
        return this.connectionState$.asObservable();
    }

    get isConnected(): boolean {
        return this.centrifuge !== null;
    }

    // ─── Legacy send stub (no-op) ─────────────────────────────────
    /**
     * @deprecated Send is now done via HTTP POST in ChatService.
     * This stub exists to avoid breaking any residual callers during migration.
     */
    send(_destination: string, _body: any): void {
        console.warn('WebSocketService.send() is deprecated. Use ChatService.sendMessage() which issues an HTTP POST instead.');
    }

    ngOnDestroy(): void {
        this.disconnect();
        this.connectionState$.complete();
    }
}
