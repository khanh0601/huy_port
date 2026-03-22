const script = () => {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    ScrollTrigger.defaults({
        invalidateOnRefresh: true
    });
    const cvUnit = (val, unit) => {
        let result;
        switch (true) {
            case unit === 'vw':
                result = window.innerWidth * (val / 100);
                break;
            case unit === 'vh':
                result = window.innerHeight * (val / 100);
                break;
            case unit === 'rem':
                result = val / 10 * parseFloat($('html').css('font-size'));
                break;
            default: break;
        }
        return result;
    }
    const viewport = {
        get w() {
            return window.innerWidth;
        },
        get h() {
            return window.innerHeight;
        },
    }
    const device = { desktop: 991, tablet: 767, mobile: 479 }
    function activeItem(elArr, index) {
        elArr.forEach((el, idx) => {
            $(el).removeClass('active').eq(index).addClass('active')
        })
    }
    const pointer = {
        x: $(window).width() / 2,
        y: $(window).height() / 2,
        xNor: $(window).width() / 2 / $(window).width(),
        yNor: $(window).height() / 2 / $(window).height(),
    };
    const xSetter = (el) => gsap.quickSetter(el, "x", `px`);
    const ySetter = (el) => gsap.quickSetter(el, "y", `px`);
    const xGetter = (el) => gsap.getProperty(el, "x");
    const yGetter = (el) => gsap.getProperty(el, "y");
    const lerp = (a, b, t = 0.08) => {
        return a + (b - a) * t;
    };
    const debounce = (func, timeout = 300) => {
        let timer

        return (...args) => {
            clearTimeout(timer)
            timer = setTimeout(() => { func.apply(this, args) }, timeout)
        }
    }
    const refreshOnBreakpoint = () => {
        const breakpoints = Object.values(device).sort((a, b) => a - b);
        const initialViewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const breakpoint = breakpoints.find(bp => initialViewportWidth < bp) || breakpoints[breakpoints.length - 1];
        window.addEventListener('resize', debounce(function () {
            const newViewportWidth = window.innerWidth || document.documentElement.clientWidth;
            if ((initialViewportWidth < breakpoint && newViewportWidth >= breakpoint) ||
                (initialViewportWidth >= breakpoint && newViewportWidth < breakpoint)) {
                location.reload();
            }
        }));
    }
    const documentHeightObserver = (() => {
        let previousHeight = document.documentElement.scrollHeight;
        let resizeObserver;
        let debounceTimer;

        function refreshScrollTrigger() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const currentHeight = document.documentElement.scrollHeight;

                if (currentHeight !== previousHeight) {
                    console.log("Document height changed. Refreshing ScrollTrigger...");
                    ScrollTrigger.refresh();
                    previousHeight = currentHeight;
                }
            }, 200); // Adjust the debounce delay as needed
        }

        return (action) => {
            if (action === "init") {
                console.log("Initializing document height observer...");
                resizeObserver = new ResizeObserver(refreshScrollTrigger);
                resizeObserver.observe(document.documentElement);
            }
            else if (action === "disconnect") {
                console.log("Disconnecting document height observer...");
                if (resizeObserver) {
                    resizeObserver.disconnect();
                }
            }
        };
    })();
    const getAllScrollTrigger = (fn) => {
        let triggers = ScrollTrigger.getAll();
        triggers.forEach(trigger => {
            if (fn === "refresh") {
                if (trigger.progress === 0) {
                    trigger[fn]?.();
                }
            } else {
                trigger[fn]?.();
            }
        });
    };
    const isTouchDevice = () => {
        return (
            "ontouchstart" in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0
        );
    };
    if (!isTouchDevice()) {
        $("html").attr("data-has-cursor", "true");
        window.addEventListener("pointermove", function (e) {
            updatePointer(e);
        });
    } else {
        $("html").attr("data-has-cursor", "false");
        window.addEventListener("pointerdown", function (e) {
            updatePointer(e);
        });
    }
    function updatePointer(e) {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.xNor = (e.clientX / $(window).width() - 0.5) * 2;
        pointer.yNor = (e.clientY / $(window).height() - 0.5) * 2;
        if (cursor.userMoved != true && viewport.w >= 992) {
            cursor.userMoved = true;
            cursor.init();
        }
    }
    class Loading {
        constructor() { }
        isDoneLoading() {
            return true;
        }
    }
    let load = new Loading();
    class Marquee {
        constructor(list, duration = 40) {
            this.list = list;
            this.duration = duration;
        }
        setup(isReverse) {
            let itemClone = this.list.find('[data-marquee="item"]').clone();
            let itemWidth = this.list.find('[data-marquee="item"]').width();
            const cloneAmount = Math.ceil(viewport.w / itemWidth) + 1;
            this.list.html("");
            new Array(cloneAmount).fill().forEach(() => {
                let html = itemClone.clone();
                html.css(
                    "animation-duration",
                    `${Math.ceil(itemWidth / this.duration)}s`,
                );
                if (isReverse) {
                    html.css("animation-direction", "reverse");
                }
                html.addClass("anim-marquee");
                this.list.append(html);
            });
        }
    }
    class Cursor {
        constructor() {
            this.targetX = pointer.x;
            this.targetY = pointer.y;
            this.userMoved = false;
            xSetter(".cursor-main")(this.targetX);
            ySetter(".cursor-main")(this.targetY);
        }
        init() {
            requestAnimationFrame(this.update.bind(this));
            $(".cursor").addClass("active");
        }
        isUserMoved() {
            return this.userMoved;
        }
        update() {
            if (this.userMoved || load.isDoneLoading()) {
                this.updatePosition();
            }
            requestAnimationFrame(this.update.bind(this));
        }
        updateHtml() {
            $('[data-cursor="bg"]').each((idx, el) => {
                let bg = '--cl-' + ($(el).attr('data-bg') || 'white')
                $(el).find('.txt, .heading').css({
                    'position': 'relative',
                    'z-index': '2'
                })
                $(el).find('.ic-embed:not(.ic-arr-main):not(.ic-arr-clone)').css({
                    'position': 'relative',
                    'z-index': '2'
                })
                let btnDot = $(document.createElement('div')).addClass('bg-dot');
                let btnDotInner = $(document.createElement('div')).addClass('bg-dot-inner').css('background-color', `var(${bg})`);
                btnDot.append(btnDotInner)
                $(el).append(btnDot)
            })
        }
        updatePosition() {
            this.targetX = pointer.x;
            this.targetY = pointer.y;
            let targetInnerX = xGetter(".cursor-main");
            let targetInnerY = yGetter(".cursor-main");

            if ($("[data-cursor]:hover").length) {
                this.onHover();
            } else {
                this.reset();
            }

            if (
                Math.hypot(this.targetX - targetInnerX, this.targetY - targetInnerY) >
                1 ||
                Math.abs(smoothScroll.lenis.velocity) > 0.1
            ) {
                xSetter(".cursor-main")(lerp(targetInnerX, this.targetX, 0.1));
                ySetter(".cursor-main")(
                    lerp(targetInnerY, this.targetY - smoothScroll.lenis.velocity / 16, 0.1)
                );
            }
        }
        isMouseInSection(el) {
            const rect = el.getBoundingClientRect();
            return (
                pointer.x >= rect.left &&
                pointer.x <= rect.right &&
                pointer.y >= rect.top &&
                pointer.y <= rect.bottom
            );
        }

        onHover() {
            let type = $("[data-cursor]:hover").attr("data-cursor");
            let gotBtnSize = false;
            if ($("[data-cursor]:hover").length) {
                $('.cursor').addClass('on-hover');
                switch (type) {
                    case "hidden":
                        $(".cursor").addClass("on-hover-hidden");
                        break;
                    case 'bg':
                        $('.cursor').addClass('on-hover-hidden');
                        let targetBg;
                        targetBg = $('[data-cursor="bg"]:hover')
                        this.targetX = targetBg.get(0).getBoundingClientRect().left + targetBg.get(0).getBoundingClientRect().width / 2;
                        this.targetY = targetBg.get(0).getBoundingClientRect().top + targetBg.get(0).getBoundingClientRect().height / 2;
                        let bgDotX, bgDotY;
                        if (!gotBtnSize) {
                            if ($('[data-cursor]:hover').hasClass('home-ser-item-btn')) {
                                gsap.set('html', { '--cursor-width': `${targetBg.get(0).getBoundingClientRect().width}px`, '--cursor-height': `${targetBg.get(0).getBoundingClientRect().height}px` })
                            } else if ($('[data-cursor]:hover').hasClass('sm-menu')) {
                                gsap.set('html', { '--cursor-width': `${targetBg.get(0).getBoundingClientRect().width * 1.6}px`, '--cursor-height': `${targetBg.get(0).getBoundingClientRect().height * 1.3}px` })
                            } else {
                                gsap.set('html', { '--cursor-width': `${targetBg.get(0).getBoundingClientRect().width * 1.4}px`, '--cursor-height': `${targetBg.get(0).getBoundingClientRect().height * 1.4}px` })
                            }

                            bgDotX = (pointer.x - targetBg.get(0).getBoundingClientRect().left)
                            bgDotY = (pointer.y - targetBg.get(0).getBoundingClientRect().top)
                            xSetter('[data-cursor]:hover .bg-dot')(lerp(bgDotX, (pointer.x - targetBg.get(0).getBoundingClientRect().left)), .12)
                            ySetter('[data-cursor]:hover .bg-dot')(lerp(bgDotY, (pointer.y - targetBg.get(0).getBoundingClientRect().top)), .12)
                            gotBtnSize = true
                        } else {
                            bgDotX = xGetter('[data-cursor]:hover .bg-dot')
                            bgDotY = yGetter('[data-cursor]:hover .bg-dot')
                            xSetter('[data-cursor]:hover .bg-dot')(lerp(bgDotX, (pointer.x - targetBg.get(0).getBoundingClientRect().left)), .12)
                            ySetter('[data-cursor]:hover .bg-dot')(lerp(bgDotY, (pointer.y - targetBg.get(0).getBoundingClientRect().top)), .12)
                        }

                        break;
                    case "txtLink":
                        $(".cursor-inner").addClass("on-hover-sm");
                        let targetEl;
                        if (
                            $("[data-cursor]:hover").attr("data-cursor-txtLink") == "parent"
                        ) {
                            targetEl = $("[data-cursor]:hover").parent();
                        } else if (
                            $("[data-cursor]:hover").attr("data-cursor-txtLink") == "child"
                        ) {
                            targetEl = $("[data-cursor]:hover").find(
                                "[data-cursor-txtLink-child]"
                            );
                        } else {
                            targetEl = $("[data-cursor]:hover");
                        }

                        this.targetX =
                            targetEl.get(0).getBoundingClientRect().left - cvUnit(12, 'rem');
                        this.targetY =
                            targetEl.get(0).getBoundingClientRect().top +
                            targetEl.get(0).getBoundingClientRect().height / 2;
                        break;
                    case "on-drag":
                        $(".cursor").addClass("on-drag");
                        break;
                    default:
                        break;
                }
            } else {
                this.reset();
            }
        }
        reset() {
            $(".cursor").removeClass("on-drag");
            $(".cursor").removeClass("on-hover-hidden");
            $('.cursor').removeClass('on-hover');
            $('[data-cursor] .txt').css('transform', 'translateX(0px)')
        }
    }
    let cursor = new Cursor();
    function scrollTop(onComplete) {
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
        smoothScroll.scrollToTop({
            onComplete: () => {
                onComplete?.();
                getAllScrollTrigger("refresh");
            }
        });
    }
    class SmoothScroll {
        constructor() {
            this.lenis = null;
            this.scroller = {
                scrollX: window.scrollX,
                scrollY: window.scrollY,
                velocity: 0,
                direction: 0,
            };
            this.lastScroller = {
                scrollX: window.scrollX,
                scrollY: window.scrollY,
                velocity: 0,
                direction: 0,
            };
        }

        init() {
            this.reInit();

            $.easing.lenisEase = function (t) {
                return Math.min(1, 1.001 - Math.pow(2, -10 * t));
            };

            gsap.ticker.add((time) => {
                if (this.lenis) {
                    this.lenis.raf(time * 1000);
                }
            });
            gsap.ticker.lagSmoothing(0);
        }

        reInit() {
            if (this.lenis) {
                this.lenis.destroy();
            }
            this.lenis = new Lenis({
                lerp: 0.07,
                wheelMultiplier: 0.5
            });
            this.lenis.on("scroll", (e) => {
                this.updateOnScroll(e);
                ScrollTrigger.update();
            });
        }
        reachedThreshold(threshold) {
            if (!threshold) return false;
            const dist = distance(
                this.scroller.scrollX,
                this.scroller.scrollY,
                this.lastScroller.scrollX,
                this.lastScroller.scrollY
            );

            if (dist > threshold) {
                this.lastScroller = { ...this.scroller };
                return true;
            }
            return false;
        }

        updateOnScroll(e) {
            this.scroller.scrollX = e.scroll;
            this.scroller.scrollY = e.scroll;
            this.scroller.velocity = e.velocity;
            this.scroller.direction = e.direction;
            if (header) {
                header.updateOnScroll(this.lenis);
            }
        }

        start() {
            if (this.lenis) {
                this.lenis.start();
            }
            $(".body").css("overflow", "initial");
        }

        stop() {
            if (this.lenis) {
                this.lenis.stop();
            }
            $(".body").css("overflow", "hidden");
        }

        scrollTo(target, options = {}) {
            if (this.lenis) {
                this.lenis.scrollTo(target, options);
            }
        }

        scrollToTop(options = {}) {
            if (this.lenis) {
                this.lenis.scrollTo("top", { duration: .0001, immediate: true, lock: true, ...options });
            }
        }

        destroy() {
            if (this.lenis) {
                gsap.ticker.remove((time) => {
                    this.lenis.raf(time * 1000);
                });
                this.lenis.destroy();
                this.lenis = null;
            }
        }
    }
    const smoothScroll = new SmoothScroll();
    smoothScroll.init();

    class TriggerSetup extends HTMLElement {
        constructor() {
            super();
            this.tlTrigger = null;
            this.onTrigger = () => { };
        }
        connectedCallback() {
            this.tlTrigger = gsap.timeline({
                scrollTrigger: {
                    trigger: $(this).find('section'),
                    start: 'top bottom+=50%',
                    end: 'bottom top-=50%',
                    once: true,
                    onEnter: () => {
                        this.onTrigger?.();
                    }
                }
            });
        }
        destroy() {
            if (this.tlTrigger) {
                this.tlTrigger.kill();
                this.tlTrigger = null;
            }
        }
    }
    class Header {
        constructor() {
            this.el = null;
            this.isOpen = false;
            this.listDependent = [];
        }
        init(data) {
            this.el = document.querySelector('.header');
            this.animationReveal();
            if (viewport.w <= 991) {
                this.interact();
            }
        }
        animationReveal() {
            gsap.set('.header-inner', { autoAlpha: 0, y: -100 })
            gsap.to('.header-inner', { autoAlpha: 1, y: 0, duration: 1, ease: 'power1.inOut' })
        }
        updateOnScroll(inst) {
            this.toggleHide(inst);
            this.toggleScroll(inst);
            this.onHideDependent(inst);
        }
        onHideDependent() {
            let heightHeader = $(this.el).outerHeight();
            if (!$(this.el).hasClass('on-hide')) {
                this.listDependent.forEach((item) => {
                    $(item).css('top', heightHeader);
                });
            } else {
                this.listDependent.forEach((item) => {
                    $(item).css('top', 0);
                });
            }
        }
        registerDependent(dependentEl) {
            this.listDependent.push(dependentEl);
        }
        unregisterDependent(dependentEl) {
            if (this.listDependent.includes(dependentEl)) {
                this.listDependent = this.listDependent.filter((item) => item !== dependentEl);
            }
        }
        toggleScroll(inst) {
            if (inst.scroll > cvUnit(44, 'rem')) $(this.el).addClass("on-scroll");
            else $(this.el).removeClass("on-scroll");
        }
        toggleHide(inst) {
            if (inst.direction == 1) {
                if (inst.scroll > ($(this.el).height() * 3)) {
                    $(this.el).addClass('on-hide');
                }
            } else if (inst.direction == -1) {
                if (inst.scroll > ($(this.el).height() * 3)) {
                    $(this.el).addClass("on-hide");
                    $(this.el).removeClass("on-hide");
                }
            }
            else {
                $(this.el).removeClass("on-hide");
            }
        }
        interact() {
            if (viewport.w <= 767) {
                $(this.el).find('.header-toggle').on('click', (e) => {
                    console.log('khanh');
                    e.preventDefault();
                    $(e.currentTarget).toggleClass('active');
                    $(this.el).find('.header-nav').toggleClass('active');
                });
                $(window).on('click', (e) => {
                    if (!$(e.target).closest('.header-toggle').length && !$(e.target).closest('.header-nav').length) {
                        $(this.el).find('.header-toggle').removeClass('active');
                        $(this.el).find('.header-nav').removeClass('active');
                    }
                });
            }
        }
    }
    const header = new Header();
    header.init();

    $('a[href^="#"]').on('click', function (e) {
        let target = $(this).attr('href');
        if (target && target !== '#') {
            e.preventDefault();
            smoothScroll.scrollTo(target, {
                offset: -$(header.el).outerHeight(),
            });
        }
    });
    class Footer {
        constructor() {
            this.el = null;
        }
        init() {
            this.el = document.querySelector('.footer');
            this.setup();
            viewport.w > 767 && this.animationReveal();
        }
        setup() {
            new Marquee($('.footer [data-marquee="list"]'), 40).setup();
        }
        animationReveal() {
            new MasterTimeline({
                timeline: gsap.timeline({
                    scrollTrigger: {
                        trigger: '.footer-head',
                        start: 'top top+=75%',
                        once: true,
                    },
                    onStart: () => {
                        console.log('onStart');
                        $('.df-init').removeClass('df-init');
                    }
                }),
                tweenArr: [
                    new RevealTextReset({ el: $('.footer-name').get(0), mask: 'lines', color: '#fff' }),
                    ...Array.from($('.footer-contact-item')).flatMap(item => [
                        new FadeIn({ el: $(item).find('.footer-contact-item-label') }),
                        new FadeIn({ el: $(item).find('.footer-contact-item-title') })
                    ]),
                ]
            })
            new MasterTimeline({
                timeline: gsap.timeline({
                    scrollTrigger: {
                        trigger: '.footer-marquee-cms',
                        start: 'top top+=80%',
                        once: true,
                    },
                    onStart: () => {
                        console.log('onStart');
                        $('.df-init').removeClass('df-init');
                    }
                }),
                tweenArr: [
                    ...Array.from($('.footer-marquee-item')).flatMap(item => [
                        new FadeSplitText({ el: $(item).get(0), mask: 'lines' })
                    ]),
                    ...Array.from($('.footer-social-item')).flatMap(item => [
                        new FadeIn({ el: item })
                    ]),
                    new FadeIn({ el: $('.footer-copy-txt txt') }),
                    ...Array.from($('.footer-menu-item')).flatMap(item => [
                        new FadeIn({ el: item })
                    ]),
                ]
            })
        }
    }
    const footer = new Footer();
    footer.init();
    const HomePage = {
        "home-hero-wrap": class extends TriggerSetup {
            constructor() {
                super();
                this.onTrigger = () => {
                    this.setup();
                    if (viewport.w > 767) this.animationReveal();
                };
            }
            setup() {
                new Marquee($('.home-hero [data-marquee="list"]'), 40).setup();
            }
            animationReveal() {
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-hero',
                            start: 'top bottom',
                            once: true,
                        },
                        onStart: () => {
                            console.log('onStart');
                            $('.df-init').removeClass('df-init');
                        }
                    }),
                    tweenArr: [
                        new FadeSplitText({ el: $('.home-hero-label').get(0), mask: 'lines' }),
                        // new FadeSplitText({ el: $('.home-hero-title').get(0), mask: 'lines' }),
                        new RevealTextReset({ el: $('.home-hero-title').get(0), mask: 'lines', color: '#ffffff' }),
                        ...Array.from($('.home-hero-social-item')).flatMap(item => [
                            new FadeIn({ el: item, delay: 0 }),
                        ]),
                    ]
                });
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-hero',
                            start: 'top bottom',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        new FadeIn({ el: $('.home-hero-cta').get(0), type: 'bottom' }),
                        ...Array.from($('.home-hero-job-item')).flatMap(item => [
                            new FadeIn({ el: item, delay: 0 }),
                        ]),
                        ...Array.from($('.home-hero-digi-item')).flatMap(item => [
                            new FadeSplitText({ el: $(item).get(0), mask: 'lines', splitType: 'chars' }),
                        ]),
                    ]
                });
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-hero',
                            start: 'top bottom',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        new FadeIn({ el: $('.home-hero-center').get(0), type: 'bottom' }),
                    ]
                });
            }
        },
        "home-about-wrap": class extends TriggerSetup {
            constructor() {
                super();
                this.onTrigger = () => {
                    this.setup();
                    if (viewport.w > 767) this.animationReveal();
                };
            }
            setup() {
                // split elements with the class "split" into words and characters
                let split = SplitText.create(".home-about-content-inner p", { type: "words, chars" });
                let tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: '.home-about-content-inner',
                        start: 'top top+=70%',
                        end: 'bottom top+=50%',
                        scrub: 1,
                    },
                });
                tl.fromTo(split.chars, { color: 'rgba(255, 255, 255, 0.20)' }, { color: '#ffffff', duration: 0.6, stagger: 0.1 });
                header.registerDependent('.home-about-avt-img');
            }
            animationReveal() {
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-about-head',
                            start: 'top top+=80%',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        new FadeSplitText({ el: $('.home-about-label').get(0), mask: 'lines' }),
                        ...Array.from($('.home-about-contact-item')).flatMap(item => [
                            new FadeSplitText({ el: $(item).find('.home-about-contact-item-label').get(0), mask: 'lines' }),
                            new FadeSplitText({ el: $(item).find('.home-about-contact-item-value').get(0), mask: 'lines' }),
                        ]),
                    ]
                });
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-about-main',
                            start: 'top top+=70%',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        new ScaleInset({ el: $('.home-about-avt-img').get(0), type: 'bottom' }),
                        ...Array.from($('.home-about-content-inner p')).flatMap((item, index) => [
                            new FadeIn({ el: item, type: 'bottom', delay: `${index * 0.2}` }),
                        ]),
                        new FadeIn({ el: $('.home-about-cta').get(0), type: 'bottom', delay: 1.6 }),
                    ]
                });
            }
        },
        "home-exper-wrap": class extends TriggerSetup {
            constructor() {
                super();
                this.onTrigger = () => {
                    this.setup();
                    viewport.w > 767 && this.animationReveal();
                };
            }
            setup() {
            }
            animationReveal() {
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-exper',
                            start: 'top top+=65%',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        new ScaleLine({ el: $('.home-exper-line').get(0), type: 'left' }),
                        new FadeSplitText({ el: $('.home-exper-label').get(0), mask: 'lines' }),
                        ...Array.from($('.home-exper-item')).flatMap(item => [
                            new FadeSplitText({ el: $(item).find('.home-exper-item-title').get(0), mask: 'lines' }),
                            new FadeSplitText({ el: $(item).find('.home-exper-item-sub').get(0), mask: 'lines' }),
                            new ScaleLine({ el: $(item).find('.home-exper-item-line').get(0), type: 'left' }),
                        ]),
                    ]
                });
            }
        },
        "home-comp-wrap": class extends TriggerSetup {
            constructor() {
                super();
                this.onTrigger = () => {
                    this.setup();
                    viewport.w > 767 && this.animationReveal();
                };
            }
            setup() {
                new Marquee($('.home-comp [data-marquee="list"]'), 40).setup();
            }
            animationReveal() {
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-comp',
                            start: 'top top+=75%',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        new FadeSplitText({ el: $('.home-comp-title').get(0), mask: 'lines' }),
                        ...Array.from($('.home-comp-item')).flatMap((item, index) => [
                            new FadeIn({ el: item, type: 'bottom', delay: `${index * 0.1}` })
                        ]),
                    ]
                });
            }
        },
        "home-skill-wrap": class extends TriggerSetup {
            constructor() {
                super();
                this.onTrigger = () => {
                    this.setup();
                    viewport.w > 767 && this.animationReveal();
                };
            }
            setup() {
            }
            animationReveal() {
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-skill',
                            start: 'top top+=75%',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        new RevealTextReset({ el: $('.home-skill-title').get(0), mask: 'lines', color: '#ffffff' }),
                        new FadeSplitText({ el: $('.home-skill-sub').get(0), mask: 'lines', delay: .01 }),
                    ]
                });
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-skill-main',
                            start: 'top top+=75%',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        ...Array.from($('.home-skill-item')).flatMap((item, index) => [
                            new FadeIn({ el: $(item).find('.home-skill-item-numb'), type: 'bottom', delay: `${index * 0.3}` }),
                            new FadeSplitText({ el: $(item).find('.home-skill-item-title').get(0), mask: 'lines', delay: `${index * 0.3}` }),
                            new FadeSplitText({ el: $(item).find('.home-skill-item-sub').get(0), mask: 'lines', delay: `${index * 0.3}` }),
                            new ScaleLine({ el: $(item).find('.home-skill-item-line'), type: 'left', delay: `${index * 0.3}` }),
                        ]),
                    ]
                });
            }
        },
        "home-brand-wrap": class extends TriggerSetup {
            constructor() {
                super();
                this.onTrigger = () => {
                    this.setup();
                    viewport.w > 767 && this.animationReveal();
                };
            }
            setup() {
            }
            animationReveal() {
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-brand-title-wrap',
                            start: 'top top+=60%',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        new FadeSplitText({ el: $('.home-brand-label').get(0), mask: 'lines' }),
                        new RevealTextReset({ el: $('.home-brand-title').get(0), mask: 'lines', color: '#ffffff' }),
                        new FadeSplitText({ el: $('.home-brand-sub').get(0), mask: 'lines' }),
                        new FadeSplitText({ el: $('.home-brand-desc').get(0), mask: 'lines' }),
                    ]
                });
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-brand-sub-wrap',
                            start: 'top top+=60%',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        new FadeSplitText({ el: $('.home-brand-never-label').get(0), mask: 'lines' }),
                        new RevealTextReset({ el: $('.home-brand-never').get(0), mask: 'lines', color: '#ffffff' }),
                        new FadeSplitText({ el: $('.home-brand-never-sub').get(0), mask: 'lines' }),
                        new FadeIn({ el: $('.home-brand-thanks'), })
                    ]
                });
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-brand-img',
                            start: 'top top+=60%',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        new FadeIn({ el: $('.home-brand-img img') }),
                        new FadeIn({ el: $('.home-brand-ic').get(0), type: 'bottom' }),
                    ]
                });
            }
        },
        "home-thumb-wrap": class extends TriggerSetup {
            constructor() {
                super();
                this.onTrigger = () => {
                    this.setup();
                    viewport.w > 767 && this.animationReveal();
                };
            }
            setup() {
                $('.home-thumb-cms').each((index, item) => {
                    if (index % 2 == 0) {
                        new Marquee($(item), 40).setup(true);
                    } else {
                        new Marquee($(item), 40).setup(false);
                    }
                })
            }
            animationReveal() {
                $('.home-thumb-cms').each((index, item) => {
                    new MasterTimeline({
                        timeline: gsap.timeline({
                            scrollTrigger: {
                                trigger: item,
                                start: 'top top+=75%',
                                once: true,
                            },
                        }),
                        tweenArr: [
                            ...Array.from($(item).find('.home-thumb-item')).map((itemTag, indexTag) => {
                                return new FadeIn({ el: $(itemTag), delay: `${indexTag * 0.1}`, type: 'bottom' })
                            }),
                        ]
                    })
                })
            }
        },
        "home-project-wrap": class extends TriggerSetup {
            constructor() {
                super();
                this.onTrigger = () => {
                    this.setup();
                    this.animationReveal();
                    this.interact();
                };
            }
            setup() {
            }
            animationReveal() {
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-project-title',
                            start: 'top top+=60%',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        new RevealTextReset({ el: $('.home-project-title').get(0), mask: 'lines', color: '#ffffff' }),
                    ]
                });
                $('.home-project-item').each((index, item) => {
                    new MasterTimeline({
                        timeline: gsap.timeline({
                            scrollTrigger: {
                                trigger: item,
                                start: 'top top+=75%',
                                once: true,
                            },
                        }),
                        tweenArr: [
                            new FadeIn({ el: $(item).find('.home-project-item-label') }),
                            new FadeIn({ el: $(item).find('.home-project-item-arrow') }),
                            new FadeSplitText({ el: $(item).find('.home-project-item-title').get(0), mask: 'lines' }),
                            new FadeSplitText({ el: $(item).find('.home-project-item-position').get(0), mask: 'lines', delay: .3 }),
                            new FadeSplitText({ el: $(item).find('.home-project-item-sub').get(0), mask: 'lines', isDisableRevert: true, delay: .5 }),
                            ...Array.from($(item).find('.home-project-item-tag-item')).map((itemTag, indexTag) => {
                                return new FadeIn({ el: $(itemTag), delay: `${indexTag * 0.1 + .6}`, type: 'bottom' })
                            }),
                            new FadeIn({ el: $(item).find('.home-project-item-cta'), delay: .9 }),
                            new ScaleInset({ el: $(item).find('.home-project-item-img.on-dk').get(0) }),
                        ]
                    })
                })
            }
            interact() {
                $('.home-project-item').on('click', function () {
                    let index = $(this).index();
                    $('.popup-item').removeClass('active');
                    $('.popup-item').eq(index).addClass('active');
                    $('.popup').addClass('active');
                })
                $('.popup-close').on('click', function () {
                    $('.popup').removeClass('active');
                })
                $('.popup').on('click', function (e) {
                    if (!$(e.target).closest('.popup-main').length) {
                        $('.popup').removeClass('active');
                    }
                })
            }
        },
        "popup-wrap": class extends TriggerSetup {
            constructor() {
                super();
                this.onTrigger = () => {
                    this.setup();
                    this.animationReveal();
                };
            }
            setup() {
                $('.popup-item').each((index, item) => {
                    console.log('khanh')
                    new Swiper($(item).find('.popup-item-detail-cms').get(0), {
                        slidesPerView: 'auto',
                        spaceBetween: cvUnit(8, 'rem'),
                        pagination: {
                            el: $(item).find('.popup-item-detail-pagi').get(0),
                            type: "progressbar",
                        }
                    })
                })
            }
            animationReveal() {
            }
        },
        "home-social-wrap": class extends TriggerSetup {
            constructor() {
                super();
                this.onTrigger = () => {
                    this.setup();
                    this.animationReveal();
                };
            }
            setup() {
                let swiper = new Swiper('.home-social-cms', {
                    slidesPerView: 'auto',
                    spaceBetween: cvUnit(60, 'rem'),
                    pagination: {
                        el: $('.home-social-line').get(0),
                        type: "progressbar",
                    },
                })
            }
            animationReveal() {
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-social-head',
                            start: 'top top+=60%',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        new RevealTextReset({ el: $('.home-social-title').get(0), mask: 'lines', color: '#ffffff' }),
                        new FadeSplitText({ el: $('.home-social-sub').get(0), mask: 'lines' }),
                    ]
                });
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-social-cms',
                            start: 'top top+=60%',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        ...Array.from($('.home-social-item')).flatMap((item, indexTag) => {
                            return [
                                new FadeIn({ el: $(item).find('.home-social-item-img').get(0) }),
                                new FadeIn({ el: $(item).find('.home-social-item-content') }),
                                new FadeIn({ el: $(item).find('.home-social-item-logo') }),
                                new FadeIn({ el: $(item).find('.home-social-item-number') }),
                                new FadeSplitText({ el: $(item).find('.home-social-item-title').get(0), mask: 'lines' }),
                                new FadeSplitText({ el: $(item).find('.home-social-item-sub').get(0), mask: 'lines' }),
                                new FadeIn({ el: $(item).find('.home-social-item-cta') }),
                            ]
                        }),
                        new FadeIn({ el: $('.home-social-line') })
                    ]
                });
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-social-job',
                            start: 'top top+=60%',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        ...Array.from($('.home-social-job-item')).flatMap((item, indexTag) => {
                            return [
                                new FadeIn({ el: $(item).find('.home-social-job-item-img').get(0) }),
                                new FadeSplitText({ el: $(item).find('.home-social-job-item-title').get(0), mask: 'lines', delay: .4 }),
                            ]
                        }),
                        new FadeIn({ el: $('.home-social-job-view') })
                    ]
                });
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-social-img',
                            start: 'top top+=75%',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        new ScaleInset({ el: $('.home-social-img').get(0) }),
                        new FadeSplitText({ el: $('.home-social-desc').get(0), mask: 'lines', delay: 1 }),
                    ]
                });
            }
        },
        "home-img-wrap": class extends TriggerSetup {
            constructor() {
                super();
                this.onTrigger = () => {
                    this.setup();
                    viewport.w > 767 && this.animationReveal();
                };
            }
            setup() {
            }
            animationReveal() {
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-img',
                            start: 'top top+=65%',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        new ScaleInset({ el: $('.home-img-inner').get(0) }),
                    ]
                });
            }
        },
        "home-micro-wrap": class extends TriggerSetup {
            constructor() {
                super();
                this.onTrigger = () => {
                    this.setup();
                    viewport.w > 767 && this.animationReveal();
                };
            }
            setup() {
            }
            animationReveal() {
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-micro-head',
                            start: 'top top+=75%',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        new FadeSplitText({ el: $('.home-micro-title').get(0), mask: 'lines' }),
                        ...Array.from($('.home-micro-social-item')).flatMap((item, indexTag) => {
                            return [
                                new FadeIn({ el: $(item) }),
                            ]
                        }),
                        new ScaleInset({ el: $('.home-micro-img').get(0) }),
                    ]
                });
                $('.home-micro-item').each((indexTag, item) => {
                    new MasterTimeline({
                        timeline: gsap.timeline({
                            scrollTrigger: {
                                trigger: item,
                                start: 'top top+=65%',
                                once: true,
                            },
                        }),
                        tweenArr: [
                            new FadeIn({ el: $(item).find('.home-micro-item-content') }),
                            new FadeIn({ el: $(item).find('.home-micro-item-ic') }),
                            new FadeIn({ el: $(item).find('.home-micro-item-label') }),
                            new FadeSplitText({ el: $(item).find('.home-micro-item-sub').get(0), mask: 'lines' }),
                            new FadeIn({ el: $(item).find('.home-micro-item-img') }),
                        ]
                    });
                });
            }
        },
        "home-profile-wrap": class extends TriggerSetup {
            constructor() {
                super();
                this.onTrigger = () => {
                    this.setup();
                    viewport.w > 767 && this.animationReveal();
                };
            }
            setup() {
            }
            animationReveal() {
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-profile-social-wrap',
                            start: 'top top+=75%',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        ...Array.from($('.home-profile-social')).flatMap((item, indexTag) => {
                            return [
                                new FadeIn({ el: $(item) }),
                            ]
                        }),
                    ]
                });
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-profile-title-wrap',
                            start: 'top top+=75%',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        new FadeSplitText({ el: $('.home-profile-label').get(0), mask: 'lines' }),
                        new RevealTextReset({ el: $('.home-profile-title').get(0), mask: 'lines', color: '#fff' }),
                    ]
                });
                $('.home-profile-thumb-item').each((indexTag, item) => {
                    new MasterTimeline({
                        timeline: gsap.timeline({
                            scrollTrigger: {
                                trigger: item,
                                start: 'top top+=90%',
                                once: true,
                            },
                        }),
                        tweenArr: [
                            new ScaleInset({ el: $(item).get(0) }),
                        ]
                    });
                });
            }
        },
        "home-certi-wrap": class extends TriggerSetup {
            constructor() {
                super();
                this.onTrigger = () => {
                    this.setup();
                    viewport.w > 767 && this.animationReveal();
                    this.iteraction();
                };
            }
            setup() {
            }
            iteraction() {
                // bắt sự kiện hover trên từng home-certi-item và lấy index của nó thêm remove class active cho .home-certi-img tương ứng và thêm active vao item mới active
                $('.home-certi-item').each((indexTag, item) => {
                    $(item).on('mouseenter', () => {
                        $('.home-certi-img').removeClass('active');
                        $('.home-certi-img').eq(indexTag).addClass('active');
                        $('.home-certi-item').removeClass('active')
                        $(item).addClass('active');
                    });
                });
                // $('.home-certi-item').each((indexTag, item) => {
                //     $(item).on('mouseleave', () => {
                //         $('.home-certi-img').removeClass('active');
                //     });
                // });
            }
            animationReveal() {
                new MasterTimeline({
                    timeline: gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-certi',
                            start: 'top top+=75%',
                            once: true,
                        },
                    }),
                    tweenArr: [
                        new RevealTextReset({ el: $('.home-certi-title').get(0), mask: 'lines', color: '#fff' }),
                        new ScaleInset({ el: $('.home-certi-img-wrap:first-child').get(0) }),
                        ...Array.from($('.home-certi-item')).flatMap((item, indexTag) => {
                            return [
                                new FadeSplitText({ el: $(item).find('.home-certi-item-num').get(0), mask: 'lines' }),
                                new FadeSplitText({ el: $(item).find('.home-certi-item-title').get(0), mask: 'lines' }),
                                new FadeSplitText({ el: $(item).find('.home-certi-item-year').get(0), mask: 'lines' }),
                                new ScaleLine({ el: $(item).find('.home-certi-item-line').get(0) }),
                            ]
                        })
                    ]
                });
            }
        }
    }
    class PageManager {
        constructor(page) {
            if (!page || typeof page !== 'object') {
                throw new Error('Invalid page configuration');
            }
            // Store registered component names to prevent duplicate registration
            this.registeredComponents = new Set();

            this.sections = Object.entries(page).map(([name, Component]) => {
                if (typeof Component !== 'function') {
                    throw new Error(`Section "${name}" must be a class constructor`);
                }

                // Only register the custom element if not already registered
                if (!this.registeredComponents.has(name)) {
                    try {
                        customElements.define(name, Component);
                        this.registeredComponents.add(name);
                    } catch (error) {
                        // Handle case where element is already defined
                        console.warn(`Custom element "${name}" is already registered`);
                    }
                }

                return new Component();
            });
        }

        // Method to cleanup sections if needed
        destroy() {
            this.sections.forEach(section => {
                if (typeof section.destroy === 'function') {
                    section.destroy();
                }
            });
        }
    }
    const pageName = $('.main').attr('data-namespace');
    console.log(pageName)
    const pageConfig = {
        home: HomePage,
    };
    if (!isTouchDevice() && viewport.w >= 992) {
        cursor.updateHtml();
        cursor.init();
    }
    const registry = {};
    registry[pageName]?.destroy();

    documentHeightObserver("init");
    refreshOnBreakpoint();
    scrollTop(() => pageConfig[pageName] && (registry[pageName] = new PageManager(pageConfig[pageName])));
}
window.onload = script;
