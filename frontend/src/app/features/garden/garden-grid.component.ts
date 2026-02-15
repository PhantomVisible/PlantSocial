import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlantData } from './plant.service';
import { PlantCardComponent } from './plant-card.component';

@Component({
  selector: 'app-garden-grid',
  standalone: true,
  imports: [CommonModule, PlantCardComponent],
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
      <app-plant-card
        *ngFor="let plant of plants"
        [plant]="plant"
        [isOwner]="isOwner"
        (edit)="plantEdit.emit($event)"
        (delete)="plantDelete.emit($event)"
        (click)="plantClick.emit(plant)"
      ></app-plant-card>

      <!-- Empty State -->
      <div *ngIf="plants.length === 0 && !isOwner" class="garden-empty">
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
  @Input() plants: PlantData[] = [];
  @Output() addPlantClicked = new EventEmitter<void>();
  @Output() plantClick = new EventEmitter<PlantData>();
  @Output() plantEdit = new EventEmitter<PlantData>();
  @Output() plantDelete = new EventEmitter<string>();
}
