/**
 * Paola Diaz Website - Refactored JavaScript
 * Modular, performant, and accessible
 */

'use strict';

// ==========================================================================
// CONFIGURATION
// ==========================================================================

const CONFIG = {
    PLAYLIST: [
        { title: "Amor superficial", file: "./music/cancion1.mp3", duration: "3:45" },
        { title: "Corre", file: "./music/cancion2.mp3", duration: "4:12" },
        { title: "Equivocada", file: "./music/cancion3.mp3", duration: "3:28" },
        { title: "No sabía", file: "./music/cancion4.mp3", duration: "3:50" },
        { title: "No te mentía", file: "./music/cancion5.mp3", duration: "4:30" }
    ],
    MUSIC: {
        autoPlay: false,
        loop: true,
        volume: 0.8
    },
    HERO: {
        images: [
            './img/1.jpg', './img/2.jpg', './img/3.jpg', './img/4.jpg', './img/5.jpg',
            './img/6.jpg', './img/7.jpg', './img/8.jpg', './img/9.jpg', './img/10.jpg', './img/11.jpg'
        ],
        interval: 5000,
        transitionDuration: 400
    },
    SELECTORS: {
        // Navigation
        navLinks: 'a[href^="#"]',
        mobileMenuBtn: '.button-collapse',
        
        // Music Player
        playBtn: '#play-btn',
        pauseBtn: '#pause-btn',
        prevBtn: '#prev-btn',
        nextBtn: '#next-btn',
        playlistBtn: '#playlist-btn',
        playlistDropdown: '#playlist-dropdown',
        currentSong: '#current-song',
        audioPlayer: '#audio-player',
        songItems: '.song-item',
        
        // Gallery
        galleryImages: '.gallery-image',
        lightbox: '#lightbox',
        lightboxImage: '.lightbox-image',
        lightboxClose: '.lightbox-close',
        lightboxPrev: '.lightbox-prev',
        lightboxNext: '.lightbox-next',
        
        // Hero
        heroSlideshow: '#hero-slideshow',
        
        // Contact
        contactForm: '.contact-form'
    }
};

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================

const Utils = {
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    createElement(tag, className, content = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.textContent = content;
        return element;
    },
    
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
};

// ==========================================================================
// NAVIGATION MODULE
// ==========================================================================

const Navigation = {
    init() {
        this.setupSmoothScrolling();
        this.setupMobileMenu();
    },
    
    setupSmoothScrolling() {
        const navLinks = document.querySelectorAll(CONFIG.SELECTORS.navLinks);
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    },
    
    setupMobileMenu() {
        const menuBtn = document.querySelector(CONFIG.SELECTORS.mobileMenuBtn);
        if (!menuBtn) return;
        
        menuBtn.addEventListener('click', () => {
            const navLinks = document.querySelector('.nav-links');
            const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
            
            menuBtn.setAttribute('aria-expanded', !isExpanded);
            navLinks.style.display = isExpanded ? 'none' : 'flex';
        });
    }
};

// ==========================================================================
// MUSIC PLAYER MODULE - ENHANCED WITH TIMELINE
// ==========================================================================

const MusicPlayer = {
    currentSongIndex: 0,
    isPlaying: false,
    isStopped: false,
    elements: {},
    audio: null,
    progressInterval: null,
    
    init() {
        this.elements = {
            playBtn: document.getElementById('play-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            stopBtn: document.getElementById('stop-btn'),
            prevBtn: document.getElementById('prev-btn'),
            nextBtn: document.getElementById('next-btn'),
            playlistBtn: document.getElementById('playlist-btn'),
            songTitle: document.getElementById('song-title'),
            artistName: document.getElementById('artist-name'),
            playlistDropdown: document.getElementById('playlist-dropdown'),
            timeline: document.getElementById('timeline'),
            timelineProgress: document.getElementById('timeline-progress'),
            currentTime: document.getElementById('current-time'),
            totalTime: document.getElementById('total-time')
        };
        
        // Validar que todos los elementos existan
        const missingElements = Object.entries(this.elements)
            .filter(([key, element]) => !element)
            .map(([key]) => key);
            
        if (missingElements.length > 0) {
            console.error('Missing elements:', missingElements);
            return;
        }
        
        this.audio = new Audio();
        this.setupEventListeners();
        this.loadSong(0);
        this.hidePauseButton();
        
        console.log('🎵 Music Player initialized successfully');
    },
    
    setupEventListeners() {
        const { playBtn, pauseBtn, stopBtn, prevBtn, nextBtn, playlistBtn, timeline } = this.elements;
        
        if (playBtn) playBtn.addEventListener('click', () => this.play());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pause());
        if (stopBtn) stopBtn.addEventListener('click', () => this.stop());
        if (prevBtn) prevBtn.addEventListener('click', () => this.previous());
        if (nextBtn) nextBtn.addEventListener('click', () => this.next());
        if (playlistBtn) playlistBtn.addEventListener('click', () => this.togglePlaylist());
        
        // Timeline events
        if (timeline) {
            timeline.addEventListener('click', (e) => this.seekTo(e));
            timeline.addEventListener('dragstart', (e) => e.preventDefault());
        }
        
        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.next());
        
        // Playlist click events
        const songItems = document.querySelectorAll('.song-item');
        songItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                this.currentSongIndex = index;
                this.loadSong(index);
                this.play();
            });
        });
        
        // Keyboard support
        if (playBtn) {
            playBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.play();
                }
            });
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.pause();
                }
            });
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.stop();
                }
            });
        }
    },
    
    preloadAudio() {
        CONFIG.PLAYLIST.forEach(song => {
            const audio = new Audio();
            audio.src = song.file;
            audio.preload = 'metadata';
        });
    },
    
    loadSong(index) {
        const song = CONFIG.PLAYLIST[index];
        if (!song) {
            console.error('Song not found at index:', index);
            return;
        }
        
        this.audio.src = song.file;
        if (this.elements.songTitle) {
            this.elements.songTitle.textContent = song.title;
        }
        this.updatePlaylistUI();
        this.isStopped = false;
        this.resetProgress();
    },
    
    play() {
        if (this.isStopped) {
            this.loadSong(this.currentSongIndex);
        }
        
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.isStopped = false;
            this.showPauseButton();
            this.startProgressUpdate();
            this.announceSong();
        }).catch(error => {
            console.error('Error playing audio:', error);
            // Fallback: try to load and play again
            this.audio.load();
            this.audio.play().catch(e => console.error('Fallback play failed:', e));
        });
    },
    
    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.hidePauseButton();
        this.stopProgressUpdate();
    },
    
    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
        this.isStopped = true;
        this.hidePauseButton();
        this.stopProgressUpdate();
        this.resetProgress();
        this.showPlayButton();
    },
    
    next() {
        this.currentSongIndex = (this.currentSongIndex + 1) % CONFIG.PLAYLIST.length;
        this.loadSong(this.currentSongIndex);
        if (this.isPlaying) {
            this.play();
        }
    },
    
    previous() {
        this.currentSongIndex = (this.currentSongIndex - 1 + CONFIG.PLAYLIST.length) % CONFIG.PLAYLIST.length;
        this.loadSong(this.currentSongIndex);
        if (this.isPlaying) {
            this.play();
        }
    },
    
    seekTo(event) {
        if (!this.audio.duration || !this.elements.timeline) return;
        
        const timeline = this.elements.timeline;
        const rect = timeline.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const seekTime = percent * this.audio.duration;
        
        this.audio.currentTime = seekTime;
        this.updateProgress();
    },
    
    updateProgress() {
        if (!this.audio.duration || !this.elements.timelineProgress || !this.elements.currentTime) return;
        
        const { currentTime, duration } = this.audio;
        const percent = (currentTime / duration) * 100;
        
        this.elements.timelineProgress.style.width = `${percent}%`;
        this.elements.currentTime.textContent = this.formatTime(currentTime);
    },
    
    updateDuration() {
        if (!this.audio.duration || !this.elements.totalTime) return;
        
        this.elements.totalTime.textContent = this.formatTime(this.audio.duration);
    },
    
    resetProgress() {
        if (this.elements.timelineProgress && this.elements.currentTime && this.elements.totalTime) {
            this.elements.timelineProgress.style.width = '0%';
            this.elements.currentTime.textContent = '0:00';
            this.elements.totalTime.textContent = '0:00';
        }
    },
    
    startProgressUpdate() {
        this.progressInterval = setInterval(() => {
            if (this.isPlaying && !this.isStopped) {
                this.updateProgress();
            }
        }, 100);
    },
    
    stopProgressUpdate() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    },
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    },
    
    showPauseButton() {
        if (this.elements.playBtn && this.elements.pauseBtn) {
            this.elements.playBtn.style.display = 'none';
            this.elements.pauseBtn.style.display = 'flex';
        }
    },
    
    hidePauseButton() {
        if (this.elements.playBtn && this.elements.pauseBtn) {
            this.elements.playBtn.style.display = 'flex';
            this.elements.pauseBtn.style.display = 'none';
        }
    },
    
    showPlayButton() {
        if (this.elements.playBtn && this.elements.pauseBtn) {
            this.elements.playBtn.style.display = 'flex';
            this.elements.pauseBtn.style.display = 'none';
        }
    },
    
    updatePlaylistUI() {
        const songItems = document.querySelectorAll('.song-item');
        songItems.forEach((item, index) => {
            item.classList.toggle('active', index === this.currentSongIndex);
            item.setAttribute('aria-selected', index === this.currentSongIndex);
        });
    },
    
    togglePlaylist() {
        const dropdown = this.elements.playlistDropdown;
        const button = this.elements.playlistBtn;
        
        if (dropdown) {
            const isOpen = dropdown.classList.contains('show');
            dropdown.classList.toggle('show');
            button?.setAttribute('aria-expanded', !isOpen);
        }
    },
    
    closePlaylist() {
        this.elements.playlistDropdown?.classList.remove('show');
        this.elements.playlistBtn?.setAttribute('aria-expanded', 'false');
    },
    
    announceSong() {
        const song = CONFIG.PLAYLIST[this.currentSongIndex];
        if (window.Accessibility && Accessibility.announce) {
            Accessibility.announce(`Reproduciendo: ${song.title}`);
        }
    },
};

// ==========================================================================
// GALLERY MODULE
// ==========================================================================

const Gallery = {
    images: [],
    currentIndex: 0,
    elements: {},
    
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupKeyboardNavigation();
    },
    
    cacheElements() {
        this.images = Array.from(document.querySelectorAll(CONFIG.SELECTORS.galleryImages));
        this.elements = {
            lightbox: document.querySelector(CONFIG.SELECTORS.lightbox),
            lightboxImage: document.querySelector(CONFIG.SELECTORS.lightboxImage),
            btnClose: document.querySelector(CONFIG.SELECTORS.lightboxClose),
            btnPrev: document.querySelector(CONFIG.SELECTORS.lightboxPrev),
            btnNext: document.querySelector(CONFIG.SELECTORS.lightboxNext)
        };
    },
    
    setupEventListeners() {
        if (this.images.length === 0 || !this.elements.lightbox) return;
        
        // Image click events
        this.images.forEach((img, index) => {
            img.addEventListener('click', () => this.open(index));
            img.setAttribute('tabindex', '0');
        });
        
        // Lightbox controls
        this.elements.btnClose?.addEventListener('click', () => this.close());
        this.elements.btnPrev?.addEventListener('click', () => this.previous());
        this.elements.btnNext?.addEventListener('click', () => this.next());
        
        // Click outside to close
        this.elements.lightbox.addEventListener('click', (e) => {
            if (e.target === this.elements.lightbox) this.close();
        });
    },
    
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (!this.elements.lightbox?.classList.contains('open')) return;
            
            switch (e.key) {
                case 'Escape':
                    this.close();
                    break;
                case 'ArrowLeft':
                    this.previous();
                    break;
                case 'ArrowRight':
                    this.next();
                    break;
            }
        });
    },
    
    open(index) {
        if (!this.isValidIndex(index)) return;
        
        this.currentIndex = index;
        this.updateLightboxImage();
        this.elements.lightbox?.classList.add('open');
        this.elements.lightbox?.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    },
    
    close() {
        this.elements.lightbox?.classList.remove('open');
        this.elements.lightbox?.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    },
    
    next() {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.updateLightboxImage();
    },
    
    previous() {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.updateLightboxImage();
    },
    
    updateLightboxImage() {
        const img = this.images[this.currentIndex];
        if (img && this.elements.lightboxImage) {
            this.elements.lightboxImage.src = img.src;
            this.elements.lightboxImage.alt = img.alt || 'Imagen de galería ampliada';
        }
    },
    
    isValidIndex(index) {
        return index >= 0 && index < this.images.length;
    }
};

// ==========================================================================
// HERO SLIDESHOW MODULE
// ==========================================================================

const HeroSlideshow = {
    currentIndex: 0,
    elements: {},
    intervalId: null,
    
    init() {
        this.cacheElements();
        this.preloadImages();
        this.startSlideshow();
    },
    
    cacheElements() {
        this.elements.heroImg = document.querySelector(CONFIG.SELECTORS.heroSlideshow);
    },
    
    preloadImages() {
        CONFIG.HERO.images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    },
    
    startSlideshow() {
        if (!this.elements.heroImg) return;
        
        this.intervalId = setInterval(() => {
            this.showNextImage();
        }, CONFIG.HERO.interval);
    },
    
    showNextImage() {
        if (!this.elements.heroImg) return;
        
        this.elements.heroImg.style.opacity = '0';
        
        setTimeout(() => {
            this.currentIndex = (this.currentIndex + 1) % CONFIG.HERO.images.length;
            this.elements.heroImg.src = CONFIG.HERO.images[this.currentIndex];
            this.elements.heroImg.style.opacity = '1';
        }, CONFIG.HERO.transitionDuration);
    },
    
    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
};

// ==========================================================================
// ACCESSIBILITY MODULE
// ==========================================================================

const Accessibility = {
    init() {
        this.setupSkipLink();
        this.setupBackToTop();
        this.setupKeyboardNavigation();
        this.setupAriaLiveRegions();
    },
    
    setupSkipLink() {
        const skipLink = document.querySelector('.skip-link');
        if (!skipLink) return;
        
        skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(skipLink.getAttribute('href'));
            if (target) {
                target.focus();
                target.scrollIntoView();
            }
        });
    },
    
    setupBackToTop() {
        const backToTopBtn = document.getElementById('back-to-top');
        if (!backToTopBtn) return;
        
        // Show/hide button based on scroll position
        window.addEventListener('scroll', Utils.throttle(() => {
            if (window.pageYOffset > 300) {
                backToTopBtn.hidden = false;
            } else {
                backToTopBtn.hidden = true;
            }
        }, 100));
        
        // Scroll to top when clicked
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        // Keyboard support
        backToTopBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                backToTopBtn.click();
            }
        });
    },
    
    setupKeyboardNavigation() {
        // Enhanced keyboard navigation for gallery
        const galleryImages = document.querySelectorAll('.gallery-image');
        
        galleryImages.forEach((img, index) => {
            img.addEventListener('keydown', (e) => {
                switch (e.key) {
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        img.click();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        const nextImg = galleryImages[index + 1];
                        if (nextImg) nextImg.focus();
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        const prevImg = galleryImages[index - 1];
                        if (prevImg) prevImg.focus();
                        break;
                }
            });
        });
        
        // Escape key to close modals/menus
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close playlist if open
                const playlist = document.querySelector('.playlist-dropdown.show');
                if (playlist) {
                    MusicPlayer.closePlaylist();
                    document.querySelector('#playlist-btn')?.focus();
                }
                
                // Close lightbox if open
                const lightbox = document.querySelector('.lightbox.open');
                if (lightbox) {
                    Gallery.close();
                }
                
                // Close mobile menu if open
                const mobileMenu = document.querySelector('.nav-links.active');
                if (mobileMenu) {
                    mobileMenu.classList.remove('active');
                    document.querySelector('.button-collapse')?.focus();
                }
            }
        });
    },
    
    setupAriaLiveRegions() {
        // Create live region for announcements
        const liveRegion = Utils.createElement('div', 'sr-only', '');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        document.body.appendChild(liveRegion);
        
        // Expose announcement function
        this.announce = (message) => {
            liveRegion.textContent = message;
        };
    }
};

const ContactForm = {
    init() {
        const form = document.querySelector(CONFIG.SELECTORS.contactForm);
        if (!form) return;
        
        form.addEventListener('submit', (e) => this.handleSubmit(e));
    },
    
    handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        if (!this.validateForm(data)) return;
        
        // Simulate form submission
        this.showSuccessMessage();
        e.target.reset();
    },
    
    validateForm(data) {
        const required = ['name', 'email', 'message'];
        const missing = required.filter(field => !data[field]);
        
        if (missing.length > 0) {
            this.showError('Por favor, completa todos los campos');
            return false;
        }
        
        if (!Utils.validateEmail(data.email)) {
            this.showError('Por favor, ingresa un email válido');
            return false;
        }
        
        return true;
    },
    
    showSuccessMessage() {
        alert('¡Mensaje enviado! Te contactaremos pronto.');
    },
    
    showError(message) {
        alert(message);
    }
};

// ==========================================================================
// APPLICATION INITIALIZATION
// ==========================================================================

class PaolaDiazWebsite {
    constructor() {
        this.modules = [];
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }
    
    start() {
        try {
            // Initialize all modules
            Navigation.init();
            MusicPlayer.init();
            Gallery.init();
            HeroSlideshow.init();
            ContactForm.init();
            Accessibility.init();
            
            // Setup global error handling
            this.setupErrorHandling();
            
            // Setup performance monitoring
            this.setupPerformanceMonitoring();
            
            console.log('🎵 Paola Diaz Website initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize website:', error);
            this.handleInitializationError(error);
        }
    }
    
    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
        });
    }
    
    setupPerformanceMonitoring() {
        // Simple performance monitoring
        if ('performance' in window) {
            window.addEventListener('load', () => {
                const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                console.log(`⚡ Page load time: ${loadTime}ms`);
            });
        }
    }
    
    handleInitializationError(error) {
        // Fallback functionality if initialization fails
        document.body.style.opacity = '1';
        
        // Show user-friendly error message
        const errorEl = Utils.createElement('div', 'init-error', 
            'Algunas funciones pueden no estar disponibles. Por favor, recarga la página.');
        errorEl.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff9800;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 3000;
        `;
        
        document.body.appendChild(errorEl);
        setTimeout(() => errorEl.remove(), 5000);
    }
}

// ==========================================================================
// GLOBAL EXPOSURE (for debugging)
// ==========================================================================

const App = new PaolaDiazWebsite();

// Initialize the application
App.init();

// Expose modules for debugging (remove in production)
if (typeof window !== 'undefined') {
    window.PaolaDiazApp = {
        MusicPlayer,
        Gallery,
        Navigation,
        HeroSlideshow,
        ContactForm,
        Accessibility,
        Utils,
        CONFIG
    };
}
