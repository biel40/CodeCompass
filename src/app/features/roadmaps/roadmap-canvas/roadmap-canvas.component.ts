import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Roadmap, RoadmapConnection, RoadmapNode } from '../../../models';

/** Posición del viewport (canvas visible) */
interface ViewportPosition {
  x: number;
  y: number;
}

/** Estado de arrastre del canvas */
interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startViewportX: number;
  startViewportY: number;
}

/**
 * Componente de visualización interactiva de roadmaps estilo pizarra.
 *
 * Permite visualizar nodos y conexiones con funcionalidades de:
 * - Zoom (rueda del ratón o botones)
 * - Pan (arrastrar el canvas)
 * - Selección de nodos para ver detalles
 * ```
 */
@Component({
  selector: 'app-roadmap-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './roadmap-canvas.component.html',
  styleUrl: './roadmap-canvas.component.css',
})
export class RoadmapCanvasComponent {
  /** Roadmap a visualizar */
  readonly roadmap = input.required<Roadmap>();

  /** Evento emitido cuando se selecciona un nodo */
  readonly nodeSelected = output<RoadmapNode | null>();

  /** Referencia al contenedor del canvas */
  private readonly canvasContainer = viewChild<ElementRef<HTMLDivElement>>('canvasContainer');

  /** Nodo actualmente seleccionado */
  protected readonly selectedNode = signal<RoadmapNode | null>(null);

  /** Nivel de zoom actual (1 = 100%) */
  protected readonly zoom = signal(1);

  /** Posición del viewport */
  protected readonly viewportPosition = signal<ViewportPosition>({ x: 0, y: 0 });

  /** Estado del arrastre */
  private readonly dragState = signal<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startViewportX: 0,
    startViewportY: 0,
  });

  /** Zoom mínimo permitido */
  private readonly MIN_ZOOM = 0.25;

  /** Zoom máximo permitido */
  private readonly MAX_ZOOM = 2;

  /** Porcentaje de zoom como string */
  protected readonly zoomPercentage = computed(() => Math.round(this.zoom() * 100) + '%');

  /** Transformación CSS del canvas */
  protected readonly canvasTransform = computed(() => {
    const pos = this.viewportPosition();
    const z = this.zoom();
    return `translate(${pos.x}px, ${pos.y}px) scale(${z})`;
  });

  /** Cursor del canvas según estado */
  protected readonly canvasCursor = computed(() => {
    return this.dragState().isDragging ? 'grabbing' : 'grab';
  });

  /**
   * Genera la curva Bézier SVG entre dos nodos conectados.
   * Los puntos de control se calculan en base a la distancia vertical.
   */
  protected getConnectionPath(connection: RoadmapConnection): string {
    const nodes = this.roadmap().nodes;
    const sourceNode = nodes.find((n) => n.id === connection.sourceNodeId);
    const targetNode = nodes.find((n) => n.id === connection.targetNodeId);

    if (!sourceNode || !targetNode) return '';

    // Dimensiones del nodo (deben coincidir con CSS)
    const nodeWidth = 200;
    const nodeHeight = 100;

    // Centro de cada nodo
    const startX = sourceNode.position.x + nodeWidth / 2;
    const startY = sourceNode.position.y + nodeHeight / 2;
    const endX = targetNode.position.x + nodeWidth / 2;
    const endY = targetNode.position.y + nodeHeight / 2;

    // Usar curva Bezier para conexión suave
    const controlPointOffset = Math.abs(endY - startY) * 0.5;

    return `M ${startX} ${startY} C ${startX} ${startY + controlPointOffset}, ${endX} ${endY - controlPointOffset}, ${endX} ${endY}`;
  }

  /** Devuelve la clase CSS según el tipo de nodo. */
  protected getNodeTypeClass(type: string): string {
    const typeClasses: Record<string, string> = {
      topic: 'node-topic',
      project: 'node-project',
      milestone: 'node-milestone',
      checkpoint: 'node-checkpoint',
    };
    return typeClasses[type] ?? 'node-topic';
  }

  /** Devuelve la etiqueta del tipo de nodo en español. */
  protected getNodeTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      topic: 'Tema',
      project: 'Proyecto',
      milestone: 'Hito',
      checkpoint: 'Checkpoint',
    };
    return labels[type] ?? 'Tema';
  }

  /** Selecciona un nodo y emite el evento. */
  protected selectNode(node: RoadmapNode): void {
    this.selectedNode.set(node);
    this.nodeSelected.emit(node);
  }

  /** Deselecciona el nodo actual. */
  protected deselectNode(): void {
    this.selectedNode.set(null);
    this.nodeSelected.emit(null);
  }

  /** Aumenta el nivel de zoom. */
  protected zoomIn(): void {
    this.setZoom(this.zoom() + 0.25);
  }

  /** Disminuye el nivel de zoom. */
  protected zoomOut(): void {
    this.setZoom(this.zoom() - 0.25);
  }

  /** Restablece el zoom a 100% y centra la vista. */
  protected resetZoom(): void {
    this.setZoom(1);
    this.viewportPosition.set({ x: 0, y: 0 });
  }

  /**
   * Establece el nivel de zoom dentro de los límites permitidos.
   */
  private setZoom(newZoom: number): void {
    this.zoom.set(Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, newZoom)));
  }

  /** Maneja el evento de rueda del ratón para zoom. */
  protected onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    this.setZoom(this.zoom() + delta);
  }

  /** Inicia el arrastre del canvas para pan. */
  protected onMouseDown(event: MouseEvent): void {
    // Solo arrastrar con botón izquierdo y si no se hizo clic en un nodo
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('.canvas-node')) return;

    event.preventDefault();
    const currentPos = this.viewportPosition();

    this.dragState.set({
      isDragging: true,
      startX: event.clientX,
      startY: event.clientY,
      startViewportX: currentPos.x,
      startViewportY: currentPos.y,
    });
  }

  /** Actualiza la posición durante el arrastre. */
  protected onMouseMove(event: MouseEvent): void {
    const state = this.dragState();
    if (!state.isDragging) return;

    const deltaX = event.clientX - state.startX;
    const deltaY = event.clientY - state.startY;

    this.viewportPosition.set({
      x: state.startViewportX + deltaX,
      y: state.startViewportY + deltaY,
    });
  }

  /** Finaliza el arrastre del canvas. */
  protected onMouseUp(): void {
    this.dragState.update((state) => ({ ...state, isDragging: false }));
  }

  /** Cancela el arrastre si el ratón sale del área. */
  protected onMouseLeave(): void {
    this.dragState.update((state) => ({ ...state, isDragging: false }));
  }

  /** Maneja atajos de teclado para navegación y zoom. */
  protected onKeyDown(event: KeyboardEvent): void {
    const moveAmount = 50;
    const zoomAmount = 0.25;

    switch (event.key) {
      case 'ArrowUp':
        this.viewportPosition.update((pos) => ({ ...pos, y: pos.y + moveAmount }));
        event.preventDefault();
        break;
      case 'ArrowDown':
        this.viewportPosition.update((pos) => ({ ...pos, y: pos.y - moveAmount }));
        event.preventDefault();
        break;
      case 'ArrowLeft':
        this.viewportPosition.update((pos) => ({ ...pos, x: pos.x + moveAmount }));
        event.preventDefault();
        break;
      case 'ArrowRight':
        this.viewportPosition.update((pos) => ({ ...pos, x: pos.x - moveAmount }));
        event.preventDefault();
        break;
      case '+':
      case '=':
        this.setZoom(this.zoom() + zoomAmount);
        event.preventDefault();
        break;
      case '-':
        this.setZoom(this.zoom() - zoomAmount);
        event.preventDefault();
        break;
      case '0':
        this.resetZoom();
        event.preventDefault();
        break;
      case 'Escape':
        this.deselectNode();
        event.preventDefault();
        break;
    }
  }
}
