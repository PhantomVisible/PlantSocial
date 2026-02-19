import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class BlockService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/block`;

    blockUser(userId: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${userId}`, {});
    }

    unblockUser(userId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${userId}`);
    }

    getBlockStatus(userId: string): Observable<{ blocked: boolean }> {
        return this.http.get<{ blocked: boolean }>(`${this.apiUrl}/${userId}/status`);
    }
}
