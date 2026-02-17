import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WebSocketService } from './websocket.service';
import { AuthService } from '../auth/auth.service';
import { ToastService } from './toast.service';

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

    init() {
        const user = this.auth.currentUser();
        if (!user) return;

        // 1. Load initial unread count
        this.http.get<number>(`${this.apiUrl}/unread-count`).subscribe(count => {
            this.unreadCountSignal.set(count);
        });

        // 2. Load latest notifications
        this.loadNotifications();

        // 3. Subscribe to real-time notifications (Observable pattern)
        this.ws.subscribe<Notification>(`/topic/notifications/${user.id}`).subscribe(notification => {
            this.addRealTimeNotification(notification);
        });
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
