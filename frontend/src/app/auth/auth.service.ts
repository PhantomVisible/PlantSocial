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
    email: string;
    password: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:8080/api/v1/auth'; // Updated to match backend Controller

    // Signal to track auth state
    isAuthenticated = signal<boolean>(false);

    constructor(
        private http: HttpClient,
        private router: Router,
        @Inject(PLATFORM_ID) private platformId: Object
    ) {
        if (isPlatformBrowser(this.platformId)) {
            this.isAuthenticated.set(!!localStorage.getItem('token'));
        }
    }

    register(request: RegisterRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
            tap(response => {
                if (isPlatformBrowser(this.platformId)) {
                    localStorage.setItem('token', response.token);
                    this.isAuthenticated.set(true);
                }
                this.router.navigate(['/feed']);
            })
        );
    }

    login(request: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/authenticate`, request).pipe( // Updated endpoint
            tap(response => {
                if (isPlatformBrowser(this.platformId)) {
                    localStorage.setItem('token', response.token);
                    this.isAuthenticated.set(true);
                }
                this.router.navigate(['/feed']);
            })
        );
    }

    logout() {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem('token');
            this.isAuthenticated.set(false);
        }
        this.router.navigate(['/auth/login']); // Redirect to login
    }
}
