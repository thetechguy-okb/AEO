import React from 'react';
import DownloadButton, { DEFAULT_DOWNLOAD_BUTTON_LABEL } from './DownloadButton';

export interface DownloadPanelProps {
  fileUrl?: string;
  title?: string;
  buttonLabel?: string;
  onDownload?: () => void;
  isDownloaded?: boolean;
  className?: string;
  fullWidthOnMobile?: boolean;
}

export const DEFAULT_DOWNLOAD_SECTION_TITLE = 'Download Official Statement';
export { DEFAULT_DOWNLOAD_BUTTON_LABEL };

/**
 * DownloadPanel wrapper component for backward-compatibility.
 * Renders the new DownloadButton without the legacy bottom panel section wrapper.
 */
export default function DownloadPanel({
  fileUrl,
  buttonLabel,
  onDownload,
  isDownloaded = false,
  className = '',
  fullWidthOnMobile = false
}: DownloadPanelProps) {
  return (
    <DownloadButton
      fileUrl={fileUrl}
      buttonLabel={buttonLabel}
      onDownload={onDownload}
      isDownloaded={isDownloaded}
      className={className}
      fullWidthOnMobile={fullWidthOnMobile}
    />
  );
}
