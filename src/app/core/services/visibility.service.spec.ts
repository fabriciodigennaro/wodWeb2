import { TestBed } from '@angular/core/testing';
import { VisibilityService } from './visibility.service';

describe('VisibilityService', () => {
  let service: VisibilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisibilityService);
  });

  it('starts visible in jsdom', () => {
    expect(service.isVisible()).toBe(true);
  });

  it('tracks document visibility changes', () => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(service.isVisible()).toBe(false);

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(service.isVisible()).toBe(true);
  });

  it('tracks window focus changes', () => {
    window.dispatchEvent(new Event('blur'));
    expect(service.isFocused()).toBe(false);

    window.dispatchEvent(new Event('focus'));
    expect(service.isFocused()).toBe(true);
  });
});
