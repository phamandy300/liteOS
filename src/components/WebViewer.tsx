import React from 'react';

interface WebProps {
    url:string;
}

const ExternalWebsiteViewer = React.memo(({ url }: WebProps) => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <iframe
        src={url}
        style={{
            width: '100%',
            height: '100%',
            border: 'none',
            transform: 'translateZ(0)',
            willChange: 'transform',
        }}
      />
    </div>
  );
});

export default ExternalWebsiteViewer;
