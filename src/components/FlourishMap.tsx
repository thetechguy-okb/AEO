import React from 'react';

interface FlourishMapProps {
  id?: string;
  className?: string;
  title?: string;
  height?: string;
}

export const FlourishMap: React.FC<FlourishMapProps> = ({
  id = '30596006',
  className = '',
  title = 'AEO Democratic Competitiveness Map',
  height = 'h-[650px] sm:h-[800px] lg:h-[850px]'
}) => {
  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <iframe
        src={`https://flo.uri.sh/visualisation/${id}/embed`}
        title={title}
        className={`w-full ${height} border-0 block`}
        sandbox="allow-same-origin allow-scripts allow-top-navigation allow-popups allow-forms"
        loading="lazy"
      />
    </div>
  );
};

export default FlourishMap;
