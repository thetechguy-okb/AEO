export function AthenaLogo({ className = "h-10 w-auto", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div className={`${className} flex items-center justify-center flex-shrink-0 ${dark ? 'bg-white rounded-lg p-1 shadow-sm' : ''}`}>
      <img
        src="/assets/athena-logo.png"
        alt="Athena Centre"
        className="w-full h-full object-contain"
        loading="eager"
      />
    </div>
  );
}

export default AthenaLogo;
