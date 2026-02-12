import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '../feed/feed.service';

export interface UserProfile {
    id: string;
    fullName: string;
    bio: string | null;
    location: string | null;
    joinDate: string;
    postCount: number;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private baseUrl = 'http://localhost:8080/api/v1';

    getUserProfile(userId: string): Observable<UserProfile> {
        return this.http.get<UserProfile>(`${this.baseUrl}/users/${userId}`);
    }

    getUserPosts(userId: string): Observable<Post[]> {
        return this.http.get<Post[]>(`${this.baseUrl}/posts/user/${userId}`);
    }
}
