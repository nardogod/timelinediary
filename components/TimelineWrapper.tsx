'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface TimelineContextType {
  zoom: number;
  pan: number;
  isDragging: boolean;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setPan: (pan: number | ((prev: number) => number)) => void;
  setIsDragging: (isDragging: boolean) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleReset: () => void;
  handleZoomChange: (delta: number, focalPointX?: number, focalPointY?: number, containerRef?: React.RefObject<HTMLDivElement | null>) => void;
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

export const useTimeline = () => {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error('useTimeline must be used within TimelineWrapper');
  }
  return context;
};

interface TimelineWrapperProps {
  children: ReactNode;
}

export default function TimelineWrapper({ children }: TimelineWrapperProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(3, prev + 0.2));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.5, prev - 0.2));
  };
  
  const handleReset = () => { 
    setZoom(1); 
    setPan(0); 
  };
  
  // Zoom focalizado: mantém o ponto sob o cursor/mouse fixo durante o zoom
  const handleZoomChange = (
    delta: number, 
    focalPointX?: number, 
    focalPointY?: number,
    containerRef?: React.RefObject<HTMLDivElement | null>
  ) => {
    setZoom(prev => {
      const newZoom = Math.max(0.5, Math.min(3, prev + delta));
      
      // Se há um ponto focal (mouse ou centro do pinch), ajusta o pan para manter esse ponto fixo
      if (focalPointX !== undefined && containerRef?.current) {
        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();
        const containerCenter = containerRect.width / 2;
        
        // Ponto relativo ao container
        const pointRelativeToContainer = focalPointX - containerRect.left;
        
        // Calcula a nova posição do pan para manter o ponto focal fixo
        const zoomRatio = newZoom / prev;
        setPan(currentPan => {
          const newPan = currentPan - (pointRelativeToContainer - containerCenter) * (zoomRatio - 1);
          return newPan;
        });
      }
      
      return newZoom;
    });
  };

  const value: TimelineContextType = {
    zoom,
    pan,
    isDragging,
    setZoom,
    setPan,
    setIsDragging,
    handleZoomIn,
    handleZoomOut,
    handleReset,
    handleZoomChange
  };

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
}
