import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClassSession, Student, StudentBundle } from '../../../models';
import { BundlesService } from '../bundles.service';
import { StudentsService } from '../students.service';

@Component({
  selector: 'app-student-bundle-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
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
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly progressPercentage = computed(() => {
    const b = this.bundle();
    if (!b) return 0;
    return Math.round((b.classesUsed / b.totalClasses) * 100);
  });

  protected readonly remainingClasses = computed(() => {
    const b = this.bundle();
    if (!b) return 0;
    return b.totalClasses - b.classesUsed;
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
