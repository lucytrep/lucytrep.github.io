// LUCILLE TREPANIER, full viewport, slight bulge, slow right-to-left.
// Lands with LUCILLE already filling the screen, then TREPANIER follows.
// https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame

const title = document.querySelector('.stretched-text');

if (title) {
    const WORD = 'LUCILLE TREPANIER';
    const THETA_MAX = 0.48;
    const SPEED = 32;
    const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    title.setAttribute('aria-label', 'Lucille Trepanier');

    let letters = [];
    let cycle = 1;
    let windowNatural = 1;
    let offset = 0;
    let speed = REDUCED_MOTION ? 0 : SPEED;
    let lastTime = performance.now();
    let resizeFrame = 0;

    function wrap(value, length) {
        return ((value % length) + length) % length;
    }

    function project(t, half) {
        const edge = Math.sin(THETA_MAX);
        if (t >= -1 && t <= 1) {
            return (Math.sin(t * THETA_MAX) / edge) * half + half;
        }

        // Keep moving off-screen instead of wrapping back onto the page.
        const side = t < 0 ? -1 : 1;
        const xEdge = t < 0 ? 0 : half * 2;
        const slope = half * THETA_MAX * Math.cos(side * THETA_MAX) / edge;
        return xEdge + (t - side) * slope;
    }

    function addLetter(char, widthOverride) {
        const span = document.createElement('span');
        span.className = 'letter';
        span.textContent = char === ' ' ? '\u00A0' : char;
        if (char === ' ') span.style.width = '0.35em';
        if (widthOverride) span.style.width = `${widthOverride}px`;
        span.setAttribute('aria-hidden', 'true');
        title.appendChild(span);

        const width = widthOverride || span.offsetWidth;
        const base = letters.length
            ? letters[letters.length - 1].base + letters[letters.length - 1].width
            : 0;
        letters.push({ el: span, base, width });
        return width;
    }

    function addWord() {
        [...WORD].forEach((char) => addLetter(char));
    }

    function build() {
        title.replaceChildren();
        letters = [];

        addWord();
        const lucilleWidth = letters
            .slice(0, 7)
            .reduce((sum, letter) => sum + letter.width, 0);
        const wordWidth = letters.reduce((sum, letter) => sum + letter.width, 0);
        const gapWidth = Math.max(lucilleWidth * 0.12, 24);

        addLetter(' ', gapWidth);
        cycle = wordWidth + gapWidth;

        addWord();
        addLetter(' ', gapWidth);
        addWord();
        addLetter(' ', gapWidth);
        addWord();

        windowNatural = lucilleWidth || cycle;
        offset = wrap(offset, cycle);
        paint();
    }

    function paint() {
        const viewWidth = window.innerWidth;
        const half = viewWidth / 2;

        letters.forEach((letter) => {
            const left = letter.base - offset;
            const right = left + letter.width;
            const t0 = left / windowNatural * 2 - 1;
            const t1 = right / windowNatural * 2 - 1;
            const x0 = project(t0, half);
            const x1 = project(t1, half);
            const screenW = x1 - x0;

            if (x1 < 0 || x0 > viewWidth || screenW < 1) {
                letter.el.style.visibility = 'hidden';
                return;
            }

            letter.el.style.visibility = 'visible';
            letter.el.style.position = 'absolute';
            letter.el.style.left = `${x0}px`;
            letter.el.style.bottom = '0';
            letter.el.style.top = 'auto';
            letter.el.style.transformOrigin = 'left bottom';
            letter.el.style.transform = `scaleX(${screenW / letter.width})`;
        });
    }

    function tick(now) {
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;

        if (!REDUCED_MOTION) {
            offset = wrap(offset + speed * dt, cycle);
        }

        paint();
        requestAnimationFrame(tick);
    }

    window.addEventListener('resize', () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(build);
    });

    document.fonts.ready.then(() => {
        build();
        lastTime = performance.now();
        requestAnimationFrame(tick);
    });
}
