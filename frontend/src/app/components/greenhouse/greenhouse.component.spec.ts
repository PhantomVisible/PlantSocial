import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { GreenhouseComponent, PlantStage } from './greenhouse.component';
import { VirtualPlantService, VirtualPlant } from '../../services/virtual-plant/virtual-plant.service';
import { AuthService } from '../../auth/auth.service';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

describe('GreenhouseComponent', () => {
  let component: GreenhouseComponent;
  let fixture: ComponentFixture<GreenhouseComponent>;
  let mockVirtualPlantService: jasmine.SpyObj<VirtualPlantService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    // Create spies for the services
    mockVirtualPlantService = jasmine.createSpyObj('VirtualPlantService', ['getMyPlants', 'plantSeed', 'waterPlant', 'cleanPlant', 'deletePlant']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['currentUser']);

    // Setup basic mock returns to avoid errors during ngOnInit
    mockAuthService.currentUser.and.returnValue({
      id: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      fullName: 'Test User'
    });
    mockVirtualPlantService.getMyPlants.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [GreenhouseComponent],
      providers: [
        { provide: VirtualPlantService, useValue: mockVirtualPlantService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GreenhouseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Test Case 1: Sprite URL Generation', () => {
    it('should generate correct sprite URL based on species and stage', () => {
      // Act
      const url = component.getSpriteUrl('Monstera', 'ANCIENT', false);
      
      // Assert
      expect(url).toBe(environment.gamificationBaseUrl + '/sprites/monstera_ancient.png');
    });
  });

  describe('Test Case 2: The Tombstone State', () => {
    it('should display tombstone sprite when plant is dead', () => {
      // Act
      const url = component.getSpriteUrl('Monstera', 'ANCIENT', true);
      
      // Assert
      expect(url).toBe(environment.gamificationBaseUrl + '/sprites/tombstone.png');
    });
  });

  describe('Test Case 3: Stage Cycling', () => {
    it('should correctly cycle to the next evolution stage', () => {
      // Arrange
      component.plant = {
        id: 1,
        userId: 'user-1',
        name: 'Testy',
        species: 'Sunflower',
        hydration: 50,
        cleanliness: 50,
        stage: 'SEED',
        lastWatered: '2026-03-02',
        lastCleaned: '2026-03-02',
        createdAt: '2026-03-01',
        updatedAt: '2026-03-01',
        daysAlive: 1
      };

      // Act & Assert cycle 1
      component.cycleEvolution();
      expect(component.plant.stage).toBe('SPROUT');

      // Act & Assert cycle 2
      component.cycleEvolution();
      expect(component.plant.stage).toBe('SAPLING');

      // Act & Assert cycle 3
      component.cycleEvolution();
      expect(component.plant.stage).toBe('BLOOM');

      // Act & Assert cycle 4
      component.cycleEvolution();
      expect(component.plant.stage).toBe('ANCIENT');

      // Act & Assert wrapping behavior
      component.cycleEvolution();
      expect(component.plant.stage).toBe('SEED');
    });
  });
});
