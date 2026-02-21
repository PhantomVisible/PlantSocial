import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
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

    getHoverCard(username: string): Observable<import('./user.model').UserHoverCard> {
        return this.http.get<import('./user.model').UserHoverCard>(`${this.baseUrl}/users/${username}/hover-card`);
    }

    getHoverCardById(userId: string): Observable<import('./user.model').UserHoverCard> {
        return this.http.get<import('./user.model').UserHoverCard>(`${this.baseUrl}/users/id/${userId}/hover-card`);
    }

    private profileRefreshSource = new Subject<void>();
    profileRefresh$ = this.profileRefreshSource.asObservable();

    triggerRefresh() {
        this.profileRefreshSource.next();
    }

    followUser(userId: string): Observable<import('./user.model').UserHoverCard> {
        return this.http.post<import('./user.model').UserHoverCard>(`${this.baseUrl}/users/${userId}/follow`, {}).pipe(
            tap(() => this.triggerRefresh())
        );
    }

    unfollowUser(userId: string): Observable<import('./user.model').UserHoverCard> {
        return this.http.delete<import('./user.model').UserHoverCard>(`${this.baseUrl}/users/${userId}/follow`).pipe(
            tap(() => this.triggerRefresh())
        );
    }

    getSuggestions(): Observable<UserProfile[]> {
        return this.http.get<UserProfile[]>(`${this.baseUrl}/users/suggestions`);
    }

    getMutualConnections(userId: string): Observable<UserProfile[]> {
        return this.http.get<UserProfile[]>(`${this.baseUrl}/users/${userId}/mutuals`);
    }
}
