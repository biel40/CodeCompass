import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-reset-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  /** Indica si la sesión de recuperación es válida para mostrar el formulario. */
  protected readonly sessionValid = signal(false);

  protected readonly resetForm = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  async ngOnInit(): Promise<void> {
    // Comprueba que existe una sesión activa (otorgada por el enlace de recovery).
    const { data } = await this.supabase.auth.getSession();
    if (data.session) {
      this.sessionValid.set(true);
    } else {
      this.errorMessage.set(
        'El enlace de recuperación no es válido o ha caducado. Solicita uno nuevo.',
      );
      setTimeout(() => this.router.navigate(['/auth/forgot-password']), 4000);
    }
  }

  /** Procesa el envío del formulario de restablecer contraseña. */
  protected async onSubmit(): Promise<void> {
    if (this.resetForm.invalid) return;

    const { password, confirmPassword } = this.resetForm.getRawValue();

    if (password !== confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const result = await this.authService.updatePassword(password);

    this.isLoading.set(false);

    if (result.success) {
      this.successMessage.set('¡Contraseña actualizada correctamente! Redirigiendo al login...');
      // Cerrar la sesión de recovery y redirigir al login
      setTimeout(async () => {
        await this.supabase.auth.signOut();
        this.router.navigate(['/auth/login']);
      }, 2500);
    } else {
      this.errorMessage.set(result.error ?? 'Error al actualizar la contraseña. Inténtalo de nuevo.');
    }
  }
}
