import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClassSession, Student, StudentBundle } from '../../../models';
import { BundlesService } from '../bundles.service';
import { StudentsService } from '../students.service';

@Component({
  selector: 'app-student-bundle-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule],
  templateUrl: './student-bundle-detail.component.html',
  styleUrl: './student-bundle-detail.component.css',
})
export class StudentBundleDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bundlesService = inject(BundlesService);
  private readonly studentsService = inject(StudentsService);

  protected readonly bundle = signal<StudentBundle | null>(null);
  protected readonly student = signal<Student | null>(null);
  protected readonly sessions = signal<ClassSession[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly isAddingSession = signal(false);
  protected readonly isEditingProgress = signal(false);
  protected readonly isSavingProgress = signal(false);
  protected readonly editedClassesUsed = signal(0);
  protected readonly editingSessionId = signal<string | null>(null);
  protected readonly editedSessionTopic = signal('');
  protected readonly isSavingSession = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly progressPercentage = computed(() => {
    const currentBundle = this.bundle();
    if (!currentBundle) {
      return 0;
    }

    return Math.round((currentBundle.classesUsed / currentBundle.totalClasses) * 100);
  });

  protected readonly remainingClasses = computed(() => {
    const currentBundle = this.bundle();
    if (!currentBundle) return 0;
    return currentBundle.totalClasses - currentBundle.classesUsed;
  });

  private studentId: string | null = null;
  private bundleId: string | null = null;

  async ngOnInit(): Promise<void> {
    this.studentId = this.route.snapshot.paramMap.get('studentId');
    this.bundleId = this.route.snapshot.paramMap.get('bundleId');

    if (!this.studentId || !this.bundleId) {
      this.router.navigate(['/students']);
      return;
    }

    await this.loadData();
  }

  private async loadData(): Promise<void> {
    this.isLoading.set(true);

    const [student, bundle, sessions] = await Promise.all([
      this.studentsService.getStudentById(this.studentId!),
      this.bundlesService.getStudentBundleById(this.bundleId!),
      this.bundlesService.getSessionsByBundle(this.bundleId!),
    ]);

    this.student.set(student);
    this.bundle.set(bundle);
    this.sessions.set(sessions);
    this.isLoading.set(false);
  }

  /** Formatea una fecha en formato largo en español. */
  protected formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /** Formatea una fecha en formato corto (ej: "15 ene"). */
  protected formatShortDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    });
  }

  /** Traduce el estado del bono al español. */
  protected getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Activo',
      completed: 'Completado',
      expired: 'Expirado',
      cancelled: 'Cancelado',
    };
    return labels[status] ?? status;
  }

  /** Añade una nueva sesión de clase al bono actual. */
  protected async onAddSession(): Promise<void> {
    // Prevenir double-click: salir inmediatamente si ya hay operación en curso
    if (this.isAddingSession()) return;

    const bundle = this.bundle();
    if (!bundle || !this.studentId) return;

    if (bundle.classesUsed >= bundle.totalClasses) {
      this.errorMessage.set('Este bono ya ha sido completado. No se pueden añadir más clases.');
      return;
    }

    this.isAddingSession.set(true);
    this.errorMessage.set(null);

    try {
      const result = await this.bundlesService.createClassSession({
        studentId: this.studentId,
        studentBundleId: bundle.id,
        sessionDate: new Date(),
        durationMinutes: 60,
      });

      if (result.success) {
        await this.loadData();
      } else {
        this.errorMessage.set(result.error ?? 'Error al registrar la clase');
      }
    } catch {
      this.errorMessage.set('Error inesperado al registrar la clase');
    } finally {
      this.isAddingSession.set(false);
    }
  }

  /** Elimina una sesión de clase previa confirmación. */
  protected async onDeleteSession(session: ClassSession): Promise<void> {
    if (!confirm('¿Eliminar esta sesión?')) {
      return;
    }

    this.errorMessage.set(null);

    try {
      const result = await this.bundlesService.deleteClassSession(session.id, session.studentBundleId);

      if (result.success) {
        await this.loadData();
      } else {
        this.errorMessage.set(result.error ?? 'Error al eliminar la sesión');
      }
    } catch {
      this.errorMessage.set('Error inesperado al eliminar la sesión');
    }
  }

  /** Inicia la edición del tema de una sesión. */
  protected onEditSessionTopic(session: ClassSession): void {
    this.editingSessionId.set(session.id);
    this.editedSessionTopic.set(session.topic ?? '');
    this.errorMessage.set(null);
  }

  /** Cancela la edición del tema. */
  protected onCancelSessionEdit(): void {
    this.editingSessionId.set(null);
    this.editedSessionTopic.set('');
  }

  /** Guarda el tema editado de una sesión. */
  protected async onSaveSessionTopic(): Promise<void> {
    const sessionId = this.editingSessionId();
    if (!sessionId) return;

    this.isSavingSession.set(true);
    this.errorMessage.set(null);

    try {
      const result = await this.bundlesService.updateClassSession(sessionId, {
        topic: this.editedSessionTopic().trim() || undefined,
      });

      if (result.success) {
        this.editingSessionId.set(null);
        this.editedSessionTopic.set('');
        await this.loadData();
      } else {
        this.errorMessage.set(result.error ?? 'Error al actualizar el tema');
      }
    } catch {
      this.errorMessage.set('Error inesperado al actualizar el tema');
    } finally {
      this.isSavingSession.set(false);
    }
  }

  /** Verifica si una sesión está en modo edición. */
  protected isEditingSession(sessionId: string): boolean {
    return this.editingSessionId() === sessionId;
  }

  /** Activa el modo de edición de progreso. */
  protected onEditProgress(): void {
    const bundle = this.bundle();
    if (!bundle) return;

    this.editedClassesUsed.set(bundle.classesUsed);
    this.isEditingProgress.set(true);
    this.errorMessage.set(null);
  }

  /** Cancela la edición de progreso. */
  protected onCancelEditProgress(): void {
    this.isEditingProgress.set(false);
    this.errorMessage.set(null);
  }

  /** Guarda el nuevo valor de progreso. */
  protected async onSaveProgress(): Promise<void> {
    const bundle = this.bundle();
    if (!bundle) return;

    const newValue = this.editedClassesUsed();
    if (newValue === bundle.classesUsed) {
      this.isEditingProgress.set(false);
      return;
    }

    this.isSavingProgress.set(true);
    this.errorMessage.set(null);

    try {
      const result = await this.bundlesService.setClassesUsed(bundle.id, newValue);

      if (result.success) {
        this.isEditingProgress.set(false);
        await this.loadData();
      } else {
        this.errorMessage.set(result.error ?? 'Error al actualizar el progreso');
      }
    } catch {
      this.errorMessage.set('Error inesperado al actualizar el progreso');
    } finally {
      this.isSavingProgress.set(false);
    }
  }

  /** Actualiza el valor editado de clases usadas. */
  protected onEditedClassesChange(value: number): void {
    const bundle = this.bundle();
    if (!bundle) return;

    // Asegurar que el valor esté dentro del rango válido
    const clampedValue = Math.max(0, Math.min(value, bundle.totalClasses));
    this.editedClassesUsed.set(clampedValue);
  }

  /**
   * Marca el bono como pagado, estableciendo la fecha de pago actual. Si el bono ya está marcado como pagado, no hace nada.
   * @returns void
   */
  protected async onMarkAsPaid(): Promise<void> {
    const bundle = this.bundle();
    if (!bundle) {
      return;
    }

    const result = await this.bundlesService.markBundleAsPaid(bundle.id);

    if (result.success) {
      await this.loadData();
    }
  }

  /** Elimina el bono previa confirmación. */
  protected async onDelete(): Promise<void> {
    const bundle = this.bundle();
    if (!bundle) {
      return;
    }

    if (!confirm('¿Eliminar este bono?')) {
      return;
    }

    const result = await this.bundlesService.deleteStudentBundle(bundle.id);

    if (result.success) {
      this.router.navigate(['/students', this.studentId]);
    }
  }
}
