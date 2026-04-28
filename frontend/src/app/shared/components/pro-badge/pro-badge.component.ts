import { Component } from '@angular/core';

@Component({
    selector: 'app-pro-badge',
    standalone: true,
    template: `
        <span class="pro-badge" title="Verified Pro Seller">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" aria-hidden="true">
                <defs>
                    <linearGradient id="proGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#f59e0b"/>
                        <stop offset="100%" style="stop-color:#b45309"/>
                    </linearGradient>
                </defs>
                <!-- Shield base -->
                <path d="M11 1 L20 5 V11 C20 16 15.5 20 11 21 C6.5 20 2 16 2 11 V5 Z"
                      fill="url(#proGrad)"/>
                <!-- Checkmark -->
                <polyline points="6.5,11 9.5,14 15.5,8"
                          fill="none" stroke="white" stroke-width="2"
                          stroke-linecap="round" stroke-linejoin="round"/>
                <!-- Tiny leaf accent at top-right -->
                <ellipse cx="17" cy="4" rx="2.2" ry="1.2" fill="#86efac"
                         transform="rotate(-35 17 4)"/>
            </svg>
        </span>
    `,
    styles: [`
        .pro-badge {
            display: inline-flex;
            align-items: center;
            vertical-align: middle;
            margin-left: 4px;
            cursor: default;
            transition: filter 0.2s, transform 0.2s;
        }
        .pro-badge:hover {
            filter: drop-shadow(0 0 5px rgba(245, 158, 11, 0.7));
            transform: scale(1.15);
        }
        svg {
            width: 18px;
            height: 18px;
            display: block;
        }
    `]
})
export class ProBadgeComponent {}
