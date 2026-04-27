import { Component, Input, Output, EventEmitter, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlantData } from './plant.service';
import { PlantIdService, PlantIdentificationDTO } from '../../core/services/plant-id.service';
import { PlantDoctorService } from '../plant-doctor/plant-doctor.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-add-plant-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./add-plant-dialog.component.scss'],
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
          <div class="flex flex-column align-items-center justify-content-center p-5 text-center fadein animation-duration-500">
            <svg class="id-loader-svg mb-4" width="150" height="150" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g class="target-leaf">
                <path d="M100 30 C 160 30, 180 100, 100 170 C 20 100, 40 30, 100 30 Z" fill="var(--surface-card, #1E1E1E)" stroke="#00C853" stroke-width="4" stroke-linejoin="round"/>
                <path d="M100 30 V 170" stroke="#00C853" stroke-width="4" stroke-linecap="round"/>
                <path d="M100 70 L 130 50 M100 110 L 135 90 M100 140 L 125 125 M100 80 L 70 60 M100 120 L 65 100" stroke="#00C853" stroke-width="3" stroke-linecap="round"/>
              </g>

              <line class="id-scan-line" x1="20" y1="100" x2="180" y2="100" stroke="#00e676" stroke-width="3" opacity="0.8"/>

              <g class="viewfinder-brackets" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M 50 70 V 50 H 70" />
                <path d="M 150 70 V 50 H 130" />
                <path d="M 50 130 V 150 H 70" />
                <path d="M 150 130 V 150 H 130" />
              </g>
            </svg>

            <h3 class="text-color m-0 mb-2">Identifying Species...</h3>
            <p class="text-color-secondary m-0">Xyla is cross-referencing the global database.</p>
          </div>
        </div>

        <!-- Error Dialog -->
        <div class="conflict-dialog" *ngIf="showErrorDialog()">
           <div class="conflict-content">
             <h3>Oops! ⚠️</h3>
             <p>
               Xyla encountered an error while trying to identify your plant.
             </p>
             <p class="sub-text">
               Would you like to try again or skip identification and save as unverified?
             </p>
             
             <div class="conflict-actions">
               <button class="btn btn--secondary" (click)="skipAndSave()">
                 Skip & Save
               </button>
               <button class="btn btn--primary" (click)="retryIdentification()">
                 Try Again
               </button>
             </div>
           </div>
         </div>

        <!-- Conflict Dialog -->
        <div class="conflict-dialog" *ngIf="showConflict()">
           <div class="conflict-content">
             <h3>Wait a sec! 🤔</h3>
             <p>
               We think this looks like a <strong>{{ suggestedPlant()?.topMatch }}</strong>
               ({{ (suggestedPlant()?.confidence || 0) * 100 | number:'1.0-0' }}% match).
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

        <!-- Identification Bloom Overlay -->
        <div class="bloom-overlay" *ngIf="showCelebrationOverlay()">
          <div class="bloom-card">
            <div class="bloom-anim-wrap">
              <div class="bloom-ring bloom-ring--1"></div>
              <div class="bloom-ring bloom-ring--2"></div>
              <svg class="bloom-leaf" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="40" r="36" fill="rgba(76,175,80,0.15)"/>
                <path d="M40 14 C 64 14, 70 40, 40 66 C 10 40, 16 14, 40 14 Z" fill="#4CAF50"/>
                <path d="M40 14 V 66" stroke="rgba(255,255,255,0.55)" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M40 34 L 54 24 M40 46 L 56 37 M40 56 L 52 49" stroke="rgba(255,255,255,0.45)" stroke-width="2" stroke-linecap="round"/>
                <path d="M40 34 L 26 26 M40 46 L 24 38" stroke="rgba(255,255,255,0.45)" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>

            <h3 class="bloom-name">{{ identificationResult()?.topMatch }}</h3>
            <span class="bloom-confidence">
              {{ (identificationResult()?.confidence || 0) * 100 | number:'1.0-0' }}% Match
            </span>
            <p class="bloom-caption">Species identified by Xyla</p>

            <div class="bloom-actions">
              <button class="btn btn--bloom-share" (click)="shareToFeed()">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                  <polyline points="16 6 12 2 8 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="12" y1="2" x2="12" y2="15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                </svg>
                Share as Post
              </button>
              <button class="btn btn--bloom-save" (click)="savePlant()">Save to Garden</button>
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

    /* === Bloom Identification Overlay === */
    .bloom-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20;
      border-radius: var(--trellis-radius-lg);
      padding: 20px;
      animation: fade-in 0.2s ease;
    }

    .bloom-card {
      background: var(--surface-card, #1e1e1e);
      border-radius: 20px;
      padding: 32px 28px;
      text-align: center;
      width: 100%;
      box-shadow: 0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);
      animation: bloom-card-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    @keyframes bloom-card-pop {
      0%   { transform: scale(0.82); opacity: 0; }
      100% { transform: scale(1);    opacity: 1; }
    }

    .bloom-anim-wrap {
      position: relative;
      width: 96px;
      height: 96px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bloom-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid rgba(76, 175, 80, 0.5);
      animation: bloom-pulse 2s ease-out infinite;
    }
    .bloom-ring--2 { animation-delay: 0.75s; }

    @keyframes bloom-pulse {
      0%   { transform: scale(0.7); opacity: 0.8; }
      100% { transform: scale(2.2); opacity: 0;   }
    }

    .bloom-leaf {
      width: 80px;
      height: 80px;
      position: relative;
      z-index: 1;
      animation: bloom-grow 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }

    @keyframes bloom-grow {
      0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
      70%  { transform: scale(1.12) rotate(4deg); opacity: 1; }
      100% { transform: scale(1) rotate(0deg);    opacity: 1; }
    }

    .bloom-name {
      margin: 0 0 10px;
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--trellis-text, #fff);
      letter-spacing: -0.02em;
    }

    .bloom-confidence {
      display: inline-block;
      background: rgba(76, 175, 80, 0.18);
      color: #4CAF50;
      border: 1px solid rgba(76, 175, 80, 0.4);
      border-radius: 20px;
      padding: 4px 14px;
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      margin-bottom: 8px;
    }

    .bloom-caption {
      margin: 0 0 22px;
      font-size: 0.83rem;
      color: var(--trellis-text-secondary, #aaa);
    }

    .bloom-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .btn--bloom-share {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      background: var(--trellis-green, #388E3C);
      color: #fff;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 0.9rem;
      padding: 11px 20px;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      transition: background 0.15s ease;
      width: 100%;
    }
    .btn--bloom-share:hover { background: var(--trellis-green-dark, #2E7D32); }

    .btn--bloom-save {
      background: rgba(255, 255, 255, 0.07);
      color: var(--trellis-text-secondary, #aaa);
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 0.88rem;
      padding: 10px 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.15s ease;
      width: 100%;
    }
    .btn--bloom-save:hover {
      background: rgba(255, 255, 255, 0.14);
      color: var(--trellis-text, #fff);
    }
  `]
})
export class AddPlantDialogComponent implements OnInit {
  @Input() plantToEdit?: PlantData; // Simplified input type
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ id?: string; nickname: string; species: string; status: string; plantedDate: string; isVerified: boolean; image?: File }>();

  plantIdService = inject(PlantIdService);
  private plantDoctorService = inject(PlantDoctorService);

  nickname = '';
  species = '';
  status = 'VEGETATIVE';
  plantedDate = new Date().toISOString().split('T')[0];
  selectedFile: File | null = null;
  previewUrl = signal<string | null>(null);

  // Verification State
  verifying = signal<boolean>(false);
  showConflict = signal<boolean>(false);
  showErrorDialog = signal<boolean>(false);
  suggestedPlant = signal<PlantIdentificationDTO | null>(null);
  showCelebrationOverlay = signal<boolean>(false);
  identificationResult = signal<PlantIdentificationDTO | null>(null);

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
    return environment.baseUrl + url;
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
        next: (result: PlantIdentificationDTO) => {
          this.verifying.set(false);
          this.checkIdentification(result);
        },
        error: (err: any) => {
          console.error('Plant ID failed', err);
          this.verifying.set(false);
          this.showErrorDialog.set(true);
        }
      });
    } else {
      this.emitSave();
    }
  }

  checkIdentification(result: PlantIdentificationDTO) {
    if (!result || !result.topMatch) {
      this.emitSave();
      return;
    }

    if (result.confidence < 0.05) {
      console.warn('Low confidence score:', result.confidence, result.topMatch);
    }

    const userSpecies = this.species.trim().toLowerCase();
    const suggested = result.topMatch.toLowerCase();
    const isMatch = suggested.includes(userSpecies) || userSpecies.includes(suggested);

    if (isMatch) {
      this.identificationResult.set(result);
      this.showCelebrationOverlay.set(true);
    } else {
      this.suggestedPlant.set(result);
      this.showConflict.set(true);
    }
  }

  resolveConflict(useSuggested: boolean) {
    const suggested = this.suggestedPlant();
    if (useSuggested && suggested?.topMatch) {
      this.species = suggested.topMatch;
    }
    this.showConflict.set(false);

    if (useSuggested && suggested) {
      this.identificationResult.set(suggested);
      this.showCelebrationOverlay.set(true);
    } else {
      this.emitSave(false);
    }
  }

  shareToFeed() {
    const result = this.identificationResult();
    if (!result) return;
    const pct = Math.round((result.confidence || 0) * 100);
    this.plantDoctorService.shareDiagnosis({
      content: `Just identified this as ${result.topMatch} — ${pct}% confidence by Xyla! 🌿`,
      imageBlob: this.selectedFile || undefined,
      plantTag: result.topMatch || undefined
    });
    this.showCelebrationOverlay.set(false);
    this.close.emit();
  }

  savePlant() {
    this.showCelebrationOverlay.set(false);
    this.emitSave(true);
  }

  skipAndSave() {
    this.showErrorDialog.set(false);
    this.emitSave();
  }

  retryIdentification() {
    this.showErrorDialog.set(false);
    this.submit();
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
