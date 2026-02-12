import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlantService, PlantData } from './plant.service';
import { AuthService } from '../../auth/auth.service';

@Component({
    selector: 'app-garden-grid',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="garden">
      <!-- Add Plant Card (owner only) -->
      <div *ngIf="isOwner" class="plant-card plant-card--add" (click)="addPlantClicked.emit()">
        <div class="add-icon">
          <i class="pi pi-plus"></i>
        </div>
        <span class="add-label">Add Plant</span>
      </div>

      <!-- Plant Cards -->
      <div *ngFor="let plant of plants()" class="plant-card" (click)="plantSelected.emit(plant)">
        <div class="plant-card__image" *ngIf="plant.imageUrl">
          <img [src]="resolveUrl(plant.imageUrl)" alt="" loading="lazy" />
          <div class="status-dot" [class]="'status--' + plant.status.toLowerCase()"></div>
        </div>
        <div class="plant-card__image plant-card__image--placeholder" *ngIf="!plant.imageUrl">
          <span class="placeholder-emoji">🌱</span>
          <div class="status-dot" [class]="'status--' + plant.status.toLowerCase()"></div>
        </div>
        <div class="plant-card__info">
          <span class="plant-card__name">{{ plant.nickname }}</span>
          <span class="plant-card__species" *ngIf="plant.species">{{ plant.species }}</span>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="plants().length === 0 && !isOwner" class="garden-empty">
        <div class="garden-empty__icon">🌿</div>
        <p class="garden-empty__text">No plants in this garden yet.</p>
      </div>
    </div>
  `,
    styles: [`
    .garden {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
      padding: 16px;
    }

    .plant-card {
      background: var(--trellis-white);
      border: 1px solid var(--trellis-border-light);
      border-radius: var(--trellis-radius-lg);
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .plant-card:hover {
      border-color: var(--trellis-green);
      box-shadow: 0 4px 12px rgba(46,125,50,0.1);
      transform: translateY(-2px);
    }

    /* Add Plant Card */
    .plant-card--add {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      border-style: dashed;
      border-color: var(--trellis-green);
      background: var(--trellis-green-ghost);
    }
    .plant-card--add:hover {
      background: var(--trellis-green-pale);
    }
    .add-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--trellis-green-pale);
      color: var(--trellis-green);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      margin-bottom: 8px;
    }
    .add-label {
      font-weight: 600;
      font-size: 0.88rem;
      color: var(--trellis-green-dark);
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
    .status--alive { background: #4CAF50; }
    .status--harvested { background: #FF9800; }
    .status--died { background: #9E9E9E; }

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

    /* Empty */
    .garden-empty {
      grid-column: 1 / -1;
      text-align: center;
      padding: 40px 16px;
    }
    .garden-empty__icon { font-size: 2rem; margin-bottom: 8px; }
    .garden-empty__text { color: var(--trellis-text-hint); font-size: 0.9rem; }
  `]
})
export class GardenGridComponent {
    @Input({ required: true }) userId!: string;
    @Input() isOwner = false;
    @Output() addPlantClicked = new EventEmitter<void>();
    @Output() plantSelected = new EventEmitter<PlantData>();

    private plantService = inject(PlantService);
    plants = signal<PlantData[]>([]);

    ngOnInit() {
        this.loadPlants();
    }

    loadPlants() {
        this.plantService.getUserPlants(this.userId).subscribe({
            next: (plants) => this.plants.set(plants)
        });
    }

    resolveUrl(url: string): string {
        if (url.startsWith('http')) return url;
        return 'http://localhost:8080' + url;
    }
}
