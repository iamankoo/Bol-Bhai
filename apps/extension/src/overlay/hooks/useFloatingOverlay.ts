import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEventHandler,
  type RefObject
} from "react";
import { getDefaultPosition, type OverlayPosition } from "../utils/position";
import { clampPosition } from "../utils/clampPosition";
import { loadOverlayPosition, resetOverlayPosition, saveOverlayPosition } from "../store/positionStore";

const DRAG_THRESHOLD_PX = 4;

type UseFloatingOverlayOptions = {
  onClick: () => void;
};

type ButtonHandlers = {
  onPointerDown: PointerEventHandler<HTMLButtonElement>;
  onClick: () => void;
};

type UseFloatingOverlayResult = {
  position: OverlayPosition;
  containerRef: RefObject<HTMLDivElement | null>;
  buttonHandlers: ButtonHandlers;
  resetPosition: () => Promise<void>;
};

export function useFloatingOverlay({
  onClick
}: UseFloatingOverlayOptions): UseFloatingOverlayResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    didMove: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const latestPositionRef = useRef(getDefaultPosition());
  const [position, setPosition] = useState<OverlayPosition>(() => latestPositionRef.current);

  const commitPosition = useCallback((nextPosition: OverlayPosition) => {
    const clampedPosition = clampPosition(nextPosition);
    latestPositionRef.current = clampedPosition;
    setPosition(clampedPosition);
    void saveOverlayPosition(clampedPosition);
  }, []);

  useEffect(() => {
    let isMounted = true;

    void loadOverlayPosition().then((storedPosition) => {
      if (!isMounted) {
        return;
      }

      commitPosition(storedPosition ?? getDefaultPosition());
    });

    return () => {
      isMounted = false;
    };
  }, [commitPosition]);

  useEffect(() => {
    const handleResize = () => {
      commitPosition(latestPositionRef.current);
    };

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [commitPosition]);

  const onPointerDown = useCallback<PointerEventHandler<HTMLButtonElement>>((event) => {
    if (event.button !== 0 || !containerRef.current) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      didMove: false
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      const container = containerRef.current;

      if (!dragState || !container || event.pointerId !== dragState.pointerId) {
        return;
      }

      const distanceX = event.clientX - dragState.startX;
      const distanceY = event.clientY - dragState.startY;

      if (Math.hypot(distanceX, distanceY) >= DRAG_THRESHOLD_PX) {
        dragState.didMove = true;
      }

      const nextPosition = clampPosition({
        left: event.clientX - dragState.offsetX,
        top: event.clientY - dragState.offsetY
      });

      latestPositionRef.current = nextPosition;
      container.style.left = `${nextPosition.left}px`;
      container.style.top = `${nextPosition.top}px`;
      event.preventDefault();
    };

    const handlePointerUp = (event: PointerEvent) => {
      const dragState = dragStateRef.current;

      if (!dragState || event.pointerId !== dragState.pointerId) {
        return;
      }

      dragStateRef.current = null;
      suppressClickRef.current = dragState.didMove;
      commitPosition(latestPositionRef.current);
      event.preventDefault();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp, { passive: false });
    window.addEventListener("pointercancel", handlePointerUp, { passive: false });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [commitPosition]);

  const handleClick = useCallback(() => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    onClick();
  }, [onClick]);

  const resetPosition = useCallback(async () => {
    const defaultPosition = clampPosition(getDefaultPosition());
    await resetOverlayPosition();
    latestPositionRef.current = defaultPosition;
    setPosition(defaultPosition);

    if (containerRef.current) {
      containerRef.current.style.left = `${defaultPosition.left}px`;
      containerRef.current.style.top = `${defaultPosition.top}px`;
    }
  }, []);

  const buttonHandlers = useMemo(
    () => ({
      onPointerDown,
      onClick: handleClick
    }),
    [handleClick, onPointerDown]
  );

  return {
    position,
    containerRef,
    buttonHandlers,
    resetPosition
  };
}
