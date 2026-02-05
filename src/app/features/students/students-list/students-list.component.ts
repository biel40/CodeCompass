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

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
