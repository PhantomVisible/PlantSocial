import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from './toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const toast = inject(ToastService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let message = 'An unexpected error occurred.';

            if (error.status === 0 || error.status === 503) {
                message = 'Server is unreachable. Please try again later.';
                toast.showError(message);
            } else if (error.status === 409) {
                message = error.error?.message || 'A conflict occurred.';
                toast.showError(message);
            } else if (error.status === 401) {
                message = error.error?.message || 'Invalid email or password.';
                toast.showError(message);
            } else if (error.status === 500) {
                message = error.error?.message || 'Something went wrong. Please try again later.';
                toast.showError(message);
            }
            // 400 validation errors are passed through to components for field-level handling

            return throwError(() => error);
        })
    );
};
