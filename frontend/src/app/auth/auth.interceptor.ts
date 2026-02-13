import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const platformId = inject(PLATFORM_ID);

    // Only attach token for requests to our own backend
    const isBackend = req.url.startsWith('http://localhost:8080') || req.url.startsWith('/api');

    if (isPlatformBrowser(platformId) && isBackend) {
        const token = localStorage.getItem('token');
        if (token) {
            const cloned = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
            return next(cloned);
        }
    }
    return next(req);
};
