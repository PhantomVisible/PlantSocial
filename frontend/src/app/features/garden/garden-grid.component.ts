import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlantData } from './plant.service';
import { PlantCardComponent } from './plant-card.component';
import { PlantSkeletonComponent } from './plant-skeleton.component';

@Component({
  selector: 'app-garden-grid',
  standalone: true,
  imports: [CommonModule, PlantCardComponent, PlantSkeletonComponent],
  template: `
    <div class="garden" *ngIf="!(!loading && plants.length === 0 && isOwner)">
      <!-- Add Plant Card (owner only - shown when there are already plants) -->
      <div *ngIf="isOwner" class="plant-card plant-card--add" (click)="addPlantClicked.emit()">
        <div class="add-icon">
          <i class="pi pi-plus"></i>
        </div>
        <span class="add-label">Add Plant</span>
      </div>

      <!-- Skeleton Loading -->
      <ng-container *ngIf="loading">
        <app-plant-skeleton *ngFor="let i of [1,2,3,4,5,6]"></app-plant-skeleton>
      </ng-container>

      <ng-container *ngIf="!loading">
        <!-- Plant Cards -->
        <app-plant-card
          *ngFor="let plant of plants"
          [plant]="plant"
          [isOwner]="isOwner"
          (edit)="plantEdit.emit($event)"
          (delete)="plantDelete.emit($event)"
          (click)="plantClick.emit(plant)"
        ></app-plant-card>
      </ng-container>

      <!-- Empty State (Visitor) -->
      <div *ngIf="!loading && plants.length === 0 && !isOwner" class="garden-empty">
        <img src="assets/empty-garden.svg" alt="Empty Garden" class="garden-empty__svg"/>
        <p class="garden-empty__text">No plants in this garden yet.</p>
      </div>
    </div>

    <!-- Empty State (Owner) -->
    <div *ngIf="!loading && plants.length === 0 && isOwner" class="garden-empty-owner">
        <img src="assets/empty-garden.svg" alt="Empty Garden" class="garden-empty__svg"/>
        <h3>No plants yet!</h3>
        <p>Add your first green friend to get started.</p>
        <button class="btn btn--filled btn--large" (click)="addPlantClicked.emit()">
           <i class="pi pi-plus"></i> Add Plant
        </button>
    </div>
  `,
  styles: [`
    .garden {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
      padding: 16px;
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
      border-radius: var(--trellis-radius-lg);
      cursor: pointer;
      transition: all 0.2s ease;
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

    /* Empty State */
    .garden-empty {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 16px;
    }
    .garden-empty__svg {
      width: 200px;
      height: 150px;
      margin-bottom: 20px;
    }
    .garden-empty__text { color: var(--trellis-text-hint); font-size: 1rem; font-weight: 500; }
    
    .garden-empty-owner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      text-align: center;
    }
    .garden-empty-owner h3 {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--trellis-text);
      margin: 0 0 8px 0;
    }
    .garden-empty-owner p {
      color: var(--trellis-text-secondary);
      margin: 0 0 24px 0;
    }
    .btn--large {
      padding: 12px 24px;
      font-size: 1rem;
      border-radius: 24px;
    }
  `]
})
export class GardenGridComponent {
  @Input({ required: true }) userId!: string;
  @Input() isOwner = false;
  @Input() plants: PlantData[] = [];
  @Input() loading = false;
  @Output() addPlantClicked = new EventEmitter<void>();
  @Output() plantClick = new EventEmitter<PlantData>();
  @Output() plantEdit = new EventEmitter<PlantData>();
  @Output() plantDelete = new EventEmitter<string>();
}
