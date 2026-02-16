import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-avatar',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div [class]="containerClass()" [style.width.px]="size" [style.height.px]="size">
      <img *ngIf="imageUrl && !imageError" 
           [src]="imageUrl" 
           [alt]="name" 
           (error)="imageError = true"
           class="avatar-img">
      
      <div *ngIf="!imageUrl || imageError" 
           class="avatar-placeholder"
           [style.fontSize.px]="size * 0.4">
        {{ initials() }}
      </div>
    </div>
  `,
    styles: [`
    .avatar-container {
      position: relative;
      border-radius: 50%;
      overflow: hidden;
      background-color: var(--surface-ground);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .avatar-container.has-border {
        border: 2px solid var(--surface-card);
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-500));
      color: white;
      font-weight: 600;
      text-transform: uppercase;
    }
  `]
})
export class AvatarComponent {
    @Input() imageUrl: string | undefined | null = null;
    @Input() name: string = '';
    @Input() size: number = 40;
    @Input() hasBorder: boolean = false;

    imageError = false;

    containerClass = computed(() => {
        return `avatar-container ${this.hasBorder ? 'has-border' : ''}`;
    });

    initials = computed(() => {
        if (!this.name) return '';
        return this.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    });
}
