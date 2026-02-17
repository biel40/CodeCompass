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
import { FormsModule } from '@angular/forms';
import {
  NodeType,
  Resource,
  ResourceType,
  RoadmapConnection,
  RoadmapNode,
} from '../../../models';

/** Estado del arrastre de nodos */
interface DragState {
  isDragging: boolean;
  nodeId: string | null;
  offsetX: number;
  offsetY: number;
}

/** Estado de creación de conexión */
interface ConnectionState {
  isConnecting: boolean;
  sourceNodeId: string | null;
  mouseX: number;
  mouseY: number;
}

/** Estado del viewport (pan/zoom) */
interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

@Component({
  selector: 'app-node-editor-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './node-editor-canvas.component.html',
  styleUrl: './node-editor-canvas.component.css',
})
export class NodeEditorCanvasComponent {
  /** Nodos actuales del roadmap */
  readonly nodes = input<RoadmapNode[]>([]);

  /** Conexiones actuales entre nodos */
  readonly connections = input<RoadmapConnection[]>([]);

  /** Evento cuando cambian los nodos */
  readonly nodesChange = output<RoadmapNode[]>();

  /** Evento cuando cambian las conexiones */
  readonly connectionsChange = output<RoadmapConnection[]>();

  /** Referencia al contenedor del canvas */
  private readonly canvasContainer = viewChild<ElementRef<HTMLDivElement>>('canvasContainer');

  /** Nodo actualmente seleccionado para editar */
  protected readonly selectedNode = signal<RoadmapNode | null>(null);

  /** Estado del viewport */
  protected readonly viewport = signal<ViewportState>({ x: 0, y: 0, zoom: 1 });

  /** Estado del arrastre de nodos */
  private readonly dragState = signal<DragState>({
    isDragging: false,
    nodeId: null,
    offsetX: 0,
    offsetY: 0,
  });

  /** Estado de creación de conexión */
  protected readonly connectionState = signal<ConnectionState>({
    isConnecting: false,
    sourceNodeId: null,
    mouseX: 0,
    mouseY: 0,
  });

  /** Estado del pan del canvas */
  private readonly panState = signal({
    isPanning: false,
    startX: 0,
    startY: 0,
    startViewportX: 0,
    startViewportY: 0,
  });

  /** Recurso en edición */
  protected readonly editingResource = signal<{ nodeId: string; resource: Partial<Resource> } | null>(null);

  /** Tipos de nodo disponibles */
  protected readonly nodeTypes: { type: NodeType; label: string; icon: string }[] = [
    { type: 'topic', label: 'Tema', icon: 'info' },
    { type: 'project', label: 'Proyecto', icon: 'folder' },
    { type: 'milestone', label: 'Hito', icon: 'star' },
    { type: 'checkpoint', label: 'Checkpoint', icon: 'check' },
  ];

  /** Tipos de recurso disponibles */
  protected readonly resourceTypes: { type: ResourceType; label: string }[] = [
    { type: 'video', label: 'Video' },
    { type: 'article', label: 'Artículo' },
    { type: 'course', label: 'Curso' },
    { type: 'documentation', label: 'Documentación' },
    { type: 'exercise', label: 'Ejercicio' },
    { type: 'book', label: 'Libro' },
  ];

  /** Zoom como porcentaje */
  protected readonly zoomPercentage = computed(() => Math.round(this.viewport().zoom * 100) + '%');

  /** Transformación CSS del canvas */
  protected readonly canvasTransform = computed(() => {
    const v = this.viewport();
    return `translate(${v.x}px, ${v.y}px) scale(${v.zoom})`;
  });

  /** Genera un ID único usando la API Web Crypto */
  private generateId(): string {
    return crypto.randomUUID();
  }

  /** Obtiene el nodo origen de una conexión en progreso (para renderizar la línea temporal) */
  protected getSourceNodeForConnection(): RoadmapNode | undefined {
    const state = this.connectionState();
    if (!state.sourceNodeId) return undefined;
    return this.nodes().find((n) => n.id === state.sourceNodeId);
  }

  // ============ GESTIÓN DE NODOS ============

  /** 
   * Obtiene la altura del toolbar según el breakpoint actual.
   * En pantallas <768px el toolbar es más alto (apilado).
   */
  private getToolbarHeight(): number {
    return window.innerWidth <= 768 ? 100 : 56;
  }

  /** 
   * Obtiene el ancho del nodo según el breakpoint actual.
   * Coincide con la variable CSS --node-width que cambia en media queries.
   */
  private getNodeWidth(): number {
    return window.innerWidth <= 480 ? 180 : 220;
  }

  /** 
   * Obtiene la altura estimada del nodo.
   */
  private getNodeHeight(): number {
    return 80;
  }

  /** Añade un nuevo nodo centrado en el área visible del canvas. */
  protected addNode(type: NodeType): void {
    const container = this.canvasContainer()?.nativeElement;
    const viewport = this.viewport();

    // Calcular posición central del viewport visible (restando toolbar)
    const toolbarHeight = this.getToolbarHeight();
    const visibleWidth = container ? container.clientWidth : 600;
    const visibleHeight = container ? container.clientHeight - toolbarHeight : 400;
    
    const centerX = container ? (visibleWidth / 2 - viewport.x) / viewport.zoom : 200;
    const centerY = container ? (visibleHeight / 2 - viewport.y) / viewport.zoom : 200;

    // Offset aleatorio para no apilar nodos
    const offsetX = (Math.random() - 0.5) * 100;
    const offsetY = (Math.random() - 0.5) * 100;

    const newNode: RoadmapNode = {
      id: this.generateId(),
      title: this.getDefaultTitle(type),
      description: '',
      type,
      position: {
        x: Math.max(20, centerX + offsetX),
        y: Math.max(20, centerY + offsetY),
      },
      resources: [],
      estimatedHours: 1,
      isOptional: false,
    };

    const updatedNodes = [...this.nodes(), newNode];
    this.nodesChange.emit(updatedNodes);
    this.selectedNode.set(newNode);
  }

  /** Obtiene el título por defecto según el tipo de nodo */
  private getDefaultTitle(type: NodeType): string {
    const titles: Record<NodeType, string> = {
      topic: 'Nuevo Tema',
      project: 'Nuevo Proyecto',
      milestone: 'Nuevo Hito',
      checkpoint: 'Nuevo Checkpoint',
    };
    return titles[type];
  }

  /** Actualiza las propiedades de un nodo y sincroniza la selección. */
  protected updateNode(nodeId: string, updates: Partial<RoadmapNode>): void {
    const updatedNodes = this.nodes().map((node) =>
      node.id === nodeId ? { ...node, ...updates } : node
    );
    this.nodesChange.emit(updatedNodes);

    // Actualizar nodo seleccionado si es el mismo
    const selected = this.selectedNode();
    if (selected?.id === nodeId) {
      this.selectedNode.set({ ...selected, ...updates });
    }
  }

  /** Elimina un nodo y todas sus conexiones asociadas. */
  protected deleteNode(nodeId: string): void {
    const updatedNodes = this.nodes().filter((n) => n.id !== nodeId);
    const updatedConnections = this.connections().filter(
      (c) => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
    );

    this.nodesChange.emit(updatedNodes);
    this.connectionsChange.emit(updatedConnections);

    if (this.selectedNode()?.id === nodeId) {
      this.selectedNode.set(null);
    }
  }

  /** Duplica un nodo con offset de posición y nuevos IDs. */
  protected duplicateNode(node: RoadmapNode): void {
    const newNode: RoadmapNode = {
      ...node,
      id: this.generateId(),
      title: node.title + ' (copia)',
      position: {
        x: node.position.x + 30,
        y: node.position.y + 30,
      },
      resources: node.resources.map((r) => ({ ...r, id: this.generateId() })),
    };

    const updatedNodes = [...this.nodes(), newNode];
    this.nodesChange.emit(updatedNodes);
    this.selectedNode.set(newNode);
  }

  // ============ GESTIÓN DE CONEXIONES ============

  /** Inicia la creación de una conexión desde el punto de salida de un nodo. */
  protected startConnection(nodeId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.connectionState.set({
      isConnecting: true,
      sourceNodeId: nodeId,
      mouseX: event.clientX,
      mouseY: event.clientY,
    });
  }

  /** Completa una conexión al punto de entrada de un nodo destino. */
  protected completeConnection(targetNodeId: string): void {
    const state = this.connectionState();
    if (!state.isConnecting || !state.sourceNodeId) return;

    // No conectar un nodo consigo mismo
    if (state.sourceNodeId === targetNodeId) {
      this.cancelConnection();
      return;
    }

    // Verificar que no exista ya la conexión
    const exists = this.connections().some(
      (c) =>
        (c.sourceNodeId === state.sourceNodeId && c.targetNodeId === targetNodeId) ||
        (c.sourceNodeId === targetNodeId && c.targetNodeId === state.sourceNodeId)
    );

    if (!exists) {
      const newConnection: RoadmapConnection = {
        id: this.generateId(),
        sourceNodeId: state.sourceNodeId,
        targetNodeId,
        isRequired: true,
      };

      const updatedConnections = [...this.connections(), newConnection];
      this.connectionsChange.emit(updatedConnections);
    }

    this.cancelConnection();
  }

  /** Cancela la creación de conexión actual. */
  protected cancelConnection(): void {
    this.connectionState.set({
      isConnecting: false,
      sourceNodeId: null,
      mouseX: 0,
      mouseY: 0,
    });
  }

  /** Elimina una conexión existente. */
  protected deleteConnection(connectionId: string): void {
    const updatedConnections = this.connections().filter((c) => c.id !== connectionId);
    this.connectionsChange.emit(updatedConnections);
  }

  /** Alterna si una conexión es requerida u opcional. */
  protected toggleConnectionRequired(connectionId: string): void {
    const updatedConnections = this.connections().map((c) =>
      c.id === connectionId ? { ...c, isRequired: !c.isRequired } : c
    );
    this.connectionsChange.emit(updatedConnections);
  }

  /** Genera la curva Bézier SVG para una conexión entre nodos. */
  protected getConnectionPath(connection: RoadmapConnection): string {
    const sourceNode = this.nodes().find((n) => n.id === connection.sourceNodeId);
    const targetNode = this.nodes().find((n) => n.id === connection.targetNodeId);

    if (!sourceNode || !targetNode) return '';

    const nodeWidth = this.getNodeWidth();
    const nodeHeight = this.getNodeHeight();

    const startX = sourceNode.position.x + nodeWidth / 2;
    const startY = sourceNode.position.y + nodeHeight;
    const endX = targetNode.position.x + nodeWidth / 2;
    const endY = targetNode.position.y;

    const controlOffset = Math.min(Math.abs(endY - startY) * 0.5, 80);

    return `M ${startX} ${startY} C ${startX} ${startY + controlOffset}, ${endX} ${endY - controlOffset}, ${endX} ${endY}`;
  }

  /** Genera la curva SVG temporal mientras se arrastra una conexión. */
  protected getTemporaryConnectionPath(): string {
    const state = this.connectionState();
    if (!state.isConnecting || !state.sourceNodeId) return '';

    const sourceNode = this.nodes().find((n) => n.id === state.sourceNodeId);
    if (!sourceNode) return '';

    const container = this.canvasContainer()?.nativeElement;
    if (!container) return '';

    const rect = container.getBoundingClientRect();
    const viewport = this.viewport();

    const nodeWidth = this.getNodeWidth();
    const nodeHeight = this.getNodeHeight();

    const startX = sourceNode.position.x + nodeWidth / 2;
    const startY = sourceNode.position.y + nodeHeight;

    // Convertir posición del ratón a coordenadas del canvas (restando toolbar)
    const toolbarHeight = this.getToolbarHeight();
    const endX = (state.mouseX - rect.left - viewport.x) / viewport.zoom;
    const endY = (state.mouseY - rect.top - toolbarHeight - viewport.y) / viewport.zoom;

    const controlOffset = Math.min(Math.abs(endY - startY) * 0.5, 80);

    return `M ${startX} ${startY} C ${startX} ${startY + controlOffset}, ${endX} ${endY - controlOffset}, ${endX} ${endY}`;
  }

  // ============ GESTIÓN DE RECURSOS ============

  /** Inicia el formulario para añadir un recurso a un nodo. */
  protected startAddResource(nodeId: string): void {
    this.editingResource.set({
      nodeId,
      resource: {
        title: '',
        url: '',
        type: 'article',
        isPremium: false,
      },
    });
  }

  /** Guarda el recurso en edición y lo añade al nodo. */
  protected saveResource(): void {
    const editing = this.editingResource();
    if (!editing || !editing.resource.title || !editing.resource.url) return;

    const node = this.nodes().find((n) => n.id === editing.nodeId);
    if (!node) return;

    const newResource: Resource = {
      id: this.generateId(),
      title: editing.resource.title!,
      url: editing.resource.url!,
      type: editing.resource.type as ResourceType,
      isPremium: editing.resource.isPremium ?? false,
    };

    this.updateNode(editing.nodeId, {
      resources: [...node.resources, newResource],
    });

    this.editingResource.set(null);
  }

  /** Cancela la edición del recurso actual. */
  protected cancelResourceEdit(): void {
    this.editingResource.set(null);
  }

  /** Actualiza el título del recurso en edición. */
  protected updateEditingResourceTitle(title: string): void {
    const current = this.editingResource();
    if (current) {
      this.editingResource.set({
        ...current,
        resource: { ...current.resource, title },
      });
    }
  }

  /** Actualiza la URL del recurso en edición. */
  protected updateEditingResourceUrl(url: string): void {
    const current = this.editingResource();
    if (current) {
      this.editingResource.set({
        ...current,
        resource: { ...current.resource, url },
      });
    }
  }

  /** Actualiza el tipo del recurso en edición. */
  protected updateEditingResourceType(type: string): void {
    const current = this.editingResource();
    if (current) {
      this.editingResource.set({
        ...current,
        resource: { ...current.resource, type: type as ResourceType },
      });
    }
  }

  /** Actualiza si el recurso en edición es premium. */
  protected updateEditingResourcePremium(isPremium: boolean): void {
    const current = this.editingResource();
    if (current) {
      this.editingResource.set({
        ...current,
        resource: { ...current.resource, isPremium },
      });
    }
  }

  /** Elimina un recurso de un nodo. */
  protected deleteResource(nodeId: string, resourceId: string): void {
    const node = this.nodes().find((n) => n.id === nodeId);
    if (!node) return;

    this.updateNode(nodeId, {
      resources: node.resources.filter((r) => r.id !== resourceId),
    });
  }

  // ============ DRAG & DROP DE NODOS ============

  /** Inicia el arrastre de un nodo al hacer mousedown sobre él. */
  protected onNodeMouseDown(event: MouseEvent, node: RoadmapNode): void {
    if (event.button !== 0) return;
    event.stopPropagation();

    const viewport = this.viewport();

    this.dragState.set({
      isDragging: true,
      nodeId: node.id,
      offsetX: event.clientX - node.position.x * viewport.zoom - viewport.x,
      offsetY: event.clientY - node.position.y * viewport.zoom - viewport.y,
    });

    this.selectedNode.set(node);
  }

  /** Maneja el movimiento del ratón: arrastra nodos, conexiones o hace pan. */
  protected onCanvasMouseMove(event: MouseEvent): void {
    // Actualizar posición de conexión temporal
    if (this.connectionState().isConnecting) {
      this.connectionState.update((state) => ({
        ...state,
        mouseX: event.clientX,
        mouseY: event.clientY,
      }));
    }

    // Arrastre de nodo
    const drag = this.dragState();
    if (drag.isDragging && drag.nodeId) {
      const viewport = this.viewport();
      const newX = (event.clientX - drag.offsetX - viewport.x) / viewport.zoom;
      const newY = (event.clientY - drag.offsetY - viewport.y) / viewport.zoom;

      this.updateNode(drag.nodeId, {
        position: {
          x: Math.max(0, newX),
          y: Math.max(0, newY),
        },
      });
      return;
    }

    // Pan del canvas
    const pan = this.panState();
    if (pan.isPanning) {
      const deltaX = event.clientX - pan.startX;
      const deltaY = event.clientY - pan.startY;

      this.viewport.update((v) => ({
        ...v,
        x: pan.startViewportX + deltaX,
        y: pan.startViewportY + deltaY,
      }));
    }
  }

  /** Finaliza cualquier operación de arrastre o conexión activa. */
  protected onCanvasMouseUp(): void {
    this.dragState.update((state) => ({ ...state, isDragging: false, nodeId: null }));
    this.panState.update((state) => ({ ...state, isPanning: false }));

    if (this.connectionState().isConnecting) {
      this.cancelConnection();
    }
  }

  // ============ PAN & ZOOM ============

  /** Inicia el pan del canvas al hacer clic en zona vacía. */
  protected onCanvasMouseDown(event: MouseEvent): void {
    // Solo con botón izquierdo y si no está en modo conexión
    if (event.button !== 0 || this.connectionState().isConnecting) return;

    const target = event.target as HTMLElement;
    // No iniciar pan si se hizo clic en un nodo o control
    if (target.closest('.editor-node') || target.closest('.toolbar') || target.closest('.node-panel')) return;

    const viewport = this.viewport();
    this.panState.set({
      isPanning: true,
      startX: event.clientX,
      startY: event.clientY,
      startViewportX: viewport.x,
      startViewportY: viewport.y,
    });
  }

  /** Maneja el zoom con la rueda del ratón. */
  protected onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    this.setZoom(this.viewport().zoom + delta);
  }

  /** Aumenta el zoom un 25%. */
  protected zoomIn(): void {
    this.setZoom(this.viewport().zoom + 0.25);
  }

  /** Disminuye el zoom un 25%. */
  protected zoomOut(): void {
    this.setZoom(this.viewport().zoom - 0.25);
  }

  /** Restablece la vista a posición y zoom iniciales. */
  protected resetView(): void {
    this.viewport.set({ x: 0, y: 0, zoom: 1 });
  }

  /** Establece el zoom asegurando que permanezca entre 0.25x y 2x */
  private setZoom(newZoom: number): void {
    this.viewport.update((v) => ({
      ...v,
      zoom: Math.max(0.25, Math.min(2, newZoom)),
    }));
  }

  // ============ SELECCIÓN ============

  /** Selecciona un nodo. */
  protected selectNode(node: RoadmapNode): void {
    this.selectedNode.set(node);
  }

  /** Deselecciona el nodo actual. */
  protected deselectNode(): void {
    this.selectedNode.set(null);
  }

  /** Maneja clic en el canvas vacío para deseleccionar. */
  protected onCanvasClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.editor-node') && !target.closest('.node-panel')) {
      this.deselectNode();
    }
  }

  // ============ UTILIDADES ============

  /** Devuelve la clase CSS asociada al tipo de nodo. */
  protected getNodeTypeClass(type: NodeType): string {
    return `node-${type}`;
  }

  /** Devuelve el label legible del tipo de nodo. */
  protected getNodeTypeLabel(type: NodeType): string {
    return this.nodeTypes.find((t) => t.type === type)?.label ?? 'Tema';
  }

  /** Devuelve el label legible del tipo de recurso. */
  protected getResourceTypeLabel(type: ResourceType): string {
    return this.resourceTypes.find((t) => t.type === type)?.label ?? type;
  }

  /** Verifica si el evento viene de un campo de entrada editable. */
  private isEditableElement(element: EventTarget | null): boolean {
    if (!element || !(element instanceof HTMLElement)) return false;
    const tagName = element.tagName.toLowerCase();
    return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || element.isContentEditable;
  }

  /** Maneja atajos de teclado (Delete, Escape, Ctrl+D). */
  protected onKeyDown(event: KeyboardEvent): void {
    const selected = this.selectedNode();

    // Ignorar si el usuario está escribiendo en un campo de entrada
    if (this.isEditableElement(event.target)) {
      // Solo capturar Escape para cerrar recursos en edición
      if (event.key === 'Escape' && this.editingResource()) {
        this.cancelResourceEdit();
        event.preventDefault();
      }
      return;
    }

    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        if (selected && !this.editingResource()) {
          this.deleteNode(selected.id);
          event.preventDefault();
        }
        break;
      case 'Escape':
        if (this.connectionState().isConnecting) {
          this.cancelConnection();
        } else if (this.editingResource()) {
          this.cancelResourceEdit();
        } else {
          this.deselectNode();
        }
        event.preventDefault();
        break;
      case 'd':
        if ((event.ctrlKey || event.metaKey) && selected) {
          this.duplicateNode(selected);
          event.preventDefault();
        }
        break;
    }
  }
}
