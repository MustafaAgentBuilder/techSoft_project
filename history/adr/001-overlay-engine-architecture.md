# ADR-001: Overlay Engine Architecture

**Status**: Accepted
**Date**: 2025-12-04
**Decision**: Use Canvas API for frame overlay rendering system

## Context

The Virtual Specs 3D Try-On MVP requires a frame overlay system capable of:
- Positioning glasses frames over user photos and webcam video
- Supporting smooth manual adjustments (position, scale, rotation)
- Maintaining <200ms response time for user interactions
- Displaying at 30fps in webcam mode
- Supporting future AI integration with automatic face detection

Two main approaches were considered:
1. **CSS Positioning**: Use CSS transforms and absolute positioning
2. **Canvas API**: Use HTML5 Canvas for programmatic rendering

## Decision

We chose **Canvas API** for the frame overlay system with the following implementation approach:

- Primary overlay rendering via Canvas 2D context
- RequestAnimationFrame for smooth 30fps animations
- Hardware acceleration for optimal performance
- Modular design supporting future AI integration

## Consequences

### Positive Outcomes

**Performance Benefits**:
- Hardware-accelerated rendering ensures consistent 30fps performance
- Sub-50ms response times for overlay positioning changes
- Efficient redraw cycles for smooth animations
- Better memory management with controlled canvas operations

**Precision and Control**:
- Pixel-perfect positioning accuracy for frame alignment
- Native image manipulation capabilities
- Consistent rendering across all browsers
- Advanced compositing operations for future features

**Future AI Integration**:
- Canvas provides foundation for face detection overlays
- Efficient image processing for automatic positioning
- Support for complex visual effects and enhancements
- Easy integration with computer vision libraries

**Development Experience**:
- Powerful debugging capabilities with canvas inspection
- Rich ecosystem of canvas libraries and tools
- Well-documented API with extensive community support
- Compatible with modern browser security models

### Negative Outcomes

**Implementation Complexity**:
- Higher learning curve compared to CSS positioning
- More complex code for basic overlay functionality
- Requires careful memory management to prevent leaks
- Additional error handling for canvas context failures

**Development Overhead**:
- Manual implementation of features that CSS provides automatically
- More verbose code for simple positioning operations
- Need to handle browser compatibility edge cases
- Additional testing required for canvas-specific bugs

## Alternatives Considered

### CSS Positioning with Transforms

**Benefits**:
- Simpler implementation for basic use case
- No JavaScript rendering overhead
- Easier debugging with DOM inspection
- CSS-native animations and transitions
- Familiar to most frontend developers

**Drawbacks**:
- Limited control over precise pixel positioning
- Inconsistent rendering across browsers
- Performance limitations at high frame rates
- Difficult to integrate with image processing
- Limited support for complex visual effects

**Rejected Because**:
- Cannot guarantee <200ms response time requirement
- Insufficient precision for accurate frame positioning
- Poor foundation for future AI integration
- Performance limitations at 30fps requirement

### Hybrid Approach (CSS + Canvas)

**Benefits**:
- Leverages strengths of both technologies
- CSS for simple animations, Canvas for precision
- Gradual migration path possible
- Flexibility to choose best tool per feature

**Drawbacks**:
- Increased complexity with dual rendering systems
- Synchronization challenges between CSS and Canvas
- Larger codebase and maintenance burden
- Potential performance conflicts

**Rejected Because**:
- Violates Constitution's Simplicity Principle
- Too complex for 4-day MVP timeline
- Unnecessary architectural overhead

## Implementation Details

### Core Canvas Architecture

```javascript
class OverlayEngine {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvas.getContext('2d');
        this.currentFrame = null;
        this.position = { x: 0, y: 0, scale: 1.0, rotation: 0 };
        this.isAnimating = false;
    }

    // Core rendering method
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.currentFrame) {
            this.ctx.save();

            // Apply transformations
            this.ctx.translate(
                this.position.x + this.currentFrame.defaultX,
                this.position.y + this.currentFrame.defaultY
            );
            this.ctx.scale(this.position.scale, this.position.scale);
            this.ctx.rotate(this.position.rotation * Math.PI / 180);

            // Draw frame
            this.ctx.drawImage(
                this.currentFrame.image,
                -this.currentFrame.defaultWidth / 2,
                -this.currentFrame.defaultHeight / 2,
                this.currentFrame.defaultWidth,
                this.currentFrame.defaultHeight
            );

            this.ctx.restore();
        }
    }

    // Smooth animation loop
    animate() {
        if (this.isAnimating) {
            this.render();
            requestAnimationFrame(() => this.animate());
        }
    }
}
```

### Performance Optimizations

**Hardware Acceleration**:
- Canvas automatically leverages GPU when available
- Use `will-change: transform` CSS property for canvas element
- Optimize canvas size to match display requirements

**Memory Management**:
- Cache frame images to prevent repeated loading
- Use object pooling for frequent operations
- Clean up event listeners and animation frames

**Rendering Efficiency**:
- Only redraw when position changes
- Use dirty rectangle optimization for partial updates
- Implement frame rate limiting for consistent performance

## Testing Strategy

### Performance Testing

```javascript
// Performance benchmarking
function benchmarkOverlayEngine() {
    const iterations = 1000;
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
        overlayEngine.setPosition(Math.random() * 100, Math.random() * 100);
        overlayEngine.render();
    }

    const endTime = performance.now();
    const avgTime = (endTime - startTime) / iterations;

    console.log(`Average render time: ${avgTime.toFixed(2)}ms`);
    return avgTime < 2.0; // Target: <2ms per render
}
```

### Cross-Browser Testing

- Chrome: Full feature support expected
- Firefox: Canvas support excellent, minor API differences
- Safari: Canvas support good, watch for memory management
- Edge: Same rendering engine as Chrome, consistent behavior

## Risk Mitigation

### Canvas Fallback Strategy

```javascript
function initializeOverlayEngine(canvasElement) {
    try {
        const ctx = canvasElement.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas 2D context not available');
        }

        return new OverlayEngine(canvasElement);
    } catch (error) {
        console.warn('Canvas not supported, falling back to CSS positioning');
        return new CSSOverlayEngine(); // Simplified fallback
    }
}
```

### Memory Management

```javascript
class OverlayEngine {
    destroy() {
        this.isAnimating = false;
        this.currentFrame = null;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Clean up event listeners
        this.canvas.removeEventListener('click', this.handleClick);
    }
}
```

## Future Considerations

### AI Integration Path

The Canvas API choice enables several future enhancements:

1. **Face Detection Integration**:
   - Draw detection boxes over identified facial features
   - Automatic frame positioning based on eye location
   - Real-time face tracking in webcam mode

2. **Advanced Visual Effects**:
   - Frame tinting based on user preferences
   - Reflection and shadow effects
   - Augmented reality features

3. **Performance Optimization**:
   - WebGL rendering for complex effects
   - OffscreenCanvas for background processing
   - Web Workers for intensive calculations

### Scaling Considerations

- Canvas performance scales well with multiple users
- Server-side rendering possible for thumbnail generation
- Progressive enhancement for low-end devices

## Decision Timeline

- **2025-12-04**: Decision made based on performance requirements
- **2025-12-04**: Implementation started
- **Expected**: Integration testing by 2025-12-06
- **Target**: Production deployment by 2025-12-08

---

**This decision aligns with Article I (Simplicity Principle) and Article IV (Performance Targets) of the Virtual Specs Constitution, providing the technical foundation needed to meet MVP requirements while supporting future AI integration.**