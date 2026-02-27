import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core';

/** Email del administrador autorizado */
const ADMIN_EMAIL = 'biel40aws@gmail.com';

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

  /** Indica si el usuario actual es administrador. */
  protected readonly isAdmin = computed(() => this.authService.user()?.email === ADMIN_EMAIL);

  /** Alterna la visibilidad del dropdown de usuario. */
  protected toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen.update(open => !open);
  }

  /** Cierra el dropdown al hacer clic fuera de él. */
  protected onDocumentClick(event: Event): void {
    this.isDropdownOpen.set(false);
  }

  /** Cierra sesión y redirige al login. */
  protected onLogout(): void {
    this.isDropdownOpen.set(false);
    this.authService.signOut();
  }
}
