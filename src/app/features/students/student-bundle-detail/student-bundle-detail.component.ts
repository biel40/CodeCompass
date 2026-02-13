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

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatShortDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Activo',
      completed: 'Completado',
      expired: 'Expirado',
      cancelled: 'Cancelado',
    };
    return labels[status] ?? status;
  }

  async onAddSession(): Promise<void> {
    const bundle = this.bundle();
    if (!bundle || !this.studentId) return;

    if (bundle.classesUsed >= bundle.totalClasses) {
      alert('Este bono ya ha sido completado. No se pueden añadir más clases.');
      return;
    }

    this.isAddingSession.set(true);

    const result = await this.bundlesService.createClassSession({
      studentId: this.studentId,
      studentBundleId: bundle.id,
      sessionDate: new Date(),
      durationMinutes: 60,
    });

    if (result.success) {
      await this.loadData();
    }

    this.isAddingSession.set(false);
  }

  async onDeleteSession(sessionId: string): Promise<void> {
    if (!confirm('¿Eliminar esta sesión?')) return;

    const result = await this.bundlesService.deleteClassSession(sessionId);

    if (result.success) {
      await this.loadData();
    }
  }

  async onMarkAsPaid(): Promise<void> {
    const bundle = this.bundle();
    if (!bundle) return;

    const result = await this.bundlesService.markBundleAsPaid(bundle.id);

    if (result.success) {
      await this.loadData();
    }
  }

  async onDelete(): Promise<void> {
    const bundle = this.bundle();
    if (!bundle) return;

    if (!confirm(`¿Eliminar el bono "${bundle.name}"? Esta acción no se puede deshacer.`)) return;

    const result = await this.bundlesService.deleteStudentBundle(bundle.id);

    if (result.success) {
      this.router.navigate(['/students', this.studentId]);
    }
  }
}
