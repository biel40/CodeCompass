import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DifficultyLevel, RoadmapCategory, RoadmapConnection, RoadmapNode } from '../../../models';
import { NodeEditorCanvasComponent } from '../node-editor-canvas/node-editor-canvas.component';
import { RoadmapsService } from '../roadmaps.service';

@Component({
  selector: 'app-roadmap-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, NodeEditorCanvasComponent],
  templateUrl: './roadmap-editor.component.html',
  styleUrl: './roadmap-editor.component.css',
})
export class RoadmapEditorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly roadmapsService = inject(RoadmapsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isEditMode = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  /** Nodos del roadmap */
  protected readonly nodes = signal<RoadmapNode[]>([]);

  /** Conexiones entre nodos */
  protected readonly connections = signal<RoadmapConnection[]>([]);

  protected readonly roadmapForm = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    category: ['frontend' as RoadmapCategory],
    difficulty: ['beginner' as DifficultyLevel],
    estimatedHours: [10],
    tags: [''],
    isPublic: [false],
  });

  private roadmapId: string | null = null;

  async ngOnInit(): Promise<void> {
    this.roadmapId = this.route.snapshot.paramMap.get('id');

    if (this.roadmapId) {
      this.isEditMode.set(true);
      await this.loadRoadmap();
    }
  }

  private async loadRoadmap(): Promise<void> {
    if (!this.roadmapId) return;

    const roadmap = await this.roadmapsService.getRoadmapById(this.roadmapId);

    if (roadmap) {
      this.roadmapForm.patchValue({
        title: roadmap.title,
        description: roadmap.description,
        category: roadmap.category,
        difficulty: roadmap.difficulty,
        estimatedHours: roadmap.estimatedHours,
        tags: roadmap.tags.join(', '),
        isPublic: roadmap.isPublic,
      });

      // Cargar nodos y conexiones
      this.nodes.set(roadmap.nodes ?? []);
      this.connections.set(roadmap.connections ?? []);
    }
  }

  /** Actualiza los nodos desde el editor visual. */
  protected onNodesChange(nodes: RoadmapNode[]): void {
    this.nodes.set(nodes);
  }

  /** Actualiza las conexiones desde el editor visual. */
  protected onConnectionsChange(connections: RoadmapConnection[]): void {
    this.connections.set(connections);
  }

  /** Procesa el envío del formulario de roadmap. */
  protected async onSubmit(): Promise<void> {
    if (this.roadmapForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formData = this.roadmapForm.getRawValue();
    const tags = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);

    const roadmapData = {
      ...formData,
      tags,
      nodes: this.nodes(),
      connections: this.connections(),
    };

    const result = this.isEditMode()
      ? await this.roadmapsService.updateRoadmap(this.roadmapId!, roadmapData)
      : await this.roadmapsService.createRoadmap(roadmapData);

    this.isLoading.set(false);

    if (result.success) {
      this.router.navigate(['/roadmaps']);
    } else {
      this.errorMessage.set(result.error ?? 'Error al guardar');
    }
  }
}
