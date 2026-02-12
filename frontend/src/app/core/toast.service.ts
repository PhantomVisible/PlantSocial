import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
    id: number;
    severity: 'error' | 'success' | 'info' | 'warn';
    message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    messages = signal<ToastMessage[]>([]);
    private nextId = 0;

    showError(message: string) {
        this.addMessage('error', message);
    }

    showSuccess(message: string) {
        this.addMessage('success', message);
    }

    showInfo(message: string) {
        this.addMessage('info', message);
    }

    dismiss(id: number) {
        this.messages.update(msgs => msgs.filter(m => m.id !== id));
    }

    private addMessage(severity: ToastMessage['severity'], message: string) {
        const id = this.nextId++;
        this.messages.update(msgs => [...msgs, { id, severity, message }]);

        // Auto-dismiss after 5 seconds
        setTimeout(() => this.dismiss(id), 5000);
    }
}
