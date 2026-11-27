// Vendored unchanged from atoms-ai-brand dist/assets/ai-identity/signal-engine.js (Signal v16),
// the brand-approved AI identity engine published at /atoms-ai-brand/ai-identity/.
// Do not edit here; re-copy from the brand repo when the kit changes.
const clamp = (value) => Math.max(0, Math.min(1, value));
// Zero first and second derivatives at both ends preserve motion at handoffs.
const smooth = (value) => { const t = clamp(value); return t * t * t * (t * (t * 6 - 15) + 10); };
const mix = (a, b, t) => a + (b - a) * t;
const durationOf = (value) => {
    if (!Number.isFinite(value) || value < 0)
        throw new RangeError('Transition duration must be a finite, non-negative number.');
    return value;
};
const validState = (state) => ['idle', 'listening', 'thinking', 'speaking'].includes(state);
/** The brand's cubic-bezier(0.7, 0, 0.3, 1), solved without reading the DOM. */
function ease(value) {
    if (value <= 0 || value >= 1)
        return clamp(value);
    let low = 0, high = 1;
    for (let i = 0; i < 20; i++) {
        const u = (low + high) / 2;
        const x = 2.1 * (1 - u) * (1 - u) * u + .9 * (1 - u) * u * u + u * u * u;
        if (x < value)
            low = u;
        else
            high = u;
    }
    const u = (low + high) / 2;
    return u * u * (3 - 2 * u);
}
/** Monotone cubic motion keeps the slits moving without stops at each position. */
function trackAt(track, phase, key) {
    let segment = 0;
    while (segment < track.length - 2 && phase > track[segment + 1].at)
        segment++;
    const slope = (i) => (track[i + 1][key] - track[i][key]) / (track[i + 1].at - track[i].at);
    const tangent = (i) => {
        if (i === 0 || i === track.length - 1)
            return key === 'center' ? slope(i === 0 ? 0 : i - 1) : 0;
        const before = slope(i - 1), after = slope(i);
        if (before * after <= 0)
            return 0;
        const a = track[i].at - track[i - 1].at, b = track[i + 1].at - track[i].at;
        return 3 * (a + b) / ((a + 2 * b) / before + (2 * a + b) / after);
    };
    const a = track[segment], b = track[segment + 1], span = b.at - a.at;
    const t = clamp((phase - a.at) / span), t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * a[key] + (t3 - 2 * t2 + t) * span * tangent(segment)
        + (-2 * t3 + 3 * t2) * b[key] + (t3 - t2) * span * tangent(segment + 1);
}
/** Three slits travel outward on each half; only a completely closed slit recycles. */
export function thinkingPoseAt(elapsed, index, config) {
    const blade = config.blades[config.channels[index].base], wave = config.thinking;
    const count = config.channels.length / 2;
    const phase = ((blade.n + .5 + elapsed / wave.stepMs) % count + count) % count;
    const center = trackAt(wave.track, phase, 'center');
    const width = Math.max(0, trackAt(wave.track, phase, 'width'));
    const radius = trackAt(wave.track, phase, 'radius');
    const scale = radius / blade.radius;
    const mirroredCenter = blade.direction === 1 ? center : 100 - center;
    const tip = mirroredCenter + blade.direction * width / 2;
    return { x: tip - blade.tip * scale, y: 50 * (1 - scale), scale,
        clipX: mirroredCenter - width / 2, clipWidth: width };
}
/** One shared speech envelope combines syllables, accents and phrase pauses. */
export function speakingPoseAt(elapsed, index, config, output = 1) {
    const blade = config.blades[config.channels[index].base], wave = config.speaking;
    const phase = ((elapsed % wave.duration) + wave.duration) % wave.duration;
    let remaining = 1;
    for (const pulse of wave.pulses) {
        const time = phase - pulse.at;
        if (time < 0 || time >= pulse.attack + pulse.release)
            continue;
        const envelope = time < pulse.attack ? smooth(time / pulse.attack)
            : 1 - smooth((time - pulse.attack) / pulse.release);
        // Blend overlapping syllables smoothly, bounded without clipping peaks.
        remaining *= 1 - pulse.depth / .8 * envelope;
    }
    const level = .8 * (1 - remaining);
    const retreat = level * mix(.35, 1, clamp(output));
    return { x: -blade.direction * blade.width * retreat, y: 0, scale: 1,
        clipX: blade.x, clipWidth: blade.width };
}
/** Deterministic sampler: time is in milliseconds and may be frozen by the host. */
export class SignalMotion {
    config;
    transitionMs;
    state;
    layer;
    levels = { input: 0, output: 1 };
    levelBlend = { from: this.levels, to: this.levels, start: 0 };
    constructor(config, options = {}, initialPose) {
        this.config = config;
        this.transitionMs = durationOf(options.transitionMs ?? config.transitionMs);
        this.state = options.state ?? 'idle';
        if (!validState(this.state))
            throw new TypeError('Unknown Signal state.');
        this.layer = { kind: 'state', state: this.state, start: 0 };
        if (initialPose && this.transitionMs > 0)
            this.layer = { kind: 'blend', from: { kind: 'still', pose: initialPose }, to: this.layer, start: 0, duration: this.transitionMs };
    }
    prune(layer, time) {
        if (layer.kind !== 'blend')
            return layer;
        if (time >= layer.start + layer.duration)
            return layer.to;
        layer.from = this.prune(layer.from, time);
        return layer;
    }
    setState(state, time, duration = this.transitionMs) {
        if (!validState(state))
            throw new TypeError('Unknown Signal state.');
        durationOf(duration);
        if (state === this.state)
            return;
        this.state = state;
        const to = { kind: 'state', state, start: time };
        // Continue the outgoing trajectory through an interruption. Do not flatten it
        // to a frozen frame: that would discard its velocity and cause a visible hitch.
        let from = this.prune(this.layer, time);
        // Several requests in one frame have not contributed any motion yet.
        if (from.kind === 'blend' && from.start === time)
            from = from.from;
        this.layer = duration === 0 ? to : { kind: 'blend', from, to, start: time, duration };
    }
    setLevels(levels, time) {
        const next = { ...this.levelBlend.to, ...levels };
        if (!Number.isFinite(next.input) || !Number.isFinite(next.output))
            throw new RangeError('Audio levels must be finite numbers.');
        this.levelBlend = { from: this.sampleLevels(time), to: { input: clamp(next.input), output: clamp(next.output) }, start: time };
    }
    sampleLevels(time) {
        const t = smooth((time - this.levelBlend.start) / 120);
        this.levels = { input: mix(this.levelBlend.from.input, this.levelBlend.to.input, t), output: mix(this.levelBlend.from.output, this.levelBlend.to.output, t) };
        return this.levels;
    }
    rest(state = this.state) { return this.statePose(state, 0, false); }
    /** Hold a still state while paused or with reduced motion, then blend on resume. */
    hold() { this.layer = { kind: 'still', pose: this.rest() }; }
    resume(time) {
        if (this.layer.kind !== 'still')
            return;
        const to = { kind: 'state', state: this.state, start: time };
        this.layer = this.transitionMs === 0 ? to : { kind: 'blend', from: this.layer, to, start: time, duration: this.transitionMs };
    }
    isMoving(time) {
        this.layer = this.prune(this.layer, time);
        return this.layer.kind === 'blend' || (this.layer.kind === 'state' && this.layer.state !== 'idle');
    }
    sample(time) {
        this.sampleLevels(time);
        this.layer = this.prune(this.layer, time);
        return this.sampleLayer(this.layer, time);
    }
    sampleLayer(layer, time) {
        if (layer.kind === 'still')
            return layer.pose;
        if (layer.kind === 'state')
            return this.statePose(layer.state, time - layer.start, true);
        const t = smooth((time - layer.start) / layer.duration);
        const from = this.sampleLayer(layer.from, time), to = this.sampleLayer(layer.to, time);
        if (t === 0)
            return from;
        if (t === 1)
            return to;
        return from.map((pose, i) => {
            const target = to[i], width = mix(pose.clipWidth, target.clipWidth, t);
            // A closed slit has no visible position. Exclude it from the spatial blend
            // so its center-to-edge reset cannot pull an in-flight transition sideways.
            const weight = width > 1e-12 ? t * target.clipWidth / width : t;
            const center = mix(pose.clipX + pose.clipWidth / 2, target.clipX + target.clipWidth / 2, weight);
            const blade = this.config.blades[this.config.channels[i].base];
            const scale = mix(pose.scale, target.scale, weight);
            const inset = (p) => p.x + blade.tip * p.scale
                - (p.clipX + p.clipWidth / 2) - blade.direction * p.clipWidth / 2;
            return { x: center + blade.direction * width / 2 + mix(inset(pose), inset(target), weight) - blade.tip * scale,
                y: 50 * (1 - scale), scale, clipX: center - width / 2, clipWidth: width };
        });
    }
    statePose(state, elapsed, animated) {
        const motion = this.config.states[state];
        return this.config.channels.map((channel, i) => {
            const blade = this.config.blades[channel.base];
            let retreat = motion.rest[channel.base];
            if (state === 'thinking' && animated) {
                return thinkingPoseAt(elapsed, i, this.config);
            }
            else if (state === 'speaking' && animated) {
                return speakingPoseAt(elapsed, i, this.config, this.levels.output);
            }
            else if (animated && motion.duration > 0) {
                const rank = 2 - blade.n;
                const phase = (Math.max(0, elapsed - rank * motion.stagger) % motion.duration) / motion.duration;
                for (let j = 1; j < motion.frames.length; j++) {
                    const [end, b] = motion.frames[j], [start, a] = motion.frames[j - 1];
                    if (phase <= end) {
                        retreat = mix(a, b, ease((phase - start) / (end - start)));
                        break;
                    }
                }
                if (state === 'listening')
                    retreat *= 1 - this.levels.input;
            }
            return { x: -blade.direction * blade.width * retreat, y: 0, scale: 1, clipX: channel.extra ? blade.x + blade.width / 2 : blade.x, clipWidth: channel.extra ? 0 : blade.width };
        });
    }
}
/** Mount on an inline Signal SVG. Interpolate the same circles and slit openings. */
export function createSignal(svg, config, options = {}) {
    const circles = [...svg.querySelectorAll('circle')];
    const clips = [...svg.querySelectorAll('clipPath rect')];
    if (circles.length !== config.channels.length || clips.length !== circles.length)
        throw new Error('Signal SVG and motion geometry do not match.');
    const styles = circles.map(circle => circle.getAttribute('style'));
    const clipAttributes = clips.map(clip => ({ x: clip.getAttribute('x'), width: clip.getAttribute('width'), style: clip.getAttribute('style') }));
    const originalState = svg.dataset.state;
    const previousEngine = svg.getAttribute('data-motion-engine');
    if (previousEngine)
        throw new Error('This Signal SVG already has a motion engine.');
    // Read once before writing, so adoption of a running CSS fallback does not jump.
    const initial = circles.map((circle, i) => {
        const style = getComputedStyle(circle);
        const matrix = new DOMMatrixReadOnly(style.transform);
        const clipStyle = getComputedStyle(clips[i]);
        const clipX = parseFloat(clipStyle.x), clipWidth = parseFloat(clipStyle.width);
        return { x: matrix.e, y: matrix.f, scale: matrix.a, clipX: Number.isFinite(clipX) ? clipX : Number(clipAttributes[i].x), clipWidth: Number.isFinite(clipWidth) ? clipWidth : Number(clipAttributes[i].width) };
    });
    const motion = new SignalMotion(config, { ...options, state: options.state ?? (validState(svg.dataset.state ?? '') ? svg.dataset.state : 'idle') }, initial);
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let paused = svg.dataset.paused === 'true', visible = true, destroyed = false;
    let time = 0, last = null, frame = null;
    svg.dataset.motionEngine = 'true';
    svg.dataset.state = motion.state;
    circles.forEach(circle => {
        circle.style.setProperty('animation', 'none', 'important');
        circle.style.setProperty('transition', 'none', 'important');
        circle.style.transformOrigin = '0px 0px';
        circle.style.transformBox = 'view-box';
    });
    clips.forEach(clip => {
        clip.style.setProperty('animation', 'none', 'important');
        clip.style.setProperty('transition', 'none', 'important');
    });
    const renderedClips = initial.map(() => ({ x: NaN, width: NaN }));
    const render = (pose) => circles.forEach((circle, i) => {
        const { x, y, scale, clipX, clipWidth } = pose[i];
        // A single scale value preserves circles during every intermediate frame.
        circle.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        if (clipX !== renderedClips[i].x)
            clips[i].style.x = `${clipX}px`;
        if (clipWidth !== renderedClips[i].width)
            clips[i].style.width = `${clipWidth}px`;
        renderedClips[i] = { x: clipX, width: clipWidth };
    });
    const active = () => !destroyed && !paused && visible && !document.hidden && !media.matches;
    const stop = () => { if (frame !== null)
        cancelAnimationFrame(frame); frame = null; last = null; };
    const tick = (now) => {
        frame = null;
        if (!active()) {
            last = null;
            return;
        }
        if (last !== null)
            time += now - last;
        last = now;
        render(motion.sample(time));
        if (motion.isMoving(time))
            frame = requestAnimationFrame(tick);
        else
            last = null;
    };
    const sync = () => {
        if (!active())
            stop();
        else if (frame === null && motion.isMoving(time))
            frame = requestAnimationFrame(tick);
    };
    const onReducedMotion = () => {
        if (media.matches) {
            motion.hold();
            render(motion.rest());
        }
        else
            motion.resume(time);
        sync();
    };
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        sync();
    }, { rootMargin: '80px' });
    observer?.observe(svg);
    document.addEventListener('visibilitychange', sync);
    media.addEventListener('change', onReducedMotion);
    if (media.matches || paused) {
        motion.hold();
        render(motion.rest());
    }
    else
        render(initial);
    sync();
    return {
        get state() { return motion.state; },
        setState(state, transitionMs = motion.transitionMs) {
            if (destroyed)
                return;
            motion.setState(state, time, transitionMs);
            svg.dataset.state = state;
            if (paused || media.matches) {
                motion.hold();
                render(motion.rest());
            }
            else
                render(motion.sample(time));
            sync();
        },
        setPaused(value) {
            if (destroyed)
                return;
            paused = value;
            svg.dataset.paused = String(value);
            if (!paused && !media.matches)
                motion.resume(time);
            sync();
        },
        setLevels(levels) {
            if (!destroyed && !media.matches)
                motion.setLevels(levels, time);
        },
        destroy() {
            if (destroyed)
                return;
            destroyed = true;
            stop();
            observer?.disconnect();
            media.removeEventListener('change', onReducedMotion);
            document.removeEventListener('visibilitychange', sync);
            delete svg.dataset.motionEngine;
            if (originalState === undefined)
                delete svg.dataset.state;
            else
                svg.dataset.state = originalState;
            circles.forEach((circle, i) => styles[i] === null ? circle.removeAttribute('style') : circle.setAttribute('style', styles[i]));
            clips.forEach((clip, i) => clipAttributes[i].style === null ? clip.removeAttribute('style') : clip.setAttribute('style', clipAttributes[i].style));
        },
    };
}

export const signalMotion = {"transitionMs":600,"blades":[{"x":31,"cx":1,"radius":50,"tip":51,"width":20,"direction":1,"n":0},{"x":49,"cx":99,"radius":50,"tip":49,"width":20,"direction":-1,"n":0},{"x":18,"cx":-9,"radius":42,"tip":33,"width":15,"direction":1,"n":1},{"x":67,"cx":109,"radius":42,"tip":67,"width":15,"direction":-1,"n":1},{"x":8,"cx":-20,"radius":36,"tip":16,"width":8,"direction":1,"n":2},{"x":84,"cx":120,"radius":36,"tip":84,"width":8,"direction":-1,"n":2}],"channels":[{"base":0,"extra":false,"x":31,"width":20,"tip":51,"radius":50,"height":40},{"base":1,"extra":false,"x":49,"width":20,"tip":49,"radius":50,"height":40},{"base":2,"extra":false,"x":18,"width":15,"tip":33,"radius":42,"height":32.17141588429082},{"base":3,"extra":false,"x":67,"width":15,"tip":67,"radius":42,"height":32.17141588429082},{"base":4,"extra":false,"x":8,"width":8,"tip":16,"radius":36,"height":22.627416997969522},{"base":5,"extra":false,"x":84,"width":8,"tip":84,"radius":36,"height":22.627416997969522}],"states":{"idle":{"duration":0,"rest":[0,0,0,0,0,0],"frames":[],"stagger":0},"listening":{"duration":2400,"rest":[0.16,0.16,0.28,0.28,0.38,0.38],"frames":[[0,0.3],[0.42,0.04],[0.76,0.3],[1,0.3]],"stagger":120},"thinking":{"duration":2250,"rest":[0,0,0,0,0,0],"frames":[],"stagger":0},"speaking":{"duration":12000,"rest":[0,0,0,0,0,0],"frames":[],"stagger":0}},"thinking":{"stepMs":750,"track":[{"at":0,"center":51,"width":0,"radius":50},{"at":0.5,"center":41,"width":20,"radius":50},{"at":1.5,"center":25.5,"width":15,"radius":42},{"at":2.5,"center":12,"width":8,"radius":36},{"at":3,"center":8,"width":0,"radius":36}],"duration":2250},"speaking":{"duration":12000,"pulses":[{"at":100,"attack":95,"release":228,"depth":0.0754},{"at":205,"attack":66,"release":262,"depth":0.1004},{"at":432,"attack":71,"release":232,"depth":0.5373},{"at":565,"attack":67,"release":98,"depth":0.1898},{"at":1149,"attack":71,"release":209,"depth":0.6133},{"at":1278,"attack":54,"release":145,"depth":0.2774},{"at":1431,"attack":53,"release":234,"depth":0.311},{"at":1637,"attack":85,"release":224,"depth":0.0839},{"at":2438,"attack":94,"release":231,"depth":0.5448},{"at":2644,"attack":105,"release":211,"depth":0.2071},{"at":2754,"attack":53,"release":122,"depth":0.4009},{"at":2901,"attack":123,"release":233,"depth":0.1316},{"at":3148,"attack":78,"release":115,"depth":0.2164},{"at":3357,"attack":99,"release":244,"depth":0.3199},{"at":4219,"attack":102,"release":214,"depth":0.635},{"at":4384,"attack":91,"release":226,"depth":0.1613},{"at":4559,"attack":115,"release":169,"depth":0.14},{"at":4702,"attack":82,"release":252,"depth":0.3328},{"at":5424,"attack":115,"release":135,"depth":0.546},{"at":5575,"attack":99,"release":175,"depth":0.3161},{"at":5691,"attack":74,"release":103,"depth":0.3101},{"at":6233,"attack":76,"release":224,"depth":0.596},{"at":6432,"attack":54,"release":228,"depth":0.3407},{"at":6555,"attack":82,"release":218,"depth":0.1406},{"at":6714,"attack":112,"release":172,"depth":0.3427},{"at":6828,"attack":111,"release":235,"depth":0.1794},{"at":6927,"attack":70,"release":161,"depth":0.0867},{"at":7084,"attack":81,"release":230,"depth":0.3667},{"at":8272,"attack":70,"release":265,"depth":0.1747},{"at":8365,"attack":118,"release":154,"depth":0.6215},{"at":8611,"attack":101,"release":130,"depth":0.0758},{"at":8778,"attack":53,"release":139,"depth":0.2763},{"at":9812,"attack":78,"release":218,"depth":0.182},{"at":9953,"attack":76,"release":211,"depth":0.3243},{"at":10239,"attack":108,"release":94,"depth":0.1229},{"at":10343,"attack":92,"release":134,"depth":0.578},{"at":10516,"attack":107,"release":266,"depth":0.0901}]}};
