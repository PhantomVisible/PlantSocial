import { Component, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlantService, PlantData } from '../garden/plant.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-post-composer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="composer">
      <div class="composer__avatar">
        <i class="pi pi-user"></i>
      </div>
      <div class="composer__body">
        <!-- Text Area -->
        <textarea
          class="composer__input"
          [(ngModel)]="content"
          placeholder="What's growing on?"
          rows="2"
          (input)="autoResize($event)"
        ></textarea>

        <!-- Image Preview -->
        <div *ngIf="previewUrl" class="composer__preview">
          <img [src]="previewUrl" alt="Attached image" />
          <button class="preview-remove" (click)="removeFile()">&times;</button>
        </div>

        <div class="composer__toolbar">
          <div class="composer__icons">
            <button class="icon-btn" title="Add image" (click)="fileInput.click()">
              <i class="pi pi-image"></i>
            </button>
            <button class="icon-btn" title="Add location">
              <i class="pi pi-map-marker"></i>
            </button>
            
            <!-- Plant Selector Dropdown Trigger -->
            <div class="plant-select-wrap">
              <button 
                class="icon-btn" 
                [class.active]="selectedPlantId()" 
                title="Tag a plant"
                (click)="togglePlantDropdown()"
              >
                <i class="pi pi-ticket"></i>
              </button>
              
              <!-- Plant Dropdown -->
              <div *ngIf="showPlantDropdown()" class="plant-dropdown">
                <div class="plant-dropdown__header">Tag a plant</div>
                <div 
                    class="plant-option" 
                    [class.selected]="!selectedPlantId()"
                    (click)="selectPlant(null)"
                >
                    <span class="plant-emoji">❌</span>
                    <span>No tag</span>
                </div>
                <div 
                    *ngFor="let plant of myPlants()" 
                    class="plant-option"
                    [class.selected]="selectedPlantId() === plant.id"
                    (click)="selectPlant(plant)"
                >
                    <img *ngIf="plant.imageUrl" [src]="resolveUrl(plant.imageUrl)" class="plant-thumb" />
                    <span *ngIf="!plant.imageUrl" class="plant-emoji">🌱</span>
                    <span class="plant-name">{{ plant.nickname }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="composer__actions">
             <span *ngIf="selectedPlantNickname()" class="plant-tag-badge">
                🌿 {{ selectedPlantNickname() }}
                <button (click)="selectPlant(null)">&times;</button>
             </span>
             
             <button
                class="composer__post-btn"
                [disabled]="!content.trim()"
                (click)="submitPost()"
              >
                Post
              </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      #fileInput
      type="file"
      accept="image/*"
      (change)="onFileSelected($event)"
      style="display: none"
    />
    
    <!-- Backdrop for dropdown -->
    <div *ngIf="showPlantDropdown()" class="dropdown-backdrop" (click)="showPlantDropdown.set(false)"></div>
  `,
  styles: [`
    .composer {
      display: flex;
      gap: 12px;
      padding: 16px 20px;
      background: var(--trellis-white);
      border-bottom: 1px solid var(--trellis-border-light);
    }

    .composer__avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: var(--trellis-green-pale);
      color: var(--trellis-green-dark);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .composer__body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .composer__input {
      width: 100%;
      border: none;
      outline: none;
      resize: none;
      font-family: 'Inter', sans-serif;
      font-size: 1.05rem;
      line-height: 1.5;
      color: var(--trellis-text);
      background: transparent;
      padding: 8px 0;
      min-height: 52px;
    }

    .composer__input::placeholder {
      color: var(--trellis-text-hint);
    }

    /* Image Preview */
    .composer__preview {
      position: relative;
      border-radius: var(--trellis-radius-lg);
      overflow: hidden;
      border: 1px solid var(--trellis-border-light);
      max-height: 200px;
    }

    .composer__preview img {
      width: 100%;
      display: block;
      object-fit: cover;
      max-height: 200px;
    }

    .preview-remove {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: none;
      background: rgba(0,0,0,0.6);
      color: #fff;
      font-size: 1.1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      transition: background 0.15s ease;
    }

    .preview-remove:hover {
      background: rgba(0,0,0,0.8);
    }

    .composer__toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--trellis-border-light);
      padding-top: 12px;
    }

    .composer__icons {
      display: flex;
      gap: 4px;
      position: relative;
    }

    .icon-btn {
      width: 34px;
      height: 34px;
      border: none;
      background: none;
      border-radius: 50%;
      color: var(--trellis-green);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      transition: all 0.15s ease;
    }

    .icon-btn:hover, .icon-btn.active {
      background: var(--trellis-green-pale);
    }
    
    .composer__actions {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .plant-tag-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        background: var(--trellis-green-ghost);
        color: var(--trellis-green-dark);
        font-size: 0.85rem;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 16px;
    }
    .plant-tag-badge button {
        background: none;
        border: none;
        color: var(--trellis-text-secondary);
        font-size: 1.1rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        display: flex;
        align-items: center;
    }
    .plant-tag-badge button:hover {
        color: #E53E3E;
    }

    .composer__post-btn {
      padding: 8px 24px;
      border: none;
      border-radius: 20px;
      background: var(--trellis-green);
      color: #fff;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .composer__post-btn:hover:not(:disabled) {
      background: var(--trellis-green-dark);
    }

    .composer__post-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    /* Plant Dropdown */
    .plant-select-wrap {
        position: relative;
    }
    
    .plant-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: 8px;
        background: var(--trellis-white);
        border: 1px solid var(--trellis-border-light);
        border-radius: var(--trellis-radius-md);
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        width: 220px;
        max-height: 260px;
        overflow-y: auto;
        z-index: 1001;
        padding: 4px 0;
    }
    
    .dropdown-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: transparent;
    }
    
    .plant-dropdown__header {
        padding: 8px 12px;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--trellis-text-hint);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .plant-option {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        cursor: pointer;
        transition: background 0.1s ease;
    }
    .plant-option:hover {
        background: var(--trellis-bg);
    }
    .plant-option.selected {
        background: var(--trellis-green-ghost);
        color: var(--trellis-green-dark);
        font-weight: 600;
    }
    
    .plant-thumb {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        object-fit: cover;
    }
    .plant-emoji {
        font-size: 1.2rem;
        width: 24px;
        text-align: center;
    }
    .plant-name {
        font-size: 0.9rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
  `]
})
export class PostComposerComponent implements OnInit {
  content = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  private plantService = inject(PlantService);
  private authService = inject(AuthService);

  myPlants = signal<PlantData[]>([]);
  showPlantDropdown = signal(false);
  selectedPlantId = signal<string | null>(null);
  selectedPlantNickname = signal<string | null>(null);

  @Output() postCreated = new EventEmitter<{ content: string; file?: File, plantId?: string }>();

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.plantService.getUserPlants(user.id).subscribe({
        next: (plants) => this.myPlants.set(plants)
      });
    }
  }

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      // Generate preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  togglePlantDropdown() {
    if (this.myPlants().length > 0) {
      this.showPlantDropdown.update(v => !v);
    }
  }

  selectPlant(plant: PlantData | null) {
    if (plant) {
      this.selectedPlantId.set(plant.id);
      this.selectedPlantNickname.set(plant.nickname);
    } else {
      this.selectedPlantId.set(null);
      this.selectedPlantNickname.set(null);
    }
    this.showPlantDropdown.set(false);
  }

  resolveUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return 'http://localhost:8080' + url;
  }

  submitPost() {
    if (this.content.trim()) {
      this.postCreated.emit({
        content: this.content,
        file: this.selectedFile || undefined,
        plantId: this.selectedPlantId() || undefined
      });
      // Reset
      this.content = '';
      this.selectedFile = null;
      this.previewUrl = null;
      this.selectedPlantId.set(null);
      this.selectedPlantNickname.set(null);
    }
  }
}
