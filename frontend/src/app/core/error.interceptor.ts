import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from './toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const toast = inject(ToastService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            const msg = error.error?.message;

            if (error.status === 0 || error.status === 503) {
                toast.showError('Server is unreachable. Please try again later.');
            } else if (error.status === 400) {
                toast.showError(msg || 'Bad Request. Please check your input.');
            } else if (error.status === 401) {
                toast.showError(msg || 'Unauthorized or Session Expired.');
            } else if (error.status === 403) {
                toast.showError('Access denied. You don\'t have permission to do that.');
            } else if (error.status === 409) {
                toast.showError(msg || 'A conflict occurred.');
            } else if (error.status === 500) {
                toast.showError('Server Error: The Xyla API is currently down.');
            } else if (error.status >= 400) {
                // Generic fallback for any other 4xx/5xx not explicitly handled
                toast.showError(msg || `Request failed (${error.status}).`);
            }

            // Re-throw so components can still run local cleanup (stop spinners etc.)
            return throwError(() => error);
        })
    );
};
