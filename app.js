/*
   NAIROBI AFTER DARK - Seb-Like Refinement
   Using GSAP & ScrollTrigger
*/

document.addEventListener('DOMContentLoaded', () => {
    // 1. GSAP Custom Cursor
    const cursor = document.getElementById('cursor');
    const dot = cursor.querySelector('.cursor__dot');
    const ring = cursor.querySelector('.cursor__ring');

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Dot follows instantly
        gsap.to(dot, { x: mouseX, y: mouseY, duration: 0 });
    });

    // Ring follows with lag
    gsap.ticker.add(() => {
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;
        gsap.set(ring, { x: ringX, y: ringY });
    });

    // 2. Initial Page Reveal
    const tl = gsap.timeline();
    
    tl.to('.loading-screen', {
        opacity: 0,
        duration: 1,
        delay: 1,
        onComplete: () => {
          document.getElementById('loadingScreen').remove();
        }
    })
    .from('[data-gsap="reveal"]', {
        y: 40,
        opacity: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: 'power4.out'
    }, '-=0.5');

    // 3. Magnetic Interaction
    document.querySelectorAll('.btn-magnetic').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            gsap.to(btn, {
                x: x * 0.35,
                y: y * 0.35,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
        
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0, y: 0,
                duration: 0.5,
                ease: 'elastic.out(1, 0.3)'
            });
        });
    });

    // 4. Culture Marquee
    gsap.to('.culture__marquee span', {
        xPercent: -50,
        repeat: -1,
        duration: 30,
        ease: 'linear'
    });

    // 5. Header Scroll Effect
    const header = document.querySelector('.site-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 6. Project Image Reveal
    document.querySelectorAll('.project').forEach(item => {
        const reveal = item.querySelector('.work__image-reveal');
        
        item.addEventListener('mousemove', (e) => {
            const rect = item.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            gsap.to(reveal, {
                x: x - 400, // Offset to right
                y: y - 130, // Center vertically
                duration: 0.5,
                ease: 'power2.out'
            });
        });
    });

    // 7. ScrollTrigger Reveals for the rest
    gsap.utils.toArray('section:not(#intro) [data-gsap="reveal"], .culture__card').forEach(el => {
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            },
            y: 40,
            opacity: 0,
            duration: 1,
            ease: 'power3.out'
        });
    });

    // 8. Cursor Pulse on Interactables
    document.querySelectorAll('a, button, .project, .chip, .highlight, .about__meta').forEach(el => {
        el.addEventListener('mouseenter', () => {
            gsap.to(ring, { scale: 1.5, borderColor: 'var(--accent)', duration: 0.3 });
        });
        el.addEventListener('mouseleave', () => {
            gsap.to(ring, { scale: 1, borderColor: 'rgba(255, 255, 255, 0.3)', duration: 0.3 });
        });
    });
});
