/// <reference types="react" />

declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        'ar-modes'?: string;
        ar?: boolean;
        'camera-controls'?: boolean;
        'environment-image'?: string;
        poster?: string;
        'shadow-intensity'?: string;
        exposure?: string;
        'auto-rotate'?: boolean;
      },
      HTMLElement
    >;
  }
}
