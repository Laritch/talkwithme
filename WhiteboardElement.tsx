import { useMemo, CSSProperties, MouseEvent } from 'react';
import { Element, ElementType } from '../types';
import ModerationIndicator from './ModerationIndicator';
import useWhiteboardModeration from '../hooks/useWhiteboardModeration';

interface WhiteboardElementProps {
  element: Element;
  selected?: boolean;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}

const WhiteboardElement = ({ element, selected = false, onClick }: WhiteboardElementProps) => {
  const { isElementVisible } = useWhiteboardModeration();

  // Element style based on its properties
  const style = useMemo((): CSSProperties => {
    return {
      position: 'absolute' as const,
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: element.width ? `${element.width}px` : 'auto',
      height: element.height ? `${element.height}px` : 'auto',
      border: selected ? '2px dashed blue' : 'none',
      outline: selected ? '1px solid rgba(0, 0, 255, 0.5)' : 'none',
      backgroundColor: element.backgroundColor || 'transparent',
      color: element.strokeColor || '#000',
      fontSize: element.fontSize ? `${element.fontSize}px` : 'inherit',
      fontFamily: element.fontFamily || 'Arial',
      cursor: 'pointer',
      userSelect: 'none' as const,
      zIndex: selected ? 2 : 1,
    };
  }, [element, selected]);

  // Don't render if not visible based on moderation status
  if (!isElementVisible(element)) {
    return null;
  }

  // Render different types of elements
  const renderElement = () => {
    switch (element.type) {
      case ElementType.Text:
        return (
          <div
            style={{
              ...style,
              padding: '4px',
              minWidth: '20px',
              minHeight: '20px',
            }}
          >
            {element.text || ''}
          </div>
        );

      case ElementType.Rectangle:
        return (
          <div
            style={{
              ...style,
              border: `2px solid ${element.strokeColor || '#000'}`,
            }}
          />
        );

      case ElementType.Ellipse:
        return (
          <div
            style={{
              ...style,
              border: `2px solid ${element.strokeColor || '#000'}`,
              borderRadius: '50%',
            }}
          />
        );

      case ElementType.Line:
        // This is a simplified line representation
        return (
          <div
            style={{
              ...style,
              height: '2px',
              backgroundColor: element.strokeColor || '#000',
            }}
          />
        );

      case ElementType.Pencil:
        // For simplicity, we just show a dot for pencil strokes
        // In a real implementation, we would render the path
        return (
          <div
            style={{
              ...style,
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: element.strokeColor || '#000',
            }}
          />
        );

      default:
        return <div style={style}>Unknown Element</div>;
    }
  };

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div
      className="relative group"
      style={{ position: 'absolute' as const, left: 0, top: 0 }}
      onClick={handleClick}
    >
      {renderElement()}
      <ModerationIndicator element={element} position="top-right" showLabel />
    </div>
  );
};

export default WhiteboardElement;
