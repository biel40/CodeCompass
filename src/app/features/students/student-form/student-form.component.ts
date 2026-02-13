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
  protected readonly avatarPreview = signal<string | null>(null);
  protected readonly currentAvatarUrl = signal<string | null>(null);

  protected readonly studentForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required]],
    email: ['', [Validators.email]],
    level: ['beginner' as StudentLevel],
    notes: [''],
  });

  private studentId: string | null = null;
  private selectedFile: File | null = null;

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

      if (student.avatarUrl) {
        this.currentAvatarUrl.set(student.avatarUrl);
        this.avatarPreview.set(student.avatarUrl);
      }
    }
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      this.errorMessage.set('Por favor, selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage.set('La imagen no puede superar los 2MB');
      return;
    }

    this.selectedFile = file;
    this.errorMessage.set(null);

    // Crear preview
    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeAvatar(): void {
    this.selectedFile = null;
    this.avatarPreview.set(null);
  }

  async onSubmit(): Promise<void> {
    if (this.studentForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formData = this.studentForm.getRawValue();

    let result;

    if (this.isEditMode()) {
      result = await this.studentsService.updateStudent(this.studentId!, formData);

      // Subir avatar si hay uno nuevo
      if (result.success && this.selectedFile) {
        const uploadResult = await this.studentsService.uploadAvatar(this.studentId!, this.selectedFile);
        if (!uploadResult.success) {
          this.errorMessage.set(uploadResult.error ?? 'Error al subir la imagen');
          this.isLoading.set(false);
          return;
        }
      }

      // Eliminar avatar si se quitó
      if (result.success && this.currentAvatarUrl() && !this.avatarPreview()) {
        await this.studentsService.deleteAvatar(this.studentId!);
      }
    } else {
      result = await this.studentsService.createStudent(formData);

      // Subir avatar para el nuevo estudiante
      if (result.success && this.selectedFile && result.data) {
        const uploadResult = await this.studentsService.uploadAvatar(result.data.id, this.selectedFile);
        if (!uploadResult.success) {
          this.errorMessage.set(uploadResult.error ?? 'Error al subir la imagen');
          this.isLoading.set(false);
          return;
        }
      }
    }

    this.isLoading.set(false);

    if (result.success) {
      this.router.navigate(['/students']);
    } else {
      this.errorMessage.set(result.error ?? 'Error al guardar');
    }
  }
}
