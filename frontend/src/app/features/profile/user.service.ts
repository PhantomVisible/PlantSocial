import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '../feed/feed.service';

import { UserProfile } from './user.model';
export { UserProfile }; // Re-export for backward compatibility or just let consumers import from model


@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private baseUrl = 'http://localhost:8080/api/v1';

    getUserProfile(username: string): Observable<UserProfile> {
        return this.http.get<UserProfile>(`${this.baseUrl}/users/${username}`);
    }

    getUserPosts(userId: string): Observable<Post[]> {
        return this.http.get<Post[]>(`${this.baseUrl}/posts/user/${userId}`);
    }

    updateProfile(formData: FormData): Observable<UserProfile> {
        return this.http.put<UserProfile>(`${this.baseUrl}/users/profile`, formData);
    }
}
