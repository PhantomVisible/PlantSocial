import {
    trigger,
    transition,
    style,
    query,
    animate,
    group
} from '@angular/animations';

export const slideInAnimation = trigger('routeAnimations', [
    transition('* <=> *', [
        // Stack both pages on top of each other so layout doesn't jump
        query(':enter, :leave', [
            style({
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
            })
        ], { optional: true }),

        group([
            // Outgoing: fade out in place
            query(':leave', [
                animate('250ms ease-out', style({ opacity: 0 }))
            ], { optional: true }),

            // Incoming: slide in from left + fade in
            query(':enter', [
                style({ transform: 'translateX(-24px)', opacity: 0 }),
                animate('350ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
            ], { optional: true })
        ])
    ])
]);
