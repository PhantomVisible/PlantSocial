import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { AuthService } from '../auth/auth.service';
import { Subject, Observable } from 'rxjs';

/**
 * WebSocket service using native WebSocket (STOMP).
 * Manages connection lifecycle, subscriptions, and reconnection.
 */
@Injectable({
    providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
    private client: Client | null = null;
    private subscriptions = new Map<string, StompSubscription>();
    private connectionState$ = new Subject<boolean>();
    private reconnectAttempts = 0;

    constructor(private authService: AuthService) { }

    /**
     * Connect to WebSocket with JWT authentication.
     */
    connect(): void {
        if (this.client?.connected) return;

        const token = this.authService.getToken();
        if (!token) return;

        this.client = new Client({
            brokerURL: 'ws://localhost:8080/ws',
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            onConnect: () => {
                console.log('🟢 WebSocket connected');
                this.reconnectAttempts = 0;
                this.connectionState$.next(true);
            },
            onDisconnect: () => {
                console.log('🔴 WebSocket disconnected');
                this.connectionState$.next(false);
            },
            onStompError: (frame) => {
                console.error('STOMP error:', frame.headers['message']);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000
        });

        this.client.activate();
    }

    /**
     * Disconnect from WebSocket.
     */
    disconnect(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
        this.subscriptions.clear();
        this.client?.deactivate();
        this.client = null;
    }

    /**
     * Subscribe to a STOMP topic/queue.
     * Returns an Observable that emits parsed JSON messages.
     */
    subscribe<T>(destination: string): Observable<T> {
        return new Observable<T>(subscriber => {
            const doSubscribe = () => {
                if (!this.client?.connected) {
                    // Wait for connection, then subscribe
                    const connSub = this.connectionState$.subscribe(connected => {
                        if (connected) {
                            connSub.unsubscribe();
                            this.performSubscription(destination, subscriber);
                        }
                    });
                    return;
                }
                this.performSubscription(destination, subscriber);
            };

            doSubscribe();

            return () => {
                const sub = this.subscriptions.get(destination);
                if (sub) {
                    sub.unsubscribe();
                    this.subscriptions.delete(destination);
                }
            };
        });
    }

    private performSubscription<T>(destination: string, subscriber: any): void {
        if (!this.client) return;

        const sub = this.client.subscribe(destination, (message: IMessage) => {
            try {
                const body = JSON.parse(message.body);
                subscriber.next(body as T);
            } catch (e) {
                console.error('Failed to parse WebSocket message:', e);
            }
        });

        this.subscriptions.set(destination, sub);
    }

    /**
     * Send a message to a STOMP destination.
     */
    send(destination: string, body: any): void {
        if (!this.client?.connected) {
            console.warn('Cannot send: WebSocket not connected');
            return;
        }

        this.client.publish({
            destination,
            body: JSON.stringify(body)
        });
    }

    /**
     * Observable of connection state.
     */
    get connected$(): Observable<boolean> {
        return this.connectionState$.asObservable();
    }

    get isConnected(): boolean {
        return this.client?.connected ?? false;
    }

    ngOnDestroy(): void {
        this.disconnect();
        this.connectionState$.complete();
    }
}
