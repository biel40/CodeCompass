import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Roadmap } from '../../../models';
import { RoadmapsService } from '../roadmaps.service';

@Component({
  selector: 'app-roadmaps-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './roadmaps-list.component.html',
  styleUrl: './roadmaps-list.component.css',
})
export class RoadmapsListComponent implements OnInit {
  private readonly roadmapsService = inject(RoadmapsService);

  protected readonly roadmaps = signal<Roadmap[]>([]);
  protected readonly isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    await this.loadRoadmaps();
  }

  private async loadRoadmaps(): Promise<void> {
    this.isLoading.set(true);
    const result = await this.roadmapsService.getRoadmaps();
    this.roadmaps.set(result);
    this.isLoading.set(false);
  }
}
