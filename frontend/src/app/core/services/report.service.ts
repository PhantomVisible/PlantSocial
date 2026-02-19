import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ReportReason = 'SPAM' | 'HATE_SPEECH' | 'HARASSMENT' | 'MISINFORMATION' | 'OTHER';

export interface ReportRequest {
    postId: string;
    reason: string;
    description?: string;
    blockUser?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/reports`;

    reportPost(postId: string, reason: string, description: string = '', blockUser: boolean = false): Observable<void> {
        return this.http.post<void>(this.apiUrl, { postId, reason, description, blockUser });
    }
}
