import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core';
import { RoadmapsService } from '../roadmaps/roadmaps.service';
import { StudentsService } from '../students/students.service';

interface DashboardStats {
  students: number;
  roadmaps: number;
  completed: number;
  overallProgress: number;
}

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly studentsService = inject(StudentsService);
  private readonly roadmapsService = inject(RoadmapsService);

  protected readonly isLoadingStats = signal(true);
  protected readonly stats = signal<DashboardStats>({
    students: 0,
    roadmaps: 0,
    completed: 0,
    overallProgress: 0,
  });

  protected readonly userName = computed(() => this.authService.user()?.fullName ?? 'Usuario');

  constructor() {
    void this.loadStats();
  }

  private async loadStats(): Promise<void> {
    this.isLoadingStats.set(true);

    const [students, roadmaps] = await Promise.all([
      this.studentsService.getStudents(),
      this.roadmapsService.getRoadmaps(),
    ]);

    let completed = 0;
    let overallProgress = 0;

    if (students.length > 0) {
      const progressByStudent = await Promise.all(students.map((student) => this.studentsService.getStudentProgress(student.id)));

      const allProgressRows = progressByStudent.flat();
      const totalProgressRows = allProgressRows.length;

      if (totalProgressRows > 0) {
        completed = allProgressRows.filter((progress) => progress.progressPercentage >= 100).length;

        const totalProgress = allProgressRows.reduce((sum, progress) => sum + progress.progressPercentage, 0);
        overallProgress = Math.round(totalProgress / totalProgressRows);
      }
    }

    this.stats.set({
      students: students.length,
      roadmaps: roadmaps.length,
      completed,
      overallProgress,
    });

    this.isLoadingStats.set(false);
  }
}
