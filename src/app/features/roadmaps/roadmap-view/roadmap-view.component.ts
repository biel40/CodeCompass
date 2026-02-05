import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Roadmap } from '../../../models';
import { RoadmapsService } from '../roadmaps.service';

@Component({
  selector: 'app-roadmap-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './roadmap-view.component.html',
  styleUrl: './roadmap-view.component.css',
})
export class RoadmapViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly roadmapsService = inject(RoadmapsService);

  protected readonly roadmap = signal<Roadmap | null>(null);
  protected readonly isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      const roadmap = await this.roadmapsService.getRoadmapById(id);
      this.roadmap.set(roadmap);
    }

    this.isLoading.set(false);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  async onDelete(): Promise<void> {
    const roadmap = this.roadmap();
    if (!roadmap) return;

    if (confirm(`¿Estás seguro de eliminar "${roadmap.title}"?`)) {
      const result = await this.roadmapsService.deleteRoadmap(roadmap.id);

      if (result.success) {
        this.router.navigate(['/roadmaps']);
      }
    }
  }
}
