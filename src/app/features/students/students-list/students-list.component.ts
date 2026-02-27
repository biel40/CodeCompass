import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Student } from '../../../models';
import { StudentsService } from '../students.service';

@Component({
  selector: 'app-students-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './students-list.component.html',
  styleUrl: './students-list.component.css',
})
export class StudentsListComponent implements OnInit {
  private readonly studentsService = inject(StudentsService);

  protected readonly students = signal<Student[]>([]);
  protected readonly isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    await this.loadStudents();
  }

  private async loadStudents(): Promise<void> {
    this.isLoading.set(true);
    const result = await this.studentsService.getStudents();
    this.students.set(result);
    this.isLoading.set(false);
  }

  /** Traduce el nivel del estudiante al español. */
  protected traducirNivel(level: string): string {
    const traducciones: Record<string, string> = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
    };
    return traducciones[level] ?? level;
  }

  /** Extrae las iniciales del nombre del estudiante (máx. 2 caracteres). */
  protected getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
