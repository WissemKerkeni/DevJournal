import { Injectable, Renderer2, RendererFactory2, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme = signal<string>('light');
  private renderer: Renderer2;

  constructor(private rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  initTheme() {
    const data = localStorage.getItem('theme');
    this.theme.set(data ?? 'light');
    this.renderer.setAttribute(document.body, "data-theme", this.theme());
  }

  switchTheme() {
    this.theme.update(value => value === 'light' ? 'dark' : 'light');
    localStorage.setItem('theme', this.theme())
    this.renderer.setAttribute(document.body, "data-theme", this.theme());
  }

}
