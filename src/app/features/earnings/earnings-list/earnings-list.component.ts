import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudentEarnings } from '../../../models';
import { BundlesService } from '../../students/bundles.service';

/**
 * Componente para mostrar el resumen de ingresos de todos los estudiantes.
 * Solo accesible para administradores.
 */
@Component({
    selector: 'app-earnings-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, CurrencyPipe],
    templateUrl: './earnings-list.component.html',
    styleUrl: './earnings-list.component.css',
})
export class EarningsListComponent implements OnInit {
    private readonly bundlesService = inject(BundlesService);

    protected readonly earnings = signal<StudentEarnings[]>([]);
    protected readonly isLoading = signal(true);

    /** Totales calculados de todos los estudiantes. */
    protected readonly summary = computed(() => {
        const data = this.earnings();
        return {
            totalStudents: data.length,
            totalBundles: data.reduce((sum, item) => sum + item.totalBundles, 0),
            totalPaid: data.reduce((sum, item) => sum + item.totalPaid, 0),
            totalPending: data.reduce((sum, item) => sum + item.totalPending, 0),
            totalAmount: data.reduce((sum, item) => sum + item.totalAmount, 0),
            totalSessions: data.reduce((sum, item) => sum + item.totalSessions, 0),
        };
    });

    async ngOnInit(): Promise<void> {
        await this.loadEarnings();
    }

    /** Carga los datos de ingresos de todos los estudiantes. */
    private async loadEarnings(): Promise<void> {
        this.isLoading.set(true);
        const result = await this.bundlesService.getAllStudentEarnings();
        this.earnings.set(result);
        this.isLoading.set(false);
    }

    /** Extrae las iniciales del nombre (máx. 2 caracteres). */
    protected getInitials(name: string): string {
        return name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }
}
