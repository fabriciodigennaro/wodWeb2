import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { TimerKind } from '@core/timer/config';
import { TimerSessionService } from '../session/timer-session.service';
import { TimerScreenComponent } from './timer-screen';

describe('TimerScreenComponent', () => {
  let session: TimerSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TimerScreenComponent],
      providers: [provideRouter([])],
    });
    session = TestBed.inject(TimerSessionService);
  });

  function createScreen(config: Parameters<TimerSessionService['config']['set']>[0]) {
    session.config.set(config);
    const fixture = TestBed.createComponent(TimerScreenComponent);
    fixture.detectChanges();
    return { fixture, native: fixture.nativeElement as HTMLElement };
  }

  function buttonByText(native: HTMLElement, text: string): HTMLButtonElement | undefined {
    return [...native.querySelectorAll('button')].find((button) =>
      button.textContent?.includes(text),
    ) as HTMLButtonElement | undefined;
  }

  it('renders an AMRAP screen in Ready with the configured duration', () => {
    const { native } = createScreen({ kind: TimerKind.Amrap, prepSeconds: 0, durationSeconds: 60 });

    expect(native.querySelector('h2')?.textContent).toContain('AMRAP');
    expect(native.textContent).toContain('Listo');
    expect(native.querySelector('[aria-label="Tiempo restante"]')?.textContent?.trim()).toBe(
      '01:00',
    );
    expect(buttonByText(native, 'Iniciar')).toBeDefined();
  });

  it('shows no pause button for AMRAP and increments the round', () => {
    const { fixture, native } = createScreen({
      kind: TimerKind.Amrap,
      prepSeconds: 0,
      durationSeconds: 60,
    });

    buttonByText(native, 'Iniciar')?.click();
    fixture.detectChanges();

    expect(native.textContent).toContain('Corriendo');
    expect(buttonByText(native, 'Reiniciar')).toBeDefined();
    expect(buttonByText(native, 'Pausa')).toBeUndefined();

    buttonByText(native, '+1')?.click();
    fixture.detectChanges();
    expect(native.textContent).toContain('Ronda 2');
  });

  it('shows a pause button for other kinds', () => {
    const { fixture, native } = createScreen({
      kind: TimerKind.Countdown,
      prepSeconds: 0,
      durationSeconds: 30,
    });

    buttonByText(native, 'Iniciar')?.click();
    fixture.detectChanges();
    expect(buttonByText(native, 'Pausa')).toBeDefined();
  });

  it('runs an EMOM with automatic rounds and no manual +1', () => {
    const { fixture, native } = createScreen({
      kind: TimerKind.Emom,
      prepSeconds: 0,
      intervalSeconds: 3,
      rounds: 3,
    });

    expect(native.textContent).toContain('Ronda 1');
    buttonByText(native, 'Iniciar')?.click();
    fixture.detectChanges();

    expect(native.textContent).toContain('Corriendo');
    expect(buttonByText(native, '+1')).toBeUndefined();
    expect(buttonByText(native, 'Pausa')).toBeDefined();
    expect(native.textContent).toContain('Ronda 1');
  });

  it('counts up for a cap-less For Time and allows Pause', () => {
    const { fixture, native } = createScreen({
      kind: TimerKind.ForTime,
      prepSeconds: 0,
      timeCapSeconds: null,
    });

    expect(native.textContent).toContain('For Time');
    buttonByText(native, 'Iniciar')?.click();
    fixture.detectChanges();

    expect(native.textContent).toContain('Corriendo');
    expect(buttonByText(native, '+1')).toBeUndefined();
    expect(buttonByText(native, 'Pausa')).toBeDefined();
  });

  it('runs a Tabata with work/rest phases and automatic rounds', () => {
    const { fixture, native } = createScreen({
      kind: TimerKind.Tabata,
      prepSeconds: 0,
      workSeconds: 2,
      restSeconds: 2,
      rounds: 3,
    });

    expect(native.textContent).toContain('Ronda 1');
    expect(native.textContent).toContain('(2/2)');
    buttonByText(native, 'Iniciar')?.click();
    fixture.detectChanges();

    expect(native.textContent).toContain('Corriendo');
    expect(buttonByText(native, '+1')).toBeUndefined();
    expect(buttonByText(native, 'Pausa')).toBeDefined();
  });

  it('sends users home when no config was chosen', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');
    session.config.set(null);
    const fixture = TestBed.createComponent(TimerScreenComponent);
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith(['/']);
    fixture.componentRef.destroy();
  });
});
