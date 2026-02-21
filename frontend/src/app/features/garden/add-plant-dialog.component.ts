import { Component, Input, Output, EventEmitter, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlantData } from './plant.service';
import { PlantIdService, PlantNetResult } from '../../core/services/plant-id.service';

@Component({
  selector: 'app-add-plant-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dialog-overlay" (click)="close.emit()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div class="dialog__header">
          <h2>{{ plantToEdit ? 'Edit Plant' : 'Add a New Plant' }} 🌱</h2>
          <button class="dialog__close" (click)="close.emit()">&times;</button>
        </div>

        <div class="dialog__body">
          <!-- Image Upload -->
          <div
            class="upload-zone"
            [class.has-image]="previewUrl()"
            (click)="fileInput.click()"
          >
            <img *ngIf="previewUrl()" [src]="previewUrl()" alt="Plant preview" />
            <div *ngIf="!previewUrl()" class="upload-placeholder">
              <i class="pi pi-camera"></i>
              <span>{{ plantToEdit ? 'Change photo' : 'Add a photo' }}</span>
            </div>
          </div>
          <input
            #fileInput
            type="file"
            accept="image/*"
            (change)="onFileSelected($event)"
            style="display: none"
          />

          <!-- Nickname -->
          <div class="field">
            <label>Nickname *</label>
            <input
              type="text"
              [(ngModel)]="nickname"
              placeholder="e.g., Mr. Prickles"
              maxlength="100"
            />
          </div>

          <!-- Species -->
          <div class="field">
            <label>Species</label>
            <input
              type="text"
              [(ngModel)]="species"
              placeholder="e.g., Cactus, Monstera"
              maxlength="200"
            />
          </div>

          <!-- Status -->
          <div class="field">
            <label>Status</label>
            <select [(ngModel)]="status">
              <option value="SEED">🌱 Seed</option>
              <option value="GERMINATED">🌱 Germinated</option>
              <option value="VEGETATIVE">🌿 Vegetative</option>
              <option value="FLOWERING">🌸 Flowering</option>
              <option value="FRUITING">🍅 Fruiting</option>
              <option value="HARVESTED">🧺 Harvested</option>
              <option value="DEAD">💀 Dead</option>
              <option value="ALIVE">🌿 Alive (Legacy)</option>
            </select>
          </div>

          <!-- Planted Date -->
          <div class="field">
            <label>Planted Date</label>
            <input
              type="date"
              [(ngModel)]="plantedDate"
            />
          </div>
        </div>

        <div class="dialog__footer">
          <button class="btn btn--cancel" (click)="close.emit()">Cancel</button>
          <button
            class="btn btn--save"
            [disabled]="!nickname.trim()"
            (click)="submit()"
          >
            {{ plantToEdit ? 'Update Plant' : 'Add to Garden' }}
          </button>
        </div>
        <!-- Loading Overlay -->
        <div class="processing-overlay" *ngIf="verifying()">
          <div class="spinner"></div>
          <p>Identifying plant...</p>
        </div>

        <!-- Conflict Dialog -->
        <div class="conflict-dialog" *ngIf="showConflict()">
           <div class="conflict-content">
             <h3>Wait a sec! 🤔</h3>
             <p>
               We think this looks like a <strong>{{ suggestedPlant()?.species?.commonNames?.[0] || suggestedPlant()?.species?.scientificNameWithoutAuthor }}</strong> 
               ({{ (suggestedPlant()?.score || 0) * 100 | number:'1.0-0' }}% match).
             </p>
             <p class="sub-text">
               You entered <strong>{{ species }}</strong>. Which one should we use?
             </p>
             
             <div class="conflict-actions">
               <button class="btn btn--secondary" (click)="resolveConflict(false)">
                 Keep "{{ species }}"
               </button>
               <button class="btn btn--primary" (click)="resolveConflict(true)">
                 Use Suggested
               </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fade-in 0.15s ease;
    }
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .dialog {
      position: relative; /* Anchor for overlays */
      background: var(--trellis-white);
      border-radius: var(--trellis-radius-lg);
      width: 90%;
      max-width: 440px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.2);
      animation: slide-up 0.2s ease;
    }
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .dialog__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px 0;
    }
    .dialog__header h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--trellis-text);
    }
    .dialog__close {
      width: 32px; height: 32px;
      border: none; background: none;
      font-size: 1.4rem;
      color: var(--trellis-text-hint);
      cursor: pointer;
      border-radius: 50%;
      transition: all 0.15s ease;
    }
    .dialog__close:hover {
      background: var(--trellis-green-pale);
      color: var(--trellis-text);
    }

    .dialog__body {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Upload */
    .upload-zone {
      width: 100%;
      aspect-ratio: 16/10;
      border: 2px dashed var(--trellis-border-light);
      border-radius: var(--trellis-radius-md);
      overflow: hidden;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .upload-zone:hover {
      border-color: var(--trellis-green);
      background: var(--trellis-green-ghost);
    }
    .upload-zone.has-image {
      border-style: solid;
    }
    .upload-zone img {
      width: 100%; height: 100%;
      object-fit: cover;
    }
    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      color: var(--trellis-text-hint);
    }
    .upload-placeholder i { font-size: 1.5rem; }
    .upload-placeholder span { font-size: 0.85rem; }

    /* Fields */
    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .field label {
      font-weight: 600;
      font-size: 0.82rem;
      color: var(--trellis-text-secondary);
    }
    .field input, .field select {
      padding: 10px 14px;
      border: 1px solid var(--trellis-border-light);
      border-radius: var(--trellis-radius-md);
      font-family: 'Inter', sans-serif;
      font-size: 0.95rem;
      color: var(--trellis-text);
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      background: var(--surface-ground);
    }
    .field input:focus, .field select:focus {
      border-color: var(--trellis-green);
      box-shadow: 0 0 0 3px rgba(56,142,60,0.1);
    }

    /* Footer */
    .dialog__footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 0 24px 20px;
    }
    .btn {
      padding: 9px 20px;
      border: none;
      border-radius: 20px;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn--cancel {
      background: var(--trellis-border-light);
      color: var(--trellis-text-secondary);
    }
    .btn--cancel:hover { background: #e0e0e0; }
    .btn--save {
      background: var(--trellis-green);
      color: #fff;
    }
    .btn--save:hover:not(:disabled) { background: var(--trellis-green-dark); }
    .btn--save:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Processing Overlay */
    .processing-overlay {
      position: absolute;
      inset: 0;
      background: var(--surface-card);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;
      border-radius: var(--trellis-radius-lg);
    }
    .spinner {
      width: 40px; height: 40px;
      border: 4px solid var(--trellis-green-pale);
      border-top-color: var(--trellis-green);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Conflict Dialog (Nested) */
    .conflict-dialog {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20;
      border-radius: var(--trellis-radius-lg);
      padding: 20px;
    }
    .conflict-content {
      background: var(--surface-card);
      padding: 24px;
      border-radius: 16px;
      text-align: center;
      width: 100%;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      animation: slide-up 0.2s ease;
    }
    .conflict-content h3 {
      margin: 0 0 12px 0;
      font-size: 1.2rem;
      color: var(--trellis-text);
    }
    .conflict-content p {
      margin: 0 0 8px 0;
      color: var(--trellis-text-secondary);
      line-height: 1.5;
    }
    .conflict-content strong {
      color: var(--trellis-green-dark);
    }
    .sub-text {
      font-size: 0.9rem;
      margin-bottom: 20px !important;
    }
    .conflict-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .btn--primary {
      background: var(--trellis-green);
      color: #fff;
      width: 100%;
    }
    .btn--secondary {
      background: var(--trellis-border-light);
      color: var(--trellis-text);
      width: 100%;
    }
  `]
})
export class AddPlantDialogComponent implements OnInit {
  @Input() plantToEdit?: PlantData; // Simplified input type
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ id?: string; nickname: string; species: string; status: string; plantedDate: string; isVerified: boolean; image?: File }>();

  plantIdService = inject(PlantIdService);

  nickname = '';
  species = '';
  status = 'VEGETATIVE';
  plantedDate = new Date().toISOString().split('T')[0]; // Default to today
  selectedFile: File | null = null;
  previewUrl = signal<string | null>(null);

  // Verification State
  verifying = signal<boolean>(false);
  showConflict = signal<boolean>(false);
  suggestedPlant = signal<PlantNetResult | null>(null);

  ngOnInit() {
    if (this.plantToEdit) {
      this.nickname = this.plantToEdit.nickname;
      this.species = this.plantToEdit.species;
      this.status = this.plantToEdit.status;
      // Handle date format if it comes as full ISO
      if (this.plantToEdit.plantedDate) {
        this.plantedDate = this.plantToEdit.plantedDate.split('T')[0];
      }
      if (this.plantToEdit.imageUrl) {
        this.previewUrl.set(this.resolveUrl(this.plantToEdit.imageUrl));
      }
    }
  }

  resolveUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return 'http://localhost:8080' + url;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.previewUrl.set(e.target?.result as string);
      reader.readAsDataURL(this.selectedFile);
    }
  }

  submit() {
    if (!this.nickname.trim()) return;

    // If we have an image and a user-entered species, verify it
    if (this.selectedFile && this.species.trim()) {
      this.verifying.set(true);
      // Explicitly typing the file used in the call, though selectedFile is File | null.
      // We checked selectedFile is truthy, so cast to File is safe or implied.
      const fileToVerify: File = this.selectedFile;

      this.plantIdService.verify(fileToVerify).subscribe({
        next: (results: PlantNetResult[]) => {
          this.verifying.set(false);
          this.checkIdentification(results);
        },
        error: (err: any) => {
          console.error('Plant ID failed', err);
          this.verifying.set(false);
          // Show error to user?
          alert('Could not verify plant (Network Error). Saving as unverified.');
          this.emitSave(); // Fallback to save anyway
        }
      });
    } else {
      this.emitSave();
    }
  }

  checkIdentification(results: PlantNetResult[]) {
    // console.log('PlantNet Results:', results); // Debug log

    if (!results || results.length === 0) {
      this.emitSave();
      return;
    }

    const bestMatch = results[0];

    // Log low scores but don't block
    if (bestMatch.score < 0.05) {
      console.warn('Low confidence score:', bestMatch.score, bestMatch.species.scientificNameWithoutAuthor);
    }

    const userSpecies = this.species.trim().toLowerCase();
    const scientific = (bestMatch.species.scientificNameWithoutAuthor || '').toLowerCase();
    const commonNames = bestMatch.species.commonNames || [];
    const common = commonNames.map(n => n.toLowerCase());

    // console.log('Comparing:', { user: userSpecies, scientific, common });

    const isMatch = scientific.includes(userSpecies) ||
      userSpecies.includes(scientific) ||
      common.some(c => c.includes(userSpecies) || userSpecies.includes(c));

    if (isMatch) {
      // console.log('Match confirmed.');
      this.emitSave(true);
    } else {
      // console.log('Conflict detected!');
      this.suggestedPlant.set(bestMatch);
      this.showConflict.set(true);
    }
  }

  resolveConflict(useSuggested: boolean) {
    if (useSuggested) {
      const suggested = this.suggestedPlant();
      if (suggested) {
        // Prefer common name if available, else scientific
        const name = suggested.species.commonNames && suggested.species.commonNames.length > 0
          ? suggested.species.commonNames[0]
          : suggested.species.scientificNameWithoutAuthor;

        this.species = name;
      }
    }
    this.showConflict.set(false);
    this.emitSave(useSuggested); // If they accepted suggestion, it is verified
  }

  emitSave(isVerified: boolean = false) {
    this.save.emit({
      id: this.plantToEdit?.id,
      nickname: this.nickname.trim(),
      species: this.species.trim(),
      status: this.status,
      plantedDate: this.plantedDate,
      isVerified: isVerified,
      image: this.selectedFile || undefined
    });
  }
}
