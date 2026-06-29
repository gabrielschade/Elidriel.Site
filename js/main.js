const initializeGoogleAnalytics = (measurementId) => {
    if (!measurementId) {
        return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
        window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
        anonymize_ip: true,
    });
};

const trackAnalyticsEvent = (eventName, parameters = {}) => {
    if (typeof window.gtag !== 'function') {
        return;
    }

    window.gtag('event', eventName, {
        transport_type: 'beacon',
        ...parameters,
    });
};

document.addEventListener('DOMContentLoaded', () => {
    const config = window.ELIDRIEL_CONFIG || {};
    initializeGoogleAnalytics(config.analyticsMeasurementId);

    const steamButton = document.getElementById('steamButton');
    const steamFooterButton = document.getElementById('steamFooterButton');
    const youtubeLink = document.getElementById('youtubeLink');
    const instagramLink = document.getElementById('instagramLink');
    const discordLink = document.getElementById('discordLink');
    const pressKitLink = document.getElementById('pressKitLink');
    const streamerKitLink = document.getElementById('streamerKitLink');
    const trailerVideo = document.getElementById('trailerVideo');
    const galleryModal = document.getElementById('galleryModal');
    let galleryModalImage = document.getElementById('galleryModalImage');
    const galleryModalTrack = document.getElementById('galleryModalTrack');
    const galleryModalPrev = galleryModal?.querySelector('.gallery-modal-arrow.prev');
    const galleryModalNext = galleryModal?.querySelector('.gallery-modal-arrow.next');
    const galleryModalCloseButtons = galleryModal?.querySelectorAll('[data-gallery-close]');

    let activeGallery = null;
    let activeGalleryIndex = 0;
    let galleryAnimationLocked = false;
    let galleryTransitionTimeout = null;

    const buildGallerySlide = (item) => {
        const slide = document.createElement('div');
        slide.className = 'gallery-modal-slide';

        const image = document.createElement('img');
        image.className = 'gallery-modal-image';
        image.alt = item.alt || '';
        image.src = item.src;

        slide.appendChild(image);
        return slide;
    };

    if (steamButton) steamButton.href = config.steamUrl || '#';
    if (steamFooterButton) steamFooterButton.href = config.steamUrl || '#';
    if (youtubeLink) youtubeLink.href = config.youtubeUrl || '#';
    if (instagramLink) instagramLink.href = config.instagramUrl || '#';
    if (discordLink) discordLink.href = config.discordUrl || '#';
    if (pressKitLink) pressKitLink.href = config.pressKitUrl || '#';
    if (streamerKitLink) streamerKitLink.href = config.streamerKitUrl || '#';
    if (trailerVideo) {
        trailerVideo.src = config.trailerEmbedUrl || config.trailerFallbackUrl || 'about:blank';
    }

    const addTrackedClick = (element, eventName, eventLabel, extraParameters = {}) => {
        if (!element) {
            return;
        }

        element.addEventListener('click', () => {
            trackAnalyticsEvent(eventName, {
                event_label: eventLabel,
                link_url: element.href || '',
                ...extraParameters,
            });
        });
    };

    addTrackedClick(steamButton, 'cta_click', 'wishlist_now_top', { link_category: 'steam' });
    addTrackedClick(steamFooterButton, 'cta_click', 'wishlist_now_footer', { link_category: 'steam' });
    addTrackedClick(pressKitLink, 'cta_click', 'press_kit', { link_category: 'press_kit' });
    addTrackedClick(streamerKitLink, 'cta_click', 'streamer_kit', { link_category: 'streamer_kit' });
    addTrackedClick(youtubeLink, 'social_click', 'youtube', { link_category: 'social' });
    addTrackedClick(instagramLink, 'social_click', 'instagram', { link_category: 'social' });
    addTrackedClick(discordLink, 'social_click', 'discord', { link_category: 'social' });

    const carouselDotImages = config.carouselDotImages || {
        inactive: 'img/Visuals/Checked-False.png',
        active: 'img/Visuals/Checked-True.png'
    };

    const applyContentData = (contentData) => {
        document.querySelectorAll('[data-content-key]').forEach((element) => {
            const value = element.dataset.contentKey
                .split('.')
                .reduce((accumulator, key) => (accumulator && accumulator[key] !== undefined ? accumulator[key] : undefined), contentData);

            if (typeof value === 'string') {
                element.textContent = value;
            }
        });
    };

    applyContentData(window.ELIDRIEL_CONTENT || {});

    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            navToggle.classList.toggle('open');
        });

        navMenu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
                navToggle.classList.remove('open');
            });
        });
    }

    const closeGallery = () => {
        if (!galleryModal || !galleryModalImage || !galleryModalTrack) {
            return;
        }

        window.clearTimeout(galleryTransitionTimeout);
        galleryModal.hidden = true;
        document.body.classList.remove('modal-open');
        galleryModalImage.src = '';
        galleryModalImage.alt = '';
        galleryModalTrack.innerHTML = '<div class="gallery-modal-slide"><img class="gallery-modal-image" id="galleryModalImage" alt=""></div>';
        galleryModalImage = document.getElementById('galleryModalImage');
        activeGallery = null;
        activeGalleryIndex = 0;
        galleryAnimationLocked = false;
    };

    const renderGalleryImage = () => {
        if (!galleryModal || !galleryModalImage || !activeGallery || activeGallery.images.length === 0) {
            return;
        }

        const item = activeGallery.images[activeGalleryIndex];
        galleryModalImage.src = item.src;
        galleryModalImage.alt = item.alt || '';
    };

    const openGallery = (gallery, startIndex) => {
        if (!galleryModal || !galleryModalImage || !galleryModalTrack || gallery.images.length === 0) {
            return;
        }

        activeGallery = gallery;
        activeGalleryIndex = startIndex;
        galleryAnimationLocked = false;
        window.clearTimeout(galleryTransitionTimeout);
        galleryModalTrack.style.transition = 'none';
        galleryModalTrack.style.transform = 'translateX(0)';
        renderGalleryImage();
        galleryModal.hidden = false;
        document.body.classList.add('modal-open');
    };

    const stepGallery = (direction) => {
        if (!activeGallery || activeGallery.images.length === 0 || !galleryModalImage || !galleryModalTrack || galleryAnimationLocked) {
            return;
        }

        const nextIndex = (activeGalleryIndex + direction + activeGallery.images.length) % activeGallery.images.length;
        galleryAnimationLocked = true;
        window.clearTimeout(galleryTransitionTimeout);

        const nextSlide = buildGallerySlide(activeGallery.images[nextIndex]);

        if (direction > 0) {
            galleryModalTrack.appendChild(nextSlide);
            void galleryModalTrack.offsetWidth;
            galleryModalTrack.style.transition = 'transform 0.35s ease';
            galleryModalTrack.style.transform = 'translateX(-100%)';
        } else {
            galleryModalTrack.insertBefore(nextSlide, galleryModalTrack.firstChild);
            galleryModalTrack.style.transform = 'translateX(-100%)';
            void galleryModalTrack.offsetWidth;
            galleryModalTrack.style.transition = 'transform 0.35s ease';
            galleryModalTrack.style.transform = 'translateX(0)';
        }

        galleryTransitionTimeout = window.setTimeout(() => {
            activeGalleryIndex = nextIndex;
            galleryModalTrack.style.transition = 'none';
            galleryModalTrack.style.transform = 'translateX(0)';
            galleryModalTrack.innerHTML = '<div class="gallery-modal-slide"><img class="gallery-modal-image" id="galleryModalImage" alt=""></div>';
            galleryModalImage = document.getElementById('galleryModalImage');
            renderGalleryImage();
            galleryAnimationLocked = false;
        }, 360);
    };

    galleryModalPrev?.addEventListener('click', () => stepGallery(-1));
    galleryModalNext?.addEventListener('click', () => stepGallery(1));
    galleryModalCloseButtons?.forEach((button) => button.addEventListener('click', closeGallery));
    attachSwipeHandlers(
        galleryModal?.querySelector('.gallery-modal-image-wrap'),
        () => stepGallery(1),
        () => stepGallery(-1)
    );
    galleryModal?.addEventListener('click', (event) => {
        if (event.target === galleryModal) {
            closeGallery();
        }
    });

    window.addEventListener('keydown', (event) => {
        if (galleryModal?.hidden) {
            return;
        }

        if (event.key === 'Escape') {
            closeGallery();
        }

        if (event.key === 'ArrowLeft') {
            stepGallery(-1);
        }

        if (event.key === 'ArrowRight') {
            stepGallery(1);
        }
    });

    function attachSwipeHandlers(element, onSwipeLeft, onSwipeRight) {
        if (!element) {
            return;
        }

        let startX = 0;
        let startY = 0;
        let pointerId = null;

        element.addEventListener('pointerdown', (event) => {
            if (event.pointerType === 'mouse') {
                return;
            }

            startX = event.clientX;
            startY = event.clientY;
            pointerId = event.pointerId;

            if (element.setPointerCapture) {
                element.setPointerCapture(pointerId);
            }
        });

        const finishSwipe = (event) => {
            if (pointerId === null || event.pointerId !== pointerId) {
                return;
            }

            const deltaX = event.clientX - startX;
            const deltaY = event.clientY - startY;
            const isHorizontalSwipe = Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY);

            if (isHorizontalSwipe) {
                if (deltaX < 0) {
                    onSwipeLeft();
                } else {
                    onSwipeRight();
                }
            }

            pointerId = null;
        };

        element.addEventListener('pointerup', finishSwipe);
        element.addEventListener('pointercancel', () => {
            pointerId = null;
        });
    }

    document.querySelectorAll('.carousel').forEach((carousel) => {
        const track = carousel.querySelector('.carousel-track');
        const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
        const prevButton = carousel.querySelector('.carousel-btn.prev');
        const nextButton = carousel.querySelector('.carousel-btn.next');
        const dotsContainer = carousel.querySelector('.carousel-dots');
        const isBattleCarousel = carousel.classList.contains('character-battle-carousel');
        const autoAdvanceCarousels = new Set(['combat', 'traversal', 'jobs']);
        const shouldAutoAdvance = autoAdvanceCarousels.has(carousel.dataset.carousel || '');
        const carouselImages = slides
            .map((slide) => slide.querySelector('img'))
            .filter(Boolean)
            .map((img) => ({
                src: img.currentSrc || img.src,
                alt: img.alt || '',
            }));
        let currentIndex = 0;

        if (!track || slides.length === 0) {
            return;
        }

        slides.forEach((slide, index) => {
            const image = slide.querySelector('img');
            if (!image) {
                return;
            }

            image.style.cursor = 'pointer';
            image.tabIndex = 0;
            image.setAttribute('role', 'button');
            image.setAttribute('aria-label', `Open image ${index + 1} in gallery`);

            const openCurrentImage = () => openGallery({ images: carouselImages }, index);

            image.addEventListener('click', openCurrentImage);
            image.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openCurrentImage();
                }
            });
        });

        const dots = isBattleCarousel ? [] : slides.map((_, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'carousel-dot';
            dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
            const dotImage = document.createElement('img');
            dotImage.alt = '';
            dotImage.src = carouselDotImages.inactive;
            dotImage.setAttribute('aria-hidden', 'true');
            dot.appendChild(dotImage);
            dot.addEventListener('click', () => {
                currentIndex = index;
                updateCarousel();
            });
            dotsContainer?.appendChild(dot);
            return dot;
        });

        const updateCarousel = () => {
            const offset = currentIndex * -100;
            track.style.transform = `translateX(${offset}%)`;
            slides.forEach((slide, index) => slide.classList.toggle('active', index === currentIndex));
            dots.forEach((dot, index) => {
                const isActive = index === currentIndex;
                dot.classList.toggle('active', isActive);
                const dotImage = dot.querySelector('img');
                if (dotImage) {
                    dotImage.src = isActive ? carouselDotImages.active : carouselDotImages.inactive;
                }
            });
        };

        const advanceCarousel = () => {
            currentIndex = (currentIndex + 1) % slides.length;
            updateCarousel();
        };

        const retreatCarousel = () => {
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            updateCarousel();
        };

        const startAutoAdvance = () => {
            window.setInterval(advanceCarousel, 5000);
        };

        if (isBattleCarousel || shouldAutoAdvance) {
            window.setTimeout(startAutoAdvance, Math.random() * 5000);
        }

        prevButton?.addEventListener('click', () => {
            retreatCarousel();
        });

        nextButton?.addEventListener('click', () => {
            advanceCarousel();
        });

        attachSwipeHandlers(
            carousel.querySelector('.carousel-track-container'),
            advanceCarousel,
            retreatCarousel
        );

        updateCarousel();
    });

    const characterTabs = document.querySelectorAll('.character-tab');
    const characterPanels = document.querySelectorAll('.character-panel');

    characterTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.character;
            characterTabs.forEach((item) => item.classList.toggle('active', item === tab));
            characterPanels.forEach((panel) => {
                panel.classList.toggle('active', panel.dataset.character === target);
            });
        });
    });

});