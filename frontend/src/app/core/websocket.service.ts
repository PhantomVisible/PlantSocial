import { Injectable, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Centrifuge, Subscription as CentrifugeSubscription, PublicationContext } from 'centrifuge';
import { Subject, Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
    private platformId = inject(PLATFORM_ID);
    private http = inject(HttpClient);

    private centrifuge: Centrifuge | null = null;
    private connecting = false; // prevents double-init during async token fetch
    private subscriptions = new Map<string, CentrifugeSubscription>();
    private channelSubjects = new Map<string, Subject<any>>();
    private connectionState$ = new Subject<boolean>();

    // ─── Lifecycle ────────────────────────────────────────────────

    connect(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        if (this.centrifuge || this.connecting) return;

        this.connecting = true;

        this.fetchCentrifugoToken().subscribe({
            next: (token) => {
                this.connecting = false;

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
            },
            error: (err) => {
                this.connecting = false;
                console.error('WebSocketService: Failed to fetch Centrifugo token', err);
            }
        });
    }

    disconnect(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
        this.subscriptions.clear();
        this.channelSubjects.forEach(subject => subject.complete());
        this.channelSubjects.clear();
        this.centrifuge?.disconnect();
        this.centrifuge = null;
    }

    // ─── Subscribe ────────────────────────────────────────────────

    /**
     * Returns an Observable that emits parsed message data from a Centrifugo channel.
     * Idempotent: multiple calls for the same channel share one Centrifugo subscription.
     * Unsubscribing an Angular subscription does not tear down the Centrifugo channel.
     */
    subscribe<T>(channel: string): Observable<T> {
        if (!this.channelSubjects.has(channel)) {
            const subject = new Subject<T>();
            this.channelSubjects.set(channel, subject);
            this.ensureCentrifugoSubscription<T>(channel, subject);
        }
        return (this.channelSubjects.get(channel) as Subject<T>).asObservable();
    }

    private ensureCentrifugoSubscription<T>(channel: string, subject: Subject<T>): void {
        if (!this.centrifuge) {
            // Still connecting — wire up once the connection is ready
            const connSub = this.connectionState$.subscribe(connected => {
                if (connected) {
                    connSub.unsubscribe();
                    this.attachChannelSubscription<T>(channel, subject);
                }
            });
            return;
        }
        this.attachChannelSubscription<T>(channel, subject);
    }

    private attachChannelSubscription<T>(channel: string, subject: Subject<T>): void {
        if (!this.centrifuge || this.subscriptions.has(channel)) return;

        const sub = this.centrifuge.newSubscription(channel);

        sub.on('publication', (ctx: PublicationContext) => {
            try {
                subject.next(ctx.data as T);
            } catch (e) {
                console.error('Failed to process Centrifugo publication:', e);
            }
        });

        sub.subscribe();
        this.subscriptions.set(channel, sub);
    }

    // ─── Token ────────────────────────────────────────────────────

    private fetchCentrifugoToken(): Observable<string> {
        return this.http
            .get<{ token: string }>(`${environment.apiUrl}/realtime/token`)
            .pipe(map(res => res.token));
    }

    // ─── Connection state ─────────────────────────────────────────

    get connected$(): Observable<boolean> {
        return this.connectionState$.asObservable();
    }

    get isConnected(): boolean {
        return this.centrifuge !== null;
    }

    // ─── Legacy send stub (no-op) ─────────────────────────────────

    /** @deprecated Send is now done via HTTP POST in ChatService. */
    send(_destination: string, _body: any): void {
        console.warn('WebSocketService.send() is deprecated. Use ChatService.sendMessage() which issues an HTTP POST instead.');
    }

    ngOnDestroy(): void {
        this.disconnect();
        this.connectionState$.complete();
    }
}
