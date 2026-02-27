import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

@Component({
  selector: 'app-date-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: DatePickerComponent,
      multi: true,
    },
  ],
})
export class DatePickerComponent implements ControlValueAccessor {
  /** Placeholder del input */
  readonly placeholder = input('Seleccionar fecha');

  /** Texto del label */
  readonly label = input<string | null>(null);

  /** Fecha mínima seleccionable */
  readonly minDate = input<Date | null>(null);

  /** Fecha máxima seleccionable */
  readonly maxDate = input<Date | null>(null);

  /** Si el campo es requerido */
  readonly required = input(false);

  /** ID del input para accesibilidad */
  readonly inputId = input('date-picker');

  /** Evento emitido cuando cambia la fecha */
  readonly dateChange = output<Date | null>();

  protected readonly isOpen = signal(false);
  protected readonly currentMonth = signal(new Date());
  protected readonly selectedDate = signal<Date | null>(null);
  protected readonly isDisabled = signal(false);

  protected readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('inputRef');

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  /** Nombre del mes y año actual en español */
  protected readonly currentMonthLabel = computed(() => {
    const date = this.currentMonth();
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  });

  /** Días de la semana abreviados */
  protected readonly weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  /** Días del calendario a mostrar */
  protected readonly calendarDays = computed(() => {
    const current = this.currentMonth();
    const selected = this.selectedDate();
    const min = this.minDate();
    const max = this.maxDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = current.getFullYear();
    const month = current.getMonth();

    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);

    // Día de la semana del primer día (0 = domingo, ajustar a lunes = 0)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days: CalendarDay[] = [];

    // Días del mes anterior para completar la primera semana
    const prevMonthLastDay = new Date(year, month, 0);
    for (let index = startDayOfWeek - 1; index >= 0; index--) {
      const date = new Date(year, month - 1, prevMonthLastDay.getDate() - index);
      days.push(this.createCalendarDay(date, false, today, selected, min, max));
    }

    // Días del mes actual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push(this.createCalendarDay(date, true, today, selected, min, max));
    }

    // Días del mes siguiente para completar la última semana
    const remainingDays = 42 - days.length; // 6 semanas × 7 días
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push(this.createCalendarDay(date, false, today, selected, min, max));
    }

    return days;
  });

  /** Valor formateado para mostrar en el input */
  protected readonly displayValue = computed(() => {
    const date = this.selectedDate();
    if (!date) return '';
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.date-picker-container')) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.isOpen.set(false);
  }

  /** Alterna la visibilidad del calendario */
  protected toggleCalendar(): void {
    if (this.isDisabled()) return;
    this.isOpen.update((open) => !open);
  }

  /** Abre el calendario */
  protected openCalendar(): void {
    if (this.isDisabled()) return;
    this.isOpen.set(true);
  }

  /** Navega al mes anterior */
  protected previousMonth(): void {
    this.currentMonth.update((current) => {
      const newDate = new Date(current);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }

  /** Navega al mes siguiente */
  protected nextMonth(): void {
    this.currentMonth.update((current) => {
      const newDate = new Date(current);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }

  /** Selecciona un día del calendario */
  protected selectDay(calendarDay: CalendarDay): void {
    if (calendarDay.isDisabled) return;

    this.selectedDate.set(calendarDay.date);
    this.isOpen.set(false);
    this.onTouched();

    // Emitir formato ISO para el formulario
    const isoDate = calendarDay.date.toISOString().split('T')[0];
    this.onChange(isoDate);
    this.dateChange.emit(calendarDay.date);
  }

  /** Selecciona el día de hoy */
  protected selectToday(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const min = this.minDate();
    const max = this.maxDate();

    if ((min && today < min) || (max && today > max)) {
      return;
    }

    this.selectedDate.set(today);
    this.currentMonth.set(today);
    this.isOpen.set(false);
    this.onTouched();

    const isoDate = today.toISOString().split('T')[0];
    this.onChange(isoDate);
    this.dateChange.emit(today);
  }

  /** Limpia la fecha seleccionada */
  protected clearDate(): void {
    this.selectedDate.set(null);
    this.onTouched();
    this.onChange('');
    this.dateChange.emit(null);
  }

  // =============================================
  // ControlValueAccessor
  // =============================================

  writeValue(value: string | Date | null): void {
    if (!value) {
      this.selectedDate.set(null);
      return;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (!isNaN(date.getTime())) {
      this.selectedDate.set(date);
      this.currentMonth.set(date);
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  // =============================================
  // Métodos privados
  // =============================================

  private createCalendarDay(
    date: Date,
    isCurrentMonth: boolean,
    today: Date,
    selected: Date | null,
    min: Date | null,
    max: Date | null
  ): CalendarDay {
    const isToday = this.isSameDay(date, today);
    const isSelected = selected ? this.isSameDay(date, selected) : false;
    const isDisabled = (min && date < min) || (max && date > max) || false;

    return {
      date,
      day: date.getDate(),
      isCurrentMonth,
      isToday,
      isSelected,
      isDisabled,
    };
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
}
