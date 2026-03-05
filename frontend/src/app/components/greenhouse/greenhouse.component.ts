import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VirtualPlantService, VirtualPlant, VirtualPlantResponse } from '../../services/virtual-plant/virtual-plant.service';

export type PlantStage = 'SEED' | 'SPROUT' | 'SAPLING' | 'BLOOM' | 'ANCIENT';
const ALL_STAGES: PlantStage[] = ['SEED', 'SPROUT', 'SAPLING', 'BLOOM', 'ANCIENT'];
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-greenhouse',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './greenhouse.component.html',
  styleUrl: './greenhouse.component.scss'
})
export class GreenhouseComponent implements OnInit {
  isLoading: boolean = true;
  availableSeeds: string[] = ['Monstera', 'Cactus', 'Sunflower', 'Bonsai'];
  
  showInfo: boolean = false;

  plantSlots: (VirtualPlant | null)[] = [null, null, null, null];
  selectedSlotIndex: number | null = null;

  plant: VirtualPlant | null = null;
  cockroaches: { id: number, spriteNum: number, delay: string, left: number, top: number }[] = [];
  
  phantomMessage: string = "The Hall of Guardians! Which of our latent warriors shall we commune with today, Commander?";

  constructor(private virtualPlantService: VirtualPlantService, private authService: AuthService) {}

  ngOnInit() {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return;
    this.virtualPlantService.getMyPlants(userId).subscribe({
      next: (plants) => {
        plants.forEach((p, i) => {
          if (i < 4) this.plantSlots[i] = p;
        });
        setTimeout(() => this.isLoading = false, 1500);
      },
      error: () => {
        setTimeout(() => this.isLoading = false, 1500);
      }
    });
  }

  selectSlot(index: number) {
    this.selectedSlotIndex = index;
    const selectedPlant = this.plantSlots[index];

    if (selectedPlant) {
      this.plant = selectedPlant;
      this.updateInfestation();
      if (this.plant.cleanliness < 60) {
        this.phantomMessage = "The corruption has sent its primitive scavengers! CLEANSE THE ARENA, GUARDIAN!";
      } else {
        this.phantomMessage = "The dormant vessel awaits! We must nurture this latent power!";
      }
    } else {
      this.plant = null;
      this.cockroaches = [];
      this.phantomMessage = "Behold, Guardian! The arena of life has expanded! The cosmic soil of the Greenhouse is ready for your first vessel!";
    }
  }

  goBackToSlots() {
    this.selectedSlotIndex = null;
    this.plant = null;
    this.cockroaches = [];
    this.phantomMessage = "The Hall of Guardians! Which of our latent warriors shall we commune with today, Commander?";
  }

  toggleInfo() {
    this.showInfo = !this.showInfo;
    if (this.showInfo) {
      this.phantomMessage = "Reviewing the cosmic laws of growth, Guardian? Knowledge is the ultimate weapon!";
    } else {
      if (this.plant) {
        if (this.plant.daysAlive > 7) {
            this.phantomMessage = "A week of survival in the void?! Your bond with this vessel is becoming legendary, Guardian!";
        } else {
            this.phantomMessage = "The dormant vessel awaits! We must nurture this latent power!";
        }
      } else if (this.selectedSlotIndex === null) {
        this.phantomMessage = "The Hall of Guardians! Which of our latent warriors shall we commune with today, Commander?";
      } else {
        this.phantomMessage = "Behold, Guardian! The arena of life has expanded! The cosmic soil of the Greenhouse is ready for your first vessel!";
      }
    }
  }

  showDeleteModal: boolean = false;
  plantToDeleteIndex: number | null = null;
  plantToDelete: VirtualPlant | null = null;

  openDeleteConfirmation(index: number, event: Event) {
    event.stopPropagation(); // prevent selectSlot
    this.plantToDeleteIndex = index;
    this.plantToDelete = this.plantSlots[index];
    this.showDeleteModal = true;
    this.phantomMessage = "Guardian... are you certain? To sever this bond is to consign this spirit to the eternal silence. Choose with conviction!";
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.plantToDeleteIndex = null;
    this.plantToDelete = null;
    this.phantomMessage = "The Hall of Guardians! Which of our latent warriors shall we commune with today, Commander?";
  }

  confirmDelete() {
    if (this.plantToDelete && this.plantToDeleteIndex !== null) {
      this.isLoading = true;
      this.virtualPlantService.deletePlant(this.plantToDelete.id).subscribe({
        next: () => {
          this.plantSlots[this.plantToDeleteIndex!] = null;
          this.showDeleteModal = false;
          this.plantToDeleteIndex = null;
          this.plantToDelete = null;
          this.phantomMessage = "The vessel has been released into the void. The slot is empty once more.";
          setTimeout(() => this.isLoading = false, 500);
        },
        error: (err) => {
          console.error("Failed to release vessel:", err);
          setTimeout(() => this.isLoading = false, 500);
        }
      });
    }
  }

  selectSeed(species: string) {
    this.isLoading = true;
    const userId = this.authService.currentUser()?.id;
    if (!userId) return;
    this.virtualPlantService.plantSeed(userId, species).subscribe({
      next: (response) => {
        this.plant = response.plant;
        if (this.selectedSlotIndex !== null) {
          this.plantSlots[this.selectedSlotIndex] = this.plant;
        }
        this.updateInfestation();
        this.phantomMessage = response.message;
        setTimeout(() => this.isLoading = false, 1500);
      },
      error: (err) => {
        console.error("Failed to plant seed:", err);
        setTimeout(() => this.isLoading = false, 1500);
      }
    });
  }

  water() {
    if (!this.plant) return;
    this.virtualPlantService.waterPlant(this.plant.id).subscribe({
      next: (response) => {
        this.plant = response.plant;
        if (this.selectedSlotIndex !== null) this.plantSlots[this.selectedSlotIndex] = this.plant;
        this.updateInfestation();
        this.phantomMessage = response.message;
        if (this.plant.cleanliness < 60) {
          this.phantomMessage = "The corruption has sent its primitive scavengers! CLEANSE THE ARENA, GUARDIAN!";
        }
      },
      error: (err) => console.error(err)
    });
  }

  clean() {
    if (!this.plant) return;
    this.virtualPlantService.cleanPlant(this.plant.id).subscribe({
      next: (response) => {
        this.plant = response.plant;
        if (this.selectedSlotIndex !== null) this.plantSlots[this.selectedSlotIndex] = this.plant;
        this.updateInfestation();
        this.phantomMessage = response.message;
      },
      error: (err) => console.error(err)
    });
  }

  getSpriteUrl(species: string, stage: string, isDead: boolean = false): string {
    if (isDead) {
      return environment.gamificationBaseUrl + '/sprites/tombstone.png';
    }
    return environment.gamificationBaseUrl + '/sprites/' + species.toLowerCase() + '_' + stage.toLowerCase() + '.png';
  }

  getCockroachSpriteUrl(spriteNum: number): string {
    return environment.gamificationBaseUrl + '/sprites/cockroach_' + spriteNum + '.png';
  }

  cycleEvolution() {
    if (this.plant) {
      const currentIndex = ALL_STAGES.indexOf(this.plant.stage as PlantStage);
      const nextIndex = (currentIndex + 1) % ALL_STAGES.length;
      this.plant.stage = ALL_STAGES[nextIndex];
    }
  }

  updateInfestation() {
    if (!this.plant) {
      this.cockroaches = [];
      return;
    }
    const count = this.calculateInfestationCount(this.plant.cleanliness);
    if (this.cockroaches.length !== count) {
      this.cockroaches = Array(count).fill(0).map((_, i) => ({
        id: i,
        spriteNum: Math.floor(Math.random() * 4) + 1,
        delay: (Math.random() * 5).toFixed(2),
        left: Math.floor(Math.random() * 80), // 0% to 80% to allow scuttling room
        top: Math.floor(Math.random() * 80) + 10 // 10% to 90%
      }));
    }
  }

  calculateInfestationCount(cleanliness: number): number {
    if (cleanliness >= 90) return 0;
    if (cleanliness >= 60) return 2;
    if (cleanliness >= 30) return 5;
    if (cleanliness > 0) return 10;
    return 15;
  }
}
