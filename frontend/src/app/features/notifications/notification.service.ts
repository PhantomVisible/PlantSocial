import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WebSocketService } from '../../core/websocket.service';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../core/toast.service';
import { environment } from '../../../environments/environment';

export interface Notification {
    id: string;
    type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MESSAGE' | 'SYSTEM';
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

    public notificationsList = computed(() => this.notifications());
    public unreadCount = computed(() =>
        this.notifications().filter(n => !n.isRead).length
    );

    private apiUrl = environment.apiUrl + '/notifications';

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
        // 1. Load latest notifications (unreadCount is derived from this array)
        this.loadNotifications();

        // 2. Subscribe to real-time notifications
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
            // unreadCount is computed from the array — no separate signal to update
        });
    }

    /** Called after the backend has already persisted the bulk-read for a chat room. */
    markRoomMessagesRead(roomId: string): void {
        this.notifications.update(list =>
            list.map(n =>
                n.type === 'MESSAGE' && n.relatedId === roomId && !n.isRead
                    ? { ...n, isRead: true }
                    : n
            )
        );
        // unreadCount is computed from the array — no separate signal to update
    }

    private addRealTimeNotification(n: Notification) {
        this.notifications.update(list => [n, ...list.slice(0, 19)]);
        // unreadCount is computed from the array — no separate signal to update
        this.toast.showInfo(n.content);
    }
}
