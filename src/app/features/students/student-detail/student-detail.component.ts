import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Student } from '../../../models';
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

  protected readonly student = signal<Student | null>(null);
  protected readonly isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      const student = await this.studentsService.getStudentById(id);
      this.student.set(student);
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
