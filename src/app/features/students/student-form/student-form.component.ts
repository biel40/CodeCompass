import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StudentLevel } from '../../../models';
import { StudentsService } from '../students.service';

@Component({
  selector: 'app-student-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './student-form.component.html',
  styleUrl: './student-form.component.css',
})
export class StudentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly studentsService = inject(StudentsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isEditMode = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly studentForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    level: ['beginner' as StudentLevel],
    notes: [''],
  });

  private studentId: string | null = null;

  async ngOnInit(): Promise<void> {
    this.studentId = this.route.snapshot.paramMap.get('id');

    if (this.studentId) {
      this.isEditMode.set(true);
      await this.loadStudent();
    }
  }

  private async loadStudent(): Promise<void> {
    if (!this.studentId) return;

    const student = await this.studentsService.getStudentById(this.studentId);

    if (student) {
      this.studentForm.patchValue({
        fullName: student.fullName,
        email: student.email,
        level: student.level,
        notes: student.notes ?? '',
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.studentForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formData = this.studentForm.getRawValue();

    const result = this.isEditMode()
      ? await this.studentsService.updateStudent(this.studentId!, formData)
      : await this.studentsService.createStudent(formData);

    this.isLoading.set(false);

    if (result.success) {
      this.router.navigate(['/students']);
    } else {
      this.errorMessage.set(result.error ?? 'Error al guardar');
    }
  }
}
