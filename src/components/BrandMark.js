export default function BrandMark({ className = "brand-crest-img", size = 44 }) {
  return (
    <img
      src="/btasp-logo.png"
      alt=""
      width={size}
      height={size}
      className={className}
      decoding="async"
    />
  );
}
