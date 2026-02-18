import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WebSocketService } from '../../core/websocket.service';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../core/toast.service';

export interface Notification {
    id: string;
    type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MESSAGE';
    content: string;
    senderName: string;
    senderHandle: string;
    senderProfilePicture: string | null;
    relatedId: string;
    isRead: boolean;
    createdAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private http = inject(HttpClient);
    private ws = inject(WebSocketService);
    private auth = inject(AuthService);
    private toast = inject(ToastService);

    private notifications = signal<Notification[]>([]);
    private unreadCountSignal = signal<number>(0);

    public notificationsList = computed(() => this.notifications());
    public unreadCount = computed(() => this.unreadCountSignal());

    private apiUrl = 'http://localhost:8080/api/v1/notifications';

    private effectRef = effect(() => {
        const user = this.auth.currentUser();
        if (user) {
            console.log('NotificationService: User logged in, initializing...');
            this.initializeForUser(user);
        } else {
            console.log('NotificationService: User logged out, cleaning up...');
            this.cleanup();
        }
    }, { allowSignalWrites: true });

    init() {
        // The effect handles initialization now.
        // We can keep this method empty or remove it, but AppComponent calls it.
    }

    private initializeForUser(user: any) {
        // 1. Load initial unread count
        this.http.get<number>(`${this.apiUrl}/unread-count`).subscribe(count => {
            this.unreadCountSignal.set(count);
        });

        // 2. Load latest notifications
        this.loadNotifications();

        // 3. Subscribe to real-time notifications (Observable pattern)
        // Ensure we don't have duplicate subscriptions
        this.cleanupSubscription();

        this.notificationSubscription = this.ws.subscribe<Notification>(`/topic/notifications/${user.id}`).subscribe(notification => {
            console.log('NotificationService: Received real-time notification', notification);
            this.addRealTimeNotification(notification);
        });
    }

    private notificationSubscription: any;

    private cleanupSubscription() {
        if (this.notificationSubscription) {
            this.notificationSubscription.unsubscribe();
            this.notificationSubscription = null;
        }
    }

    private cleanup() {
        this.cleanupSubscription();
        this.notifications.set([]);
        this.unreadCountSignal.set(0);
    }

    loadNotifications() {
        this.http.get<{ content: Notification[] }>(`${this.apiUrl}`).subscribe(page => {
            this.notifications.set(page.content);
        });
    }

    markAsRead(id: string) {
        this.http.post(`${this.apiUrl}/${id}/read`, {}).subscribe(() => {
            this.notifications.update(list =>
                list.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            this.unreadCountSignal.update(c => Math.max(0, c - 1));
        });
    }

    private addRealTimeNotification(n: Notification) {
        this.notifications.update(list => [n, ...list.slice(0, 19)]);
        this.unreadCountSignal.update(c => c + 1);

        // Show toast
        this.toast.showInfo(n.content);
    }
}
