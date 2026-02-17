import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Bundle, Student } from '../../../models';
import { BundlesService } from '../bundles.service';
import { StudentsService } from '../students.service';

@Component({
  selector: 'app-student-bundle-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './student-bundle-form.component.html',
  styleUrl: './student-bundle-form.component.css',
})
export class StudentBundleFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly bundlesService = inject(BundlesService);
  private readonly studentsService = inject(StudentsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isEditMode = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly student = signal<Student | null>(null);
  protected readonly bundleTemplates = signal<Bundle[]>([]);

  protected readonly bundleForm = this.fb.nonNullable.group({
    bundleId: [''],
    name: ['', [Validators.required]],
    totalClasses: [5, [Validators.required, Validators.min(1)]],
    totalPrice: [50, [Validators.required, Validators.min(0)]],
    isPaid: [false],
    paymentDate: [''],
    notes: [''],
    expiresAt: [''],
  });

  protected readonly pricePerClass = computed(() => {
    const total = this.bundleForm.controls.totalPrice.value;
    const classes = this.bundleForm.controls.totalClasses.value;
    return classes > 0 ? (total / classes).toFixed(2) : '0.00';
  });

  private studentId: string | null = null;
  private bundleId: string | null = null;

  async ngOnInit(): Promise<void> {
    this.studentId = this.route.snapshot.paramMap.get('studentId');
    this.bundleId = this.route.snapshot.paramMap.get('bundleId');

    if (!this.studentId) {
      this.router.navigate(['/students']);
      return;
    }

    // Cargar datos en paralelo
    const [student, templates] = await Promise.all([
      this.studentsService.getStudentById(this.studentId),
      this.bundlesService.getBundles(),
    ]);

    this.student.set(student);
    this.bundleTemplates.set(templates.filter((t) => t.isActive));

    if (this.bundleId) {
      this.isEditMode.set(true);
      await this.loadBundle();
    }
  }

  private async loadBundle(): Promise<void> {
    if (!this.bundleId) return;

    const bundle = await this.bundlesService.getStudentBundleById(this.bundleId);

    if (bundle) {
      this.bundleForm.patchValue({
        bundleId: bundle.bundleId ?? '',
        name: bundle.name,
        totalClasses: bundle.totalClasses,
        totalPrice: bundle.totalPrice,
        isPaid: bundle.isPaid,
        paymentDate: bundle.paymentDate ? this.formatDateForInput(bundle.paymentDate) : '',
        notes: bundle.notes ?? '',
        expiresAt: bundle.expiresAt ? this.formatDateForInput(bundle.expiresAt) : '',
      });
    }
  }

  /** Rellena el formulario al seleccionar una plantilla de bono. */
  protected onTemplateChange(): void {
    const templateId = this.bundleForm.controls.bundleId.value;
    if (!templateId) return;

    const template = this.bundleTemplates().find((t) => t.id === templateId);
    if (template) {
      this.bundleForm.patchValue({
        name: template.name,
        totalClasses: template.totalClasses,
        totalPrice: template.defaultPrice,
      });
    }
  }

  /** Procesa el envío del formulario de bono. */
  protected async onSubmit(): Promise<void> {
    if (this.bundleForm.invalid || !this.studentId) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formData = this.bundleForm.getRawValue();

    const bundleData = {
      studentId: this.studentId,
      bundleId: formData.bundleId || undefined,
      name: formData.name,
      totalClasses: formData.totalClasses,
      totalPrice: formData.totalPrice,
      isPaid: formData.isPaid,
      paymentDate: formData.paymentDate ? new Date(formData.paymentDate) : undefined,
      notes: formData.notes || undefined,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined,
    };

    const result = this.isEditMode()
      ? await this.bundlesService.updateStudentBundle(this.bundleId!, bundleData)
      : await this.bundlesService.createStudentBundle(bundleData);

    this.isLoading.set(false);

    if (result.success) {
      this.router.navigate(['/students', this.studentId]);
    } else {
      this.errorMessage.set(result.error ?? 'Error al guardar el bono');
    }
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
