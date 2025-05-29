"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Plus, Minus, Divide, X as Multiply, Sigma, Percent } from "lucide-react";

// Constants for physics behavior
const PHYSICS = {
  FRICTION: 0.98,
  BOUNCE: 0.8,
  THROW_MULTIPLIER: 0.3,
  MIN_VELOCITY: 1,
  SYMBOL_SIZE: 200,
  INITIAL_COUNT: 40,
  // Add initial velocity range for random movement
  INITIAL_VELOCITY_RANGE: 6,
};

// Symbol types with their corresponding components and colors
const SYMBOL_TYPES = [
  { type: 'plus', component: Plus, color: 'text-blue-500' },
  { type: 'minus', component: Minus, color: 'text-green-500' },
  { type: 'multiply', component: Multiply, color: 'text-red-500' },
  { type: 'divide', component: Divide, color: 'text-yellow-500' },
  { type: 'equals', component: () => <span className="text-4xl font-bold">=</span>, color: 'text-purple-500' },
  { type: 'sigma', component: Sigma, color: 'text-pink-500' },
  { type: 'percent', component: Percent, color: 'text-indigo-500' },
  { type: 'pi', component: () => <span className="text-4xl font-bold">π</span>, color: 'text-orange-500' },
];

interface MathSymbolProps {
  type: string;
  initialPosition: {
    x: number;
    y: number;
  };
  initialVelocity: {
    x: number;
    y: number;
  };
  id: string;
}

const MathSymbol = ({ type, initialPosition, initialVelocity, id }: MathSymbolProps) => {
  const [position, setPosition] = useState(initialPosition);
  const [velocity, setVelocity] = useState(initialVelocity);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const lastPositionRef = useRef(initialPosition);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(performance.now());

  // Find the symbol configuration
  const symbolConfig = SYMBOL_TYPES.find(s => s.type === type) || SYMBOL_TYPES[0];
  const SymbolComponent = symbolConfig.component;

  // Physics update function
  const updatePhysics = useCallback(() => {
    const now = performance.now();
    const deltaTime = (now - lastTimeRef.current) / 1000; // Convert to seconds
    lastTimeRef.current = now;

    setPosition(prev => {
      // Apply velocity with time correction
      let newX = prev.x + velocity.x * deltaTime * 60; // Scale to ~60fps
      let newY = prev.y + velocity.y * deltaTime * 60;
      
      // Apply friction
      let newVelX = velocity.x * PHYSICS.FRICTION;
      let newVelY = velocity.y * PHYSICS.FRICTION;

      // Check boundaries and bounce - fix to use full viewport
      const maxX = window.innerWidth - PHYSICS.SYMBOL_SIZE;
      const maxY = window.innerHeight - PHYSICS.SYMBOL_SIZE;

      if (newX < 0 || newX > maxX) {
        newVelX = -newVelX * PHYSICS.BOUNCE;
        newX = newX < 0 ? 0 : maxX;
      }
      
      if (newY < 0 || newY > maxY) {
        newVelY = -newVelY * PHYSICS.BOUNCE;
        newY = newY < 0 ? 0 : maxY;
      }

      // Update velocity
      setVelocity({ x: newVelX, y: newVelY });
      
      // If almost stopped, add a small random impulse to keep it moving
      if (Math.abs(newVelX) < PHYSICS.MIN_VELOCITY && Math.abs(newVelY) < PHYSICS.MIN_VELOCITY) {
        // Instead of zeroing out velocity, add a random small impulse
        if (Math.random() > 0.95) { // Only add impulse occasionally
          newVelX = (Math.random() - 0.5) * PHYSICS.INITIAL_VELOCITY_RANGE * 0.2;
          newVelY = (Math.random() - 0.5) * PHYSICS.INITIAL_VELOCITY_RANGE * 0.2;
          setVelocity({ x: newVelX, y: newVelY });
        }
      }

      return { x: newX, y: newY };
    });

    // Always continue animation frame
    animationFrameRef.current = requestAnimationFrame(updatePhysics);
  }, [velocity]);

  // Start/stop physics animation based on state
  useEffect(() => {
    // Always run physics update to enable floating behavior
    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updatePhysics]);

  // Event handlers
  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
    
    setDragOffset({ 
      x: clientX - position.x, 
      y: clientY - position.y 
    });
    lastPositionRef.current = position;
  }, [position]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
    
    const newPosition = {
      x: clientX - dragOffset.x,
      y: clientY - dragOffset.y
    };
    
    setPosition(newPosition);
    
    // Calculate velocity based on movement for smooth throwing
    const newVelocity = {
      x: (newPosition.x - lastPositionRef.current.x) * 2,
      y: (newPosition.y - lastPositionRef.current.y) * 2
    };
    
    setVelocity(newVelocity);
    lastPositionRef.current = newPosition;
  }, [isDragging, dragOffset]);

  const handlePointerUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    setVelocity(prev => ({
      x: prev.x * PHYSICS.THROW_MULTIPLIER,
      y: prev.y * PHYSICS.THROW_MULTIPLIER
    }));
  }, [isDragging]);

  // global event listeners when dragging
  useEffect(() => {
    const mouseMoveHandler = handlePointerMove as unknown as (e: MouseEvent) => void;
    const mouseUpHandler = handlePointerUp as unknown as (e: MouseEvent) => void;
    const touchMoveHandler = handlePointerMove as unknown as (e: TouchEvent) => void;
    const touchEndHandler = handlePointerUp as unknown as (e: TouchEvent) => void;
  
    if (isDragging) {
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
      document.addEventListener('touchmove', touchMoveHandler, { passive: false });
      document.addEventListener('touchend', touchEndHandler);
    }
    
    return () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
      document.removeEventListener('touchmove', touchMoveHandler);
      document.removeEventListener('touchend', touchEndHandler);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  return (
    <div
      className={`absolute cursor-grab select-none flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm shadow-lg
                 ${isDragging ? 'cursor-grabbing scale-110 z-50' : 'z-10'}
                 transition-transform duration-100`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        touchAction: 'none',
        willChange: isDragging ? 'transform' : 'auto'
      }}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
    >
      <SymbolComponent size={32} className={symbolConfig.color} />
    </div>
  );
};

interface SymbolData {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  velocity: {
    x: number;
    y: number;
  };
}

const Hero = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [symbols, setSymbols] = useState<SymbolData[]>([]); 
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate random initial positions and velocities
  const generateRandomPositions = useCallback((count: number): SymbolData[] => {
    const newSymbols: SymbolData[] = [];
    
    for (let i = 0; i < count; i++) {
      const symbolType = SYMBOL_TYPES[Math.floor(Math.random() * SYMBOL_TYPES.length)];
      
      newSymbols.push({
        id: `symbol-${i}-${Date.now()}`,
        type: symbolType.type,
        position: {
          // Use full viewport width/height
          x: Math.random() * (window.innerWidth - PHYSICS.SYMBOL_SIZE),
          y: Math.random() * (window.innerHeight - PHYSICS.SYMBOL_SIZE)
        },
        // Add initial random velocity
        velocity: {
          x: (Math.random() - 0.5) * PHYSICS.INITIAL_VELOCITY_RANGE,
          y: (Math.random() - 0.5) * PHYSICS.INITIAL_VELOCITY_RANGE
        }
      });
    }
    
    return newSymbols;
  }, []);

  // Handle window resize
  const handleResize = useCallback(() => {
    setSymbols(prev => prev.map(symbol => ({
      ...symbol,
      position: {
        x: Math.min(symbol.position.x, window.innerWidth - PHYSICS.SYMBOL_SIZE),
        y: Math.min(symbol.position.y, window.innerHeight - PHYSICS.SYMBOL_SIZE)
      }
    })));
  }, []);

  useEffect(() => {
    setIsLoaded(true);
    setSymbols(generateRandomPositions(PHYSICS.INITIAL_COUNT));
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [generateRandomPositions, handleResize]);

  return (
    <section 
      ref={containerRef}
      className="relative pt-32 pb-20 container-padding flex flex-col items-center justify-center min-h-[100vh] overflow-hidden"
    >
      {/* Floating Math Symbols */}
      {symbols.map((symbol) => (
        <MathSymbol
          key={symbol.id}
          type={symbol.type}
          initialPosition={symbol.position}
          initialVelocity={symbol.velocity}
          id={symbol.id}
        />
      ))}
      
      {/* Main Content */}
      <div className={`relative z-20 transition-all duration-1000 transform ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h1 className="text-hero text-center mb-3">Ekko</h1>
        <p className="text-center text-forai-gray text-lg mb-12">Education, artificial intelligence</p>
      </div>
    </section>
  );
};

export default Hero;