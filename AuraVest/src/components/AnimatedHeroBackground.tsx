'use client';

import { useEffect, useRef } from 'react';

export default function AnimatedHeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      life: number;
      maxLife: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 3 + 1;
        this.color = this.getRandomColor();
        this.alpha = Math.random() * 0.8 + 0.2;
        this.life = 0;
        this.maxLife = Math.random() * 200 + 100;
      }

      getRandomColor() {
        const colors = [
          '#3B82F6', // Blue
          '#8B5CF6', // Purple
          '#10B981', // Green
          '#F59E0B', // Yellow
          '#EF4444', // Red
          '#06B6D4', // Cyan
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life++;

        // Wrap around edges
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        // Fade out near end of life
        if (this.life > this.maxLife * 0.8) {
          this.alpha = (this.maxLife - this.life) / (this.maxLife * 0.2);
        }
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
      }

      isDead() {
        return this.life >= this.maxLife;
      }
    }

    // Wave animation
    class Wave {
      amplitude: number;
      frequency: number;
      phase: number;
      speed: number;
      color: string;
      y: number;

      constructor(y: number) {
        this.amplitude = Math.random() * 20 + 10;
        this.frequency = Math.random() * 0.02 + 0.01;
        this.phase = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 0.02 + 0.01;
        this.color = `rgba(${Math.random() * 100 + 155}, ${Math.random() * 100 + 155}, 255, 0.1)`;
        this.y = y;
      }

      update() {
        this.phase += this.speed;
      }

      draw() {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let x = 0; x < canvas.width; x += 5) {
          const y = this.y + Math.sin(x * this.frequency + this.phase) * this.amplitude;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }
    }

    const particles: Particle[] = [];
    const waves: Wave[] = [];

    // Initialize particles
    for (let i = 0; i < 50; i++) {
      particles.push(new Particle());
    }

    // Initialize waves
    for (let i = 0; i < 3; i++) {
      waves.push(new Wave(canvas.height * (0.3 + i * 0.2)));
    }

    let animationId: number;

    const animate = () => {
      // Clear with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.95)'); // slate-900
      gradient.addColorStop(0.5, 'rgba(30, 41, 59, 0.9)'); // slate-700
      gradient.addColorStop(1, 'rgba(51, 65, 85, 0.95)'); // slate-600
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw waves
      waves.forEach(wave => {
        wave.update();
        wave.draw();
      });

      // Update and draw particles
      particles.forEach((particle, index) => {
        particle.update();
        particle.draw();

        if (particle.isDead()) {
          particles[index] = new Particle();
        }
      });

      // Draw connections between nearby particles
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.strokeStyle = `rgba(59, 130, 246, ${(100 - distance) / 100 * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
}
