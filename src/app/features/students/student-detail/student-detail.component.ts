import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Student, StudentBundle, StudentEarnings } from '../../../models';
import { BundlesService } from '../bundles.service';
import { StudentsService } from '../students.service';

@Component({
  selector: 'app-student-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './student-detail.component.html',
  styleUrl: './student-detail.component.css',
})
export class StudentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studentsService = inject(StudentsService);
  private readonly bundlesService = inject(BundlesService);

  protected readonly student = signal<Student | null>(null);
  protected readonly bundles = signal<StudentBundle[]>([]);
  protected readonly earnings = signal<StudentEarnings | null>(null);
  protected readonly isLoading = signal(true);

  protected readonly activeBundles = computed(() => this.bundles().filter((b) => b.status === 'active'));

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      const [student, bundles, earnings] = await Promise.all([
        this.studentsService.getStudentById(id),
        this.bundlesService.getStudentBundles(id),
        this.bundlesService.getStudentEarnings(id),
      ]);
      this.student.set(student);
      this.bundles.set(bundles);
      this.earnings.set(earnings);
    }

    this.isLoading.set(false);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getBundleProgress(bundle: StudentBundle): number {
    return Math.round((bundle.classesUsed / bundle.totalClasses) * 100);
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

  async onDelete(): Promise<void> {
    const student = this.student();
    if (!student) return;

    if (confirm(`¿Estás seguro de eliminar a ${student.fullName}?`)) {
      const result = await this.studentsService.deleteStudent(student.id);

      if (result.success) {
        this.router.navigate(['/students']);
      }
    }
  }
}
