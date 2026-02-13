import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core';

@Component({
  selector: 'app-main-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
  host: {
    '(document:click)': 'onDocumentClick($event)'
  }
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);

  protected readonly userName = computed(() => this.authService.user()?.fullName ?? 'Usuario');
  protected readonly isDropdownOpen = signal(false);
  
  protected readonly userInitials = computed(() => {
    const name = this.authService.user()?.fullName ?? 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen.update(open => !open);
  }

  onDocumentClick(event: Event): void {
    this.isDropdownOpen.set(false);
  }

  onLogout(): void {
    this.isDropdownOpen.set(false);
    this.authService.signOut();
  }
}
