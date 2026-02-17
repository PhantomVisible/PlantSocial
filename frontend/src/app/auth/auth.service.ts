import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface AuthResponse {
    token: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    fullName: string;
    username: string; // Added
    email: string;
    password: string;
}

export interface CurrentUser {
    id: string;
    email: string;
    username: string; // Added
    fullName: string;
    profilePictureUrl?: string; // Added
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:8080/api/v1/auth';

    isAuthenticated = signal<boolean>(false);
    currentUser = signal<CurrentUser | null>(null);

    constructor(
        private http: HttpClient,
        private router: Router,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        if (isPlatformBrowser(this.platformId)) {
            const token = localStorage.getItem('token');
            if (token) {
                const user = this.decodeToken(token);
                if (user && user.id) {
                    // Valid new-format token
                    this.isAuthenticated.set(true);
                    this.currentUser.set(user);
                } else {
                    // Old token without userId — wipe it and force re-login
                    localStorage.clear();
                    this.isAuthenticated.set(false);
                    this.currentUser.set(null);
                }
            }
        }
    }

    register(request: RegisterRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
            tap(response => {
                if (isPlatformBrowser(this.platformId)) {
                    localStorage.setItem('token', response.token);
                    this.isAuthenticated.set(true);
                    this.currentUser.set(this.decodeToken(response.token));
                }
                this.router.navigate(['/feed']);
            })
        );
    }

    login(request: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/authenticate`, request).pipe(
            tap(response => {
                if (isPlatformBrowser(this.platformId)) {
                    localStorage.setItem('token', response.token);
                    this.isAuthenticated.set(true);
                    this.currentUser.set(this.decodeToken(response.token));
                }
                this.router.navigate(['/feed']);
            })
        );
    }

    logout() {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.clear();
            this.isAuthenticated.set(false);
            this.currentUser.set(null);
        }
        this.router.navigate(['/']);
    }

    getToken(): string | null {
        if (isPlatformBrowser(this.platformId)) {
            return localStorage.getItem('token');
        }
        return null;
    }

    private decodeToken(token: string): CurrentUser | null {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return {
                id: payload.userId || '',
                email: payload.email || payload.sub || '',
                username: payload.username || '', // Added
                fullName: payload.fullName || '',
                profilePictureUrl: payload.profilePictureUrl
            };
        } catch {
            return null;
        }
    }
}
