declare module '*.jpg' {
  const src: import('next/image').StaticImageData;
  export default src;
}
declare module '*.png' {
  const src: import('next/image').StaticImageData;
  export default src;
}
declare module '*.svg' {
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
