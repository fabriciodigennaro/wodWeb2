import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { SettingsService } from '@core/services/settings.service';

@Component({
  selector: 'app-settings-modal',
  styleUrl: './settings-modal.css',
  templateUrl: './settings-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsModalComponent {
  readonly settings = inject(SettingsService);

  readonly isOpen = input.required<boolean>();
  readonly closed = output<void>();

  readonly volumePercent = computed(() => Math.round(this.settings.volume() * 100));

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }

  onVolumeChange(event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.settings.setVolume(value / 100);
  }

  async onClearRecents(): Promise<void> {
    if (confirm('¿Eliminar todos los WODs recientes?')) {
      await this.settings.clearRecents();
      this.closed.emit();
    }
  }

  onClose(): void {
    this.closed.emit();
  }
}