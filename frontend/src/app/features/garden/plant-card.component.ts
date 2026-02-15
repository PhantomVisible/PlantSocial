import { Component, Input, Output, EventEmitter, inject, signal, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlantData } from './plant.service';

@Component({
  selector: 'app-plant-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="plant-card">
      <div class="plant-card__image" *ngIf="plant.imageUrl">
        <img [src]="resolveUrl(plant.imageUrl)" alt="" loading="lazy" />
        <div class="status-dot" [class]="'status--' + plant.status.toLowerCase()"></div>
      </div>
      <div class="plant-card__image plant-card__image--placeholder" *ngIf="!plant.imageUrl">
        <span class="placeholder-emoji">🌱</span>
        <div class="status-dot" [class]="'status--' + plant.status.toLowerCase()"></div>
      </div>
      
      <!-- Owners only: Menu Button -->
      <!-- Stop propagation on click to avoid triggering card select -->
      <div 
        *ngIf="isOwner" 
        class="menu-wrapper" 
        (click)="$event.stopPropagation()"
      >
        <button 
          class="menu-btn" 
          [class.active]="menuOpen()"
          (click)="toggleMenu()"
        >
          <i class="pi pi-ellipsis-v"></i>
        </button>

        <!-- Custom Dropdown Menu -->
        <div *ngIf="menuOpen()" class="custom-menu">
          <button class="menu-item" (click)="onEdit()">
            <i class="pi pi-pencil"></i>
            <span>Edit</span>
          </button>
          <button class="menu-item delete-item" (click)="onDelete()">
            <i class="pi pi-trash"></i>
            <span>Delete</span>
          </button>
        </div>
      </div>

      <div class="plant-card__info">
        <span class="plant-card__name">{{ plant.nickname }}</span>
        <div class="plant-card__meta">
            <span class="plant-card__species" *ngIf="plant.species">{{ plant.species }}</span>
            <span class="plant-card__age" *ngIf="plant.plantedDate">• {{ daysOld }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .plant-card {
      background: var(--trellis-white);
      border: 1px solid var(--trellis-border-light);
      border-radius: var(--trellis-radius-lg);
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }
    .plant-card:hover {
      border-color: var(--trellis-green);
      box-shadow: 0 4px 12px rgba(46,125,50,0.1);
      transform: translateY(-2px);
    }

    /* Image */
    .plant-card__image {
      width: 100%;
      aspect-ratio: 1;
      position: relative;
      overflow: hidden;
    }
    .plant-card__image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .plant-card__image--placeholder {
      background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .placeholder-emoji { font-size: 2.5rem; }

    /* Status Dot */
    .status-dot {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid var(--trellis-white);
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .status--seed { background: #795548; }
    .status--germinated { background: #8D6E63; }
    .status--vegetative { background: #4CAF50; }
    .status--flowering { background: #E91E63; }
    .status--fruiting { background: #FF9800; }
    .status--harvested { background: #FF5722; }
    .status--dead { background: #9E9E9E; }
    .status--alive { background: #4CAF50; }

    /* Info */
    .plant-card__info {
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .plant-card__name {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--trellis-text);
    }
    .plant-card__species {
      font-size: 0.8rem;
      color: var(--trellis-text-hint);
      font-style: italic;
    }
    .plant-card__meta {
        display: flex;
        gap: 4px;
        align-items: center;
        font-size: 0.8rem;
        color: var(--trellis-text-hint);
    }
    .plant-card__age {
        font-size: 0.75rem;
    }

    /* Menu Wrapper */
    .menu-wrapper {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 10;
    }

    /* Menu Button */
    .menu-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(255,255,255,0.8);
      backdrop-filter: blur(4px);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0;
      transition: all 0.2s ease;
      color: var(--trellis-text-secondary);
    }
    .plant-card:hover .menu-btn, .menu-btn:hover, .menu-btn.active {
        opacity: 1;
    }
    .menu-btn:hover, .menu-btn.active {
        background: #fff;
        color: var(--trellis-green-dark);
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    /* Custom Dropdown */
    .custom-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 4px;
        background: var(--trellis-white);
        border: 1px solid var(--trellis-border-light);
        border-radius: var(--trellis-radius-md);
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        padding: 4px;
        min-width: 140px;
        animation: fade-in 0.1s ease;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    @keyframes fade-in {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .menu-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
        font-family: 'Inter', sans-serif;
        font-size: 0.85rem;
        color: var(--trellis-text);
        cursor: pointer;
        border-radius: 4px;
        transition: background 0.1s ease;
    }
    .menu-item:hover {
        background: var(--trellis-bg);
    }
    .menu-item i {
        font-size: 0.9rem;
    }
    .delete-item {
        color: #d32f2f;
    }
    .delete-item:hover {
        background: #ffebee;
    }
  `]
})
export class PlantCardComponent {
  @Input({ required: true }) plant!: PlantData;
  @Input() isOwner = false;
  @Output() edit = new EventEmitter<PlantData>();
  @Output() delete = new EventEmitter<string>();

  menuOpen = signal(false);
  private elementRef = inject(ElementRef);

  resolveUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return 'http://localhost:8080' + url;
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  onEdit() {
    this.edit.emit(this.plant);
    this.menuOpen.set(false);
  }

  onDelete() {
    if (confirm(`Are you sure you want to compost ${this.plant.nickname}? This cannot be undone.`)) {
      this.delete.emit(this.plant.id);
    }
    this.menuOpen.set(false);
  }

  // Close menu when clicking outside
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.menuOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.menuOpen.set(false);
    }
  }

  get daysOld(): string {
    if (!this.plant.plantedDate) return '';
    const planted = new Date(this.plant.plantedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - planted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // If future date (planted tomorrow?), handle gracefully
    if (planted > now) return 'New';
    return `${diffDays}d`;
  }
}
